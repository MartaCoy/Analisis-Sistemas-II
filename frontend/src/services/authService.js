import { apiUrl } from "../config/api.js";
import { errorUsuario, mensajeHttp } from "../utils/mensajesUsuario.js";

const API_URL = apiUrl("/api/auth");
const SESSION_KEY = "becas_session";
const CAMPOS = new Set(["nombreCompleto", "correo", "password", "carnet", "universidadId"]);

async function autenticar(operacion, body) {
  const controller = new AbortController();
  let agotado = false;
  const timer = setTimeout(() => { agotado = true; controller.abort(); }, 15000);
  try {
    const respuesta = await fetch(`${API_URL}/${operacion}`, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body), signal: controller.signal, cache: "no-store",
    });
    // Algunos controladores devuelven texto incluso con un Content-Type JSON.
    const texto = await respuesta.text();
    let datos = null;
    try { datos = texto ? JSON.parse(texto) : null; } catch { /* el status decide el mensaje */ }
    if (!respuesta.ok) {
      const campos = {};
      if (operacion === "registro" && datos?.code === "VALIDACION_FALLIDA" && datos?.errors) {
        for (const [campo, mensaje] of Object.entries(datos.errors)) {
          if (CAMPOS.has(campo) && typeof mensaje === "string" && mensaje.length <= 200) campos[campo] = mensaje;
        }
      }
      throw errorUsuario(Object.values(campos)[0] || mensajeHttp(respuesta.status, operacion), respuesta.status, campos);
    }
    if (!datos || typeof datos.token !== "string" || !datos.token.trim() || typeof datos.rol !== "string") {
      throw errorUsuario("No recibimos una confirmación válida. Intenta iniciar sesión nuevamente.");
    }
    return datos;
  } catch (error) {
    if (agotado) throw errorUsuario(operacion === "registro"
      ? "No recibimos confirmación a tiempo. Comprueba si puedes iniciar sesión antes de repetir el registro."
      : "El servicio tardó demasiado en responder. Intenta nuevamente.");
    if (error instanceof TypeError) throw errorUsuario("No pudimos conectar con el servicio. Revisa tu conexión e intenta nuevamente.");
    throw error;
  } finally { clearTimeout(timer); }
}

export function registrarEstudiante(datos) {
  return autenticar("registro", {
    nombreCompleto: datos.nombreCompleto.trim(), carnet: datos.carnet.trim(),
    correo: datos.correo.trim().toLowerCase(), password: datos.password,
    universidadId: Number(datos.universidadId),
  });
}
export function iniciarSesion(datos) {
  return autenticar("login", { correo: datos.correo.trim().toLowerCase(), password: datos.password });
}
export function guardarSesion(datos) {

  if (!datos?.token) {
    throw new Error(
      "No pudimos confirmar tu sesión. Intenta iniciar sesión nuevamente."
    );
  }

  const sesion = {
    token: datos.token,
    nombreCompleto:
      datos.nombreCompleto,

    correo:
      datos.correo,

    rol:
      datos.rol,
  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(sesion)
  );

  return sesion;
}

export function obtenerSesion() {
  const sesionGuardada =
    localStorage.getItem(SESSION_KEY);

  if (!sesionGuardada) {
    return null;
  }

  try {
    const sesion =
      JSON.parse(sesionGuardada);

    if (!sesion?.token) {
      return null;
    }

    return sesion;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function obtenerToken() {
  return obtenerSesion()?.token || null;
}

export function estaAutenticado() {
  return Boolean(obtenerToken());
}

export function cerrarSesion() {
  localStorage.removeItem(SESSION_KEY);
}