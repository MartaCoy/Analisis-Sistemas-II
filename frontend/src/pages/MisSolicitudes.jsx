import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listarMisSolicitudes,
} from "../services/solicitudService.js";

import {
  usePageTransition,
} from "../components/usePageTransition.js";

import "../styles/mis-solicitudes.css";

function formatearFecha(fecha) {
  if (!fecha) {
    return "Sin fecha registrada";
  }

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) {
    return "Fecha no disponible";
  }

  return valor.toLocaleString("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatearEstado(estado) {
  return String(estado ?? "SIN ESTADO")
    .replaceAll("_", " ");
}

function claseEstado(estado) {
  return String(estado ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

function MisSolicitudes() {
  const {
    irA,
    transicionActiva,
  } = usePageTransition();

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let activo = true;

    async function cargar() {
      try {
        const datos = await listarMisSolicitudes({
          signal: controller.signal,
        });

        if (!activo || controller.signal.aborted) {
          return;
        }

        setSolicitudes(datos);
      } catch (errorSolicitud) {
        if (
          !activo ||
          controller.signal.aborted ||
          errorSolicitud?.name === "AbortError"
        ) {
          return;
        }

        setError(
          errorSolicitud?.message ||
            "No fue posible cargar tus solicitudes."
        );
      } finally {
        if (activo && !controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargar();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [intento]);

  const resumen = useMemo(() => {
    const recibidas = solicitudes.filter(
      (solicitud) =>
        solicitud.estado === "RECIBIDA"
    ).length;

    const evaluacion = solicitudes.filter(
      (solicitud) =>
        solicitud.estado === "EN_EVALUACION"
    ).length;

    const resueltas = solicitudes.filter(
      (solicitud) =>
        solicitud.estado === "APROBADA" ||
        solicitud.estado === "RECHAZADA"
    ).length;

    return {
      total: solicitudes.length,
      recibidas,
      evaluacion,
      resueltas,
    };
  }, [solicitudes]);

  const recargar = () => {
    if (cargando || transicionActiva) {
      return;
    }

    setCargando(true);
    setError("");
    setIntento((actual) => actual + 1);
  };

  return (
    <main className="mis-solicitudes-page">
      <div
        className="mis-solicitudes-grid"
        aria-hidden="true"
      />

      <header className="mis-solicitudes-header">
        <button
          type="button"
          className="mis-solicitudes-back"
          onClick={() => irA("/dashboard")}
          disabled={transicionActiva}
        >
          ← VOLVER AL PANEL
        </button>

        <div className="mis-solicitudes-brand">
          <small>SISTEMA NACIONAL DE BECAS</small>
          <strong>PORTAL ESTUDIANTIL</strong>
        </div>
      </header>

      <section className="mis-solicitudes-shell">
        <div className="mis-solicitudes-heading">
          <div>
            <p>GESTIÓN DE PROCESOS</p>

            <h1>Mis solicitudes</h1>

            <span>
              Consulta las solicitudes de beca que has
              registrado y el estado actual de cada una.
            </span>
          </div>

          <button
            type="button"
            className="mis-solicitudes-refresh"
            onClick={recargar}
            disabled={cargando || transicionActiva}
          >
            {cargando
              ? "ACTUALIZANDO..."
              : "ACTUALIZAR"}
          </button>
        </div>

        <section
          className="mis-solicitudes-resumen"
          aria-label="Resumen de solicitudes"
        >
          <article>
            <small>TOTAL</small>
            <strong>{resumen.total}</strong>
          </article>

          <article>
            <small>RECIBIDAS</small>
            <strong>{resumen.recibidas}</strong>
          </article>

          <article>
            <small>EN EVALUACIÓN</small>
            <strong>{resumen.evaluacion}</strong>
          </article>

          <article>
            <small>RESUELTAS</small>
            <strong>{resumen.resueltas}</strong>
          </article>
        </section>

        {cargando && (
          <section className="mis-solicitudes-message">
            <span className="mis-solicitudes-loader" />

            <strong>
              Cargando solicitudes...
            </strong>

            <p>
              Estamos consultando la información de tu
              expediente académico.
            </p>
          </section>
        )}

        {!cargando && error && (
          <section className="mis-solicitudes-message error">
            <strong>
              No fue posible cargar las solicitudes
            </strong>

            <p>{error}</p>

            <button
              type="button"
              onClick={recargar}
            >
              INTENTAR DE NUEVO
            </button>
          </section>
        )}

        {!cargando &&
          !error &&
          solicitudes.length === 0 && (
            <section className="mis-solicitudes-message">
              <strong>
                Aún no tienes solicitudes registradas
              </strong>

              <p>
                Explora las convocatorias disponibles y
                presenta tu primera solicitud de beca.
              </p>

              <button
                type="button"
                onClick={() =>
                  irA("/convocatorias")
                }
                disabled={transicionActiva}
              >
                EXPLORAR CONVOCATORIAS
              </button>
            </section>
          )}

        {!cargando &&
          !error &&
          solicitudes.length > 0 && (
            <section className="mis-solicitudes-lista">
              {solicitudes.map((solicitud) => (
                <article
                  className="mis-solicitudes-card"
                  key={solicitud.id}
                >
                  <div className="mis-solicitudes-card-top">
                    <div>
                      <small>
                        SOLICITUD #
                        {String(solicitud.id).padStart(
                          4,
                          "0"
                        )}
                      </small>

                      <h2>
                        Convocatoria #
                        {solicitud.convocatoriaId}
                      </h2>
                    </div>

                    <span
                      className={`mis-solicitudes-estado estado-${claseEstado(
                        solicitud.estado
                      )}`}
                    >
                      {formatearEstado(
                        solicitud.estado
                      )}
                    </span>
                  </div>

                  <div className="mis-solicitudes-card-data">
                    <div>
                      <small>
                        FECHA DE SOLICITUD
                      </small>

                      <strong>
                        {formatearFecha(
                          solicitud.fechaSolicitud
                        )}
                      </strong>
                    </div>

                    <div>
                      <small>
                        COMITÉ ASIGNADO
                      </small>

                      <strong>
                        {solicitud.comiteId
                          ? `Comité #${solicitud.comiteId}`
                          : "Pendiente de asignación"}
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mis-solicitudes-expediente"
                    onClick={() =>
                      irA(
                        `/mis-solicitudes/${solicitud.id}`
                      )
                    }
                    disabled={transicionActiva}
                  >
                    VER EXPEDIENTE →
                  </button>

                  <div className="mis-solicitudes-card-footer">
                    <span>
                      ID DE PROCESO · {solicitud.id}
                    </span>

                    <span>
                      ESTADO ACTUAL ·{" "}
                      {formatearEstado(
                        solicitud.estado
                      )}
                    </span>
                  </div>
                </article>
              ))}
            </section>
          )}
      </section>
    </main>
  );
}

export default MisSolicitudes;
