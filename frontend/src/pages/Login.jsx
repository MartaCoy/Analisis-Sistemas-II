import { useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { iniciarSesion, guardarSesion } from "../services/authService.js";
import { usePageTransition } from "../components/usePageTransition.js";
import TransitionLink from "../components/TransitionLink.jsx";
import CampoPassword from "../components/CampoPassword.jsx";
import "../styles/registro.css";
import "../styles/login.css";
import "../styles/auth-mejoras.css";

export default function Login() {
  const { irA, transicionActiva } = usePageTransition();
  const location = useLocation();
  const [formulario, setFormulario] = useState({ correo: "", password: "" });
  const [error, setError] = useState("");
  const [campos, setCampos] = useState({});
  const [cargando, setCargando] = useState(false);
  const enviando = useRef(false);
  const aviso = location.state?.aviso === "sesion" ? "Inicia sesión para continuar con tu trámite." : "";

  function actualizar(event) {
    const { name, value } = event.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
    setCampos((prev) => ({ ...prev, [name]: "" }));
    setError("");
  }
  async function enviar(event) {
    event.preventDefault();
    if (enviando.current || transicionActiva) return;
    const errores = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo.trim())) errores.correo = "Escribe un correo válido.";
    if (!formulario.password) errores.password = "Escribe tu contraseña.";
    setCampos(errores); setError("");
    if (Object.keys(errores).length) { document.getElementById(Object.keys(errores)[0])?.focus(); return; }
    enviando.current = true; setCargando(true);
    try {
      const respuesta = await iniciarSesion(formulario);
      try { guardarSesion(respuesta); }
      catch { throw new Error("No pudimos guardar tu sesión en este navegador. Revisa sus permisos de almacenamiento."); }
      irA("/dashboard");
    } catch (err) { setError(err.message || "No fue posible iniciar sesión."); }
    finally { enviando.current = false; setCargando(false); }
  }
  return <div className="registro-page login-page">
    <div className="tech-grid" aria-hidden="true" />
    <div className="registro-layout">
      <div className="registro-info">
        <div className="system-marker"><span aria-hidden="true" />SISTEMA NACIONAL DE BECAS</div>
        <h1>ACCESO A TU <strong>CUENTA</strong></h1>
        <p>Estudiantes y administradores: inicia sesión para acceder a las opciones correspondientes a tu cuenta.</p>
      </div>
      <div className="registro-card login-card">
        <div className="corner corner-top-left" aria-hidden="true" /><div className="corner corner-bottom-right" aria-hidden="true" />
        <div className="registro-header"><span className="status-dot" aria-hidden="true" /><p>PORTAL DE BECAS</p><h2>Iniciar sesión</h2><span>Identifícate para continuar</span></div>
        {aviso && <p className="auth-notice" role="status">{aviso}</p>}
        <form onSubmit={enviar} noValidate aria-busy={cargando}>
          <div className="campo">
            <label htmlFor="correo">CORREO</label>
            <input id="correo" name="correo" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
              value={formulario.correo} onChange={actualizar} placeholder="correo@ejemplo.com" required disabled={cargando}
              aria-invalid={Boolean(campos.correo)} aria-describedby={campos.correo ? "correo-error" : undefined} />
            {campos.correo && <small className="auth-field-error" id="correo-error">{campos.correo}</small>}
          </div>
          <div className="campo">
            <label htmlFor="password">CONTRASEÑA</label>
            <CampoPassword id="password" name="password" value={formulario.password} onChange={actualizar}
              autoComplete="current-password" placeholder="Ingresa tu contraseña" required disabled={cargando}
              aria-invalid={Boolean(campos.password)} aria-describedby={campos.password ? "password-error" : undefined} />
            {campos.password && <small className="auth-field-error" id="password-error">{campos.password}</small>}
          </div>
          {error && <div className="mensaje error" role="alert">{error}</div>}
          <button className="auth-submit" type="submit" disabled={cargando || transicionActiva}>
            {cargando ? "INICIANDO SESIÓN..." : "INICIAR SESIÓN"}<span aria-hidden="true">→</span>
          </button>
          <p className="auth-sr-only" role="status">{cargando ? "Verificando tus credenciales." : ""}</p>
        </form>
        <p className="login-text">¿Aún no tienes cuenta de estudiante? <TransitionLink to="/registro">Regístrate</TransitionLink></p>
        <p className="login-volver"><TransitionLink to="/">← Volver al inicio</TransitionLink></p>
      </div>
    </div>
  </div>;
}
