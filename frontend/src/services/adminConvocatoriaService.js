import { obtenerToken } from "./authService.js";
import {
  cuerpoConvocatoria,
  validarFormulario,
} from "../utils/convocatoriaAdminUtils.js";

const API_URL = "/api/convocatorias";
const TIEMPO_LIMITE_MS = 15_000;

function errorAPI(mensaje, status = 0, resultadoIncierto = false) {
  const error = new Error(mensaje);
  error.status = status;
  error.resultadoIncierto = resultadoIncierto;
  return error;
}

function identificar(id) {
  const valor = String(id ?? "").trim();
  const numeroInseguro = typeof id === "number" && !Number.isSafeInteger(id);

  if (numeroInseguro || !/^[1-9]\d*$/.test(valor)) {
    throw errorAPI("El identificador de la convocatoria no es válido.", 400);
  }

  return valor;
}

function esConvocatoria(datos) {
  return (
    datos !== null &&
    typeof datos === "object" &&
    !Array.isArray(datos) &&
    datos.id != null &&
    typeof datos.nombre === "string" &&
    typeof datos.tipoBeca === "string" &&
    typeof datos.estado === "string"
  );
}

// Una sola peticion por llamada. Nunca reintentamos escrituras automaticamente.
async function solicitar(ruta = "", { method = "GET", body, signal } = {}) {
  if (signal?.aborted) {
    throw new DOMException("Consulta cancelada.", "AbortError");
  }

  let token;
  try {
    token = obtenerToken();
  } catch {
    throw errorAPI("No se pudo leer la sesión del navegador.");
  }

  if (typeof token !== "string" || !token.trim()) {
    throw errorAPI("Inicia sesión para continuar.", 401);
  }

  const contenido = body === undefined ? undefined : JSON.stringify(body);
  const escritura = method !== "GET";
  const controller = new AbortController();
  const cancelar = () => controller.abort();
  let tiempoAgotado = false;

  signal?.addEventListener("abort", cancelar, { once: true });

  const timer = window.setTimeout(() => {
    tiempoAgotado = true;
    controller.abort();
  }, TIEMPO_LIMITE_MS);

  try {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token.trim()}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: contenido,
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });

    if (!respuesta.ok) {
      const mensajes = {
        400: "El servidor rechazó los datos. Revisa el formulario.",
        401: "Tu sesión no es válida. Inicia sesión nuevamente.",
        403: "El servidor rechazó el acceso. Comprueba tu sesión y tus permisos.",
        404: "No se encontró la convocatoria o la ruta solicitada.",
        409: "Existe un conflicto con los datos. Actualiza el listado.",
        422: "Revisa los datos y las fechas de la convocatoria.",
        429: "Hay demasiadas solicitudes. Espera un momento antes de continuar.",
      };

      throw errorAPI(
        mensajes[respuesta.status] ||
          `No se pudo completar la operación (HTTP ${respuesta.status}).`,
        respuesta.status,
        escritura && (respuesta.status >= 500 || respuesta.status === 408)
      );
    }

    const texto = await respuesta.text();

    // El backend compartido devuelve null si no encuentra ciertos ID.
    if (!texto.trim()) return null;

    const tipo = respuesta.headers.get("content-type") || "";
    if (!tipo.toLowerCase().includes("json")) {
      throw errorAPI("El servidor no devolvió JSON válido.", 0, escritura);
    }

    try {
      return JSON.parse(texto);
    } catch {
      throw errorAPI("No se pudo interpretar la respuesta del servidor.", 0, escritura);
    }
  } catch (error) {
    if (tiempoAgotado) {
      throw errorAPI(
        "Se agotó el tiempo de espera del servidor.", 0, escritura
      );
    }

    if (error.name === "AbortError" || signal?.aborted) {
      // Cancelar la espera no confirma que el servidor deshizo una escritura.
      if (escritura) {
        throw errorAPI("Se canceló la espera de confirmación.", 0, true);
      }
      throw new DOMException("Consulta cancelada.", "AbortError");
    }

    if (error instanceof TypeError) {
      throw errorAPI("No se pudo completar la conexión con el servidor.", 0, escritura);
    }

    throw error;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", cancelar);
  }
}

function confirmarEscritura(datos, id = null, estadoEsperado = null) {
  if (id !== null && datos === null) {
    throw errorAPI("La convocatoria ya no existe.", 404);
  }

  if (
    !esConvocatoria(datos) ||
    (id !== null && String(datos.id) !== String(id)) ||
    (estadoEsperado !== null && datos.estado !== estadoEsperado)
  ) {
    throw errorAPI("No se recibió una confirmación válida de la operación.", 0, true);
  }

  return datos;
}

// GET: incluye borradores, publicadas y cerradas, tal como responde la API.
export async function listarAdministracion({ signal } = {}) {
  const datos = await solicitar("", { signal });

  if (!Array.isArray(datos) || !datos.every(esConvocatoria)) {
    throw errorAPI("El servidor no devolvió una lista válida.");
  }

  return datos;
}

// GET: consultamos el detalle actualizado antes de editar o confirmar acciones.
export async function consultarAdministracion(id, { signal } = {}) {
  const identificador = identificar(id);
  const datos = await solicitar(`/${identificador}`, { signal });

  if (datos === null) {
    throw errorAPI("La convocatoria ya no existe.", 404);
  }

  if (!esConvocatoria(datos) || String(datos.id) !== identificador) {
    throw errorAPI("El servidor no devolvió el detalle solicitado.");
  }

  return datos;
}

// Sin id: POST para crear. Con id: PUT para editar.
export async function guardarAdministracion(datos, { id = null, signal } = {}) {
  const errores = validarFormulario(datos);

  if (Object.keys(errores).length > 0) {
    const error = errorAPI(Object.values(errores)[0], 400);
    error.erroresCampos = errores;
    throw error;
  }

  const identificador = id === null ? null : identificar(id);
  const resultado = await solicitar(
    identificador === null ? "" : `/${identificador}`,
    {
      method: identificador === null ? "POST" : "PUT",
      // Incluye beneficio y solo los campos de ConvocatoriaRequest.
      body: cuerpoConvocatoria(datos),
      signal,
    }
  );

  return confirmarEscritura(
    resultado, identificador, identificador === null ? "BORRADOR" : null
  );
}

// PUT: el estado se cambia por su endpoint, no dentro del formulario.
export async function cambiarEstadoAdministracion(id, accion, { signal } = {}) {
  if (accion !== "publicar" && accion !== "cerrar") {
    throw errorAPI("La acción solicitada no está disponible.", 400);
  }

  const identificador = identificar(id);
  const estadoEsperado = accion === "publicar" ? "PUBLICADA" : "CERRADA";
  const resultado = await solicitar(`/${identificador}/${accion}`, {
    method: "PUT",
    signal,
  });

  return confirmarEscritura(resultado, identificador, estadoEsperado);
}