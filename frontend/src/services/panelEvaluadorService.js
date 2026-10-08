import { obtenerToken } from "./authService.js";
import { apiUrl } from "../config/api.js";

const API_URL = apiUrl("/api/panel-evaluador/solicitudes");
const TIEMPO_LIMITE_MS = 15_000;

function crearError(mensaje, status = 0) {
  const error = new Error(mensaje);
  error.status = status;
  return error;
}

function esId(valor) {
  return typeof valor === "number"
    ? Number.isSafeInteger(valor) && valor > 0
    : typeof valor === "string" && /^[1-9]\d*$/.test(valor);
}

function esSolicitud(datos) {
  return (
    datos !== null &&
    typeof datos === "object" &&
    !Array.isArray(datos) &&
    esId(datos.id) &&
    esId(datos.estudianteId) &&
    esId(datos.convocatoriaId) &&
    esId(datos.comiteId) &&
    typeof datos.estado === "string" &&
    datos.estado.trim() !== "" &&
    typeof datos.fechaSolicitud === "string"
  );
}

export async function obtenerBandejaEvaluador({ signal } = {}) {
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
    throw crearError(
      "Inicia sesión para consultar la bandeja.",
      401
    );
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
    const respuesta = await fetch(API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
      signal: controller.signal,
      cache: "no-store",
      redirect: "error",
    });

    if (!respuesta.ok) {
      const mensajes = {
        401: "Tu sesión no es válida. Inicia sesión nuevamente.",
        403: "El servidor rechazó el acceso al panel. Revisa tu sesión y el rol ADMINISTRADOR.",
        404: "La ruta del panel no está disponible. Comprueba que el backend actualizado esté ejecutándose.",
        500: "El backend no pudo consultar la bandeja. Revisa su terminal.",
      };

      throw crearError(
        mensajes[respuesta.status] ||
          `No se pudo consultar la bandeja (HTTP ${respuesta.status}).`,
        respuesta.status
      );
    }

    const tipo = respuesta.headers.get("content-type") || "";

    if (!tipo.toLowerCase().includes("json")) {
      throw crearError("El servidor no devolvió JSON válido.");
    }

    const texto = await respuesta.text();
    let datos;

    try {
      datos = JSON.parse(texto);
    } catch {
      throw crearError(
        "No se pudo interpretar la respuesta de la bandeja."
      );
    }

    if (
      !datos ||
      !esId(datos.evaluadorId) ||
      !Array.isArray(datos.solicitudes) ||
      !datos.solicitudes.every(esSolicitud) ||
      new Set(
        datos.solicitudes.map((item) => String(item.id))
      ).size !== datos.solicitudes.length
    ) {
      throw crearError(
        "La respuesta no tiene el formato esperado del panel."
      );
    }

    return datos;
  } catch (error) {
    if (signal?.aborted) {
      throw new DOMException("Consulta cancelada.", "AbortError");
    }

    if (tiempoAgotado) {
      throw crearError(
        "Se agotó el tiempo de espera. Intenta actualizar."
      );
    }

    if (typeof error?.status === "number") {
      throw error;
    }

    throw crearError("No fue posible conectar con el backend.");
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", cancelar);
  }
}
