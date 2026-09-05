import { useState } from "react";

import {
  iniciarSesion,
  guardarSesion,
} from "../services/authService";

import {
  usePageTransition,
} from "../components/usePageTransition";

import TransitionLink from "../components/TransitionLink";

import "../styles/registro.css";
import "../styles/login.css";

const esperar = (tiempo) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, tiempo);
  });

function Login() {
  const { irA } = usePageTransition();

  const [formulario, setFormulario] = useState({
    correo: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [estadoAuth, setEstadoAuth] = useState(null);

  const actualizarCampo = (event) => {
    setFormulario({
      ...formulario,
      [event.target.name]: event.target.value,
    });
  };

  const obtenerMensajeAuth = () => {
    if (estadoAuth === "verificando") {
      return "VERIFICANDO IDENTIDAD";
    }

    if (estadoAuth === "sincronizando") {
      return "SINCRONIZANDO PERFIL";
    }

    if (estadoAuth === "autorizado") {
      return "ACCESO AUTORIZADO";
    }

    return "";
  };

  const manejarSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formulario.correo || !formulario.password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setCargando(true);
    setEstadoAuth("verificando");

    try {
      const respuesta = await iniciarSesion(formulario);

      setEstadoAuth("sincronizando");

      guardarSesion(respuesta);

      await esperar(400);

      setEstadoAuth("autorizado");

      await esperar(650);

      setEstadoAuth(null);

      irA("/dashboard");
    } catch (err) {
      setEstadoAuth(null);

      setError(
        err.message ||
          "No fue posible iniciar sesión."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="registro-page login-page">
      <div className="tech-grid"></div>

      {estadoAuth && (
        <div
          className={`auth-overlay auth-overlay--${estadoAuth}`}
        >
          <div className="auth-scan-line"></div>

          <div className="auth-nucleo">
            <div className="auth-ring auth-ring-one"></div>
            <div className="auth-ring auth-ring-two"></div>

            <div className="auth-diamond">
              <span></span>
            </div>

            <p>{obtenerMensajeAuth()}</p>

            <small>
              SISTEMA NACIONAL DE BECAS
            </small>
          </div>
        </div>
      )}

      <div className="registro-layout">
        <div className="registro-info">
          <div className="system-marker">
            <span></span>
            SISTEMA DE BECAS
          </div>

          <h1>
            ACCESO <strong>ESTUDIANTIL</strong>
          </h1>

          <p>
            Ingresa a tu cuenta para consultar
            convocatorias, solicitudes y el estado
            de tus procesos de beca.
          </p>
        </div>

        <div className="registro-card login-card">
          <div className="corner corner-top-left"></div>
          <div className="corner corner-bottom-right"></div>

          <div className="registro-header">
            <span className="status-dot"></span>

            <p>ACCESO SEGURO</p>

            <h2>Iniciar Sesión</h2>

            <span>
              Identifícate para continuar
            </span>
          </div>

          <form onSubmit={manejarSubmit}>
            <div className="campo">
              <label htmlFor="correo">
                CORREO
              </label>

              <input
                type="email"
                id="correo"
                name="correo"
                value={formulario.correo}
                onChange={actualizarCampo}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="password">
                CONTRASEÑA
              </label>

              <input
                type="password"
                id="password"
                name="password"
                value={formulario.password}
                onChange={actualizarCampo}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="mensaje error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={cargando}
            >
              {cargando
                ? "VERIFICANDO..."
                : "INICIAR SESIÓN"}

              <span>→</span>
            </button>
          </form>

          <p className="login-text">
            ¿No tienes cuenta?{" "}

            <TransitionLink to="/registro">
              Regístrate
            </TransitionLink>
          </p>

          <p className="login-volver">
            <TransitionLink to="/">
              ← Volver al inicio
            </TransitionLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;