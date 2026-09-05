import "../styles/transitions.css";

function PageTransition({ phase }) {
  if (phase === "idle") {
    return null;
  }

  let mensaje = "INTERFAZ LISTA";

  if (phase === "closing") {
    mensaje = "SINCRONIZANDO INTERFAZ";
  }

  if (phase === "history") {
    mensaje = "RESTAURANDO INTERFAZ";
  }

  return (
    <div
      className={`route-transition route-transition--${phase}`}
      aria-hidden="true"
    >
      <div className="transition-panel transition-panel-left"></div>
      <div className="transition-panel transition-panel-right"></div>

      <div className="transition-center">
        <div className="transition-ring transition-ring-one"></div>
        <div className="transition-ring transition-ring-two"></div>

        <div className="transition-diamond">
          <span></span>
        </div>

        <p>SISTEMA NACIONAL DE BECAS</p>

        <small>{mensaje}</small>
      </div>

      <div className="transition-line"></div>
    </div>
  );
}

export default PageTransition;