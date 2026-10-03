import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  DEMO_REPORTES_HABILITADA,
  obtenerReporteBecas,
  REPORTE_DEMO,
} from "../../services/reportesService.js";

import {
  usePageTransition,
} from "../../components/usePageTransition.js";

import "../../styles/reportes-estadisticas.css";

function porcentaje(valor, total) {
  if (!total) {
    return "0.0";
  }

  return ((valor / total) * 100).toFixed(1);
}

function fechaCorta(valor) {
  if (!valor) {
    return "Sin fecha";
  }

  const fecha = new Date(`${valor}T00:00:00`);

  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }

  return fecha.toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function textoTipo(tipo) {
  return String(tipo || "")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(
      /(^|\s)\S/g,
      (letra) => letra.toUpperCase()
    );
}

function escaparCsv(valor) {
  const texto = String(valor ?? "");

  if (
    texto.includes(",") ||
    texto.includes('"') ||
    texto.includes("\n")
  ) {
    return `"${texto.replaceAll('"', '""')}"`;
  }

  return texto;
}

function ReportesEstadisticas() {
  const {
    irA,
    transicionActiva,
  } = usePageTransition();

  const [consulta, setConsulta] = useState({
    estado: "cargando",
    datos: null,
    error: null,
    demo: false,
  });

  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [tipoBeca, setTipoBeca] = useState("TODAS");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let activo = true;

    async function cargar() {
      try {
        const datos = await obtenerReporteBecas({
          signal: controller.signal,
        });

        if (!activo || controller.signal.aborted) {
          return;
        }

        setConsulta({
          estado: "listo",
          datos,
          error: null,
          demo: false,
        });
      } catch (error) {
        if (
          !activo ||
          controller.signal.aborted ||
          error?.name === "AbortError"
        ) {
          return;
        }

        setConsulta({
          estado:
            error?.codigo === "HU12_BACKEND_PENDIENTE"
              ? "pendiente"
              : "error",
          datos: null,
          error:
            error.message ||
            "No fue posible generar el reporte.",
          demo: false,
        });
      }
    }

    cargar();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [intento]);

  const datos = consulta.datos;

  const tiposDisponibles = useMemo(() => {
    const registros = datos?.otorgadas ?? [];

    return [
      ...new Set(
        registros
          .map((item) => item.tipoBeca)
          .filter(Boolean)
      ),
    ].sort();
  }, [datos]);

  const otorgadasFiltradas = useMemo(() => {
    const registros = datos?.otorgadas ?? [];
    const texto = busqueda.trim().toLowerCase();

    return registros.filter((item) => {
      const coincideTexto =
        !texto ||
        [
          item.id,
          item.estudiante,
          item.convocatoria,
          item.tipoBeca,
        ]
          .join(" ")
          .toLowerCase()
          .includes(texto);

      const coincideTipo =
        tipoBeca === "TODAS" ||
        item.tipoBeca === tipoBeca;

      const coincideDesde =
        !fechaDesde || item.fecha >= fechaDesde;

      const coincideHasta =
        !fechaHasta || item.fecha <= fechaHasta;

      return (
        coincideTexto &&
        coincideTipo &&
        coincideDesde &&
        coincideHasta
      );
    });
  }, [
    datos,
    busqueda,
    tipoBeca,
    fechaDesde,
    fechaHasta,
  ]);

  function activarDemo() {
    if (!DEMO_REPORTES_HABILITADA) {
      return;
    }

    setBusqueda("");
    setTipoBeca("TODAS");
    setFechaDesde("");
    setFechaHasta("");

    setConsulta({
      estado: "listo",
      datos: REPORTE_DEMO,
      error: null,
      demo: true,
    });
  }

  function reintentar() {
    setConsulta({
      estado: "cargando",
      datos: null,
      error: null,
      demo: false,
    });

    setIntento((actual) => actual + 1);
  }

  function limpiarFiltros() {
    setBusqueda("");
    setTipoBeca("TODAS");
    setFechaDesde("");
    setFechaHasta("");
  }

  function exportarCsv() {
    const encabezados = [
      "Solicitud",
      "Estudiante",
      "Convocatoria",
      "Tipo de beca",
      "Fecha",
      "Puntaje",
      "Estado",
    ];

    const filas = otorgadasFiltradas.map((item) => [
      item.id,
      item.estudiante,
      item.convocatoria,
      textoTipo(item.tipoBeca),
      item.fecha,
      item.puntaje,
      item.estado,
    ]);

    const contenido = [
      encabezados,
      ...filas,
    ]
      .map((fila) =>
        fila.map(escaparCsv).join(",")
      )
      .join("\n");

    const blob = new Blob(
      [`\ufeff${contenido}`],
      {
        type: "text/csv;charset=utf-8",
      }
    );

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download =
      "reporte-becas-otorgadas.csv";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  }

  const resumen = datos?.resumen;

  const total =
    Number(resumen?.totalSolicitudes) || 0;

  const tasaAprobacion = porcentaje(
    Number(resumen?.aprobadas) || 0,
    total
  );

  const maxEstado = Math.max(
    1,
    ...(datos?.estados ?? []).map(
      (item) => Number(item.cantidad) || 0
    )
  );

  const totalTipos = (datos?.tiposBeca ?? []).reduce(
    (acumulado, item) =>
      acumulado + (Number(item.cantidad) || 0),
    0
  );

  return (
    <main className="rep-page">
      <div
        className="rep-grid"
        aria-hidden="true"
      />

      <header className="rep-header">
        <div className="rep-brand">
          <span aria-hidden="true" />

          <div>
            <small>
              SISTEMA NACIONAL DE BECAS
            </small>

            <strong>
              INTELIGENCIA Y REPORTES
            </strong>
          </div>
        </div>

        <button
          type="button"
          className="rep-btn"
          onClick={() => irA("/dashboard")}
          disabled={transicionActiva}
        >
          ← VOLVER AL PANEL
        </button>
      </header>

      <section className="rep-shell">
        <div className="rep-heading">
          <div>
            <p className="rep-kicker">
              HU-12 · ANÁLISIS INSTITUCIONAL
            </p>

            <h1>
              Reportes y{" "}
              <span>estadísticas</span>
            </h1>

            <p>
              Consulta indicadores del proceso de
              becas y analiza las adjudicaciones
              registradas.
            </p>
          </div>

          {consulta.estado === "listo" && (
            <div className="rep-heading-actions">
              <button
                type="button"
                className="rep-btn"
                onClick={reintentar}
                disabled={transicionActiva}
              >
                ACTUALIZAR
              </button>

              <button
                type="button"
                className="rep-btn rep-btn-primary"
                onClick={exportarCsv}
                disabled={
                  otorgadasFiltradas.length === 0
                }
              >
                EXPORTAR CSV
              </button>
            </div>
          )}
        </div>

        {consulta.estado === "cargando" && (
          <section
            className="rep-state"
            role="status"
          >
            <span
              className="rep-spinner"
              aria-hidden="true"
            />

            <h2>Generando reporte</h2>

            <p>
              Consultando información institucional.
            </p>
          </section>
        )}

        {consulta.estado === "pendiente" && (
          <section className="rep-state">
            <span className="rep-state-code">
              HU-12
            </span>

            <h2>
              Integración backend pendiente
            </h2>

            <p>
              La interfaz frontend está preparada,
              pero el endpoint de reportes todavía
              no existe en la rama principal.
            </p>

            {DEMO_REPORTES_HABILITADA ? (
              <>
                <button
                  type="button"
                  className="rep-btn rep-btn-primary"
                  onClick={activarDemo}
                >
                  VER DEMOSTRACIÓN
                </button>

                <small>
                  Los datos de demostración son locales
                  y no representan información oficial.
                </small>
              </>
            ) : (
              <small>
                El modo demostración está deshabilitado
                en esta compilación. La vista quedará
                activa cuando HU-12 Backend esté
                configurado.
              </small>
            )}
          </section>
        )}

        {consulta.estado === "error" && (
          <section
            className="rep-state rep-state-error"
            role="alert"
          >
            <span className="rep-state-code">
              ERROR
            </span>

            <h2>
              No fue posible cargar el reporte
            </h2>

            <p>{consulta.error}</p>

            <button
              type="button"
              className="rep-btn"
              onClick={reintentar}
            >
              REINTENTAR
            </button>
          </section>
        )}

        {consulta.estado === "listo" && datos && (
          <>
            <div className="rep-status-line">
              <span>
                {consulta.demo
                  ? "● MODO DEMOSTRACIÓN"
                  : "● DATOS DEL SERVIDOR"}
              </span>

              <span>
                {consulta.demo
                  ? "Datos locales no oficiales"
                  : "Reporte actualizado"}
              </span>
            </div>

            <section
              className="rep-kpis"
              aria-label="Indicadores principales"
            >
              <article>
                <small>
                  SOLICITUDES TOTALES
                </small>
                <strong>
                  {total.toLocaleString("es-GT")}
                </strong>
                <span>
                  Procesos registrados
                </span>
              </article>

              <article>
                <small>
                  BECAS APROBADAS
                </small>
                <strong>
                  {Number(
                    resumen?.aprobadas || 0
                  ).toLocaleString("es-GT")}
                </strong>
                <span>
                  Resoluciones favorables
                </span>
              </article>

              <article>
                <small>
                  RECHAZADAS
                </small>
                <strong>
                  {Number(
                    resumen?.rechazadas || 0
                  ).toLocaleString("es-GT")}
                </strong>
                <span>
                  Solicitudes no adjudicadas
                </span>
              </article>

              <article className="rep-kpi-accent">
                <small>
                  TASA DE APROBACIÓN
                </small>
                <strong>
                  {tasaAprobacion}%
                </strong>
                <span>
                  Sobre solicitudes totales
                </span>
              </article>
            </section>

            <section className="rep-charts">
              <article className="rep-panel">
                <div className="rep-panel-heading">
                  <div>
                    <small>
                      DISTRIBUCIÓN GENERAL
                    </small>
                    <h2>
                      Solicitudes por estado
                    </h2>
                  </div>

                  <span>
                    {total} registros
                  </span>
                </div>

                <div className="rep-bars">
                  {datos.estados.map((item) => {
                    const valor =
                      Number(item.cantidad) || 0;

                    const ancho =
                      (valor / maxEstado) * 100;

                    return (
                      <div
                        className="rep-bar-row"
                        key={item.nombre}
                      >
                        <div className="rep-bar-label">
                          <span>
                            {item.nombre}
                          </span>
                          <strong>
                            {valor}
                          </strong>
                        </div>

                        <div className="rep-bar-track">
                          <span
                            style={{
                              width: `${ancho}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="rep-panel">
                <div className="rep-panel-heading">
                  <div>
                    <small>
                      ADJUDICACIONES
                    </small>
                    <h2>
                      Becas por categoría
                    </h2>
                  </div>

                  <span>
                    {totalTipos} otorgadas
                  </span>
                </div>

                <div className="rep-types">
                  {datos.tiposBeca.map(
                    (item, indice) => {
                      const cantidad =
                        Number(item.cantidad) || 0;

                      return (
                        <div
                          className="rep-type"
                          key={item.nombre}
                        >
                          <span
                            className={`rep-type-index rep-type-${indice + 1}`}
                          >
                            {String(
                              indice + 1
                            ).padStart(2, "0")}
                          </span>

                          <div>
                            <strong>
                              {item.nombre}
                            </strong>

                            <small>
                              {porcentaje(
                                cantidad,
                                totalTipos
                              )}
                              % del total
                            </small>
                          </div>

                          <b>
                            {cantidad}
                          </b>
                        </div>
                      );
                    }
                  )}
                </div>
              </article>
            </section>

            <section className="rep-panel rep-report">
              <div className="rep-report-heading">
                <div>
                  <small>
                    REPORTE DETALLADO
                  </small>

                  <h2>
                    Becas otorgadas
                  </h2>

                  <p>
                    Filtra y exporta los registros
                    mostrados.
                  </p>
                </div>

                <strong>
                  {otorgadasFiltradas.length}
                  {" "}RESULTADOS
                </strong>
              </div>

              <div className="rep-filters">
                <label className="rep-search">
                  <span>Buscar</span>

                  <input
                    type="search"
                    value={busqueda}
                    onChange={(event) =>
                      setBusqueda(
                        event.target.value
                      )
                    }
                    placeholder="Estudiante, solicitud o convocatoria..."
                  />
                </label>

                <label>
                  <span>Tipo de beca</span>

                  <select
                    value={tipoBeca}
                    onChange={(event) =>
                      setTipoBeca(
                        event.target.value
                      )
                    }
                  >
                    <option value="TODAS">
                      Todas
                    </option>

                    {tiposDisponibles.map(
                      (tipo) => (
                        <option
                          value={tipo}
                          key={tipo}
                        >
                          {textoTipo(tipo)}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>Desde</span>

                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(event) =>
                      setFechaDesde(
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  <span>Hasta</span>

                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(event) =>
                      setFechaHasta(
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>

              {otorgadasFiltradas.length === 0 ? (
                <div className="rep-empty">
                  <h3>
                    Sin coincidencias
                  </h3>

                  <p>
                    Cambia los filtros para mostrar
                    otros registros.
                  </p>

                  <button
                    type="button"
                    className="rep-btn"
                    onClick={limpiarFiltros}
                  >
                    LIMPIAR FILTROS
                  </button>
                </div>
              ) : (
                <div className="rep-table-wrap">
                  <table className="rep-table">
                    <thead>
                      <tr>
                        <th>Solicitud</th>
                        <th>Estudiante</th>
                        <th>Convocatoria</th>
                        <th>Tipo</th>
                        <th>Puntaje</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                      </tr>
                    </thead>

                    <tbody>
                      {otorgadasFiltradas.map(
                        (item) => (
                          <tr key={item.id}>
                            <td>
                              #
                              {String(
                                item.id
                              ).padStart(
                                4,
                                "0"
                              )}
                            </td>

                            <td>
                              <strong>
                                {
                                  item.estudiante
                                }
                              </strong>
                            </td>

                            <td>
                              {
                                item.convocatoria
                              }
                            </td>

                            <td>
                              {textoTipo(
                                item.tipoBeca
                              )}
                            </td>

                            <td>
                              <b>
                                {item.puntaje}/100
                              </b>
                            </td>

                            <td>
                              {fechaCorta(
                                item.fecha
                              )}
                            </td>

                            <td>
                              <span className="rep-badge">
                                {item.estado}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {consulta.demo && (
              <div className="rep-demo-warning">
                DEMOSTRACIÓN · LOS VALORES MOSTRADOS
                NO PROVIENEN DE LA BASE DE DATOS
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default ReportesEstadisticas;
