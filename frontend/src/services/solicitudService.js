import { obtenerToken, obtenerSesion } from "./authService.js";
import { esMensajeNegocio, mensajeHttp } from "../utils/mensajesUsuario.js";
import { apiUrl } from "../config/api.js";

const API_URL = apiUrl("/api/solicitudes");
const TIEMPO_LIMITE_MS = 900_000;

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
        (respuesta.status === 400 && esMensajeNegocio(mensajeServidor) ? mensajeServidor : null) ||
          (respuesta.status === 403 ? mensajeHttp(403, "solicitudes", obtenerSesion()?.rol) : mensajes[respuesta.status]) ||
          mensajeHttp(respuesta.status),
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
        "No pudimos conectar con el servicio. Revisa tu conexión e intenta nuevamente."
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
export async function obtenerHistorialSolicitud(
  solicitudId,
  { signal } = {}
) {
  const id = validarId(
    solicitudId,
    "identificador de la solicitud"
  );

  const datos = await solicitar(
    `/${id}/historial`,
    { signal }
  );

  if (!Array.isArray(datos)) {
    throw crearError(
      "El servidor no devolvió un historial válido."
    );
  }

  return datos;
}

// Requisitos octubre 2026: consulta administrativa y segunda aprobación.
export async function listarPendientesSegundaAprobacion({ signal } = {}) {
  const datos = await solicitar("/pendientes-segunda", { signal });
  if (!Array.isArray(datos)) throw crearError("Listado de autorizaciones inválido.");
  return datos;
}

export async function obtenerAprobacionesSolicitud(solicitudId, { signal } = {}) {
  const id = validarId(solicitudId, "solicitud");
  const datos = await solicitar(`/${id}/aprobaciones`, { signal });
  if (!Array.isArray(datos)) throw crearError("Registro de aprobaciones inválido.");
  return datos;
}

export async function obtenerAuditoriaSolicitud(solicitudId, { signal } = {}) {
  const id = validarId(solicitudId, "solicitud");
  const datos = await solicitar(`/${id}/auditoria`, { signal });
  if (!Array.isArray(datos)) throw crearError("Registro de auditoría inválido.");
  return datos;
}

export async function resolverSegundaAprobacionSolicitud(
  solicitudId, { aprobada, observacion = "" }
) {
  const id = validarId(solicitudId, "solicitud");
  if (typeof aprobada !== "boolean") throw crearError("Decisión inválida.", 400);
  if (observacion.length > 500) throw crearError("Observación demasiado larga.", 400);
  return solicitar(`/${id}/segunda-aprobacion`, {
    method: "POST", body: { aprobada, observacion },
  });
}

export async function actualizarMontoSolicitud(solicitudId, monto) {
  const id = validarId(solicitudId, "solicitud");
  if (!Number.isFinite(Number(monto)) || Number(monto) <= 0) {
    throw crearError("Indica un monto positivo.", 400);
  }
  return solicitar(`/${id}/monto`, { method: "PUT", body: { monto: Number(monto) } });
}
