import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  listarDocumentos,
  obtenerHistorialSolicitud,
  obtenerSolicitud,
} from "../services/solicitudService.js";

import {
  usePageTransition,
} from "../components/usePageTransition.js";

import "../styles/detalle-solicitud.css";

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

function DetalleSolicitud() {
  const { id } = useParams();

  const {
    irA,
    transicionActiva,
  } = usePageTransition();

  const [solicitud, setSolicitud] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [historial, setHistorial] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let activo = true;

    async function cargarExpediente() {
      try {
        const [
          datosSolicitud,
          datosDocumentos,
          datosHistorial,
        ] = await Promise.all([
          obtenerSolicitud(id, {
            signal: controller.signal,
          }),
          listarDocumentos(id, {
            signal: controller.signal,
          }),
          obtenerHistorialSolicitud(id, {
            signal: controller.signal,
          }),
        ]);

        if (!activo || controller.signal.aborted) {
          return;
        }

        setSolicitud(datosSolicitud);
        setDocumentos(datosDocumentos);
        setHistorial(datosHistorial);
      } catch (errorCarga) {
        if (
          !activo ||
          controller.signal.aborted ||
          errorCarga?.name === "AbortError"
        ) {
          return;
        }

        setError(
          errorCarga?.message ||
            "No fue posible cargar el expediente."
        );
      } finally {
        if (activo && !controller.signal.aborted) {
          setCargando(false);
        }
      }
    }

    cargarExpediente();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [id]);

  return (
    <main className="detalle-solicitud-page">
      <div
        className="detalle-solicitud-grid"
        aria-hidden="true"
      />

      <header className="detalle-solicitud-header">
        <button
          type="button"
          className="detalle-solicitud-back"
          onClick={() => irA("/mis-solicitudes")}
          disabled={transicionActiva}
        >
          ← VOLVER A MIS SOLICITUDES
        </button>

        <div className="detalle-solicitud-brand">
          <small>SISTEMA NACIONAL DE BECAS</small>
          <strong>EXPEDIENTE ESTUDIANTIL</strong>
        </div>
      </header>

      <section className="detalle-solicitud-shell">
        {cargando && (
          <section className="detalle-solicitud-message">
            <div className="detalle-solicitud-loader" />
            <strong>Cargando expediente...</strong>
          </section>
        )}

        {!cargando && error && (
          <section className="detalle-solicitud-message error">
            <strong>
              No fue posible cargar el expediente
            </strong>

            <p>{error}</p>
          </section>
        )}

        {!cargando && !error && solicitud && (
          <>
            <section className="detalle-solicitud-heading">
              <div>
                <p>EXPEDIENTE DIGITAL</p>

                <h1>
                  Solicitud #
                  {String(solicitud.id).padStart(4, "0")}
                </h1>

                <span>
                  Consulta los datos, documentos y movimientos
                  registrados durante tu proceso de beca.
                </span>
              </div>

              <span className="detalle-solicitud-estado">
                {formatearEstado(solicitud.estado)}
              </span>
            </section>

            <section className="detalle-solicitud-datos">
              <article>
                <small>CONVOCATORIA</small>
                <strong>
                  #{solicitud.convocatoriaId}
                </strong>
              </article>

              <article>
                <small>ESTADO ACTUAL</small>
                <strong>
                  {formatearEstado(solicitud.estado)}
                </strong>
              </article>

              <article>
                <small>FECHA DE SOLICITUD</small>
                <strong>
                  {formatearFecha(
                    solicitud.fechaSolicitud
                  )}
                </strong>
              </article>

              <article>
                <small>COMITÉ</small>
                <strong>
                  {solicitud.comiteId
                    ? `Comité #${solicitud.comiteId}`
                    : "Pendiente de asignación"}
                </strong>
              </article>
            </section>

            <section className="detalle-solicitud-panel">
              <div className="detalle-solicitud-section-title">
                <p>ARCHIVOS DEL EXPEDIENTE</p>
                <h2>Documentos cargados</h2>
              </div>

              {documentos.length === 0 ? (
                <div className="detalle-solicitud-empty">
                  No hay documentos registrados.
                </div>
              ) : (
                <div className="detalle-solicitud-documentos">
                  {documentos.map((documento) => (
                    <article key={documento.id}>
                      <div className="detalle-documento-icon">
                        DOC
                      </div>

                      <div>
                        <small>
                          {documento.tipoDocumento ||
                            "DOCUMENTO"}
                        </small>

                        <strong>
                          {documento.nombreArchivo}
                        </strong>

                        <span>
                          Cargado:{" "}
                          {formatearFecha(
                            documento.fechaCarga
                          )}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="detalle-solicitud-panel">
              <div className="detalle-solicitud-section-title">
                <p>SEGUIMIENTO DEL PROCESO</p>
                <h2>Historial de estados</h2>
              </div>

              {historial.length === 0 ? (
                <div className="detalle-solicitud-empty">
                  Aún no existen cambios de estado registrados.
                </div>
              ) : (
                <div className="detalle-solicitud-historial">
                  {historial.map((movimiento, indice) => (
                    <article key={movimiento.id}>
                      <div className="detalle-historial-linea">
                        <span>
                          {String(indice + 1).padStart(
                            2,
                            "0"
                          )}
                        </span>
                      </div>

                      <div>
                        <small>
                          {formatearFecha(
                            movimiento.fechaCambio
                          )}
                        </small>

                        <strong>
                          {movimiento.estadoAnterior
                            ? `${formatearEstado(
                                movimiento.estadoAnterior
                              )} → `
                            : ""}
                          {formatearEstado(
                            movimiento.estadoNuevo
                          )}
                        </strong>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

export default DetalleSolicitud;
