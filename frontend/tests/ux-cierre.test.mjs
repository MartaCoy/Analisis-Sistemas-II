import test from "node:test";
import assert from "node:assert/strict";
import { validarPassword, estimarFortaleza, passwordBytes } from "../src/utils/passwordPolicy.js";
import { mostrarFechaHora, mostrarMonto, mostrarEstado } from "../src/utils/formatoPresentacion.js";
import { validarRegistro } from "../src/utils/registroValidacion.js";
import { mensajeHttp, esMensajeNegocio } from "../src/utils/mensajesUsuario.js";
import { iniciarSesion, registrarEstudiante } from "../src/services/authService.js";

const valido = { nombreCompleto: "Persona Prueba", correo: "persona@example.com", carnet: "22942313756", universidadId: "1", password: "bosque nube camino violeta", confirmacion: "bosque nube camino violeta" };
const credenciales = { correo: "  PERSONA@EXAMPLE.COM ", password: "anterior" };

test("contraseña vacía rechazada", () => assert.ok(validarPassword("")));
test("contraseña de 14 caracteres rechazada", () => assert.ok(validarPassword("a".repeat(14))));
test("mínimo de registro 15", () => assert.equal(validarPassword("a".repeat(15)), ""));
test("frases con espacios admitidas", () => assert.equal(validarPassword(valido.password), ""));
test("72 bytes admitidos", () => assert.equal(validarPassword("a".repeat(72)), ""));
test("73 bytes rechazados", () => assert.ok(validarPassword("a".repeat(73))));
test("Unicode respeta límite UTF-8", () => { assert.equal(passwordBytes("á".repeat(36)),72); assert.ok(validarPassword("á".repeat(37))); });
test("fortaleza vacía neutral", () => assert.equal(estimarFortaleza("").nivel,0));
test("repeticiones nunca fuertes", () => assert.equal(estimarFortaleza("a".repeat(30)).nivel,1));
test("secuencias numéricas nunca fuertes", () => assert.equal(estimarFortaleza("12345678901234567890").nivel,1));
test("frase variada produce estimación fuerte", () => assert.equal(estimarFortaleza(valido.password).nivel,3));
test("fecha conserva minutos y no inventa zona", () => assert.equal(mostrarFechaHora("2026-10-28T12:55:07.013203"), "28/10/2026 · 12:55"));
test("fecha vacía legible", () => assert.equal(mostrarFechaHora(null), "Fecha no disponible"));
test("fecha imposible rechazada", () => assert.equal(mostrarFechaHora("2026-02-30T12:34:00"),"Fecha no disponible"));
test("hora imposible rechazada", () => assert.equal(mostrarFechaHora("2026-10-28T29:34:00"),"Fecha no disponible"));
test("monto exacto mostrado", () => assert.equal(mostrarMonto(10001), "10,001.00"));
test("monto nulo no se convierte en cero", () => assert.equal(mostrarMonto(null), "Monto por confirmar"));
test("estado humanizado", () => assert.equal(mostrarEstado("PENDIENTE_SEGUNDA_APROBACION"), "Pendiente de segunda aprobación"));
test("registro válido", () => assert.deepEqual(validarRegistro(valido),{}));
test("confirmación distinta rechazada", () => assert.ok(validarRegistro({...valido, confirmacion:"otra"}).confirmacion));
test("correo inválido señalado", () => assert.ok(validarRegistro({...valido, correo:"no-correo"}).correo));
test("carnet no se cambia al validar", () => { const d={...valido,carnet:"123"}; assert.ok(validarRegistro(d).carnet); assert.equal(d.carnet,"123"); });
test("nombre en blanco rechazado", () => assert.ok(validarRegistro({...valido,nombreCompleto:"   "}).nombreCompleto));
test("403 incluye contexto de administrador", () => assert.match(mensajeHttp(403,"general","ADMINISTRADOR"),/administrativa/));
test("403 de estudiante no incluye detalles internos", () => assert.match(mensajeHttp(403,"general","ESTUDIANTE"),/tu cuenta/));
test("rechaza mensajes técnicos", () => { assert.equal(esMensajeNegocio("<html>Error</html>"),false); assert.equal(esMensajeNegocio("El error java.lang.Exception"),false); });
test("preserva validación de negocio conocida", () => assert.equal(esMensajeNegocio("La solicitud no está en evaluación."),true));

for (const [nombre,status,cuerpo,tipo] of [
  ["401 texto plano",401,"Correo o contraseña incorrectos.","text/plain"],
  ["401 texto mal etiquetado JSON",401,"Correo o contraseña incorrectos.","application/json"],
  ["401 JSON",401,JSON.stringify({message:"Internal"}),"application/json"],
  ["401 HTML",401,"<html>Error</html>","text/html"],
]) test(nombre, async (t) => {
  t.mock.method(globalThis,"fetch",async () => new Response(cuerpo,{status,headers:{"content-type":tipo}}));
  await assert.rejects(iniciarSesion(credenciales), (e) => e.message === "Correo o contraseña incorrectos." && e.status === 401);
});
test("500 no expone SQL ni stack trace", async (t) => {
  t.mock.method(globalThis,"fetch",async () => new Response("org.hibernate.SQL error secreto",{status:500}));
  await assert.rejects(iniciarSesion(credenciales), (e) => /servicio/i.test(e.message) && !/SQL|hibernate/.test(e.message));
});
test("red caída da mensaje legible", async (t) => {
  t.mock.method(globalThis,"fetch",async () => {throw new TypeError("Failed to fetch");});
  await assert.rejects(iniciarSesion(credenciales), /conexión/);
});
test("respuesta 200 inválida no crea sesión", async (t) => {
  t.mock.method(globalThis,"fetch",async () => new Response("<html>proxy</html>",{status:200}));
  await assert.rejects(iniciarSesion(credenciales), /confirmación/);
});
test("login antiguo no aplica mínimo de registro y normaliza solo correo", async (t) => {
  let enviado;
  t.mock.method(globalThis,"fetch",async (url,options) => { enviado=JSON.parse(options.body); return new Response(JSON.stringify({token:"token-simulado",rol:"ESTUDIANTE"})); });
  await iniciarSesion({...credenciales,password:" corta "});
  assert.equal(enviado.correo,"persona@example.com"); assert.equal(enviado.password," corta ");
});
test("confirmación de contraseña no se envía ni se inventa rol", async (t) => {
  let enviado;
  t.mock.method(globalThis,"fetch",async (url,options) => { enviado=JSON.parse(options.body); return new Response(JSON.stringify({token:"token-simulado",rol:"ESTUDIANTE"})); });
  await registrarEstudiante(valido);
  assert.equal(enviado.confirmacion,undefined); assert.equal(enviado.rol,undefined);
});
test("errores de validación se asocian al campo sin revelar contraseña", async (t) => {
  t.mock.method(globalThis,"fetch",async () => new Response(JSON.stringify({code:"VALIDACION_FALLIDA",errors:{password:"Usa al menos 15 caracteres."}}),{status:400}));
  await assert.rejects(registrarEstudiante(valido),(e) => e.erroresCampos.password === "Usa al menos 15 caracteres." && !e.message.includes(valido.password));
});
test("correo duplicado no muestra texto técnico", async (t) => {
  t.mock.method(globalThis,"fetch",async () => new Response("Ya existe un estudiante con ese correo.",{status:400}));
  await assert.rejects(registrarEstudiante(valido), /No pudimos crear la cuenta/);
});
