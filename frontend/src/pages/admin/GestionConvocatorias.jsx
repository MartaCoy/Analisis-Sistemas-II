import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import TransitionLink from "../../components/TransitionLink.jsx";

import {
  listarAdministracion,
  consultarAdministracion,
  guardarAdministracion,
  cambiarEstadoAdministracion,
} from "../../services/adminConvocatoriaService.js";

import {
  TIPOS_BECA_ADMIN,
  ESTADOS_ADMIN,
  LIMITES_ADMIN,
  formularioDesde,
  mostrarFecha,
  normalizarBusqueda,
  validarFormulario,
} from "../../utils/convocatoriaAdminUtils.js";

import "../../styles/gestion-convocatorias.css";

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const FILTROS = [
  ["TODAS", "Todas"],
  ...Object.entries(ESTADOS_ADMIN),
];

const TITULOS = {
  crear: "Nueva convocatoria",
  editar: "Editar convocatoria",
  detalle: "Detalle de convocatoria",
  publicar: "Publicar convocatoria",
  cerrar: "Cerrar convocatoria",
};

const MENSAJES = {
  crear: "Borrador creado.",
  editar: "Cambios guardados.",
  publicar: "Convocatoria publicada.",
  cerrar: "Convocatoria cerrada.",
};

// Acciones disponibles en esta interfaz.
// Los permisos efectivos siguen dependiendo del backend.
const PERMITIDOS = {
  editar: ["BORRADOR", "PUBLICADA"],
  publicar: ["BORRADOR"],
  cerrar: ["PUBLICADA"],
};

const CAMPOS = [
  {
    name: "nombre",
    label: "Nombre de la convocatoria",
    required: true,
    wide: true,
    max: LIMITES_ADMIN.nombre,
    placeholder: "Ej. Programa de excelencia académica",
  },
  {
    name: "tipoBeca",
    label: "Tipo de beca",
    control: "select",
    required: true,
    wide: true,
  },
  {
    name: "fechaApertura",
    label: "Fecha de apertura",
    type: "date",
  },
  {
    name: "fechaCierre",
    label: "Fecha de cierre",
    type: "date",
  },
  {
    name: "beneficio",
    label: "Beneficio de la beca",
    control: "textarea",
    wide: true,
    max: LIMITES_ADMIN.beneficio,
    rows: 3,
    placeholder: "Describe la cobertura o el apoyo que ofrece esta beca.",
  },
  {
    name: "requisitos",
    label: "Requisitos",
    control: "textarea",
    wide: true,
    max: LIMITES_ADMIN.requisitos,
    rows: 5,
    placeholder: "Describe los requisitos. Puedes separarlos por líneas.",
  },
];

/* =========================================================
   ESTADO Y MENSAJES
   ========================================================= */

function Estado({ valor }) {
  const clase = Object.hasOwn(ESTADOS_ADMIN, valor)
    ? valor.toLowerCase()
    : "otro";

  return (
    <span className={`ga-badge ga-badge-${clase}`}>
      <i aria-hidden="true" />
      {ESTADOS_ADMIN[valor] || valor || "Sin estado"}
    </span>
  );
}

function MensajeError({ error }) {
  if (!error) {
    return null;
  }

  return (
    <div className="ga-notice ga-notice-error" role="alert">
      <strong>
        {error.message || "No fue posible completar la operación."}
      </strong>

      {error.resultadoIncierto && (
        <p>
          La operación pudo haberse aplicado. Cierra este panel y revisa
          el listado actualizado antes de repetirla. El envío no se
          reintentará automáticamente.
        </p>
      )}

      {(error.status === 401 || error.status === 403) && (
        <p>
          Comprueba tu sesión y los permisos de la cuenta. Un rechazo
          de acceso no confirma por sí solo que el token haya vencido.
        </p>
      )}
    </div>
  );
}

/* =========================================================
   CAMPO DEL FORMULARIO
   ========================================================= */

