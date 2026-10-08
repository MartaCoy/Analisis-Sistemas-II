const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || ""
)
  .trim()
  .replace(/\/+$/, "");

export function apiUrl(path) {
  const ruta = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${ruta}`;
}

export { API_BASE_URL };
