import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listarConvocatoriasActivas } from "../services/convocatoriaService.js";
import { obtenerSesion } from "../services/authService.js";
import TransitionLink from "../components/TransitionLink.jsx";

import "../styles/convocatorias.css";

const TIPOS_BECA = {
  ACADEMICA: { etiqueta: "Académica", codigo: "AC" },
  DEPORTIVA: { etiqueta: "Deportiva", codigo: "DP" },
  SOCIOECONOMICA: { etiqueta: "Socioeconómica", codigo: "SE" },
};

const FILTROS = [
  ["TODAS", "Todas"],
  ["ACADEMICA", "Académicas"],
  ["DEPORTIVA", "Deportivas"],
  ["SOCIOECONOMICA", "Socioeconómicas"],
];

const DIA_MS = 24 * 60 * 60 * 1000;

const PRIORIDAD = {
  abierta: 0,
  proxima: 1,
  pendiente: 2,
};

const FORMATO_HOY = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Guatemala",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const FORMATO_FECHA = new Intl.DateTimeFormat("es-GT", {
  timeZone: "UTC",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// Convierte YYYY-MM-DD a un día calendario sin desfases de horas.
function leerDia(fecha) {
  if (
    typeof fecha !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    return null;
  }

  const valor = new Date(`${fecha}T00:00:00.000Z`);

  if (
    Number.isNaN(valor.getTime()) ||
    valor.toISOString().slice(0, 10) !== fecha
  ) {
    return null;
  }

  return Math.floor(valor.getTime() / DIA_MS);
}

function obtenerHoy() {
  const partes = FORMATO_HOY.formatToParts(new Date());

  const valor = (tipo) =>
    partes.find((parte) => parte.type === tipo)?.value;

  return leerDia(
    `${valor("year")}-${valor("month")}-${valor("day")}`
  );
}

function formatearFecha(fecha) {
  const dia = leerDia(fecha);

  return dia === null
    ? "Por confirmar"
    : FORMATO_FECHA.format(new Date(dia * DIA_MS));
}

function obtenerTipo(codigo) {
  return (
    TIPOS_BECA[codigo] || {
      etiqueta: codigo || "General",
      codigo: "BE",
    }
  );
}

function obtenerVigencia(convocatoria, hoy) {
  const apertura = leerDia(convocatoria.fechaApertura);
  const cierre = leerDia(convocatoria.fechaCierre);

  // La fecha de cierre se incluye.
  if (cierre !== null && cierre < hoy) {
    return {
      codigo: "finalizada",
      texto: "Fecha finalizada",
      cantidad: null,
      plazo: "Periodo finalizado",
    };
  }

  const pendiente = {
    codigo: "pendiente",
    texto: "Fechas por confirmar",
    cantidad: null,
    plazo: "Consulta las fechas",
  };

  const formatoInvalido =
    (Boolean(convocatoria.fechaApertura) && apertura === null) ||
    (Boolean(convocatoria.fechaCierre) && cierre === null);

  if (
    formatoInvalido ||
    (apertura !== null && cierre !== null && apertura > cierre)
  ) {
    return pendiente;
  }

  if (apertura !== null && apertura > hoy) {
    const dias = apertura - hoy;

    return {
      codigo: "proxima",
      texto: "Próximamente",
      cantidad: dias,
      plazo: dias === 1 ? "día para iniciar" : "días para iniciar",
    };
  }

  if (apertura === null || cierre === null) {
    return pendiente;
  }

  const dias = cierre - hoy;

  return {
    codigo: "abierta",
    texto: "Convocatoria abierta",
    cantidad: dias === 0 ? null : dias,
    plazo:
      dias === 0
        ? "Cierra hoy"
        : dias === 1
          ? "día para el cierre"
          : "días para el cierre",
  };
}

function claseVigencia(vigencia) {
  const color =
    vigencia.codigo === "pendiente"
      ? "proxima"
      : vigencia.codigo;

  return `conv-vigencia conv-vigencia-${color}`;
}

