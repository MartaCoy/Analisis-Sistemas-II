# Cierre de experiencia de usuario y pruebas - Sistema Nacional de Becas

## Alcance del paquete

Este paquete complementa la implementación ya aplicada de segunda aprobación,
notificaciones y auditoría. Se preparó contra `Becas_Codigo_Modificado.zip`, más la
corrección de `setCargando` y la reparación SQL documentadas en la conversación.
El instalador verifica las versiones antes de escribir. No modifica `.env`,
`application.properties`, `SecurityConfig.java`, puertos ni credenciales.

### Cambios

- Login: errores legibles incluso si una respuesta de texto llega etiquetada como JSON;
  credenciales equivocadas siempre muestran "Correo o contraseña incorrectos".
- Registro: confirmación de contraseña, validación junto al campo, foco en el primer error,
  bloqueo de doble envío, pantalla de éxito y texto de cuenta estudiantil.
- Ojo de mostrar/ocultar en login, contraseña nueva y confirmación; botón de teclado
  con nombre accesible; aviso de Bloq Mayús. No se bloquea pegar ni usar gestores.
- Medidor orientativo Débil/Media/Fuerte: no mide entropía real, no consulta filtraciones
  y no garantiza que una contraseña sea segura.
- Política NUEVA solo para registros: mínimo 15 caracteres Unicode, máximo 72 bytes
  UTF-8 por el BCrypt ya utilizado. Sin exigencia arbitraria de mayúsculas o símbolos.
  El backend valida lo mismo. No se alteran hashes ni contraseñas de cuentas existentes.
  El login NO exige el nuevo mínimo a usuarios anteriores.
- Acceso fuera del rol: explicación y regreso al panel en vez de redirección silenciosa.
  Se mantienen los controles de permisos del backend.
- Convocatorias: monto visible y botón directo "Solicitar beca". Los registros sin monto
  confirmado o fuera de vigencia no habilitan el botón. El botón del detalle se conserva.
- Solicitud: monto visible y bloqueo inmediato de doble clic al crear.
- Notificaciones: fecha completa con minutos, estados legibles, contador sin leer,
  confirmación de lectura y errores de conexión comprensibles.
- Segunda aprobación: corrección de fechas y de respuestas cruzadas al elegir rápidamente
  expedientes; botones bloqueados durante la operación; detalle de auditoría visible.
- Reparación SQL reejecutable. El instalador NO ejecuta SQL.

## Estado real de las pruebas

### Evidencia anterior aportada por el usuario

En `becas_requisitos_pruebas`, la solicitud 2 por 10001.00 terminó APROBADA,
con una primera decisión de `admin.hu04@example.com` y una segunda de
`admin.segundo.pruebas@correo.com`. Se observaron cuatro notificaciones y nueve
entradas de auditoría. La misma persona tenía la segunda decisión deshabilitada
en la interfaz. Esto verifica ese caso feliz; no constituye una auditoría completa
ni prueba todos los rechazos, concurrencia o autorizaciones posibles.

### Verificaciones realizadas al preparar este paquete

- 38 pruebas Node del archivo `frontend/tests/ux-cierre.test.mjs`: aprobadas.
- 39 archivos JS/JSX revisados con parser TypeScript: sin errores de sintaxis ni imports locales faltantes.
- `PasswordPolicy.java` compilado con `javac --release 17` y ocho comprobaciones ejecutadas.
- Pruebas adicionales JUnit incluidas: política, validación del DTO, login con contraseña
  demasiado larga, auditoría de rechazo y modificación de monto.
- Maven completo, oxlint, build Vite, pruebas con PostgreSQL y revisión visual:
  PENDIENTES EN EL EQUIPO DEL USUARIO. No se logró descargar dependencias en el
  entorno de preparación. No se cambiaron versiones ni lockfiles para ocultarlo.

## Comandos de validación en el Mac

No usar el servidor Ubuntu de otros proyectos ni detener el puerto 8090.
La sesión de pruebas sigue siendo frontend 5173 / backend 8091 / base
`becas_requisitos_pruebas`.

### Frontend (terminal libre de macOS)

```bash
cd "$HOME/Analisis-Sistemas-II/frontend" &&
node --test tests/ux-cierre.test.mjs &&
npm run lint &&
npm run build
```

No avanzar si hay errores. Revisar también cualquier advertencia del lint.
No hace falta `npm install`: el paquete no incorpora dependencias nuevas.

### Backend (terminal libre de macOS)

