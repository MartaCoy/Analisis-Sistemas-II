const API_URL = "/api/auth";
async function procesarRespuesta(respuesta) {
    const contentType = respuesta.headers.get("content-type");

    let data;

    if (contentType && contentType.includes("application/json")) {
        data = await respuesta.json();
    } else {
        data = await respuesta.text();
    }

    if (!respuesta.ok) {
        const mensaje =
            typeof data === "string"
                ? data
                : data?.message || "Ocurrió un error al procesar la solicitud.";

        throw new Error(mensaje);
    }

    return data;
}

export async function registrarEstudiante(datos) {
    try {
        const respuesta = await fetch(`${API_URL}/registro`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },

            body: JSON.stringify({
                nombreCompleto: datos.nombreCompleto.trim(),
                carnet: datos.carnet.trim(),
                correo: datos.correo.trim().toLowerCase(),
                password: datos.password,
            }),
        });

        return await procesarRespuesta(respuesta);
    } catch (error) {
        if (error instanceof TypeError) {
            throw new Error(
                "No fue posible conectar con el servidor. Verifica que el backend esté activo."
            );
        }

        throw error;
    }
}