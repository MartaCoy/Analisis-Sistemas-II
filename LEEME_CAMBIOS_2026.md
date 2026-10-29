# Nuevos requisitos - Sistema Nacional de Becas

**Base analizada:** `main` / commit `00946fa`, exportado el 27 de octubre de 2026. La copia original del usuario no fue modificada.

**Requisitos:** (1) si el monto supera 10,000, una segunda aprobación; (2) evento + notificación por cada cambio de estado; (3) auditoría de aprobaciones, rechazos y modificaciones relevantes.

## Decisiones de implementación (propuestas, no especificadas por el catedrático)

- Se usa el **monto numérico** `convocatorias.monto_beca` y se guarda una **copia** en `solicitudes.monto_solicitado` al registrarla. No se interpreta el texto libre `beneficio` como monto.
- Se compara contra `10000.00` con `BigDecimal`. **Exactamente 10,000 requiere una aprobación; 10,000.01 requiere dos.** No se presume moneda.
- La primera decisión favorable corresponde a la resolución del comité existente; la segunda corresponde a **otro administrador autenticado**. Se registra actor real mediante el correo del JWT. Un mismo usuario no puede ejecutar ambas.
- La notificación es **interna al portal** y persistente. El enunciado no exige correo electrónico; no se finge envío por email.
- Las entidades y el historial se guardan en la misma transacción. `SolicitudEstadoCambiadoEvent` puede tener futuros listeners para otras integraciones.
- No se migran montos antiguos desde descripciones textuales. Los registros históricos sin monto permanecen con `NULL` hasta que un administrador verifique y registre el valor auténtico.

## Instalación cuidadosa

1. Verificar que el repo local esté limpio y crear una rama desde `main` **actualizada**. No sobreescribir trabajo de otras personas.
2. Respaldar PostgreSQL **antes de migrar**:

   ```sh
   pg_dump -U postgres -h 127.0.0.1 -Fc becas_db > becas_db_antes_nuevos_requisitos.dump
   ```

   No subir el dump ni los secretos a GitHub.
3. Revisar diferencias (el ZIP adjunto contiene los archivos completos y un parche) y aplicar con `git apply --check cambios-requisitos.patch` / `git apply cambios-requisitos.patch` desde el root de proyecto. El parche se creó a partir de `00946fa`; si `main` avanzó, inspeccionar conflictos antes de aplicar.
4. Ejecutar **una sola vez** el SQL idempotente con PostgreSQL y **parar si falla**:

   ```sh
   psql -U postgres -h 127.0.0.1 -d becas_db -v ON_ERROR_STOP=1 -f database/2026-10-27-nuevos-requisitos.sql
   ```

5. Iniciar backend con su configuración existente (NO compartir credenciales); ejecutar `./mvnw test` o `mvn test` según el proyecto local. En la exportación no venía el wrapper Maven.
6. En `frontend`: `npm ci && npm run lint && npm run build`. El presente entorno de revisión no disponía de instalación de dependencias para completar esas verificaciones.
7. Probar primero con convocatorias nuevas de prueba, sin modificar registros reales.

## Flujo nuevo de backend

- `POST /api/solicitudes`: toma `montoBeca` de convocatoria, lo copia a la solicitud; genera primer evento `RECIBIDA` y notificación.
- `PUT /api/solicitudes/{id}/evaluar`: cambia a `EN_EVALUACION`, guarda historial/notificación/auditoría.
- Una evaluación final favorable en `EvaluacionFacade` llama a `SolicitudService.aprobar(id)`: si monto <= 10,000 queda `APROBADA`; si > 10,000 queda `PENDIENTE_SEGUNDA_APROBACION`.
- `GET /api/solicitudes/pendientes-segunda`: bandeja administrativa.
- `POST /api/solicitudes/{id}/segunda-aprobacion`: `{"aprobada":true, "observacion":"..."}`. El segundo usuario debe ser distinto y tener rol administrador; si la decisión es negativa, termina `RECHAZADA`.
- `GET /api/solicitudes/{id}/aprobaciones` y `GET /api/solicitudes/{id}/auditoria`: solo administradores.
- `GET /api/notificaciones/mias` y `PUT /api/notificaciones/{id}/leer`: usuario autenticado, solo sus propias notificaciones.
- `PUT /api/solicitudes/{id}/monto`: `{"monto":12500.00}` para completar/ajustar montos verificados en expedientes aún no aprobados; se audita.
- `PUT /api/solicitudes/{id}/rechazar` y la asignación de comité generan auditoría.

## Frontend

- Formulario de convocatorias con campo `Monto de la beca` separado del beneficio narrativo.
- Nueva opción administrativa **Segundas aprobaciones**, con bandeja, primera aprobación, segunda decisión y auditoría.
- Nueva sección estudiantil **Mis notificaciones**, con lectura y acceso al expediente.
- Panel evaluador muestra monto, permite completar montos históricos antes de resolver y muestra auditoría.
- Detalle estudiantil muestra monto y estado pendiente con texto legible.

## Regresión / aceptación (hacer con datos de prueba)

1. Montos 9,999.99 y 10,000.00: una aprobación; 10,000.01 y 12,500: pendiente segunda.
2. Primer aprobador no puede aprobar nuevamente la misma solicitud.
3. Segundo administrador sí puede aprobar o rechazar una solicitud pendiente.
4. Estado cambia RECIBIDA -> EN_EVALUACION -> PENDIENTE_SEGUNDA_APROBACION -> APROBADA. Para cada cambio hay historial + notificación.
5. Se registra auditoría de evaluación, aprobación, rechazo, cambio de comité, cambio de monto y carga de documentos.
6. Un estudiante no puede consultar las notificaciones, documentos o historial de otro estudiante. Un estudiante no puede consultar auditoría ni ejecutar aprobaciones.
7. Ningún reporte debe contar PENDIENTE_SEGUNDA_APROBACION como APROBADA.
8. No hacer `reset --hard`, `git push --force`, vaciar BD ni generar montos ficticios para registros históricos.

## Advertencias verificables

- El ZIP original no incluía `database/becas_db.sql` ni `application.properties`. **No fue posible comprobar la estructura real de PostgreSQL ni la configuración DDL**; revisar tablas y backups en la máquina del equipo antes de ejecutar SQL.
- No se ejecutó la suite Maven ni una base PostgreSQL real en este entorno de generación. **No afirmar que la integración esté aprobada o lista para producción sin estas verificaciones.**
- El enunciado no especifica moneda ni quién debe ser segundo aprobador. La separación de identidad y el rol ADMINISTRADOR son decisiones técnicas que conviene validar con el docente.