function CampoFormulario({
  campo,
  formulario,
  errores,
  onChange,
}) {
  const { name, label, required, max, wide } = campo;
  const id = `ga-${name}`;
  const error = errores[name];

  const descritoPor = [
    max ? `${id}-ayuda` : "",
    error ? `${id}-error` : "",
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const props = {
    id,
    name,
    value: formulario[name],
    onChange,
    required,
    "aria-invalid": Boolean(error),
    "aria-describedby": descritoPor,
  };

  return (
    <div className={`ga-field${wide ? " ga-field-wide" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>

      {campo.control === "select" ? (
        <select {...props}>
          <option value="">Selecciona un tipo</option>

          {Object.entries(TIPOS_BECA_ADMIN).map(([valor, texto]) => (
            <option key={valor} value={valor}>
              {texto}
            </option>
          ))}
        </select>
      ) : campo.control === "textarea" ? (
        <textarea
          {...props}
          rows={campo.rows}
          maxLength={max}
          placeholder={campo.placeholder}
        />
      ) : (
        <input
          {...props}
          type={campo.type || "text"}
          maxLength={max}
          placeholder={campo.placeholder}
        />
      )}

      {max && (
        <div className="ga-field-meta">
          <small id={`${id}-ayuda`}>
            Hasta {max} caracteres.
          </small>

          <span>
            {formulario[name].length}/{max}
          </span>
        </div>
      )}

      {error && (
        <small className="ga-field-error" id={`${id}-error`}>
          {error}
        </small>
      )}
    </div>
  );
}

/* =========================================================
   MODAL ADMINISTRATIVO
   ========================================================= */

function ModalConvocatoria({
  modo,
  id,
  onCerrar,
  onGuardado,
}) {
  const dialogoRef = useRef(null);
  const descarteRef = useRef(null);
  const peticionRef = useRef(null);
  const bloqueoRef = useRef(false);
  const activoRef = useRef(false);

  const [original, setOriginal] = useState(null);
  const [formulario, setFormulario] = useState(() => formularioDesde());

  // El estado inicial ya indica si debemos consultar el registro.
  const [cargando, setCargando] = useState(modo !== "crear");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [errores, setErrores] = useState({});
  const [descartar, setDescartar] = useState(false);
  const [intento, setIntento] = useState(0);

  const esFormulario = modo === "crear" || modo === "editar";

  const hayCambios =
    esFormulario &&
    JSON.stringify(formulario) !==
      JSON.stringify(formularioDesde(original));

  // Sincronizar la apertura y el cierre del dialogo con el navegador.
  useEffect(() => {
    activoRef.current = true;

    const dialogo = dialogoRef.current;
    const previo = document.activeElement;
    const overflow = document.body.style.overflow;

    if (!dialogo.open) {
      dialogo.showModal();
    }

    document.body.style.overflow = "hidden";

    dialogo.querySelector("h2")?.focus({
      preventScroll: true,
    });

    return () => {
      activoRef.current = false;
      peticionRef.current?.abort();

      if (dialogo.open) {
        dialogo.close();
      }

      document.body.style.overflow = overflow;

      if (previo?.isConnected) {
        previo.focus({ preventScroll: true });
      }
    };
  }, []);

  // Consultar el registro. Los cambios de estado ocurren al recibir
  // la respuesta, no de forma inmediata al comenzar el efecto.
  useEffect(() => {
    if (modo === "crear") {
      return undefined;
    }

    const controller = new AbortController();
    let vigente = true;

    consultarAdministracion(id, {
      signal: controller.signal,
    })
      .then((datos) => {
        if (!vigente) {
          return;
        }

        setOriginal(datos);
        setFormulario(formularioDesde(datos));
      })
      .catch((err) => {
        if (vigente && err.name !== "AbortError") {
          setError(err);
        }
      })
      .finally(() => {
        if (vigente) {
          setCargando(false);
        }
      });

    return () => {
      vigente = false;
      controller.abort();
    };
  }, [id, modo, intento]);

  useEffect(() => {
    if (descartar) {
      descarteRef.current?.focus();
    }
  }, [descartar]);

  // Avisar al recargar o cerrar la pestaña con cambios pendientes.
  useEffect(() => {
    if (!hayCambios && !guardando) {
      return undefined;
    }

    const avisar = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", avisar);

    return () => {
      window.removeEventListener("beforeunload", avisar);
    };
  }, [hayCambios, guardando]);

  const estadoNoPermitido = Boolean(
    original &&
      PERMITIDOS[modo] &&
      !PERMITIDOS[modo].includes(original.estado)
  );

  const respuestaBloqueante = Boolean(
    error &&
      (
        error.resultadoIncierto ||
        [401, 403, 404, 409].includes(error.status)
      )
  );

  const problemasPublicar =
    modo === "publicar" && original
      ? Object.entries(
          validarFormulario(formularioDesde(original), true)
        )
      : [];

  const bloquear =
    guardando ||
    cargando ||
    descartar ||
    respuestaBloqueante ||
    estadoNoPermitido ||
    (modo !== "crear" && !original) ||
    problemasPublicar.length > 0;

  // Reiniciar la carga desde el botón de reintento.
  const reintentarConsulta = () => {
    setCargando(true);
    setError(null);
    setOriginal(null);
    setIntento((n) => n + 1);
  };

  const pedirCerrar = () => {
    if (bloqueoRef.current) {
      return;
    }

    if (hayCambios && !error?.resultadoIncierto) {
      setDescartar(true);
    } else {
      onCerrar(Boolean(error?.resultadoIncierto));
    }
  };

  const actualizar = (event) => {
    const { name, value } = event.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));

    setErrores((actual) => ({
      ...actual,
      [name]: undefined,
    }));
  };

  const enviar = async (event) => {
    event.preventDefault();

    if (bloqueoRef.current || bloquear || modo === "detalle") {
      return;
    }

    const fallos = esFormulario
      ? validarFormulario(formulario)
      : modo === "publicar"
        ? validarFormulario(formularioDesde(original), true)
        : {};

    if (Object.keys(fallos).length) {
      setErrores(fallos);
      setError(new Error(Object.values(fallos)[0]));

      dialogoRef.current
        .querySelector(`[name="${Object.keys(fallos)[0]}"]`)
        ?.focus();

      return;
    }

    bloqueoRef.current = true;
    setGuardando(true);
    setError(null);

    const controller = new AbortController();
    peticionRef.current = controller;

    try {
      const resultado = esFormulario
        ? await guardarAdministracion(formulario, {
            id: modo === "editar" ? id : null,
            signal: controller.signal,
          })
        : await cambiarEstadoAdministracion(id, modo, {
            signal: controller.signal,
          });

      if (activoRef.current) {
        onGuardado(resultado, MENSAJES[modo]);
      }
    } catch (err) {
      if (activoRef.current && err.name !== "AbortError") {
        setError(err);

        if (err.erroresCampos) {
          setErrores(err.erroresCampos);
        }
      }
    } finally {
      bloqueoRef.current = false;

      if (activoRef.current) {
        setGuardando(false);
      }
    }
  };

  return (
    <dialog
      ref={dialogoRef}
      className="ga-dialog"
      aria-labelledby="ga-modal-title"
      aria-busy={cargando || guardando}
      onCancel={(event) => {
        event.preventDefault();
        pedirCerrar();
      }}
    >
      <div className="ga-dialog-head">
        <div>
          <p className="ga-eyebrow">
            CONTROL ADMINISTRATIVO
          </p>

          <h2 id="ga-modal-title" tabIndex={-1}>
            {TITULOS[modo]}
          </h2>
        </div>

        <button
          className="ga-icon-button"
          type="button"
          onClick={pedirCerrar}
          disabled={guardando}
          aria-label="Cerrar panel"
        >
          ×
        </button>
      </div>

      {descartar && (
        <div className="ga-notice ga-notice-warning" role="alert">
          <strong>Hay cambios sin guardar.</strong>

          <p>
            Descartarlos no modifica la información que ya existe
            en el servidor.
          </p>

          <div className="ga-actions">
            <button
              ref={descarteRef}
              type="button"
              className="ga-button"
              onClick={() => {
                setDescartar(false);
                dialogoRef.current.querySelector("h2")?.focus();
              }}
            >
              Seguir editando
            </button>

            <button
              type="button"
              className="ga-button ga-button-danger"
              onClick={() => onCerrar(false)}
            >
              Descartar cambios
            </button>
          </div>
        </div>
      )}

      <MensajeError error={error} />

      {cargando && (
        <div className="ga-loading" role="status">
          <span className="ga-spinner" aria-hidden="true" />
          Consultando la convocatoria...
        </div>
      )}

      {!cargando &&
        modo !== "crear" &&
        !original &&
        !error?.resultadoIncierto && (
          <button
            type="button"
            className="ga-button"
            onClick={reintentarConsulta}
          >
            Reintentar consulta
          </button>
        )}

      {estadoNoPermitido && (
        <div className="ga-notice ga-notice-warning" role="alert">
          El estado actual no permite esta acción desde este panel.
          Cierra y actualiza el listado.
        </div>
      )}

      {!cargando &&
        (modo === "crear" || original) &&
        (
          esFormulario ? (
            <form onSubmit={enviar} noValidate>
              <p className="ga-help">
                Nombre y tipo son obligatorios. El beneficio describe
                el apoyo ofrecido; no tiene que ser un monto o porcentaje.
                {modo === "crear"
                  ? " Se guardará como borrador: publicar es una acción independiente."
                  : " Guardar conserva el estado de publicación."}
              </p>

              {original?.estado === "PUBLICADA" && (
                <div className="ga-notice ga-notice-warning">
                  Estás editando una convocatoria publicada.
                  Revisa los cambios antes de guardarlos.
                </div>
              )}

              <fieldset
                className="ga-fields"
                disabled={
                  guardando ||
                  descartar ||
                  estadoNoPermitido ||
                  respuestaBloqueante
                }
              >
                <legend className="ga-sr-only">
                  Datos de la convocatoria
                </legend>

                {CAMPOS.map((campo) => (
                  <CampoFormulario
                    key={campo.name}
                    campo={campo}
                    formulario={formulario}
                    errores={errores}
                    onChange={actualizar}
                  />
                ))}
              </fieldset>

              {original && (
                <section className="ga-requisitos ga-readonly">
                  <h4>
                    Documentos requeridos · solo lectura
                  </h4>

                  <p>
                    {String(original.documentosRequeridos ?? "").trim() ||
                      "No definidos en el registro."}
                  </p>

                  <small>
                    Este formulario no cambia la configuración
                    de documentos.
                  </small>
                </section>
              )}

              <div className="ga-dialog-foot">
                <button
                  type="button"
                  className="ga-button"
                  onClick={pedirCerrar}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="ga-button ga-button-primary"
                  disabled={
                    Boolean(bloquear) ||
                    (modo === "editar" && !hayCambios)
                  }
                >
                  {guardando
                    ? "Guardando..."
                    : modo === "crear"
                      ? "Guardar borrador"
                      : "Guardar cambios"}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div className="ga-detail-top">
                <Estado valor={original.estado} />

                <span className="ga-code">
                  ID #{original.id}
                </span>
              </div>

              <h3 className="ga-detail-title">
                {original.nombre}
              </h3>

              <dl className="ga-detail-grid">
                <div>
                  <dt>Tipo de beca</dt>
                  <dd>
                    {TIPOS_BECA_ADMIN[original.tipoBeca] ||
                      original.tipoBeca}
                  </dd>
                </div>

                <div>
                  <dt>Publicación</dt>
                  <dd>
                    {ESTADOS_ADMIN[original.estado] ||
                      original.estado}
                  </dd>
                </div>

                <div>
                  <dt>Apertura</dt>
                  <dd>{mostrarFecha(original.fechaApertura)}</dd>
                </div>

                <div>
                  <dt>Cierre</dt>
                  <dd>{mostrarFecha(original.fechaCierre)}</dd>
                </div>
              </dl>

              <section className="ga-requisitos ga-beneficio">
                <h4>Beneficio de la beca</h4>

                <p>
                  {String(original.beneficio ?? "").trim() ||
                    "Beneficio pendiente de definir."}
                </p>
              </section>

              <section className="ga-requisitos">
                <h4>Requisitos</h4>

                <p>
                  {String(original.requisitos ?? "").trim() ||
                    "Requisitos pendientes de definir."}
                </p>
              </section>

              <section className="ga-requisitos ga-readonly">
                <h4>
                  Documentos requeridos · solo lectura
                </h4>

                <p>
                  {String(original.documentosRequeridos ?? "").trim() ||
                    "No definidos en el registro."}
                </p>
              </section>

              {modo === "publicar" && (
                <div className="ga-notice ga-notice-warning">
                  <strong>Confirmar publicación</strong>

                  <p>
                    Pasará de borrador a publicada. Una apertura futura
                    se mostrará como próxima en el listado estudiantil.
                  </p>
                </div>
              )}

              {modo === "cerrar" && (
                <div className="ga-notice ga-notice-warning">
                  <strong>Confirmar cierre</strong>

                  <p>
                    Dejará de aparecer en el listado estudiantil.
                    El registro se conservará. Esta acción no envía
                    cambios a las solicitudes.
                  </p>
                </div>
              )}

              {problemasPublicar.length > 0 && (
                <div className="ga-notice ga-notice-error" role="alert">
                  <strong>
                    Antes de publicar, edita estos datos:
                  </strong>

                  <ul>
                    {problemasPublicar.map(([campo, texto]) => (
                      <li key={campo}>{texto}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="ga-dialog-foot">
                <button
                  type="button"
                  className="ga-button"
                  onClick={pedirCerrar}
                  disabled={guardando}
                >
                  {modo === "detalle"
                    ? "Cerrar detalle"
                    : "Cancelar"}
                </button>

                {modo !== "detalle" && (
                  <button
                    type="button"
                    onClick={enviar}
                    disabled={Boolean(bloquear)}
                    className={`ga-button ${
                      modo === "cerrar"
                        ? "ga-button-danger"
                        : "ga-button-primary"
                    }`}
                  >
                    {guardando
                      ? "Procesando..."
                      : modo === "publicar"
                        ? "Confirmar publicación"
                        : "Confirmar cierre"}
                  </button>
                )}
              </div>
            </div>
          )
        )}

      {guardando && (
        <p className="ga-help" role="status">
          Esperando confirmación del servidor.
          No repitas la operación.
        </p>
      )}
    </dialog>
  );
}

/* =========================================================
   PANTALLA PRINCIPAL
   ========================================================= */

export default function GestionConvocatorias() {
  const [registros, setRegistros] = useState([]);

  // La primera consulta comienza con la pantalla en estado de carga.
  const [estado, setEstado] = useState("cargando");

  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [revision, setRevision] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("TODAS");
  const [modal, setModal] = useState(null);

  const avisoRef = useRef(null);

  // El efecto solo consulta y procesa la respuesta del servidor.
  useEffect(() => {
    const controller = new AbortController();
    let activo = true;

    listarAdministracion({
      signal: controller.signal,
    })
      .then((datos) => {
        if (activo) {
          setRegistros(datos);
          setEstado("listo");
        }
      })
      .catch((err) => {
        if (activo && err.name !== "AbortError") {
          setError(err);
          setEstado("error");
        }
      });

    return () => {
      activo = false;
      controller.abort();
    };
  }, [revision]);

  useEffect(() => {
    if (aviso) {
      avisoRef.current?.focus({
        preventScroll: true,
      });
    }
  }, [aviso]);

  const filtradas = useMemo(() => {
    const texto = normalizarBusqueda(busqueda);

    return registros
      .filter((c) => {
        const coincideEstado =
          filtro === "TODAS" || c.estado === filtro;

        const contenido = normalizarBusqueda(
          `${c.nombre} ${c.beneficio ?? ""} ${c.requisitos ?? ""} ${
            TIPOS_BECA_ADMIN[c.tipoBeca] || c.tipoBeca
          }`
        );

        return coincideEstado && contenido.includes(texto);
      })
      .sort((a, b) =>
        String(b.id).localeCompare(
          String(a.id),
          "en",
          { numeric: true }
        )
      );
  }, [registros, busqueda, filtro]);

  // Se llama desde los botones o después de una operación.
  // Aquí sí reiniciamos la carga y limpiamos el error anterior.
  const actualizarListado = () => {
    setEstado("cargando");
    setError(null);
    setRevision((n) => n + 1);
  };

  const abrir = (modo, id = null) => {
    setAviso(null);
    setModal({ modo, id });
  };

  const cerrar = (revisar = false) => {
    setModal(null);

    if (revisar) {
      setAviso({
        tipo: "warning",
        texto:
          "Se perdió la confirmación de la operación. Revisa el listado antes de repetirla.",
      });

      actualizarListado();
    }
  };

  const guardado = (datos, mensaje) => {
    setModal(null);

    setAviso({
      tipo: "success",
      texto: `${mensaje} ${datos.nombre}`,
    });

    actualizarListado();
  };

  return (
    <main className="ga-page">
      <header className="ga-header">
        <div className="ga-brand">
          <span aria-hidden="true" />

          <div>
            <small>SISTEMA NACIONAL DE BECAS</small>
            <strong>ADMINISTRACIÓN</strong>
          </div>
        </div>

        <TransitionLink
          to="/dashboard"
          className="ga-back"
        >
          ← Volver al panel
        </TransitionLink>
      </header>

      <div className="ga-shell">
        <section
          className="ga-hero"
          aria-labelledby="ga-title"
        >
          <div>
            <p className="ga-eyebrow">
              CONTROL DE OPORTUNIDADES
            </p>

            <h1 id="ga-title">
              Gestión de
              <strong> convocatorias</strong>
            </h1>

            <p className="ga-lead">
              Define beneficios y requisitos, prepara borradores
              y controla la publicación de cada oportunidad.
            </p>
          </div>

          <button
            type="button"
            className="ga-button ga-button-primary ga-new"
            disabled={estado !== "listo"}
            onClick={() => abrir("crear")}
          >
            Nueva convocatoria
            <span aria-hidden="true">+</span>
          </button>
        </section>

        <section
          className="ga-stats"
          aria-label="Resumen por estado de publicación"
        >
          {FILTROS.map(([clave, etiqueta]) => (
            <div
              key={clave}
              className={`ga-stat ga-stat-${clave.toLowerCase()}`}
            >
              <small>
                {clave === "TODAS" ? "Total" : etiqueta}
              </small>

              <strong>
                {estado === "listo"
                  ? String(
                      clave === "TODAS"
                        ? registros.length
                        : registros.filter(
                            (c) => c.estado === clave
                          ).length
                    ).padStart(2, "0")
                  : "—"}
              </strong>

              <span>
                {clave === "TODAS"
                  ? "REGISTROS CONSULTADOS"
                  : "ESTADO DE PUBLICACIÓN"}
              </span>
            </div>
          ))}
        </section>

        {aviso && (
          <div
            ref={avisoRef}
            tabIndex={-1}
            className={`ga-notice ga-notice-${aviso.tipo}`}
            role="status"
          >
            {aviso.texto}
          </div>
        )}

        <div className="ga-toolbar">
          <div className="ga-search">
            <label htmlFor="ga-search">
              Buscar convocatorias
            </label>

            <input
              id="ga-search"
              type="search"
              placeholder="Nombre, beneficio, requisitos o tipo..."
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
            />
          </div>

          <div
            className="ga-filters"
            role="group"
            aria-label="Filtrar por publicación"
          >
            {FILTROS.map(([clave, texto]) => (
              <button
                key={clave}
                type="button"
                aria-pressed={filtro === clave}
                className={
                  filtro === clave ? "activo" : ""
                }
                onClick={() => setFiltro(clave)}
              >
                {texto}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="ga-button"
            disabled={estado === "cargando"}
            onClick={actualizarListado}
          >
            Actualizar
          </button>
        </div>

        <MensajeError error={error} />

        {estado === "cargando" && (
          <div className="ga-empty" role="status">
            <span
              className="ga-spinner"
              aria-hidden="true"
            />

            <h2>Consultando convocatorias</h2>

            <p>
              Recuperando la información del servidor.
            </p>
          </div>
        )}

        {estado === "error" && (
          <div className="ga-empty">
            <h2>No se pudo cargar el listado</h2>

            <p>
              Verifica la conexión y los permisos de tu cuenta.
            </p>

            <button
              type="button"
              className="ga-button"
              onClick={actualizarListado}
            >
              Reintentar
            </button>

            {(error?.status === 401 ||
              error?.status === 403) && (
              <TransitionLink
                to="/login"
                className="ga-back"
              >
                Ir a iniciar sesión
              </TransitionLink>
            )}
          </div>
        )}

        {estado === "listo" &&
          filtradas.length === 0 && (
            <div className="ga-empty" role="status">
              <span
                className="ga-empty-symbol"
                aria-hidden="true"
              >
                ◇
              </span>

              <h2>
                {registros.length
                  ? "Sin coincidencias"
                  : "Comienza con un borrador"}
              </h2>

              <p>
                {registros.length
                  ? "Prueba otra búsqueda o cambia el estado seleccionado."
                  : "Todavía no hay convocatorias en esta base de datos."}
              </p>

              {registros.length > 0 && (
                <button
                  type="button"
                  className="ga-button"
                  onClick={() => {
                    setBusqueda("");
                    setFiltro("TODAS");
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

        {estado === "listo" &&
          filtradas.length > 0 && (
            <section aria-label="Listado administrativo">
              <p className="ga-results" role="status">
                MOSTRANDO {filtradas.length} DE{" "}
                {registros.length} REGISTROS
              </p>

              <div className="ga-table-wrap">
                <table className="ga-table">
                  <caption className="ga-sr-only">
                    Convocatorias con acciones administrativas
                  </caption>

                  <thead>
                    <tr>
                      <th scope="col">Convocatoria</th>
                      <th scope="col">Período</th>
                      <th scope="col">Publicación</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtradas.map((c) => (
                      <tr key={c.id}>
                        <th scope="row">
                          <span className="ga-code">
                            #{String(c.id).padStart(3, "0")} /{" "}
                            {TIPOS_BECA_ADMIN[c.tipoBeca] ||
                              c.tipoBeca}
                          </span>

                          <strong>{c.nombre}</strong>

                          <p className="ga-benefit-preview">
                            {String(c.beneficio ?? "").trim() ||
                              "Beneficio por definir"}
                          </p>
                        </th>

                        <td data-label="Período">
                          <div className="ga-dates">
                            <span>
                              Apertura
                              <b>
                                {mostrarFecha(c.fechaApertura)}
                              </b>
                            </span>

                            <span>
                              Cierre
                              <b>
                                {mostrarFecha(c.fechaCierre)}
                              </b>
                            </span>
                          </div>
                        </td>

                        <td data-label="Publicación">
                          <Estado valor={c.estado} />
                        </td>

                        <td data-label="Acciones">
                          <div className="ga-row-actions">
                            <button
                              type="button"
                              onClick={() =>
                                abrir("detalle", c.id)
                              }
                              aria-haspopup="dialog"
                              aria-label={`Ver detalle de ${c.nombre}`}
                            >
                              Detalle
                            </button>

                            {PERMITIDOS.editar.includes(
                              c.estado
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  abrir("editar", c.id)
                                }
                                aria-haspopup="dialog"
                                aria-label={`Editar ${c.nombre}`}
                              >
                                Editar
                              </button>
                            )}

                            {c.estado === "BORRADOR" && (
                              <button
                                type="button"
                                className="ga-row-publish"
                                onClick={() =>
                                  abrir("publicar", c.id)
                                }
                                aria-haspopup="dialog"
                                aria-label={`Publicar ${c.nombre}`}
                              >
                                Publicar
                              </button>
                            )}

                            {c.estado === "PUBLICADA" && (
                              <button
                                type="button"
                                className="ga-row-close"
                                onClick={() =>
                                  abrir("cerrar", c.id)
                                }
                                aria-haspopup="dialog"
                                aria-label={`Cerrar ${c.nombre}`}
                              >
                                Cerrar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

        <footer className="ga-footer">
          <span>
            PUBLICACIÓN Y VIGENCIA SON DATOS DISTINTOS.
          </span>

          <span>
            LOS CAMBIOS SE CONFIRMAN CON EL SERVIDOR.
          </span>
        </footer>
      </div>

      {modal && (
        <ModalConvocatoria
          key={`${modal.modo}-${modal.id ?? "nueva"}`}
          {...modal}
          onCerrar={cerrar}
          onGuardado={guardado}
        />
      )}
    </main>
  );
}