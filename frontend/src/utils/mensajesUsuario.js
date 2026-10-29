export function mensajeHttp(status, contexto = "general", rol = "") {
  if (contexto === "login" && (status === 400 || status === 401)) return "Correo o contraseña incorrectos.";
  if (status === 401) return "Tu sesión venció o ya no es válida. Inicia sesión nuevamente.";
  if (status === 403) return contexto === "login"
    ? "No fue posible autorizar el acceso. Intenta iniciar sesión nuevamente."
    : rol === "ADMINISTRADOR"
      ? "Tu cuenta no tiene permiso para realizar esta acción administrativa."
      : "Esta acción no está disponible para tu cuenta. Vuelve a tu panel.";
  if (status === 404) return "No encontramos el registro solicitado. Actualiza la página.";
  if (status === 409) return "Los datos cambiaron o el registro ya existe. Actualiza antes de continuar.";
  if (status === 413) return "El archivo supera el tamaño permitido. Selecciona uno más pequeño.";
  if (status === 429) return "Hay demasiados intentos. Espera un momento antes de volver a intentarlo.";
  if (status >= 500) return "El servicio no está disponible en este momento. Intenta más tarde.";
  if (contexto === "registro") return "No pudimos crear la cuenta con esos datos. Revísalos o inicia sesión si ya te registraste.";
  return "No pudimos completar la operación. Revisa los datos e intenta nuevamente.";
}
export function errorUsuario(mensaje, status = 0, campos = {}) {
  const error = new Error(mensaje);
  error.status = status;
  error.erroresCampos = campos;
  return error;
}
// No propagar HTML, trazas, SQL ni textos internos hacia estudiantes o administradores.
export function esMensajeNegocio(value) {
  return typeof value === "string" && value.length <= 350 && !/[<>\r\n]/.test(value)
    && !/(exception|sql|jdbc|hibernate|stacktrace|java\.|org\.|token|jwt|json|\bat\b.*\()/i.test(value)
    && /^(La |El |No se puede |No puedes |No se ha |Ya existe |Ya se |Debes |Se requiere |Elige |Ingresa |Una |Este |Esta )/.test(value);
}
