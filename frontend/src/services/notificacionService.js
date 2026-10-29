import { obtenerToken, obtenerSesion } from "./authService.js";
import { apiUrl } from "../config/api.js";
import { errorUsuario, mensajeHttp } from "../utils/mensajesUsuario.js";

async function consultar(ruta, method = "GET", { signal } = {}) {
  const token = obtenerToken();
  if (!token) throw errorUsuario("Inicia sesión para consultar tus notificaciones.", 401);
  if (signal?.aborted) throw new DOMException("Consulta cancelada", "AbortError");
  const controller = new AbortController();
  const cancelar = () => controller.abort();
  let agotado = false;
  signal?.addEventListener("abort", cancelar, { once: true });
  const timer = setTimeout(() => { agotado = true; controller.abort(); }, 15000);
  try {
    const respuesta = await fetch(apiUrl(`/api/notificaciones${ruta}`), {
      method, signal: controller.signal, cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!respuesta.ok) throw errorUsuario(mensajeHttp(respuesta.status, "notificaciones", obtenerSesion()?.rol), respuesta.status);
    try { return await respuesta.json(); }
    catch { throw errorUsuario("No pudimos leer tus notificaciones. Actualiza el listado."); }
  } catch (error) {
    if (agotado) throw errorUsuario("La consulta tardó demasiado. Actualiza el listado para comprobar el resultado.");
    if (error instanceof TypeError) throw errorUsuario("No pudimos conectar con el servicio. Revisa tu conexión.");
    throw error;
  } finally { clearTimeout(timer); signal?.removeEventListener("abort", cancelar); }
}
export async function listarMisNotificaciones({ signal } = {}) {
  const datos = await consultar("/mias", "GET", { signal });
  if (!Array.isArray(datos)) throw errorUsuario("No pudimos cargar tus notificaciones. Intenta nuevamente.");
  return datos;
}
export function marcarNotificacionLeida(id) {
  if (!/^[1-9]\d*$/.test(String(id))) throw errorUsuario("No encontramos la notificación seleccionada.");
  return consultar(`/${id}/leer`, "PUT");
}
