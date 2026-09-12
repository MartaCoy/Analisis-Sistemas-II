// Utilidades del formulario administrativo de convocatorias.
// Las reglas del frontend no sustituyen las validaciones del backend.

export const TIPOS_BECA_ADMIN = {
  ACADEMICA: "Académica",
  DEPORTIVA: "Deportiva",
  SOCIOECONOMICA: "Socioeconómica",
};

export const ESTADOS_ADMIN = {
  BORRADOR: "Borrador",
  PUBLICADA: "Publicada",
  CERRADA: "Cerrada",
};

export const LIMITES_ADMIN = {
  nombre: 255, // Limite del formulario; lo conservamos del diseno anterior.
  requisitos: 1000, // Longitud indicada en Convocatoria.java.
  beneficio: 500, // Longitud indicada en Convocatoria.java.
};

// No recortamos los valores aqui: conservamos el contenido al abrir la edicion.
export function formularioDesde(datos = {}) {
  const origen = datos ?? {};

  return {
    nombre: String(origen.nombre ?? ""),
    tipoBeca: String(origen.tipoBeca ?? "ACADEMICA"),
    requisitos: String(origen.requisitos ?? ""),
    beneficio: String(origen.beneficio ?? ""),
    fechaApertura: String(origen.fechaApertura ?? ""),
    fechaCierre: String(origen.fechaCierre ?? ""),
  };
}

// Verifica el formato y que el dia realmente exista en el calendario.
export function fechaValida(valor) {
  if (
    typeof valor !== "string" ||
    !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    return false;
  }

  const fecha = new Date(`${valor}T00:00:00.000Z`);

  return (
    !Number.isNaN(fecha.getTime()) &&
    fecha.toISOString().slice(0, 10) === valor
  );
}

export function hoyGuatemala(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);

  const leer = (tipo) =>
    partes.find((parte) => parte.type === tipo).value;

  return `${leer("year")}-${leer("month")}-${leer("day")}`;
}

export function mostrarFecha(valor) {
  if (!fechaValida(valor)) {
    return "Por definir";
  }

  return new Intl.DateTimeFormat("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${valor}T00:00:00.000Z`));
}

export function normalizarBusqueda(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Devuelve mensajes por campo para mostrarlos junto al formulario.
// publicar=true aplica las reglas propuestas para la publicacion.
export function validarFormulario(
  datos = {},
  publicar = false,
  hoy = hoyGuatemala()
) {
  const formulario = formularioDesde(datos);
  const errores = {};
  const nombre = formulario.nombre.trim();

  if (!nombre) {
    errores.nombre = "Escribe el nombre de la convocatoria.";
  } else if (nombre.length > LIMITES_ADMIN.nombre) {
    errores.nombre = `El nombre admite hasta ${LIMITES_ADMIN.nombre} caracteres.`;
  }

  if (!Object.hasOwn(TIPOS_BECA_ADMIN, datos?.tipoBeca ?? "")) {
    errores.tipoBeca = "Selecciona un tipo de beca válido.";
  }

  if (formulario.requisitos.length > LIMITES_ADMIN.requisitos) {
    errores.requisitos = `Los requisitos admiten hasta ${LIMITES_ADMIN.requisitos} caracteres.`;
  }

  if (formulario.beneficio.length > LIMITES_ADMIN.beneficio) {
    errores.beneficio = `El beneficio admite hasta ${LIMITES_ADMIN.beneficio} caracteres.`;
  }

  for (const campo of ["fechaApertura", "fechaCierre"]) {
    const valor = formulario[campo];

    if (valor && !fechaValida(valor)) {
      errores[campo] = "Introduce una fecha válida.";
    } else if (publicar && !valor) {
      errores[campo] = "Completa esta fecha antes de publicar.";
    }
  }

  const aperturaValida = fechaValida(formulario.fechaApertura);
  const cierreValido = fechaValida(formulario.fechaCierre);

  if (
    aperturaValida &&
    cierreValido &&
    formulario.fechaCierre < formulario.fechaApertura
  ) {
    errores.fechaCierre = "El cierre no puede ser anterior a la apertura.";
  } else if (
    publicar &&
    cierreValido &&
    formulario.fechaCierre < hoy
  ) {
    errores.fechaCierre = "La fecha de cierre ya pasó. Actualízala antes de publicar.";
  }

  return errores;
}

// Construye los seis campos admitidos por ConvocatoriaRequest.
// No enviamos id, estado, rol ni documentosRequeridos.
// Validar el formulario antes de llamar a esta funcion.
export function cuerpoConvocatoria(datos) {
  const formulario = formularioDesde(datos);

  return {
    nombre: formulario.nombre.trim(),
    tipoBeca: formulario.tipoBeca,
    requisitos: formulario.requisitos.trim() || null,
    beneficio: formulario.beneficio.trim() || null,
    fechaApertura: formulario.fechaApertura || null,
    fechaCierre: formulario.fechaCierre || null,
  };
}