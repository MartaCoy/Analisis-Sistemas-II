import { obtenerToken } from "./authService.js";

const API_URL = "/api/solicitudes";
const TIEMPO_LIMITE_MS = 15_000;

function crearError(mensaje, status = 0) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

function validarId(id, nombre = "identificador") {
  const valor = String(id ?? "").trim();

  if (!/^[1-9]\d*$/.test(valor)) {
    throw crearError(`El ${nombre} no es válido.`, 400);
  }

  return valor;
}

async function solicitar(
  ruta = "",
  {
    method = "GET",
    body,
    signal,
  } = {}
) {
  const token = obtenerToken();

  if (typeof token !== "string" || !token.trim()) {
    throw crearError(
      "Debes iniciar sesión para continuar.",
      401
    );
  }

  const controller = new AbortController();
  let tiempoAgotado = false;

  const cancelar = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener(
      "abort",
      cancelar,
      { once: true }
    );
  }

  const timer = window.setTimeout(() => {
    tiempoAgotado = true;
    controller.abort();
  }, TIEMPO_LIMITE_MS);

  const esFormData =
    typeof FormData !== "undefined" &&
    body instanceof FormData;

  try {
    const respuesta = await fetch(
      `${API_URL}${ruta}`,
      {
        method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token.trim()}`,
          ...(
            body !== undefined && !esFormData
              ? { "Content-Type": "application/json" }
              : {}
          ),
        },
        body:
          body === undefined
            ? undefined
            : esFormData
              ? body
              : JSON.stringify(body),
        signal: controller.signal,
        cache: "no-store",
      }
    );

    const texto = await respuesta.text();

    const contentType =
      respuesta.headers.get("content-type") || "";

    let datos = null;

    if (texto.trim()) {
      if (
        contentType
          .toLowerCase()
          .includes("application/json")
      ) {
        try {
          datos = JSON.parse(texto);
        } catch {
          throw crearError(
            "El servidor devolvió una respuesta inválida."
          );
        }
      } else {
        datos = texto;
      }
    }

    if (!respuesta.ok) {
      const mensajeServidor =
        typeof datos === "string"
          ? datos.trim()
          : datos?.message;

      const mensajes = {
        400: "El servidor rechazó la solicitud.",
        401: "Tu sesión no es válida. Inicia sesión nuevamente.",
        403: "No tienes permisos para realizar esta operación.",
        404: "No se encontró el recurso solicitado.",
        409: "Existe un conflicto con la solicitud.",
      };

      throw crearError(
        mensajeServidor ||
          mensajes[respuesta.status] ||
          `No se pudo completar la operación (HTTP ${respuesta.status}).`,
        respuesta.status
      );
    }

    return datos;
  } catch (error) {
    if (tiempoAgotado) {
      throw crearError(
        "El servidor tardó demasiado en responder."
      );
    }

    if (
      error.name === "AbortError" ||
      signal?.aborted
    ) {
      throw new DOMException(
        "Operación cancelada.",
        "AbortError"
      );
    }

    if (error instanceof TypeError) {
      throw crearError(
        "No fue posible conectar con el servidor. Verifica que el backend esté activo."
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timer);

    signal?.removeEventListener(
      "abort",
      cancelar
    );
  }
}

export async function crearSolicitud(
  convocatoriaId,
  { signal } = {}
) {
  const id = validarId(
    convocatoriaId,
    "identificador de la convocatoria"
  );

  const datos = await solicitar("", {
    method: "POST",
    body: {
      convocatoriaId: Number(id),
    },
    signal,
  });

  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos) ||
    datos.id == null ||
    datos.convocatoriaId == null ||
    typeof datos.estado !== "string"
  ) {
    throw crearError(
      "El servidor no confirmó correctamente la creación de la solicitud."
    );
  }

  return datos;
}

export async function listarMisSolicitudes({
  signal,
} = {}) {
  const datos = await solicitar("/mias", {
    signal,
  });

  if (!Array.isArray(datos)) {
    throw crearError(
      "El servidor no devolvió una lista válida de solicitudes."
    );
  }

  return datos;
}

export async function obtenerSolicitud(
  solicitudId,
  { signal } = {}
) {
  const id = validarId(
    solicitudId,
    "identificador de la solicitud"
  );

  const datos = await solicitar(`/${id}`, {
    signal,
  });

  if (datos === null) {
    return null;
  }

  if (
    typeof datos !== "object" ||
    Array.isArray(datos) ||
    datos.id == null
  ) {
    throw crearError(
      "El servidor no devolvió una solicitud válida."
    );
  }

  return datos;
}

export async function subirDocumento(
  solicitudId,
  archivo,
  tipoDocumento,
  { signal } = {}
) {
  const id = validarId(
    solicitudId,
    "identificador de la solicitud"
  );

  if (
    !archivo ||
    typeof archivo.name !== "string"
  ) {
    throw crearError(
      "Selecciona un archivo para continuar.",
      400
    );
  }

  const tipo = String(
    tipoDocumento ?? ""
  ).trim();

  if (!tipo) {
    throw crearError(
      "Indica el tipo de documento.",
      400
    );
  }

  const formulario = new FormData();

  formulario.append(
    "archivo",
    archivo
  );

  formulario.append(
    "tipoDocumento",
    tipo
  );

  const datos = await solicitar(
    `/${id}/documentos`,
    {
      method: "POST",
      body: formulario,
      signal,
    }
  );

  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos) ||
    datos.id == null ||
    datos.solicitudId == null
  ) {
    throw crearError(
      "El servidor no confirmó correctamente la carga del documento."
    );
  }

  return datos;
}

export async function listarDocumentos(
  solicitudId,
  { signal } = {}
) {
  const id = validarId(
    solicitudId,
    "identificador de la solicitud"
  );

  const datos = await solicitar(
    `/${id}/documentos`,
    { signal }
  );

  if (!Array.isArray(datos)) {
    throw crearError(
      "El servidor no devolvió una lista válida de documentos."
    );
  }

  return datos;
}