```bash
cd "$HOME/Analisis-Sistemas-II" &&
SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/becas_requisitos_pruebas" \
JWT_SECRET="$(openssl rand -hex 32)" \
sh ./mvnw -Dspring.datasource.url=jdbc:postgresql://localhost:5432/becas_requisitos_pruebas test
```

La URL se especifica expresamente para no ejecutar el contexto de prueba contra
`becas_db`. Las credenciales locales siguen siendo las que ya funcionan.
La clave JWT temporal pertenece a esta ejecución de pruebas, no cambia la clave
ambiental del proceso del servidor que ya está abierto.

### SQL (solo la copia de pruebas)

El archivo de reparación ahora se puede repetir. Ya existen las seis restricciones
aplicadas anteriormente; se conservan y se crean índices faltantes.

```bash
cd "$HOME/Analisis-Sistemas-II" &&
psql -X -h localhost -U postgres -d becas_requisitos_pruebas \
-v ON_ERROR_STOP=1 -f database/2026-10-27-reparar-restricciones.sql
```

Para instalar en otra base: respaldar primero, ejecutar la migración original
`2026-10-27-nuevos-requisitos.sql` y después esta reparación. Nunca inventar montos
para registros antiguos. No se borran columnas antiguas en este paquete.

## Revisión visual antes del commit

| Prueba | Resultado requerido |
|---|---|
| Login con clave equivocada | Correo o contraseña incorrectos; ningún JSON/SQL/trace visible |
| Login con cuenta inexistente | Mismo mensaje; no confirmar si existe el correo |
| Ojo en los tres campos | Alterna sin borrar texto ni enviar el formulario; usable con Tab/Enter |
| Registro incompleto | Mensaje por campo y foco en el primero incorrecto |
| Claves diferentes | No enviar la petición; explicar que no coinciden |
| Registro nuevo | Validar mínimo 15, mostrar fortaleza orientativa y crear ESTUDIANTE |
| Cuentas antiguas | Siguen iniciando sesión con sus contraseñas actuales |
| Cambio de rol | Cerrar sesión e iniciar nuevamente antes de comprobar permisos |
| Estudiante en ruta admin | Explicación de acceso y regreso a su panel |
| Administrador en ruta estudiantil | Explicación de acceso y regreso al panel administrativo |
| Convocatoria abierta con monto | Solicitar beca lleva al formulario sin escribir la URL |
| Monto sin definir | Mensaje de monto por confirmar; no habilitar una solicitud inválida |
| Fechas de notificaciones y aprobaciones | Día/mes/año y hora:minuto completos |
| Marcar una notificación leída | Confirmación, contador actualizado y lectura conservada al recargar |
| Pantalla pequeña / teclado | Sin campos cortados, foco visible y botones accesibles |

## Casos de negocio de cierre

No reiniciar ni rechazar la solicitud 2: conservarla como evidencia de doble aprobación.
Los unit tests existentes cubren exactamente 10000.00 y 10000.01. Los nuevos refuerzan
9999.99, cambio de monto y auditoría del rechazo. Hay que ejecutarlos con Maven.
Para la evidencia del navegador, crear registros nuevos claramente identificados:

1. `PRUEBA CIERRE - LIMITE`: académica, monto 10000.00, fechas vigentes, publicar.
   Presentar una nueva solicitud desde el estudiante; asignar al comité académico 2,
   evaluar favorablemente. Debe quedar APROBADA sin requerir etapa 2.
2. `PRUEBA CIERRE - RECHAZO`: académica, monto 10001.00, fechas vigentes, publicar.
   Presentar otra solicitud, asignar al comité 2 y evaluar favorablemente con el primer
   administrador. Con el segundo, rechazar indicando "Rechazo controlado para validar
   notificación y auditoría". Debe quedar RECHAZADA, salir de pendientes y generar
   notificación y auditoría con el actor correcto.
3. Verificar con una cuenta ajena que no puede leer ni marcar las notificaciones del
   solicitante. No basta con ocultar los botones: el servidor debe negar el acceso.

La asignación de comité ya existe en la API; no se agrega un módulo nuevo de gestión
de comités en este pulido. En consola DEL NAVEGADOR, con el primer administrador,
este auxiliar permite asignar SOLO expedientes nuevos de las dos convocatorias de cierre:

