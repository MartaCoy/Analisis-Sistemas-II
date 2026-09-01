-- ==========================================
-- TABLAS BASE
-- ========================================== 

CREATE TABLE universidades (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    siglas VARCHAR(20),
    pais VARCHAR(100) NOT NULL DEFAULT 'Guatemala',
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO universidades (nombre, siglas, pais) VALUES
('Universidad Mariano Gálvez', 'UMG', 'Guatemala');

CREATE TABLE estudiantes (
    id BIGSERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    correo VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    carnet VARCHAR(50) NOT NULL,
    rol VARCHAR(30) NOT NULL DEFAULT 'ESTUDIANTE',
    universidad_id BIGINT NOT NULL REFERENCES universidades(id),
    UNIQUE (universidad_id, carnet)
);

CREATE TABLE convocatorias (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo_beca VARCHAR(30) NOT NULL,
    requisitos VARCHAR(1000),
    fecha_apertura DATE,
    fecha_cierre DATE,
    estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR'
);

CREATE TABLE solicitudes (
    id BIGSERIAL PRIMARY KEY,
    estudiante_id BIGINT NOT NULL REFERENCES estudiantes(id),
    convocatoria_id BIGINT NOT NULL REFERENCES convocatorias(id),
    estado VARCHAR(30) NOT NULL DEFAULT 'RECIBIDA',
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (estudiante_id, convocatoria_id)
);

CREATE TABLE documentos (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL REFERENCES solicitudes(id),
    nombre_archivo VARCHAR(255) NOT NULL,
    url_s3 VARCHAR(500) NOT NULL,
    tipo_documento VARCHAR(100),
    fecha_carga TIMESTAMP NOT NULL DEFAULT now()
);

-- ==========================================
-- HISTORIAL DE ESTADOS (para el disparador)
-- ==========================================

CREATE TABLE historial_estados_solicitud (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL REFERENCES solicitudes(id),
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30) NOT NULL,
    fecha_cambio TIMESTAMP NOT NULL DEFAULT now()
);

-- ==========================================
-- DISPARADOR (TRIGGER)
-- Cada vez que cambia el estado de una solicitud,
-- se guarda automáticamente en el historial.
-- ==========================================

CREATE OR REPLACE FUNCTION registrar_cambio_estado_solicitud()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO historial_estados_solicitud (solicitud_id, estado_anterior, estado_nuevo)
        VALUES (NEW.id, OLD.estado, NEW.estado);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_historial_solicitud
AFTER UPDATE ON solicitudes
FOR EACH ROW
EXECUTE FUNCTION registrar_cambio_estado_solicitud();

-- ==========================================
-- VISTA
-- Convocatorias activas + conteo de solicitudes
-- ==========================================

CREATE VIEW vista_convocatorias_activas AS
SELECT c.*, COUNT(s.id) AS total_solicitudes
FROM convocatorias c
LEFT JOIN solicitudes s ON s.convocatoria_id = c.id
WHERE c.estado = 'PUBLICADA'
GROUP BY c.id;