function Convocatorias() {
  const navigate = useNavigate();

  const sesion = obtenerSesion();
  const esEstudiante = sesion?.rol === "ESTUDIANTE";

  const [convocatorias, setConvocatorias] = useState([]);
  const [estado, setEstado] = useState("cargando");
  const [error, setError] = useState(null);
  const [intento, setIntento] = useState(0);
  const [hoy, setHoy] = useState(obtenerHoy);
  const [busqueda, setBusqueda] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] =
    useState("TODAS");
  const [seleccionada, setSeleccionada] = useState(null);

  const fondoRef = useRef(null);
  const modalRef = useRef(null);
  const botonDetalleRef = useRef(null);

  // Carga inicial y reintentos.
  useEffect(() => {
    const controller = new AbortController();
    let activo = true;

    async function cargar() {
      setEstado("cargando");
      setError(null);

      try {
        const datos = await listarConvocatoriasActivas({
          signal: controller.signal,
        });

        if (
          datos.some(
            (dato) =>
              !dato ||
              dato.id == null ||
              typeof dato.nombre !== "string" ||
              typeof dato.estado !== "string"
          )
        ) {
          throw new Error(
            "El servidor devolvió una convocatoria incompleta."
          );
        }

        if (!activo) {
          return;
        }

        setConvocatorias(datos);
        setEstado("listo");
      } catch (err) {
        if (!activo || err.name === "AbortError") {
          return;
        }

        setError({
          mensaje:
            err.message ||
            "No fue posible cargar las convocatorias.",
          status: err.status || 0,
        });

        setEstado("error");
      }
    }

    cargar();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [intento]);

  // Actualiza la vigencia si cambia el día.
  useEffect(() => {
    const actualizarDia = () => setHoy(obtenerHoy());

    const timer = window.setInterval(actualizarDia, 60_000);

    window.addEventListener("focus", actualizarDia);
    document.addEventListener(
      "visibilitychange",
      actualizarDia
    );

    return () => {
      window.clearInterval(timer);

      window.removeEventListener(
        "focus",
        actualizarDia
      );

      document.removeEventListener(
        "visibilitychange",
        actualizarDia
      );
    };
  }, []);

  // Manejo accesible del modal.
  useEffect(() => {
    if (!seleccionada) {
      return undefined;
    }

    const modal = modalRef.current;
    const fondo = fondoRef.current;
    const botonOrigen = botonDetalleRef.current;

    if (!modal || !fondo) {
      return undefined;
    }

    const overflowAnterior = document.body.style.overflow;
    const inertAnterior = fondo.inert;

    fondo.inert = true;
    document.body.style.overflow = "hidden";

    const titulo = modal.querySelector("#conv-modal-titulo");

    titulo?.focus({
      preventScroll: true,
    });

    const manejarTeclado = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSeleccionada(null);
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const botones = Array.from(
        modal.querySelectorAll(
          "button:not([disabled]), a[href]"
        )
      );

      const primero = botones[0];
      const ultimo = botones[botones.length - 1];
      const actual = document.activeElement;

      if (!primero) {
        return;
      }

      if (
        event.shiftKey &&
        (actual === primero || !botones.includes(actual))
      ) {
        event.preventDefault();
        ultimo.focus();
      } else if (
        !event.shiftKey &&
        (actual === ultimo || !botones.includes(actual))
      ) {
        event.preventDefault();
        primero.focus();
      }
    };

    document.addEventListener(
      "keydown",
      manejarTeclado
    );

    return () => {
      document.removeEventListener(
        "keydown",
        manejarTeclado
      );

      document.body.style.overflow =
        overflowAnterior;

      fondo.inert = inertAnterior;

      if (botonOrigen?.isConnected) {
        botonOrigen.focus({
          preventScroll: true,
        });
      }
    };
  }, [seleccionada]);

  const disponibles = useMemo(() => {
    return convocatorias
      .filter(
        (convocatoria) =>
          convocatoria.estado === "PUBLICADA"
      )
      .map((convocatoria) => ({
        datos: convocatoria,
        tipo: obtenerTipo(convocatoria.tipoBeca),
        vigencia: obtenerVigencia(convocatoria, hoy),
      }))
      .filter(
        (item) =>
          item.vigencia.codigo !== "finalizada"
      )
      .sort((a, b) => {
        const prioridad =
          PRIORIDAD[a.vigencia.codigo] -
          PRIORIDAD[b.vigencia.codigo];

        if (prioridad !== 0) {
          return prioridad;
        }

        const fechaA = leerDia(
          a.vigencia.codigo === "proxima"
            ? a.datos.fechaApertura
            : a.datos.fechaCierre
        );

        const fechaB = leerDia(
          b.vigencia.codigo === "proxima"
            ? b.datos.fechaApertura
            : b.datos.fechaCierre
        );

        return (
          (fechaA ?? Infinity) -
            (fechaB ?? Infinity) ||
          a.datos.nombre.localeCompare(
            b.datos.nombre,
            "es"
          )
        );
      });
  }, [convocatorias, hoy]);

  const filtradas = useMemo(() => {
    const texto = normalizarTexto(busqueda);

    return disponibles.filter(({ datos, tipo }) => {
      const coincideTipo =
        tipoSeleccionado === "TODAS" ||
        datos.tipoBeca === tipoSeleccionado;

      const contenido = normalizarTexto(
        `${datos.nombre} ${datos.requisitos ?? ""} ${tipo.etiqueta}`
      );

      return (
        coincideTipo &&
        (!texto || contenido.includes(texto))
      );
    });
  }, [
    disponibles,
    busqueda,
    tipoSeleccionado,
  ]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setTipoSeleccionado("TODAS");
  };

  const abrirDetalle = (
    convocatoria,
    event
  ) => {
    botonDetalleRef.current =
      event.currentTarget;

    setSeleccionada(convocatoria);
  };

  const irASolicitud = () => {
    if (!seleccionada?.id) {
      return;
    }

    navigate(
      `/convocatorias/${seleccionada.id}/solicitar`
    );
  };

  const vigenciaDetalle = seleccionada
    ? obtenerVigencia(seleccionada, hoy)
    : null;

  const tipoDetalle = seleccionada
    ? obtenerTipo(seleccionada.tipoBeca)
    : null;

  const requiereSesion =
    error?.status === 401 ||
    error?.status === 403;

  return (
    <main className="conv-page">
      <div ref={fondoRef}>
        <div
          className="conv-grid-fondo"
          aria-hidden="true"
        />

        <div
          className="conv-orbe conv-orbe-uno"
          aria-hidden="true"
        />

        <div
          className="conv-orbe conv-orbe-dos"
          aria-hidden="true"
        />

        <header className="conv-header">
          <div className="conv-header-marca">
            <span
              className="conv-pulso"
              aria-hidden="true"
            />

            <div>
              <small>
                SISTEMA NACIONAL DE BECAS
              </small>

              <strong>
                PORTAL ESTUDIANTIL
              </strong>
            </div>
          </div>

          <TransitionLink
            to="/dashboard"
            className="conv-volver"
          >
            <span aria-hidden="true">
              ←
            </span>{" "}
            VOLVER AL PANEL
          </TransitionLink>
        </header>

        <section className="conv-contenido">
          <div className="conv-intro">
            <div className="conv-intro-texto">
              <p className="conv-kicker">
                NODO 02 · EXPLORACIÓN DE
                OPORTUNIDADES
              </p>

              <h1>
                Convocatorias
                <strong>
                  {" "}disponibles
                </strong>
              </h1>

              <p className="conv-descripcion">
                Consulta requisitos y fechas de
                las oportunidades publicadas.
                Las finalizadas no aparecen en
                este listado y las fechas
                pendientes se indican en cada
                tarjeta.
              </p>
            </div>

            <div className="conv-contador">
              <span>
                {estado === "listo"
                  ? String(
                      disponibles.length
                    ).padStart(2, "0")
                  : "—"}
              </span>

              <div>
                <small>
                  CONVOCATORIAS
                </small>

                <strong>
                  EN ESTE LISTADO
                </strong>
              </div>
            </div>
          </div>

          <div className="conv-panel-filtros">
            <div className="conv-buscador">
              <span aria-hidden="true">
                ⌕
              </span>

              <input
                type="search"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(
                    event.target.value
                  )
                }
                placeholder="Buscar convocatoria..."
                aria-label="Buscar por nombre, requisitos o tipo de beca"
              />
            </div>

            <div
              className="conv-filtros"
              role="group"
              aria-label="Tipo de beca"
            >
              {FILTROS.map(
                ([valor, etiqueta]) => (
                  <button
                    key={valor}
                    type="button"
                    className={
                      tipoSeleccionado ===
                      valor
                        ? "activo"
                        : ""
                    }
                    aria-pressed={
                      tipoSeleccionado ===
                      valor
                    }
                    onClick={() =>
                      setTipoSeleccionado(
                        valor
                      )
                    }
                  >
                    {etiqueta}
                  </button>
                )
              )}
            </div>
          </div>

          {estado === "cargando" && (
            <section
              className="conv-estado conv-cargando"
              role="status"
            >
              <div
                className="conv-loader"
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </div>

              <p>
                SINCRONIZANDO CONVOCATORIAS
              </p>

              <small>
                Consultando oportunidades
                publicadas
              </small>
            </section>
          )}

          {estado === "error" && (
            <section
              className="conv-estado conv-error"
              role="alert"
            >
              <div
                className="conv-estado-icono"
                aria-hidden="true"
              >
                !
              </div>

              <p>
                NO FUE POSIBLE CARGAR LAS
                CONVOCATORIAS
              </p>

              <small>
                {error?.mensaje}
              </small>

              <button
                type="button"
                onClick={() =>
                  setIntento(
                    (actual) =>
                      actual + 1
                  )
                }
              >
                REINTENTAR CONEXIÓN
              </button>

              {requiereSesion && (
                <TransitionLink
                  to="/login"
                  className="conv-volver"
                >
                  VOLVER A INICIAR SESIÓN
                </TransitionLink>
              )}
            </section>
          )}

          {estado === "listo" &&
            disponibles.length === 0 && (
              <section
                className="conv-estado"
                role="status"
              >
                <div
                  className="conv-estado-icono"
                  aria-hidden="true"
                >
                  ◇
                </div>

                <p>
                  NO HAY CONVOCATORIAS
                  DISPONIBLES
                </p>

                <small>
                  No hay convocatorias
                  publicadas para mostrar en
                  este momento. Las que ya
                  finalizaron se conservan en
                  el sistema, pero no se
                  muestran aquí.
                </small>
              </section>
            )}

          {estado === "listo" &&
            disponibles.length > 0 &&
            filtradas.length === 0 && (
              <section
                className="conv-estado"
                role="status"
              >
                <div
                  className="conv-estado-icono"
                  aria-hidden="true"
                >
                  ⌕
                </div>

                <p>
                  SIN RESULTADOS
                </p>

                <small>
                  Prueba otro nombre o cambia
                  el tipo de beca seleccionado.
                </small>

                <button
                  type="button"
                  onClick={limpiarFiltros}
                >
                  LIMPIAR FILTROS
                </button>
              </section>
            )}

          {estado === "listo" &&
            filtradas.length > 0 && (
              <>
                <div
                  className="conv-resultados-info"
                  role="status"
                >
                  <span>
                    MOSTRANDO{" "}
                    {filtradas.length} DE{" "}
                    {disponibles.length}
                  </span>

                  <span>
                    CONSULTA COMPLETADA{" "}
                    <i aria-hidden="true" />
                  </span>
                </div>

                <section
                  className="conv-listado"
                  aria-label="Resultados de convocatorias"
                >
                  {filtradas.map(
                    (
                      {
                        datos,
                        tipo,
                        vigencia,
                      },
                      indice
                    ) => (
                      <article
                        className="conv-card"
                        key={datos.id}
                        aria-labelledby={`conv-titulo-${datos.id}`}
                        style={{
                          "--card-index":
                            Math.min(
                              indice,
                              5
                            ),
                        }}
                      >
                        <div
                          className="conv-card-linea"
                          aria-hidden="true"
                        />

                        <div className="conv-card-superior">
                          <div className="conv-tipo">
                            <span
                              aria-hidden="true"
                            >
                              <b
                                style={{
                                  transform:
                                    "rotate(-45deg)",
                                  fontWeight:
                                    "inherit",
                                }}
                              >
                                {
                                  tipo.codigo
                                }
                              </b>
                            </span>

                            {
                              tipo.etiqueta
                            }
                          </div>

                          <span
                            className={claseVigencia(
                              vigencia
                            )}
                          >
                            <i
                              aria-hidden="true"
                            />
                            {
                              vigencia.texto
                            }
                          </span>
                        </div>

                        <div className="conv-card-cuerpo">
                          <small>
                            CONVOCATORIA #
                            {String(
                              datos.id
                            ).padStart(
                              3,
                              "0"
                            )}
                          </small>

                          <h2
                            id={`conv-titulo-${datos.id}`}
                          >
                            {
                              datos.nombre
                            }
                          </h2>

                          <p>
                            {datos.requisitos?.trim() ||
                              "Requisitos pendientes de publicación."}
                          </p>
                        </div>

                        <div className="conv-fechas">
                          <div>
                            <small>
                              APERTURA
                            </small>

                            <strong>
                              {formatearFecha(
                                datos.fechaApertura
                              )}
                            </strong>
                          </div>

                          <span
                            aria-hidden="true"
                          />

                          <div>
                            <small>
                              CIERRE
                            </small>

                            <strong>
                              {formatearFecha(
                                datos.fechaCierre
                              )}
                            </strong>
                          </div>
                        </div>

                        <div className="conv-card-footer">
                          <div className="conv-tiempo">
                            {vigencia.cantidad !==
                              null && (
                              <strong>
                                {
                                  vigencia.cantidad
                                }
                              </strong>
                            )}

                            <span>
                              {
                                vigencia.plazo
                              }
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(
                              event
                            ) =>
                              abrirDetalle(
                                datos,
                                event
                              )
                            }
                            aria-haspopup="dialog"
                            aria-label={`Ver detalles de ${datos.nombre}`}
                          >
                            VER DETALLES{" "}
                            <span
                              aria-hidden="true"
                            >
                              →
                            </span>
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </section>
              </>
            )}
        </section>
      </div>

      {seleccionada &&
        vigenciaDetalle &&
        tipoDetalle && (
          <div
            className="conv-modal-fondo"
            role="presentation"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setSeleccionada(
                  null
                );
              }
            }}
          >
            <section
              ref={modalRef}
              className="conv-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="conv-modal-titulo"
            >
              <button
                type="button"
                className="conv-modal-cerrar"
                onClick={() =>
                  setSeleccionada(
                    null
                  )
                }
                aria-label="Cerrar detalle"
              >
                ×
              </button>

              <div className="conv-modal-codigo">
                EXPEDIENTE DE CONVOCATORIA
              </div>

              <div className="conv-modal-identidad">
                <span
                  aria-hidden="true"
                >
                  <b
                    style={{
                      transform:
                        "rotate(-45deg)",
                      fontWeight:
                        "inherit",
                    }}
                  >
                    {
                      tipoDetalle.codigo
                    }
                  </b>
                </span>

                <div>
                  <small>
                    {
                      tipoDetalle.etiqueta
                    }
                  </small>

                  <strong>
                    ID #
                    {String(
                      seleccionada.id
                    ).padStart(
                      3,
                      "0"
                    )}
                  </strong>
                </div>
              </div>

              <h2
                id="conv-modal-titulo"
                tabIndex={-1}
              >
                {seleccionada.nombre}
              </h2>

              <div
                className="conv-modal-separador"
                aria-hidden="true"
              />

              {seleccionada.beneficio && (
                <div className="conv-modal-bloque">
                  <small>
                    BENEFICIO
                  </small>

                  <p>
                    {
                      seleccionada.beneficio
                    }
                  </p>
                </div>
              )}

              <div className="conv-modal-bloque">
                <small>
                  REQUISITOS
                </small>

                <p>
                  {seleccionada.requisitos?.trim() ||
                    "Requisitos pendientes de publicación."}
                </p>
              </div>

              <div className="conv-modal-fechas">
                <div>
                  <small>
                    FECHA DE APERTURA
                  </small>

                  <strong>
                    {formatearFecha(
                      seleccionada.fechaApertura
                    )}
                  </strong>
                </div>

                <div>
                  <small>
                    FECHA DE CIERRE
                  </small>

                  <strong>
                    {formatearFecha(
                      seleccionada.fechaCierre
                    )}
                  </strong>
                </div>

                <div>
                  <small>
                    VIGENCIA SEGÚN FECHAS
                  </small>

                  <span
                    className={claseVigencia(
                      vigenciaDetalle
                    )}
                  >
                    <i
                      aria-hidden="true"
                    />

                    {
                      vigenciaDetalle.texto
                    }
                  </span>
                </div>

                <div>
                  <small>
                    PLAZO
                  </small>

                  <strong>
                    {vigenciaDetalle.cantidad !==
                    null
                      ? `${vigenciaDetalle.cantidad} `
                      : ""}

                    {
                      vigenciaDetalle.plazo
                    }
                  </strong>
                </div>
              </div>

              <div className="conv-modal-footer">
                <div>
                  <span
                    className="conv-modal-status-dot"
                    aria-hidden="true"
                  />

                  <div>
                    <small>
                      ESTADO DE PUBLICACIÓN
                    </small>

                    <strong>
                      {
                        seleccionada.estado
                      }
                    </strong>
                  </div>
                </div>

                <div className="conv-modal-acciones">
                  <button
                    type="button"
                    onClick={() =>
                      setSeleccionada(
                        null
                      )
                    }
                  >
                    CERRAR DETALLE
                  </button>

                  {esEstudiante && (
                    <button
                      type="button"
                      className="conv-solicitar"
                      onClick={
                        irASolicitud
                      }
                      disabled={
                        vigenciaDetalle.codigo !==
                        "abierta"
                      }
                    >
                      {vigenciaDetalle.codigo ===
                      "abierta"
                        ? "SOLICITAR BECA →"
                        : vigenciaDetalle.codigo ===
                            "proxima"
                          ? "PRÓXIMAMENTE"
                          : "NO DISPONIBLE"}
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
    </main>
  );
}

export default Convocatorias;