```javascript
(async () => {
  if (location.origin !== "http://localhost:5173") throw new Error("Abre el sistema local de Becas.");
  const { obtenerToken, obtenerSesion } = await import("/src/services/authService.js");
  if (obtenerSesion()?.rol !== "ADMINISTRADOR") throw new Error("Se requiere administrador.");
  const id = prompt("ID de la NUEVA solicitud de cierre (no usar 1 ni 2):");
  if (!/^[1-9]\d*$/.test(id || "") || Number(id) <= 2) throw new Error("ID no permitido para esta prueba.");
  const api = "http://localhost:8091/api";
  const headers = { Authorization: `Bearer ${obtenerToken()}` };
  const consulta = await fetch(`${api}/solicitudes/${id}`, { headers });
  if (!consulta.ok) throw new Error(`Consulta rechazada: ${consulta.status}`);
  const solicitud = await consulta.json();
  if (solicitud.estado !== "RECIBIDA") throw new Error("La solicitud ya avanzó; no se reasigna.");
  const r = await fetch(`${api}/convocatorias/${solicitud.convocatoriaId}`, { headers });
  if (!r.ok) throw new Error("No se pudo verificar la convocatoria.");
  const convocatoria = await r.json();
  if (!["PRUEBA CIERRE - LIMITE", "PRUEBA CIERRE - RECHAZO"].includes(convocatoria.nombre)) {
    throw new Error("No es una convocatoria de las pruebas de cierre.");
  }
  if (!confirm(`Asignar solicitud ${id} al comité académico 2 en el backend de pruebas 8091?`)) return;
  const resultado = await fetch(`${api}/solicitudes/${id}/asignar/2`, { method: "PUT", headers });
  console.log("Asignación HTTP:", resultado.status);
  if (!resultado.ok) console.log("No se confirmó la asignación. Revisa la sesión antes de repetir.");
})().catch((error) => console.error(error.message));
```

Este auxiliar no valida por sí mismo la URL JDBC. Antes de usarlo, comprobar en el
log del backend que 8091 continúa conectado a `becas_requisitos_pruebas`.
No compartir tokens, contraseñas ni archivos de respaldo en el Pull Request.

## Preparar Git

No hay commit ni push automático. Ejecutar solamente tras aprobar los controles anteriores:

```bash
cd "$HOME/Analisis-Sistemas-II"
git status --short --branch
git diff --check
git add frontend/src frontend/tests src/main/java src/test/java \
database/2026-10-27-nuevos-requisitos.sql \
database/2026-10-27-reparar-restricciones.sql \
LEEME_CAMBIOS_2026.md docs/CIERRE_UX_2026.md
git diff --cached --check
git diff --cached --stat
```

Revisar el contenido preparado con `git diff --cached`. No debe contener `.env`,
respaldos `.dump`, tokens ni claves reales. Los ZIP y respaldos del instalador quedan
en el Escritorio, fuera del repositorio.

```bash
git commit -m "feat: doble aprobacion, notificaciones, auditoria y mejoras de experiencia"
git push -u origin feature/requisitos-aprobaciones-notificaciones-auditoria
```

Crear Pull Request de esa rama a `main`. No utilizar `--force`. Si hay conflictos,
resolverlos antes del merge sin hacer `reset --hard` ni eliminar archivos nuevos.
No borrar la base de pruebas ni respaldos como parte del cierre.

### Texto sugerido para el Pull Request

**Título:** Nuevos requisitos de becas y pulido de autenticación / experiencia de usuario.

**Resumen:** segunda aprobación para montos superiores a 10000, notificaciones
persistentes y auditoría; mensajes de autenticación legibles, visibilidad y confirmación
de contraseñas, fortaleza orientativa, validación de nuevas cuentas, fechas completas
y acceso directo a la solicitud. Migración original más reparación reejecutable.

**Pruebas:** completar con resultados REALES de Maven, node:test, lint, build y los casos
manuales anteriores. No marcar como ejecutadas las comprobaciones pendientes.

**Compatibilidad:** nuevas cuentas requieren 15 caracteres y máximo 72 bytes UTF-8;
las contraseñas existentes no se modifican. Mantener secretos fuera del repositorio.
No se cambia la configuración de despliegue ni se publica automáticamente en AWS.

## Fuentes de las decisiones de autenticación

- OWASP Authentication Cheat Sheet: errores genéricos de credenciales, longitud
  recomendada de 15 caracteres cuando no se utiliza MFA y admisión de frases.
  `https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html`
- Spring Security BCrypt: límite de 72 bytes; no se trunca silenciosamente.
  `https://github.com/spring-projects/spring-security/blob/main/crypto/src/main/java/org/springframework/security/crypto/bcrypt/BCrypt.java`
- MDN: autocomplete de password actual/nueva y compatibilidad con gestores.
  `https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/password`

Este cambio no implementa MFA, comprobación de contraseñas filtradas, limitación de
intentos a nivel servidor ni una auditoría integral de seguridad. No presentarlo como tal.
