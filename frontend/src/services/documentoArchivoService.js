// VISOR_DOCUMENTOS_PROTEGIDOS_V1
import { obtenerToken } from "./authService.js";
const API = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export async function abrirDocumentoProtegido(documento, descargar = false) {
  const pestana = descargar ? null : window.open("about:blank", "_blank");
  if (!descargar && !pestana) {
    window.alert("Habilita las ventanas emergentes para ver el documento.");
    return;
  }
  if (pestana) {
    pestana.document.title = "Cargando documento";
    pestana.document.body.textContent = "Cargando documento...";
    pestana.opener = null;
  }
  try {
    const token = obtenerToken();
    if (!token) throw new Error("Tu sesion ha terminado. Vuelve a iniciar sesion.");
    if (!documento?.id || !documento?.solicitudId) {
      throw new Error("No se encontro el identificador del documento.");
    }
    const ruta = `/api/solicitudes/${encodeURIComponent(documento.solicitudId)}` +
      `/documentos/${encodeURIComponent(documento.id)}/archivo` +
      (descargar ? "?descargar=true" : "");
    const respuesta = await fetch(API + ruta, {
      headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
    });
    if (respuesta.status === 401 || respuesta.status === 403)
      throw new Error("No tienes permisos para consultar este archivo.");
    if (respuesta.status === 404)
      throw new Error("El archivo no se encuentra en el servidor.");
    if (!respuesta.ok)
      throw new Error(`No se pudo obtener el archivo (HTTP ${respuesta.status}).`);
    const blob = await respuesta.blob();
    const url = URL.createObjectURL(blob);
    if (descargar) {
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = (documento.nombreArchivo || "documento").replace(/[\\/\r\n]/g, "_");
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
    } else {
      pestana.location.replace(url);
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
  } catch (error) {
    if (pestana && !pestana.closed) pestana.close();
    window.alert(error instanceof Error ? error.message : "No se pudo abrir el documento.");
  }
}
