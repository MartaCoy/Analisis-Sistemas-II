import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  obtenerSolicitud,
  listarDocumentos,
  obtenerHistorialSolicitud,
} from "../../services/solicitudService.js";

import {
  listarEvaluacionesSolicitud,
  registrarEvaluacionSolicitud,
} from "../../services/evaluacionService.js";

import {
  obtenerBandejaEvaluador,
} from "../../services/panelEvaluadorService.js";

import {
  usePageTransition,
} from "../../components/usePageTransition.js";

import "../../styles/panel-evaluador.css";
import "../../styles/evaluar-solicitud.css";

const ESTADOS = {
  RECIBIDA: "Recibida",
  EN_EVALUACION: "En evaluación",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

function formatearEstado(estado) {
  return ESTADOS[estado] || String(estado || "").replaceAll("_", " ");
}

function formatearFecha(valor) {
  if (!valor) {
    return "No disponible";
  }

  const partes =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(valor);

  if (!partes) {
    return valor;
  }

  const [, anio, mes, dia, hora, minuto] = partes;

  return `${dia}/${mes}/${anio} · ${hora}:${minuto}`;
}

function EvaluarSolicitud() {
  const { id } = useParams();
  const { irA, transicionActiva } = usePageTransition();

  const [consulta, setConsulta] = useState({
    estado: "cargando",
    datos: null,
    error: null,
  });

  const [intento, setIntento] = useState(0);
  const [puntaje, setPuntaje] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let activo = true;

    async function cargar() {
      try {
        const [
          bandeja,
          solicitud,
          documentos,
          evaluaciones,
          historial,
        ] = await Promise.all([
          obtenerBandejaEvaluador({
            signal: controller.signal,
          }),
          obtenerSolicitud(id, {
            signal: controller.signal,
          }),
          listarDocumentos(id, {
            signal: controller.signal,
          }),
          listarEvaluacionesSolicitud(id, {
            signal: controller.signal,
          }),
          obtenerHistorialSolicitud(id, {
            signal: controller.signal,
          }),
        ]);

        if (!activo || controller.signal.aborted) {
          return;
        }

        const asignada = bandeja.solicitudes.some(
          (item) => String(item.id) === String(id)
        );

        if (!asignada) {
          setConsulta({
            estado: "error",
            datos: null,
            error:
              "Esta solicitud no está asignada a uno de tus comités.",
          });

          return;
        }

        setConsulta({
          estado: "listo",
          datos: {
            evaluadorId: bandeja.evaluadorId,
            solicitud,
            documentos,
            evaluaciones,
            historial,
          },
          error: null,
        });
      } catch (error) {
        if (!activo || controller.signal.aborted) {
          return;
        }

        setConsulta({
          estado: "error",
          datos: null,
          error:
            error.message ||
            "No fue posible cargar el expediente.",
        });
      }
    }

    cargar();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [id, intento]);

  const datos = consulta.datos;
  const solicitud = datos?.solicitud;

  const miEvaluacion = datos?.evaluaciones?.find(
    (evaluacion) =>
      String(evaluacion.evaluadorId) ===
      String(datos.evaluadorId)
  );

  const puedeEvaluar =
    consulta.estado === "listo" &&
    !miEvaluacion &&
    ["RECIBIDA", "EN_EVALUACION"].includes(
      solicitud?.estado
    );

  function recargar() {
    setConsulta({
      estado: "cargando",
      datos: null,
      error: null,
    });

    setMensaje(null);
    setIntento((actual) => actual + 1);
  }

  async function registrarEvaluacion(event) {
    event.preventDefault();

    if (!puedeEvaluar || guardando) {
      return;
    }

    const confirmar = window.confirm(
      "¿Deseas registrar esta evaluación? " +
        "Si eres el último integrante pendiente del comité, " +
        "el sistema puede resolver la solicitud automáticamente."
    );

    if (!confirmar) {
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      await registrarEvaluacionSolicitud(id, {
        puntaje,
        observaciones,
      });

      const [
        solicitudActualizada,
        evaluacionesActualizadas,
        historialActualizado,
      ] = await Promise.all([
        obtenerSolicitud(id),
        listarEvaluacionesSolicitud(id),
        obtenerHistorialSolicitud(id),
      ]);

      setConsulta((actual) => ({
        ...actual,
        datos: {
          ...actual.datos,
          solicitud: solicitudActualizada,
          evaluaciones: evaluacionesActualizadas,
          historial: historialActualizado,
        },
      }));

      setPuntaje("");
      setObservaciones("");

      setMensaje({
        tipo: "exito",
        texto:
          "Evaluación registrada correctamente. " +
          `Estado actual: ${formatearEstado(
            solicitudActualizada.estado
          )}.`,
      });
    } catch (error) {
      setMensaje({
        tipo: "error",
        texto:
          error.message ||
          "No fue posible registrar la evaluación.",
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <main className="pev-page ee-page">
      <div className="pev-grid" aria-hidden="true" />

      <header className="pev-header">
        <div className="pev-brand">
          <span aria-hidden="true" />

          <div>
            <small>SISTEMA NACIONAL DE BECAS</small>
            <strong>EVALUACIÓN DE EXPEDIENTE</strong>
          </div>
        </div>

        <button
          className="pev-btn"
          type="button"
          onClick={() => irA("/admin/panel-evaluador")}
          disabled={transicionActiva}
        >
          ← VOLVER A LA BANDEJA
        </button>
      </header>

      <section className="pev-shell ee-shell">
        {consulta.estado === "cargando" && (
          <section className="pev-message" role="status">
            <span
              className="pev-spinner"
              aria-hidden="true"
            />

            <h2>Cargando expediente</h2>

            <p>
              Consultando solicitud, documentos y evaluaciones.
            </p>
          </section>
        )}

        {consulta.estado === "error" && (
          <section
            className="pev-message pev-error"
            role="alert"
          >
            <h2>No se pudo abrir el expediente</h2>

            <p>{consulta.error}</p>

            <button
              className="pev-btn"
              type="button"
              onClick={recargar}
            >
              REINTENTAR
            </button>
          </section>
        )}

        {consulta.estado === "listo" && (
          <>
            <div className="ee-heading">
              <div>
                <p className="pev-kicker">
                  HU-09 · REGISTRO DE EVALUACIÓN
                </p>

                <h1>
                  Solicitud #
                  {String(solicitud.id).padStart(4, "0")}
                </h1>

                <p>
                  Revisa la información del expediente antes de
                  registrar tu evaluación.
                </p>
              </div>

              <span
                className={`ee-status ee-${String(
                  solicitud.estado
                ).toLowerCase()}`}
              >
                {formatearEstado(solicitud.estado)}
              </span>
            </div>

            <section className="ee-info">
              <article>
                <small>ESTUDIANTE</small>
                <strong>#{solicitud.estudianteId}</strong>
              </article>

              <article>
                <small>CONVOCATORIA</small>
                <strong>#{solicitud.convocatoriaId}</strong>
              </article>

              <article>
                <small>COMITÉ</small>
                <strong>#{solicitud.comiteId}</strong>
              </article>

              <article>
                <small>FECHA DE SOLICITUD</small>
                <strong>
                  {formatearFecha(
                    solicitud.fechaSolicitud
                  )}
                </strong>
              </article>
            </section>

            <div className="ee-columns">
              <div className="ee-left">
                <section className="ee-panel">
                  <div className="ee-section-title">
                    <div>
                      <small>DOCUMENTACIÓN</small>
                      <h2>Documentos cargados</h2>
                    </div>

                    <span>
                      {datos.documentos.length}
                    </span>
                  </div>

                  {datos.documentos.length === 0 ? (
                    <p className="ee-empty">
                      No hay documentos cargados.
                    </p>
                  ) : (
                    <div className="ee-list">
                      {datos.documentos.map(
                        (documento) => (
                          <article key={documento.id}>
                            <div>
                              <small>
                                {documento.tipoDocumento ||
                                  "DOCUMENTO"}
                              </small>

                              <strong>
                                {documento.nombreArchivo}
                              </strong>
                            </div>

                            <span>
                              {formatearFecha(
                                documento.fechaCarga
                              )}
                            </span>
                          </article>
                        )
                      )}
                    </div>
                  )}
                </section>

                <section className="ee-panel">
                  <div className="ee-section-title">
                    <div>
                      <small>COMITÉ</small>
                      <h2>Evaluaciones registradas</h2>
                    </div>

                    <span>
                      {datos.evaluaciones.length}
                    </span>
                  </div>

                  {datos.evaluaciones.length === 0 ? (
                    <p className="ee-empty">
                      Aún no existen evaluaciones.
                    </p>
                  ) : (
                    <div className="ee-list">
                      {datos.evaluaciones.map(
                        (evaluacion) => (
                          <article key={evaluacion.id}>
                            <div>
                              <small>
                                EVALUADOR #
                                {evaluacion.evaluadorId}
                              </small>

                              <strong>
                                {evaluacion.puntaje}/100
                              </strong>

                              {evaluacion.observaciones && (
                                <p>
                                  {
                                    evaluacion.observaciones
                                  }
                                </p>
                              )}
                            </div>

                            <span>
                              {formatearFecha(
                                evaluacion.fechaEvaluacion
                              )}
                            </span>
                          </article>
                        )
                      )}
                    </div>
                  )}
                </section>

                <section className="ee-panel">
                  <div className="ee-section-title">
                    <div>
                      <small>TRAZABILIDAD</small>
                      <h2>Historial de estados</h2>
                    </div>
                  </div>

                  {datos.historial.length === 0 ? (
                    <p className="ee-empty">
                      No existen cambios de estado registrados.
                    </p>
                  ) : (
                    <div className="ee-list">
                      {datos.historial.map(
                        (movimiento) => (
                          <article key={movimiento.id}>
                            <div>
                              <small>
                                CAMBIO DE ESTADO
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

                            <span>
                              {formatearFecha(
                                movimiento.fechaCambio
                              )}
                            </span>
                          </article>
                        )
                      )}
                    </div>
                  )}
                </section>
              </div>

              <aside className="ee-panel ee-form-panel">
                <small className="pev-kicker">
                  TU EVALUACIÓN
                </small>

                <h2>Registrar criterio</h2>

                {miEvaluacion ? (
                  <div className="ee-notice">
                    <strong>
                      Evaluación ya registrada
                    </strong>

                    <p>
                      Tu puntaje fue de{" "}
                      <b>{miEvaluacion.puntaje}/100</b>.
                      Una solicitud solo puede evaluarse una vez
                      por integrante.
                    </p>
                  </div>
                ) : !puedeEvaluar ? (
                  <div className="ee-notice">
                    <strong>
                      Solicitud resuelta
                    </strong>

                    <p>
                      El expediente ya no admite nuevas
                      evaluaciones.
                    </p>
                  </div>
                ) : (
                  <form
                    className="ee-form"
                    onSubmit={registrarEvaluacion}
                  >
                    <label>
                      <span>Puntaje</span>

                      <div className="ee-score">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          required
                          value={puntaje}
                          onChange={(event) =>
                            setPuntaje(
                              event.target.value
                            )
                          }
                          disabled={guardando}
                          placeholder="0"
                        />

                        <strong>/ 100</strong>
                      </div>
                    </label>

                    <label>
                      <span>Observaciones</span>

                      <textarea
                        rows="7"
                        maxLength="1000"
                        value={observaciones}
                        onChange={(event) =>
                          setObservaciones(
                            event.target.value
                          )
                        }
                        disabled={guardando}
                        placeholder="Escribe las observaciones de la evaluación..."
                      />

                      <small>
                        {observaciones.length}/1000
                      </small>
                    </label>

                    {mensaje && (
                      <div
                        className={`ee-feedback ${mensaje.tipo}`}
                        role="status"
                      >
                        {mensaje.texto}
                      </div>
                    )}

                    <button
                      className="pev-btn pev-primary ee-submit"
                      type="submit"
                      disabled={
                        guardando ||
                        transicionActiva
                      }
                    >
                      {guardando
                        ? "REGISTRANDO..."
                        : "REGISTRAR EVALUACIÓN"}
                    </button>
                  </form>
                )}

                {mensaje && miEvaluacion && (
                  <div
                    className={`ee-feedback ${mensaje.tipo}`}
                  >
                    {mensaje.texto}
                  </div>
                )}
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default EvaluarSolicitud;
