import TransitionLink from "../components/TransitionLink";
import "../styles/inicio.css";

function Inicio() {
  return (
    <main className="inicio-page">
      <div className="inicio-grid"></div>

      <section className="inicio-contenido">
        <div className="inicio-marca">
          <span className="marca-pulso"></span>

          SISTEMA NACIONAL DE BECAS
        </div>

        <div className="inicio-hero">
          <p className="inicio-codigo">
            PORTAL ACADÉMICO · GUATEMALA
          </p>

          <h1>
            Oportunidades que
            <strong>
              {" "}
              transforman futuros
            </strong>
          </h1>

          <p className="inicio-descripcion">
            Consulta convocatorias, gestiona tus
            solicitudes y da seguimiento a tu proceso
            de beca desde una sola plataforma.
          </p>

          <div className="inicio-acciones">
            <TransitionLink
              to="/login"
              className="btn-principal"
            >
              INICIAR SESIÓN
              <span>→</span>
            </TransitionLink>

            <TransitionLink
              to="/registro"
              className="btn-secundario"
            >
              REGISTRARSE
            </TransitionLink>
          </div>
        </div>

        <div className="inicio-indicadores">
          <div>
            <span>01</span>
            <p>Registro estudiantil</p>
          </div>

          <div>
            <span>02</span>
            <p>Convocatorias</p>
          </div>

          <div>
            <span>03</span>
            <p>Seguimiento</p>
          </div>
        </div>
      </section>

      <div
        className="inicio-sello"
        aria-hidden="true"
      >
        <div className="sello-exterior">
          <div className="sello-interior">
            <span></span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Inicio;