import { useState } from "react";
import { registrarEstudiante } from "../services/authService";
import "../styles/registro.css";

function Registro() {
  const [formulario, setFormulario] = useState({
    nombreCompleto: "",
    carnet: "",
    correo: "",
    password: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const actualizarCampo = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo);

  const obtenerFuerzaPassword = () => {
    const password = formulario.password;

    if (!password) return 0;

    let puntos = 0;

    if (password.length >= 8) puntos++;
    if (/[A-Z]/.test(password)) puntos++;
    if (/[0-9]/.test(password)) puntos++;
    if (/[^A-Za-z0-9]/.test(password)) puntos++;

    return puntos;
  };

  const fuerzaPassword = obtenerFuerzaPassword();

  const enviarFormulario = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (
      !formulario.nombreCompleto ||
      !formulario.carnet ||
      !formulario.correo ||
      !formulario.password
    ) {
      setTipoMensaje("error");
      setMensaje("Completa todos los campos.");
      return;
    }

    if (!correoValido) {
      setTipoMensaje("error");
      setMensaje("Ingresa un correo electrónico válido.");
      return;
    }

    if (fuerzaPassword < 2) {
      setTipoMensaje("error");
      setMensaje("La contraseña debe ser más segura.");
      return;
    }

    try {
      setCargando(true);

      const respuesta = await registrarEstudiante(formulario);

      setTipoMensaje("exito");
      setMensaje(`Cuenta creada correctamente. Bienvenido, ${respuesta.nombreCompleto}.`);

      setFormulario({
        nombreCompleto: "",
        carnet: "",
        correo: "",
        password: "",
      });
    } catch (error) {
      setTipoMensaje("error");
      setMensaje(error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="registro-page">
      <div className="tech-grid"></div>

      <section className="registro-layout">
        <div className="registro-info">
          <div className="system-marker">
            <span></span>
            SISTEMA NACIONAL DE BECAS
          </div>

          <h1>
            Construye tu
            <strong> futuro académico</strong>
          </h1>

          <p>
            Crea tu perfil para consultar convocatorias, presentar solicitudes
            y dar seguimiento a tus procesos de beca.
          </p>

          <div className="info-line">
            <span>01</span>
            Registro de estudiante
          </div>

          <div className="info-line">
            <span>02</span>
            Acceso a convocatorias
          </div>

          <div className="info-line">
            <span>03</span>
            Seguimiento de solicitudes
          </div>
        </div>

        <div className="registro-card">
          <div className="corner corner-top-left"></div>
          <div className="corner corner-bottom-right"></div>

          <div className="registro-header">
            <span className="status-dot"></span>
            <p>NUEVO PERFIL</p>

            <h2>Crear cuenta</h2>
            <span>Ingresa tus datos para comenzar.</span>
          </div>

          <form onSubmit={enviarFormulario}>
            <div className="campo">
              <label htmlFor="nombreCompleto">Nombre completo</label>
              <input
                id="nombreCompleto"
                type="text"
                name="nombreCompleto"
                value={formulario.nombreCompleto}
                onChange={actualizarCampo}
                placeholder="Nombre y apellidos"
              />
            </div>

            <div className="campo">
              <label htmlFor="carnet">Carnet</label>
              <input
                id="carnet"
                type="text"
                name="carnet"
                value={formulario.carnet}
                onChange={actualizarCampo}
                placeholder="Número de carnet"
              />
            </div>

            <div className="campo">
              <label htmlFor="correo">Correo electrónico</label>
              <input
                id="correo"
                type="email"
                name="correo"
                value={formulario.correo}
                onChange={actualizarCampo}
                placeholder="usuario@correo.com"
              />

              {formulario.correo && (
                <small className={correoValido ? "valido" : "invalido"}>
                  {correoValido ? "Formato válido" : "Formato de correo inválido"}
                </small>
              )}
            </div>

            <div className="campo">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formulario.password}
                onChange={actualizarCampo}
                placeholder="Crea una contraseña segura"
              />

              {formulario.password && (
                <div className="password-strength">
                  <div className={`strength-bar nivel-${fuerzaPassword}`}>
                    <span></span>
                  </div>

                  <small>
                    {fuerzaPassword <= 1 && "Débil"}
                    {fuerzaPassword === 2 && "Aceptable"}
                    {fuerzaPassword === 3 && "Segura"}
                    {fuerzaPassword === 4 && "Muy segura"}
                  </small>
                </div>
              )}
            </div>

            {mensaje && (
              <div className={`mensaje ${tipoMensaje}`}>
                {mensaje}
              </div>
            )}

            <button type="submit" disabled={cargando}>
              {cargando ? "PROCESANDO..." : "CREAR CUENTA"}
              <span>→</span>
            </button>
          </form>

          <p className="login-text">
            ¿Ya tienes una cuenta? <a href="#">Iniciar sesión</a>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Registro;