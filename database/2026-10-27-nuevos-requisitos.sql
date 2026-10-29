-- Sistema Nacional de Becas / nuevos requisitos de octubre 2026.
-- Ejecutar SOLO tras respaldo y revisión en un ambiente de pruebas.
-- No se asignan montos inventados a convocatorias ni solicitudes existentes.
BEGIN;

ALTER TABLE convocatorias ADD COLUMN IF NOT EXISTS monto_beca NUMERIC(14,2);
ALTER TABLE solicitudes ADD COLUMN IF NOT EXISTS monto_solicitado NUMERIC(14,2);

CREATE TABLE IF NOT EXISTS aprobaciones_solicitud (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL REFERENCES solicitudes(id),
    etapa SMALLINT NOT NULL CHECK (etapa IN (1,2)),
    actor_correo VARCHAR(255) NOT NULL,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('APROBADA','RECHAZADA')),
    observacion VARCHAR(500),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_aprobacion_solicitud_etapa UNIQUE (solicitud_id, etapa)
);

CREATE TABLE IF NOT EXISTS notificaciones_solicitud (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL REFERENCES solicitudes(id),
    estudiante_id BIGINT NOT NULL REFERENCES estudiantes(id),
    estado_nuevo VARCHAR(80) NOT NULL,
    mensaje VARCHAR(500) NOT NULL,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS ix_notificaciones_estudiante_fecha
    ON notificaciones_solicitud (estudiante_id, fecha DESC);

CREATE TABLE IF NOT EXISTS auditoria_solicitud (
    id BIGSERIAL PRIMARY KEY,
    solicitud_id BIGINT NOT NULL REFERENCES solicitudes(id),
    actor_correo VARCHAR(255) NOT NULL,
    operacion VARCHAR(100) NOT NULL,
    resultado VARCHAR(60) NOT NULL,
    detalle VARCHAR(1000),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_auditoria_solicitud_fecha
    ON auditoria_solicitud (solicitud_id, fecha DESC);

COMMIT;
