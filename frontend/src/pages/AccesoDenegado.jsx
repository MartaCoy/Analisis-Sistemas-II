import { obtenerSesion } from "../services/authService.js";
import { usePageTransition } from "../components/usePageTransition.js";
import "../styles/requisitos-nuevos.css";
export default function AccesoDenegado({ soloAdministrador }) {
  const { irA, transicionActiva } = usePageTransition();
  const rol = obtenerSesion()?.rol;
  return <main className="nreq-page"><section className="nreq-shell">
    <p className="nreq-kicker">PERMISOS DE TU CUENTA</p>
    <h1>Esta sección no está <span>disponible</span></h1>
    <div className="nreq-panel" role="alert">
      <p>{soloAdministrador ? "Esta sección es exclusiva de administradores. Desde tu panel puedes consultar las opciones de tu cuenta." : "Esta sección corresponde al portal estudiantil. Utiliza una cuenta de estudiante para presentar o consultar tus propias solicitudes."}</p>
      <button type="button" onClick={() => irA("/dashboard")} disabled={transicionActiva}>
        {rol === "ADMINISTRADOR" ? "VOLVER AL PANEL ADMINISTRATIVO" : "VOLVER A MI PANEL"}
      </button>
    </div>
  </section></main>;
}
