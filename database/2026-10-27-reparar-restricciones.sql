-- Reejecutable: crea solamente restricciones/indices que aun no existen.
-- Revisar el nombre de la base en psql antes de ejecutar. No borra registros.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $reparacion$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('aprobaciones_solicitud','fk_aprobacion_solicitud','solicitud_id','solicitudes'),
    ('notificaciones_solicitud','fk_notificacion_solicitud','solicitud_id','solicitudes'),
    ('notificaciones_solicitud','fk_notificacion_estudiante','estudiante_id','estudiantes'),
    ('auditoria_solicitud','fk_auditoria_solicitud','solicitud_id','solicitudes')
  ) AS reglas(tabla,nombre,columna,referencia)
  LOOP
    -- Busca por tabla/columna referenciada, no solo por el nombre asignado.
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      WHERE c.conrelid = format('public.%I', r.tabla)::regclass
        AND c.contype = 'f'
        AND c.confrelid = format('public.%I', r.referencia)::regclass
        AND c.conkey = ARRAY[(SELECT attnum FROM pg_attribute
          WHERE attrelid = c.conrelid AND attname = r.columna)]::smallint[]
        AND c.confkey = ARRAY[(SELECT attnum FROM pg_attribute
          WHERE attrelid = c.confrelid AND attname = 'id')]::smallint[]
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id)',r.tabla,r.nombre,r.columna,r.referencia);
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.aprobaciones_solicitud'::regclass AND conname IN ('ck_aprobacion_etapa','aprobaciones_solicitud_etapa_check')) THEN
    ALTER TABLE public.aprobaciones_solicitud ADD CONSTRAINT ck_aprobacion_etapa CHECK (etapa IN (1,2));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.aprobaciones_solicitud'::regclass AND conname IN ('ck_aprobacion_decision','aprobaciones_solicitud_decision_check')) THEN
    ALTER TABLE public.aprobaciones_solicitud ADD CONSTRAINT ck_aprobacion_decision CHECK (decision IN ('APROBADA','RECHAZADA'));
  END IF;
END
$reparacion$;
CREATE INDEX IF NOT EXISTS ix_notificaciones_estudiante_fecha ON public.notificaciones_solicitud(estudiante_id,fecha DESC);
CREATE INDEX IF NOT EXISTS ix_auditoria_solicitud_fecha ON public.auditoria_solicitud(solicitud_id,fecha DESC);
COMMIT;
