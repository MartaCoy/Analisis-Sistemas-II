import { obtenerToken } from "./authService.js";
import { apiUrl } from "../config/api.js";

const API_URL = apiUrl("/api/solicitudes");
const TIEMPO_LIMITE_MS = 15_000;

function crearError(mensaje, status = 0, resultadoIncierto = false) {
  const aviso = resultadoIncierto
    ? " Consulta las evaluaciones antes de intentar enviar nuevamente."
    : "";

  const error = new Error(mensaje + aviso);
  error.status = status;
  error.resultadoIncierto = resultadoIncierto;

  return error;
}

function validarId(id) {
  const valor = String(id ?? "").trim();

  if (
    !/^[1-9]\d*$/.test(valor) ||
    (typeof id === "number" && !Number.isSafeInteger(id))
  ) {
    throw crearError(
      "El identificador de la solicitud no es válido.",
      400
    );
  }

  return valor;
}

// Valida y construye solamente los campos de EvaluacionRequest.
export function validarEvaluacion(datos) {
  const errores = {};
  const valor = datos?.puntaje;
  const tipoValido =
    typeof valor === "string" || typeof valor === "number";

  // Un campo vacío no debe convertirse accidentalmente en cero.
  const puntaje =
    tipoValido && String(valor).trim() !== ""
      ? Number(valor)
      : NaN;

  const observaciones = datos?.observaciones ?? "";

  if (!Number.isInteger(puntaje) || puntaje < 0 || puntaje > 100) {
    errores.puntaje = "Ingresa un puntaje entero entre 0 y 100.";
  }

  if (
    typeof observaciones !== "string" ||
    observaciones.length > 1000
  ) {
    errores.observaciones =
      "Las observaciones admiten hasta 1000 caracteres.";
  }

  if (Object.keys(errores).length > 0) {
    const error = crearError(Object.values(errores)[0], 400);
    error.erroresCampos = errores;
    throw error;
  }

  return {
    puntaje,
    observaciones: observaciones.trim() || null,
  };
}

// Cada llamada realiza una sola petición. No reintenta escrituras.
async function solicitarEvaluaciones(id, { body, signal } = {}) {
  const escritura = body !== undefined;

  if (signal?.aborted) {
    throw new DOMException("Consulta cancelada.", "AbortError");
  }

  let token;

  try {
    token = obtenerToken();
  } catch {
    throw crearError("No se pudo leer la sesión del navegador.");
  }

  if (typeof token !== "string" || !token.trim()) {
    throw crearError("Inicia sesión para continuar.", 401);
  }

  const controller = new AbortController();
  const cancelar = () => controller.abort();
  let tiempoAgotado = false;

  signal?.addEventListener("abort", cancelar, { once: true });

  const timer = window.setTimeout(() => {
    tiempoAgotado = true;
    controller.abort();
  }, TIEMPO_LIMITE_MS);

  try {
    const respuesta = await fetch(
      `${API_URL}/${id}/evaluaciones`,
      {
        method: escritura ? "POST" : "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token.trim()}`,
          ...(escritura
            ? { "Content-Type": "application/json" }
            : {}),
        },
        body: escritura ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        cache: "no-store",
        redirect: "error",
      }
    );

    const texto = await respuesta.text();

    const tipo = (
      respuesta.headers.get("content-type") || ""
    ).toLowerCase();

    if (!respuesta.ok) {
      const mensajes = {
        400: "El servidor rechazó la evaluación. Revisa los datos.",
        401: "Tu sesión no es válida. Inicia sesión nuevamente.",
        403: "Tu cuenta no tiene permiso para acceder a las evaluaciones.",
        404: "No se encontró la solicitud o la ruta solicitada.",
        409: "Hay un conflicto. Actualiza el expediente.",
      };

      let mensaje =
        mensajes[respuesta.status] ||
        `No se completó la operación (HTTP ${respuesta.status}).`;

      // El controlador devuelve sus errores de negocio como texto.
      if (
        respuesta.status === 400 &&
        tipo.includes("text/plain") &&
        texto.trim()
      ) {
        mensaje = texto.trim().slice(0, 500);
      }

      throw crearError(
        mensaje,
        respuesta.status,
        escritura &&
          (respuesta.status >= 500 || respuesta.status === 408)
      );
    }

    if (!tipo.includes("json")) {
      throw crearError(
        "El servidor no devolvió JSON válido.",
        0,
        escritura
      );
    }

    try {
      return JSON.parse(texto);
    } catch {
      throw crearError(
        "No se pudo interpretar la respuesta.",
        0,
        escritura
      );
    }
  } catch (error) {
    if (typeof error?.status === "number") {
      throw error;
    }

    if (!escritura && signal?.aborted) {
      throw new DOMException("Consulta cancelada.", "AbortError");
    }

    const mensaje = tiempoAgotado
      ? "Se agotó el tiempo de espera del servidor."
      : signal?.aborted
        ? "Se canceló la espera de confirmación."
        : "No fue posible completar la comunicación con el servidor.";

    // Un fallo de comunicación no confirma que el POST se deshizo.
    throw crearError(mensaje, 0, escritura);
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", cancelar);
  }
}

function esEvaluacion(datos, solicitudId) {
  return (
    datos !== null &&
    typeof datos === "object" &&
    !Array.isArray(datos) &&
    datos.id != null &&
    String(datos.solicitudId) === solicitudId &&
    datos.evaluadorId != null &&
    Number.isInteger(datos.puntaje) &&
    datos.puntaje >= 0 &&
    datos.puntaje <= 100
  );
}

// GET /api/solicitudes/{id}/evaluaciones
export async function listarEvaluacionesSolicitud(
  solicitudId,
  { signal } = {}
) {
  const id = validarId(solicitudId);
  const datos = await solicitarEvaluaciones(id, { signal });

  if (
    !Array.isArray(datos) ||
    !datos.every((item) => esEvaluacion(item, id))
  ) {
    throw crearError(
      "El servidor no devolvió una lista válida de evaluaciones."
    );
  }

  return datos;
}

// POST /api/solicitudes/{id}/evaluaciones
export async function registrarEvaluacionSolicitud(
  solicitudId,
  datos,
  { signal } = {}
) {
  const id = validarId(solicitudId);
  const body = validarEvaluacion(datos);

  const resultado = await solicitarEvaluaciones(id, {
    body,
    signal,
  });

  if (
    !esEvaluacion(resultado, id) ||
    resultado.puntaje !== body.puntaje
  ) {
    throw crearError(
      "No se recibió una confirmación válida del guardado.",
      0,
      true
    );
  }

  return resultado;
}
