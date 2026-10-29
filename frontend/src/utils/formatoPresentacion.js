const formatoMonto = new Intl.NumberFormat("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatoConZona = new Intl.DateTimeFormat("es-GT", {
  timeZone: "America/Guatemala", day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
export function mostrarMonto(value) {
  if (value == null || String(value).trim() === "" || !Number.isFinite(Number(value))) return "Monto por confirmar";
  return formatoMonto.format(Number(value));
}
export function mostrarFechaHora(value) {
  if (!value) return "Fecha no disponible";
  const raw = String(value).trim();
  // LocalDateTime de Java no incluye zona: conservar la hora informada, no inventar UTC.
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(raw);
  if (m) {
    const [,y,mo,d,h,mi] = m;
    const date = new Date(Date.UTC(Number(y),Number(mo)-1,Number(d)));
    if (date.getUTCFullYear() !== Number(y) || date.getUTCMonth()+1 !== Number(mo)
      || date.getUTCDate() !== Number(d) || Number(h)>23 || Number(mi)>59) return "Fecha no disponible";
    return `${d}/${mo}/${y} · ${h}:${mi}`;
  }
  if (/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(raw)) {
    const date = new Date(raw);
    if (!Number.isNaN(date.getTime())) return formatoConZona.format(date);
  }
  return "Fecha no disponible";
}
export function mostrarEstado(value) {
  const estados = {
    RECIBIDA: "Recibida", EN_EVALUACION: "En evaluación", APROBADA: "Aprobada",
    RECHAZADA: "Rechazada", PENDIENTE_SEGUNDA_APROBACION: "Pendiente de segunda aprobación",
  };
  return estados[value] || "Estado por confirmar";
}
