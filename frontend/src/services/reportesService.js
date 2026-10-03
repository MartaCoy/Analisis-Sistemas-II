import { obtenerToken } from "./authService.js";

const API_URL = String(
  import.meta.env.VITE_REPORTES_API_URL || ""
).trim();

export const DEMO_REPORTES_HABILITADA =
  import.meta.env.DEV &&
  String(
    import.meta.env.VITE_ENABLE_REPORTES_DEMO || ""
  )
    .trim()
    .toLowerCase() === "true";

function crearError(mensaje, codigo = "ERROR_REPORTE") {
  const error = new Error(mensaje);
  error.codigo = codigo;
  return error;
}

export function backendReportesDisponible() {
  return Boolean(API_URL);
}

export const REPORTE_DEMO = {
  generadoEn: "2026-10-03T08:00:00",
  resumen: {
    totalSolicitudes: 124,
    aprobadas: 68,
    rechazadas: 31,
    enEvaluacion: 17,
    recibidas: 8,
  },
  estados: [
    { nombre: "Aprobadas", cantidad: 68 },
    { nombre: "Rechazadas", cantidad: 31 },
    { nombre: "En evaluación", cantidad: 17 },
    { nombre: "Recibidas", cantidad: 8 },
  ],
  tiposBeca: [
    { nombre: "Socioeconómica", cantidad: 31 },
    { nombre: "Excelencia académica", cantidad: 22 },
    { nombre: "Deportiva", cantidad: 9 },
    { nombre: "Cultural", cantidad: 6 },
  ],
  otorgadas: [
    {
      id: 1042,
      estudiante: "Ana Martínez",
      convocatoria: "Programa de Apoyo Socioeconómico",
      tipoBeca: "SOCIOECONOMICA",
      fecha: "2026-09-29",
      puntaje: 92,
      estado: "APROBADA",
    },
    {
      id: 1038,
      estudiante: "Luis Hernández",
      convocatoria: "Beca de Excelencia Académica",
      tipoBeca: "EXCELENCIA",
      fecha: "2026-09-27",
      puntaje: 96,
      estado: "APROBADA",
    },
    {
      id: 1031,
      estudiante: "María López",
      convocatoria: "Programa de Apoyo Socioeconómico",
      tipoBeca: "SOCIOECONOMICA",
      fecha: "2026-09-24",
      puntaje: 88,
      estado: "APROBADA",
    },
    {
      id: 1027,
      estudiante: "Carlos Ramírez",
      convocatoria: "Beca Deportiva Nacional",
      tipoBeca: "DEPORTIVA",
      fecha: "2026-09-21",
      puntaje: 90,
      estado: "APROBADA",
    },
    {
      id: 1019,
      estudiante: "Sofía Castillo",
      convocatoria: "Programa Cultural Nacional",
      tipoBeca: "CULTURAL",
      fecha: "2026-09-18",
      puntaje: 87,
      estado: "APROBADA",
    },
    {
      id: 1012,
      estudiante: "Diego Morales",
      convocatoria: "Beca de Excelencia Académica",
      tipoBeca: "EXCELENCIA",
      fecha: "2026-09-15",
      puntaje: 94,
      estado: "APROBADA",
    },
  ],
};

export async function obtenerReporteBecas({
  signal,
} = {}) {
  if (!API_URL) {
    throw crearError(
      "HU-12 Backend aún no está integrado. La interfaz está lista para recibir el endpoint real.",
      "HU12_BACKEND_PENDIENTE"
    );
  }

  const token = obtenerToken();

  if (!token) {
    throw crearError(
      "No existe una sesión válida.",
      "SESION_INVALIDA"
    );
  }

  let respuesta;

  try {
    respuesta = await fetch(API_URL, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw crearError(
      "No fue posible conectar con el servicio de reportes.",
      "CONEXION"
    );
  }

  if (!respuesta.ok) {
    throw crearError(
      `No se pudo generar el reporte (HTTP ${respuesta.status}).`,
      "HTTP"
    );
  }

  const datos = await respuesta.json();

  if (
    !datos ||
    typeof datos !== "object" ||
    !datos.resumen ||
    !Array.isArray(datos.estados) ||
    !Array.isArray(datos.tiposBeca) ||
    !Array.isArray(datos.otorgadas)
  ) {
    throw crearError(
      "El backend no devolvió el formato esperado por HU-12.",
      "FORMATO"
    );
  }

  return datos;
}
