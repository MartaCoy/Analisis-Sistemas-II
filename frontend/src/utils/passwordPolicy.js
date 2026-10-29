// Solo aplica al registro. El login conserva las contraseñas ya existentes.
export const MIN_PASSWORD_LENGTH = 15;
export const MAX_PASSWORD_BYTES = 72; // Límite del BCrypt utilizado por el backend.
export const passwordBytes = (value) => new TextEncoder().encode(String(value ?? "")).length;

export function validarPassword(value) {
  const password = String(value ?? "");
  if (!password.trim()) return "Escribe una contraseña.";
  if (Array.from(password).length < MIN_PASSWORD_LENGTH) {
    return "Usa al menos 15 caracteres. Puedes escribir una frase con espacios.";
  }
  if (passwordBytes(password) > MAX_PASSWORD_BYTES) {
    return "La contraseña supera el límite permitido. Acórtala un poco.";
  }
  return "";
}

export function estimarFortaleza(value) {
  const password = String(value ?? "");
  if (!password) return { nivel: 0, etiqueta: "Sin evaluar", consejo: "Prueba con varias palabras que no estén relacionadas." };
  const largo = Array.from(password).length;
  const compacta = password.toLowerCase().replace(/\s+/g, "");
  const predecible = /^(.)\1+$/.test(compacta) || /^(\d+|[a-z])$/.test(compacta)
    || /(password|contrasena|contraseña|qwerty|123456|abcdef)/i.test(compacta)
    || /^(.{1,6})\1{2,}$/.test(compacta);
  const variedad = new Set(Array.from(password.toLowerCase())).size;
  let nivel = largo >= 20 && variedad >= 10 ? 3 : largo >= 15 && variedad >= 7 ? 2 : 1;
  if (predecible || validarPassword(password)) nivel = 1;
  return {
    nivel,
    etiqueta: ["Sin evaluar", "Débil", "Media", "Fuerte"][nivel],
    consejo: nivel === 3 ? "Usa esta contraseña solo aquí y guárdala en un gestor."
      : predecible ? "Evita secuencias, repeticiones y palabras muy habituales."
        : "Añade longitud con palabras distintas; no necesitas memorizar símbolos complicados.",
  };
}
