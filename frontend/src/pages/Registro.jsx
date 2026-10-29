import { useRef, useState } from "react";
import { registrarEstudiante } from "../services/authService.js";
import CampoPassword from "../components/CampoPassword.jsx";
import FortalezaPassword from "../components/FortalezaPassword.jsx";
import TransitionLink from "../components/TransitionLink.jsx";
import { UNIVERSIDADES, validarRegistro } from "../utils/registroValidacion.js";
import "../styles/registro.css";
import "../styles/auth-mejoras.css";

const VACIO = { nombreCompleto: "", carnet: "", correo: "", password: "", confirmacion: "", universidadId: "" };
export default function Registro() {
  const [formulario, setFormulario] = useState({ ...VACIO });
  const [tocados, setTocados] = useState({});
  const [erroresServidor, setErroresServidor] = useState({});
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);
  const bloqueo = useRef(false);
  const formRef = useRef(null);
  const errores = { ...validarRegistro(formulario), ...erroresServidor };
  const universidad = UNIVERSIDADES.find(([id]) => id === Number(formulario.universidadId));
  const mensaje = (campo) => tocados[campo] ? errores[campo] || "" : "";
  const propsCampo = (campo) => ({
    id: campo, name: campo, value: formulario[campo], onChange: actualizar,
    onBlur: () => setTocados((prev) => ({ ...prev, [campo]: true })),
    disabled: cargando, required: true, "aria-invalid": Boolean(mensaje(campo)),
    "aria-describedby": [mensaje(campo) ? `${campo}-error` : "", campo === "password" ? "password-ayuda" : "", campo === "carnet" ? "carnet-ayuda" : ""].filter(Boolean).join(" ") || undefined,
  });
  const avisoCampo = (campo) => mensaje(campo) ? <small className="auth-field-error" id={`${campo}-error`}>{mensaje(campo)}</small> : null;
  function actualizar(event) {
    const { name, value } = event.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
    setErroresServidor((prev) => { const next = { ...prev }; delete next[name]; return next; });
    setError("");
  }
  async function enviar(event) {
    event.preventDefault();
    if (bloqueo.current || exito) return;
    const validacion = validarRegistro(formulario);
    setTocados(Object.fromEntries(Object.keys(VACIO).map((key) => [key, true])));
    setError(""); setErroresServidor({});
    if (Object.keys(validacion).length) {
      formRef.current?.elements.namedItem(Object.keys(validacion)[0])?.focus(); return;
    }
    bloqueo.current = true; setCargando(true);
    try {
      await registrarEstudiante(formulario);
      setFormulario({ ...VACIO }); setTocados({}); setExito(true);
    } catch (err) {
      setError(err.message || "No pudimos crear tu cuenta. Intenta nuevamente.");
      setErroresServidor(err.erroresCampos || {});
      const campo = Object.keys(err.erroresCampos || {})[0];
      if (campo) window.requestAnimationFrame(() => formRef.current?.elements.namedItem(campo)?.focus());
    } finally { bloqueo.current = false; setCargando(false); }
  }
  return <div className="registro-page auth-registro">
    <div className="tech-grid" aria-hidden="true" />
    <div className="registro-layout">
      <div className="registro-info">
        <div className="system-marker"><span aria-hidden="true" />SISTEMA NACIONAL DE BECAS</div>
        <h1>REGISTRO <strong>ESTUDIANTIL</strong></h1>
        <p>Crea tu cuenta para postularte a becas y recibir avisos sobre tus solicitudes.</p>
        <p className="auth-notice">Este registro crea una cuenta de estudiante. Los permisos administrativos no se eligen aquí.</p>
      </div>
      <div className="registro-card">
        <div className="corner corner-top-left" aria-hidden="true" /><div className="corner corner-bottom-right" aria-hidden="true" />
        <div className="registro-header"><span className="status-dot" aria-hidden="true" /><p>PORTAL ESTUDIANTIL</p><h2>Crear cuenta</h2><span>Todos los campos son obligatorios</span></div>
        {exito ? <div className="auth-registration-success" role="status">
          <h3>Tu cuenta de estudiante está lista</h3>
          <p>Ya puedes iniciar sesión con tu correo y contraseña.</p>
          <TransitionLink to="/login" className="auth-success-link">INICIAR SESIÓN →</TransitionLink>
        </div> : <form ref={formRef} onSubmit={enviar} noValidate aria-busy={cargando}>
          <div className="campo"><label htmlFor="nombreCompleto">NOMBRE COMPLETO</label><input {...propsCampo("nombreCompleto")} type="text" autoComplete="name" maxLength={255} placeholder="Tu nombre completo" />{avisoCampo("nombreCompleto")}</div>
          <div className="campo"><label htmlFor="universidadId">UNIVERSIDAD</label><select {...propsCampo("universidadId")}><option value="">Selecciona tu universidad</option>{UNIVERSIDADES.map(([id,nombre]) => <option key={id} value={id}>{nombre}</option>)}</select>{avisoCampo("universidadId")}</div>
          <div className="campo"><label htmlFor="carnet">CARNET</label><input {...propsCampo("carnet")} type="text" inputMode="numeric" placeholder="Ingresa tu carnet" maxLength={30} />
            <small className="muted" id="carnet-ayuda">{universidad ? `Ejemplo: ${universidad[4]} (${universidad[2] === universidad[3] ? universidad[2] : `${universidad[2]} u ${universidad[3]}`} dígitos)` : "Selecciona una universidad para ver el formato."}</small>{avisoCampo("carnet")}</div>
          <div className="campo"><label htmlFor="correo">CORREO</label><input {...propsCampo("correo")} type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={255} placeholder="correo@ejemplo.com" />{avisoCampo("correo")}</div>
          <div className="campo"><label htmlFor="password">CONTRASEÑA</label><CampoPassword {...propsCampo("password")} autoComplete="new-password" placeholder="Una frase de al menos 15 caracteres" />{avisoCampo("password")}<FortalezaPassword id="password-ayuda" value={formulario.password} /></div>
          <div className="campo"><label htmlFor="confirmacion">CONFIRMAR CONTRASEÑA</label><CampoPassword {...propsCampo("confirmacion")} etiqueta="Confirmación de contraseña" autoComplete="new-password" placeholder="Repite tu contraseña" />{avisoCampo("confirmacion")}</div>
          {error && <div className="mensaje error" role="alert">{error}</div>}
          <button className="auth-submit" type="submit" disabled={cargando}>{cargando ? "CREANDO CUENTA..." : "CREAR CUENTA"}<span aria-hidden="true">→</span></button>
          <p className="auth-sr-only" role="status">{cargando ? "Registrando tu cuenta de estudiante." : ""}</p>
        </form>}
        <p className="login-text">¿Ya tienes cuenta? <TransitionLink to="/login">Inicia sesión</TransitionLink></p>
        <p className="login-text"><TransitionLink to="/">← Volver al inicio</TransitionLink></p>
      </div>
    </div>
  </div>;
}
