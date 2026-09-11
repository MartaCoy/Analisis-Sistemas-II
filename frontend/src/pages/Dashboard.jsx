import {
  cerrarSesion,
  obtenerSesion,
} from "../services/authService";

import {
  usePageTransition,
} from "../components/usePageTransition";

import "../styles/dashboard.css";

function obtenerIniciales(nombre = "") {
  const partes = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "US";
  }

  return partes
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toUpperCase();
}

function Dashboard() {
  const sesion = obtenerSesion();

  const { irA } = usePageTransition();

  const manejarCerrarSesion = () => {
    cerrarSesion();
    irA("/");
  };

  const abrirConvocatorias = () => {
    irA("/convocatorias");
  };

  return (
    <main className="dashboard-page">
      <div
        className="dashboard-grid"
        aria-hidden="true"
      />

      <div
        className="dashboard-glow dashboard-glow-uno"
        aria-hidden="true"
      />

      <div
        className="dashboard-glow dashboard-glow-dos"
        aria-hidden="true"
      />

      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="dashboard-brand-pulso" />

          <div>
            <small>
              SISTEMA NACIONAL DE BECAS
            </small>

            <strong>
              PORTAL ESTUDIANTIL
            </strong>
          </div>
        </div>

        <div className="dashboard-header-actions">
          <div className="dashboard-session">
            <span />

            SESIÓN ACTIVA
          </div>

          <button
            type="button"
            className="dashboard-logout"
            onClick={manejarCerrarSesion}
          >
            CERRAR SESIÓN
          </button>
        </div>
      </header>

      <section className="dashboard-shell">
        <div className="dashboard-welcome">
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">
              NODO PRINCIPAL · ACCESO AUTORIZADO
            </p>

            <h1>
              Bienvenido,
              <strong>
                {sesion?.nombreCompleto ||
                  "Estudiante"}
              </strong>
            </h1>

            <p className="dashboard-description">
              Consulta oportunidades de beca y
              accede a los servicios disponibles
              desde tu panel académico.
            </p>
          </div>

          <div className="dashboard-identity">
            <div className="dashboard-avatar">
              <span>
                {obtenerIniciales(
                  sesion?.nombreCompleto
                )}
              </span>
            </div>

            <div className="dashboard-user-data">
              <small>
                PERFIL AUTENTICADO
              </small>

              <strong>
                {sesion?.nombreCompleto ||
                  "Estudiante"}
              </strong>

              <span>
                {sesion?.correo ||
                  "Sin correo registrado"}
              </span>

              <p>
                ROL ·{" "}
                {sesion?.rol || "ESTUDIANTE"}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-section-heading">
          <div>
            <small>
              SERVICIOS DISPONIBLES
            </small>

            <h2>
              Centro de operaciones
            </h2>
          </div>

          <span>
            SISTEMA EN LÍNEA
            <i />
          </span>
        </div>

        <section className="dashboard-modules">
          <article className="dashboard-module dashboard-module-active">
            <div className="dashboard-module-top">
              <span className="dashboard-module-code">
                01
              </span>

              <span className="dashboard-module-status">
                <i />
                DISPONIBLE
              </span>
            </div>

            <div className="dashboard-module-symbol">
              <div>
                <span />
              </div>
            </div>

            <div className="dashboard-module-copy">
              <small>
                EXPLORACIÓN ACADÉMICA
              </small>

              <h3>
                Convocatorias
              </h3>

              <p>
                Consulta las oportunidades de beca
                publicadas, sus fechas, requisitos y
                condiciones.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirConvocatorias}
            >
              EXPLORAR CONVOCATORIAS

              <span>→</span>
            </button>
          </article>

          <article className="dashboard-module dashboard-module-disabled">
            <div className="dashboard-module-top">
              <span className="dashboard-module-code">
                02
              </span>

              <span className="dashboard-module-status">
                EN DESARROLLO
              </span>
            </div>

            <div className="dashboard-module-placeholder">
              <span />
              <span />
              <span />
            </div>

            <div className="dashboard-module-copy">
              <small>
                GESTIÓN DE PROCESOS
              </small>

              <h3>
                Mis solicitudes
              </h3>

              <p>
                Este módulo permitirá administrar
                solicitudes y consultar el avance de
                cada proceso de beca.
              </p>
            </div>

            <div className="dashboard-module-soon">
              PRÓXIMAMENTE
            </div>
          </article>

          <article className="dashboard-module dashboard-module-disabled">
            <div className="dashboard-module-top">
              <span className="dashboard-module-code">
                03
              </span>

              <span className="dashboard-module-status">
                EN DESARROLLO
              </span>
            </div>

            <div className="dashboard-module-placeholder">
              <span />
              <span />
              <span />
            </div>

            <div className="dashboard-module-copy">
              <small>
                SEGUIMIENTO ACADÉMICO
              </small>

              <h3>
                Estado del proceso
              </h3>

              <p>
                Permitirá visualizar el estado y los
                cambios asociados a las solicitudes
                registradas.
              </p>
            </div>

            <div className="dashboard-module-soon">
              PRÓXIMAMENTE
            </div>
          </article>
        </section>

        <footer className="dashboard-footer">
          <span>
            SISTEMA NACIONAL DE BECAS
          </span>

          <div>
            <i />
            CONEXIÓN SEGURA
          </div>
        </footer>
      </section>
    </main>
  );
}

export default Dashboard;