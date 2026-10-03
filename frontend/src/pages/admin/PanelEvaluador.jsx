import { useEffect, useState } from "react";

import {
  obtenerBandejaEvaluador,
} from "../../services/panelEvaluadorService.js";

import {
  usePageTransition,
} from "../../components/usePageTransition.js";

import "../../styles/panel-evaluador.css";

const ESTADOS = {
  RECIBIDA: "Recibida",
  EN_EVALUACION: "En evaluación",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};

function nombreEstado(estado) {
  return Object.hasOwn(ESTADOS, estado)
    ? ESTADOS[estado]
    : String(estado).replaceAll("_", " ");
}

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// LocalDateTime no incluye zona.
// Conservamos la fecha y hora informadas por el servidor.
function formatearFecha(valor) {
  const partes =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(
      valor || ""
    );

  if (!partes) {
    return "Fecha no disponible";
  }

  const [, anio, mes, dia, hora, minuto] = partes;

  return `${dia}/${mes}/${anio} · ${hora}:${minuto}`;
}

function PanelEvaluador() {
  const { irA, transicionActiva } = usePageTransition();

  const [consulta, setConsulta] = useState({
    estado: "cargando",
    datos: null,
    error: null,
  });

  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("TODAS");

  useEffect(() => {
    const controller = new AbortController();
    let activo = true;

    async function cargar() {
      try {
        const datos = await obtenerBandejaEvaluador({
          signal: controller.signal,
        });

        if (!activo || controller.signal.aborted) {
          return;
        }

        setConsulta({
          estado: "listo",
          datos,
          error: null,
        });
      } catch (error) {
        if (!activo || controller.signal.aborted) {
          return;
        }

        setConsulta({
          estado: "error",
          datos: null,
          error: error.message || "No se pudo cargar el panel.",
        });
      }
    }

    cargar();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [intento]);

  const cargando = consulta.estado === "cargando";
  const listo = consulta.estado === "listo";
  const solicitudes = consulta.datos?.solicitudes ?? [];

  const resumen = [
    ["TOTAL ASIGNADAS", solicitudes.length],
    [
      "RECIBIDAS",
      solicitudes.filter((s) => s.estado === "RECIBIDA").length,
    ],
    [
      "EN EVALUACIÓN",
      solicitudes.filter(
        (s) => s.estado === "EN_EVALUACION"
      ).length,
    ],
    [
      "RESUELTAS",
      solicitudes.filter(
        (s) => ["APROBADA", "RECHAZADA"].includes(s.estado)
      ).length,
    ],
  ];

  const texto = normalizar(busqueda);

  const filtradas = solicitudes.filter((solicitud) => {
    const coincideEstado =
      filtro === "TODAS" || solicitud.estado === filtro;

    const contenido = normalizar(
      `Solicitud #${solicitud.id} ` +
      `Convocatoria #${solicitud.convocatoriaId} ` +
      `Estudiante #${solicitud.estudianteId} ` +
      `Comité #${solicitud.comiteId} ` +
      nombreEstado(solicitud.estado)
    );

    return (
      coincideEstado &&
      (!texto || contenido.includes(texto))
    );
  });

  function actualizar() {
    if (cargando || transicionActiva) {
      return;
    }

    setConsulta({
      estado: "cargando",
      datos: null,
      error: null,
    });

    setIntento((actual) => actual + 1);
  }

  function limpiarFiltros() {
    setBusqueda("");
    setFiltro("TODAS");
  }

  return (
    <main className="pev-page">
      <div className="pev-grid" aria-hidden="true" />

      <header className="pev-header">
        <div className="pev-brand">
          <span aria-hidden="true" />

          <div>
            <small>SISTEMA NACIONAL DE BECAS</small>
            <strong>COMITÉS DE EVALUACIÓN</strong>
          </div>
        </div>

        <button
          className="pev-btn"
          type="button"
          onClick={() => irA("/dashboard")}
          disabled={transicionActiva}
        >
          ← VOLVER AL PANEL
        </button>
      </header>

      <section className="pev-shell">
        <div className="pev-heading">
          <div>
            <p className="pev-kicker">
              REVISIÓN ACADÉMICA · HU-08 / HU-09
            </p>

            <h1>
              Panel de <span>evaluador</span>
            </h1>

            <p className="pev-description">
              Consulta los expedientes asignados a los comités
              a los que perteneces.
            </p>
          </div>

          <button
            className="pev-btn pev-primary"
            type="button"
            onClick={actualizar}
            disabled={cargando || transicionActiva}
          >
            {cargando
              ? "CONSULTANDO..."
              : "ACTUALIZAR BANDEJA"}
          </button>
        </div>

        <section
          className="pev-summary"
          aria-label="Resumen por estado de las solicitudes"
        >
          {resumen.map(([etiqueta, cantidad]) => (
            <article key={etiqueta}>
              <small>{etiqueta}</small>

              <strong>
                {listo
                  ? String(cantidad).padStart(2, "0")
                  : "—"}
              </strong>
            </article>
          ))}
        </section>

        <div className="pev-filters">
          <label>
            <span>Buscar por identificador</span>

            <input
              type="search"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
              placeholder="Solicitud, convocatoria, estudiante o comité..."
              disabled={!listo}
            />
          </label>

          <label>
            <span>Estado de la solicitud</span>

            <select
              value={filtro}
              onChange={(event) =>
                setFiltro(event.target.value)
              }
              disabled={!listo}
            >
              <option value="TODAS">
                Todos los estados
              </option>

              {Object.entries(ESTADOS).map(
                ([codigo, nombre]) => (
                  <option key={codigo} value={codigo}>
                    {nombre}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        {cargando && (
          <section className="pev-message" role="status">
            <span
              className="pev-spinner"
              aria-hidden="true"
            />

            <h2>Consultando tu bandeja</h2>
            <p>Verificando asignaciones con el servidor.</p>
          </section>
        )}

        {consulta.estado === "error" && (
          <section
            className="pev-message pev-error"
            role="alert"
          >
            <h2>No se pudo cargar la bandeja</h2>
            <p>{consulta.error}</p>

            <button
              className="pev-btn"
              type="button"
              onClick={actualizar}
              disabled={transicionActiva}
            >
              REINTENTAR CONSULTA
            </button>
          </section>
        )}

        {listo && solicitudes.length === 0 && (
          <section className="pev-message" role="status">
            <span
              className="pev-empty-mark"
              aria-hidden="true"
            >
              00
            </span>

            <h2>No tienes solicitudes asignadas</h2>

            <p>
              No se encontraron expedientes para los comités
              a los que pertenece tu cuenta. Comprueba tu
              membresía y las asignaciones.
            </p>
          </section>
        )}

        {listo &&
          solicitudes.length > 0 &&
          filtradas.length === 0 && (
            <section className="pev-message" role="status">
              <h2>No hay coincidencias</h2>

              <p>
                Cambia el identificador o el estado seleccionado.
              </p>

              <button
                className="pev-btn"
                type="button"
                onClick={limpiarFiltros}
              >
                LIMPIAR FILTROS
              </button>
            </section>
          )}

        {listo && filtradas.length > 0 && (
          <>
            <div className="pev-results" role="status">
              <span>
                {filtradas.length} DE {solicitudes.length}
                {" "}SOLICITUDES
              </span>

              <span>
                EVALUADOR #{consulta.datos.evaluadorId}
              </span>
            </div>

            <section
              className="pev-list"
              aria-label="Solicitudes asignadas"
            >
              {filtradas.map((solicitud) => (
                <article
                  className="pev-card"
                  key={solicitud.id}
                  aria-labelledby={`pev-solicitud-${solicitud.id}`}
                >
                  <div className="pev-card-top">
                    <span className="pev-code">
                      EXPEDIENTE
                    </span>

                    <span
                      className={`pev-badge pev-${
                        Object.hasOwn(ESTADOS, solicitud.estado)
                          ? solicitud.estado.toLowerCase()
                          : "otro"
                      }`}
                    >
                      {nombreEstado(solicitud.estado)}
                    </span>
                  </div>

                  <h2 id={`pev-solicitud-${solicitud.id}`}>
                    Solicitud #
                    {String(solicitud.id).padStart(4, "0")}
                  </h2>

                  <dl className="pev-card-data">
                    <div>
                      <dt>CONVOCATORIA</dt>
                      <dd>#{solicitud.convocatoriaId}</dd>
                    </div>

                    <div>
                      <dt>COMITÉ ASIGNADO</dt>
                      <dd>#{solicitud.comiteId}</dd>
                    </div>

                    <div>
                      <dt>ESTUDIANTE</dt>
                      <dd>#{solicitud.estudianteId}</dd>
                    </div>

                    <div>
                      <dt>FECHA DE REGISTRO</dt>
                      <dd>
                        {formatearFecha(
                          solicitud.fechaSolicitud
                        )}
                      </dd>
                    </div>
                  </dl>

                  <button
                    className="pev-btn pev-review"
                    type="button"
                    onClick={() =>
                      irA(
                        `/admin/panel-evaluador/solicitudes/${solicitud.id}`
                      )
                    }
                    disabled={transicionActiva}
                  >
                    REVISAR EXPEDIENTE →
                  </button>
                </article>
              ))}
            </section>
          </>
        )}

        <footer className="pev-footer">
          BANDEJA DE CONSULTA · LAS FECHAS CONSERVAN LA HORA
          INFORMADA POR EL SERVIDOR
        </footer>
      </section>
    </main>
  );
}

export default PanelEvaluador;
