import {
  cerrarSesion,
  obtenerSesion,
} from "../services/authService";

import {
  usePageTransition,
} from "../components/usePageTransition";

import "../styles/dashboard.css";

function Dashboard() {
  const sesion = obtenerSesion();

  const { irA } =
    usePageTransition();

  const manejarCerrarSesion = () => {
    cerrarSesion();
    irA("/");
  };

  return (
    <main className="dashboard-page">
      <div className="dashboard-grid"></div>

      <section className="dashboard-panel">
        <span className="dashboard-status">
          ● SESIÓN ACTIVA
        </span>

        <p>SISTEMA NACIONAL DE BECAS</p>

        <h1>
          Bienvenido,
          <strong>
            {sesion?.nombreCompleto}
          </strong>
        </h1>

        <div className="dashboard-info">
          <span>
            {sesion?.correo}
          </span>

          <span>
            ROL · {sesion?.rol}
          </span>
        </div>

        <button
          type="button"
          onClick={manejarCerrarSesion}
        >
          CERRAR SESIÓN
        </button>
      </section>
    </main>
  );
}

export default Dashboard;