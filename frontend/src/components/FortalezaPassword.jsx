import { estimarFortaleza, validarPassword } from "../utils/passwordPolicy.js";
export default function FortalezaPassword({ value, id }) {
  const { nivel, etiqueta, consejo } = estimarFortaleza(value);
  const error = validarPassword(value);
  return <div className={`auth-strength auth-strength-${nivel}`} id={id}>
    <div className="auth-strength-heading"><span>Fortaleza orientativa</span><strong>{etiqueta}</strong></div>
    <meter min="0" max="3" value={nivel} aria-label="Fortaleza orientativa de la contraseña">{etiqueta}</meter>
    <small>{value ? error || consejo : "Mínimo 15 caracteres. Puedes usar una frase con espacios."}</small>
    <small>La barra es orientativa: no verifica filtraciones ni garantiza seguridad.</small>
  </div>;
}
