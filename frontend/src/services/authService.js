const API_URL = "/api/auth";
const SESSION_KEY = "becas_session";

async function procesarRespuesta(respuesta) {
  const contentType =
    respuesta.headers.get("content-type");

  let data;

  if (
    contentType &&
    contentType.includes("application/json")
  ) {
    data = await respuesta.json();
  } else {
    data = await respuesta.text();
  }

  if (!respuesta.ok) {
    const mensaje =
      typeof data === "string"
        ? data
        : data?.message ||
          "Ocurrió un error al procesar la solicitud.";

    throw new Error(mensaje);
  }

  return data;
}

export async function registrarEstudiante(datos) {
  try {
    const respuesta = await fetch(
      `${API_URL}/registro`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          nombreCompleto:
            datos.nombreCompleto.trim(),

          carnet:
            datos.carnet.trim(),

          correo:
            datos.correo.trim().toLowerCase(),

          password:
            datos.password,

          universidadId:
            Number(datos.universidadId),
        }),
      }
    );

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

export async function iniciarSesion(datos) {
  try {
    const respuesta = await fetch(
      `${API_URL}/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          correo:
            datos.correo.trim().toLowerCase(),

          password:
            datos.password,
        }),
      }
    );

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

export function guardarSesion(datos) {
  if (!datos?.token) {
    throw new Error(
      "El servidor no devolvió un token de sesión."
    );
  }

  const sesion = {
    token: datos.token,
    nombreCompleto:
      datos.nombreCompleto,

    correo:
      datos.correo,

    rol:
      datos.rol,
  };

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify(sesion)
  );

  return sesion;
}

export function obtenerSesion() {
  const sesionGuardada =
    localStorage.getItem(SESSION_KEY);

  if (!sesionGuardada) {
    return null;
  }

  try {
    const sesion =
      JSON.parse(sesionGuardada);

    if (!sesion?.token) {
      return null;
    }

    return sesion;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function obtenerToken() {
  return obtenerSesion()?.token || null;
}

export function estaAutenticado() {
  return Boolean(obtenerToken());
}

export function cerrarSesion() {
  localStorage.removeItem(SESSION_KEY);
}