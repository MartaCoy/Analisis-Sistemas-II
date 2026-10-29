import { validarPassword } from "./passwordPolicy.js";
// Catálogo conservado del formulario existente, no redefinido como norma oficial.
export const UNIVERSIDADES = [
  [1,"UMG - Universidad Mariano Gálvez",10,11,"22942313756"],
  [2,"USAC - Universidad de San Carlos",8,8,"20201234"],
  [3,"UVG - Universidad del Valle",7,7,"2312345"],
  [4,"URL - Universidad Rafael Landívar",8,8,"21012345"],
  [5,"UFM - Universidad Francisco Marroquín",6,6,"123456"],
  [6,"UGAL - Universidad Galileo",6,6,"123456"],
  [7,"UPANA - Universidad Panamericana",8,8,"20210001"],
  [8,"UMES - Universidad Mesoamericana",7,7,"1234567"],
  [9,"UDAV - Universidad Da Vinci",8,8,"20200001"],
  [10,"URURAL - Universidad Rural",9,9,"202300001"],
  [11,"USPG - Universidad San Pablo",7,7,"1234567"],
  [12,"UNIS - Universidad del Istmo",8,8,"20201234"],
];
export function validarRegistro(datos) {
  const errores = {};
  if (!datos.nombreCompleto.trim()) errores.nombreCompleto = "Escribe tu nombre completo.";
  else if (datos.nombreCompleto.trim().length > 255) errores.nombreCompleto = "El nombre admite hasta 255 caracteres.";
  const universidad = UNIVERSIDADES.find(([id]) => id === Number(datos.universidadId));
  if (!universidad) errores.universidadId = "Selecciona tu universidad.";
  if (!datos.carnet.trim()) errores.carnet = "Escribe tu carnet.";
  else if (universidad && (!/^\d+$/.test(datos.carnet.trim()) || datos.carnet.trim().length < universidad[2] || datos.carnet.trim().length > universidad[3])) {
    errores.carnet = `Revisa tu carnet: se esperan ${universidad[2] === universidad[3] ? universidad[2] : `${universidad[2]} u ${universidad[3]}`} dígitos para esta universidad.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo.trim())) errores.correo = "Escribe un correo válido.";
  else if (datos.correo.trim().length > 255) errores.correo = "El correo es demasiado largo.";
  const password = validarPassword(datos.password);
  if (password) errores.password = password;
  if (!datos.confirmacion) errores.confirmacion = "Repite la contraseña.";
  else if (datos.password !== datos.confirmacion) errores.confirmacion = "Las contraseñas no coinciden.";
  return errores;
}
