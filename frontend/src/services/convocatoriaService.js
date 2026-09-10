import { obtenerToken } from "./authService.js";

const API_URL = "/api/convocatorias";
const TIEMPO_LIMITE_MS = 15_000;

// Conservamos el estado HTTP para que la pantalla pueda manejar cada caso.
function crearError(mensaje, status = 0) {
  const error = new Error(mensaje);
  error.status = status;

  return error;
}

async function consultarAPI(ruta, { signal } = {}) {
  let token;

  try {
    token = obtenerToken();
  } catch {
    throw crearError(
      "No se pudo leer la sesión del navegador."
    );
  }

  if (typeof token !== "string" || !token.trim()) {
    throw crearError(
      "Inicia sesión para consultar convocatorias.",
      401
    );
  }

  const controller = new AbortController();
  let tiempoAgotado = false;

  const cancelar = () => controller.abort();

  if (signal?.aborted) {
    cancelar();
  } else {
    signal?.addEventListener("abort", cancelar, {
      once: true,
    });
  }

  // Evitamos que la pantalla se quede esperando indefinidamente.
  const timer = window.setTimeout(() => {
    tiempoAgotado = true;
    controller.abort();
  }, TIEMPO_LIMITE_MS);

  try {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!respuesta.ok) {
      const mensajes = {
        401: "Tu sesión no es válida. Inicia sesión nuevamente.",
        403: "El servidor rechazó el acceso. Revisa tu sesión o tus permisos.",
        404: "No se encontró el recurso solicitado.",
      };

      throw crearError(
        mensajes[respuesta.status] ||
          `No se pudieron consultar las convocatorias (HTTP ${respuesta.status}).`,
        respuesta.status
      );
    }

    const texto = await respuesta.text();

    // El backend actual puede devolver un detalle vacío
    // cuando no encuentra una convocatoria.
    if (!texto.trim()) {
      return null;
    }

    const contentType =
      respuesta.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("json")) {
      throw crearError(
        "El servidor no devolvió una respuesta JSON."
      );
    }

    try {
      return JSON.parse(texto);
    } catch {
      throw crearError(
        "La respuesta del servidor no contiene JSON válido."
      );
    }
  } catch (error) {
    if (tiempoAgotado) {
      throw crearError(
        "El servidor tardó demasiado. Intenta nuevamente."
      );
    }

    // Cambiar de pantalla puede cancelar la consulta.
    // Conservamos esa señal sin convertirla en un error de conexión.
    if (error.name === "AbortError") {
      throw error;
    }

    if (error instanceof TypeError) {
      throw crearError(
        "No se pudo conectar con el servidor. Intenta nuevamente."
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", cancelar);
  }
}

// Listado de convocatorias PUBLICADAS.
// La vigencia por fechas se presentará por separado en la interfaz.
export async function listarConvocatoriasActivas({
  signal,
} = {}) {
  const datos = await consultarAPI("/activas", {
    signal,
  });

  if (!Array.isArray(datos)) {
    throw crearError(
      "El servidor no devolvió una lista de convocatorias."
    );
  }

  return datos;
}

// Detalle de una convocatoria.
// Devuelve null si el backend responde vacío o con JSON null.
export async function obtenerConvocatoria(
  id,
  { signal } = {}
) {
  const identificador = String(id ?? "").trim();

  if (!/^[1-9]\d*$/.test(identificador)) {
    throw crearError(
      "El identificador de la convocatoria no es válido."
    );
  }

  const datos = await consultarAPI(
    `/${identificador}`,
    { signal }
  );

  if (datos === null) {
    return null;
  }

  if (
    typeof datos !== "object" ||
    Array.isArray(datos) ||
    datos.id == null
  ) {
    throw crearError(
      "El servidor no devolvió un detalle de convocatoria válido."
    );
  }

  return datos;
}