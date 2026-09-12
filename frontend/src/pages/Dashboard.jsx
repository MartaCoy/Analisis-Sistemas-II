import {
  cerrarSesion,
  obtenerSesion,
} from "../services/authService.js";

import {
  usePageTransition,
} from "../components/usePageTransition.js";

import "../styles/dashboard.css";

function obtenerIniciales(nombre) {
  const partes = String(nombre ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (
    partes
      .slice(0, 2)
      .map((parte) => parte.charAt(0))
      .join("")
      .toUpperCase() || "US"
  );
}

function Dashboard() {
  const sesion = obtenerSesion();

  const {
    irA,
    transicionActiva,
  } = usePageTransition();

  const administrador =
    sesion?.rol === "ADMINISTRADOR";

  // Solo los módulos con una ruta tienen una acción disponible.
  const modulos = [
    ...(administrador
      ? [
          {
            titulo: "Gestión de convocatorias",
            categoria: "ADMINISTRACIÓN",
            descripcion:
              "Define beneficios y requisitos, prepara borradores y controla la publicación y el cierre de convocatorias.",
            ruta: "/admin/convocatorias",
            accion: "GESTIONAR CONVOCATORIAS",
          },
        ]
      : []),

    {
      titulo: "Convocatorias",
      categoria: "EXPLORACIÓN ACADÉMICA",
      descripcion:
        "Consulta las oportunidades de beca publicadas, sus fechas, requisitos y condiciones.",
      ruta: "/convocatorias",
      accion: "EXPLORAR CONVOCATORIAS",
    },

    {
      titulo: "Mis solicitudes",
      categoria: "GESTIÓN DE PROCESOS",
      descripcion:
        "Este módulo permitirá administrar solicitudes y consultar el avance de cada proceso de beca.",
    },

    {
      titulo: "Estado del proceso",
      categoria: "SEGUIMIENTO ACADÉMICO",
      descripcion:
        "Permitirá visualizar el estado y los cambios asociados a las solicitudes registradas.",
    },
  ];

  const manejarCerrarSesion = () => {
    if (transicionActiva) {
      return;
    }

    cerrarSesion();
    irA("/");
  };

  const abrirModulo = (ruta) => {
    if (transicionActiva || !ruta) {
      return;
    }

    irA(ruta);
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
          <span
            className="dashboard-brand-pulso"
            aria-hidden="true"
          />

          <div>
            <small>
              SISTEMA NACIONAL DE BECAS
            </small>

            <strong>
              {administrador
                ? "PORTAL ADMINISTRATIVO"
                : "PORTAL ESTUDIANTIL"}
            </strong>
          </div>
        </div>

        <div className="dashboard-header-actions">
          <div className="dashboard-session">
            <span aria-hidden="true" />
            SESIÓN INICIADA
          </div>

          <button
            type="button"
            className="dashboard-logout"
            onClick={manejarCerrarSesion}
            disabled={transicionActiva}
          >
            CERRAR SESIÓN
          </button>
        </div>
      </header>

      <section className="dashboard-shell">
        <div className="dashboard-welcome">
          <div className="dashboard-welcome-copy">
            <p className="dashboard-kicker">
              NODO PRINCIPAL · PANEL PERSONAL
            </p>

            <h1>
              Bienvenido,
              <strong>
                {sesion?.nombreCompleto || "Usuario"}
              </strong>
            </h1>

            <p className="dashboard-description">
              {administrador
                ? "Administra las convocatorias y revisa las oportunidades publicadas desde un mismo panel."
                : "Consulta oportunidades de beca y accede a los servicios disponibles desde tu panel académico."}
            </p>
          </div>

          <div className="dashboard-identity">
            <div
              className="dashboard-avatar"
              aria-hidden="true"
            >
              <span>
                {obtenerIniciales(
                  sesion?.nombreCompleto
                )}
              </span>
            </div>

            <div className="dashboard-user-data">
              <small>
                PERFIL DE LA SESIÓN
              </small>

              <strong>
                {sesion?.nombreCompleto || "Usuario"}
              </strong>

              <span>
                {sesion?.correo ||
                  "Sin correo registrado"}
              </span>

              <p>
                ROL · {sesion?.rol || "Sin definir"}
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
        </div>

        <section
          className="dashboard-modules"
          aria-label="Módulos del sistema"
        >
          {modulos.map((modulo, indice) => {
            const disponible = Boolean(modulo.ruta);

            return (
              <article
                key={modulo.titulo}
                className={`dashboard-module ${
                  disponible
                    ? "dashboard-module-active"
                    : "dashboard-module-disabled"
                }`}
              >
                <div className="dashboard-module-top">
                  <span className="dashboard-module-code">
                    {String(indice + 1).padStart(2, "0")}
                  </span>

                  <span className="dashboard-module-status">
                    {disponible && (
                      <i aria-hidden="true" />
                    )}

                    {disponible
                      ? "DISPONIBLE"
                      : "EN DESARROLLO"}
                  </span>
                </div>

                {disponible ? (
                  <div
                    className="dashboard-module-symbol"
                    aria-hidden="true"
                  >
                    <div>
                      <span />
                    </div>
                  </div>
                ) : (
                  <div
                    className="dashboard-module-placeholder"
                    aria-hidden="true"
                  >
                    <span />
                    <span />
                    <span />
                  </div>
                )}

                <div className="dashboard-module-copy">
                  <small>
                    {modulo.categoria}
                  </small>

                  <h3>
                    {modulo.titulo}
                  </h3>

                  <p>
                    {modulo.descripcion}
                  </p>
                </div>

                {disponible ? (
                  <button
                    type="button"
                    onClick={() =>
                      abrirModulo(modulo.ruta)
                    }
                    disabled={transicionActiva}
                  >
                    {modulo.accion}
                    <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <div className="dashboard-module-soon">
                    PRÓXIMAMENTE
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <footer className="dashboard-footer">
          <span>
            SISTEMA NACIONAL DE BECAS
          </span>

          <div>
            <i aria-hidden="true" />
            PORTAL ACADÉMICO
          </div>
        </footer>
      </section>
    </main>
  );
}

export default Dashboard;