import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useParams } from "react-router-dom";

import TransitionLink from "../components/TransitionLink.jsx";

import {
  obtenerConvocatoria,
} from "../services/convocatoriaService.js";

import {
  crearSolicitud,
  listarDocumentos,
  listarMisSolicitudes,
  subirDocumento,
} from "../services/solicitudService.js";

import {
  obtenerSesion,
} from "../services/authService.js";

import "../styles/solicitud-beca.css";

const DIA_MS = 24 * 60 * 60 * 1000;

const TIPOS_BECA = {
  ACADEMICA: "Académica",
  DEPORTIVA: "Deportiva",
  SOCIOECONOMICA: "Socioeconómica",
};

function leerDia(fecha) {
  if (
    typeof fecha !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    return null;
  }

  const valor = new Date(
    `${fecha}T00:00:00.000Z`
  );

  if (
    Number.isNaN(valor.getTime()) ||
    valor.toISOString().slice(0, 10) !== fecha
  ) {
    return null;
  }

  return Math.floor(
    valor.getTime() / DIA_MS
  );
}

function hoyGuatemala() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "America/Guatemala",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(new Date());

  const valor = (tipo) =>
    partes.find(
      (parte) => parte.type === tipo
    )?.value;

  return leerDia(
    `${valor("year")}-${valor("month")}-${valor("day")}`
  );
}

function formatearFecha(fecha) {
  const dia = leerDia(fecha);

  if (dia === null) {
    return "Por confirmar";
  }

  return new Intl.DateTimeFormat(
    "es-GT",
    {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(dia * DIA_MS)
  );
}

function formatearFechaHora(valor) {
  if (!valor) {
    return "Sin fecha";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-GT",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(fecha);
}

function obtenerVigencia(convocatoria) {
  if (!convocatoria) {
    return {
      codigo: "pendiente",
      texto: "Sin información",
    };
  }

  const apertura =
    leerDia(convocatoria.fechaApertura);

  const cierre =
    leerDia(convocatoria.fechaCierre);

  const hoy = hoyGuatemala();

  if (
    convocatoria.estado !== "PUBLICADA"
  ) {
    return {
      codigo: "cerrada",
      texto: "No disponible",
    };
  }

  if (
    apertura === null ||
    cierre === null ||
    hoy === null
  ) {
    return {
      codigo: "pendiente",
      texto: "Fechas por confirmar",
    };
  }

  if (hoy < apertura) {
    return {
      codigo: "proxima",
      texto: "Próximamente",
    };
  }

  if (hoy > cierre) {
    return {
      codigo: "cerrada",
      texto: "Periodo finalizado",
    };
  }

  return {
    codigo: "abierta",
    texto: "Convocatoria abierta",
  };
}

function SolicitudBeca() {
  const { id } = useParams();

  const sesion = obtenerSesion();

  const archivoRef = useRef(null);

  const [estadoCarga, setEstadoCarga] =
    useState("cargando");

  const [
    convocatoria,
    setConvocatoria,
  ] = useState(null);

  const [
    solicitud,
    setSolicitud,
  ] = useState(null);

  const [
    documentos,
    setDocumentos,
  ] = useState([]);

  const [
    errorCarga,
    setErrorCarga,
  ] = useState("");

  const [
    errorAccion,
    setErrorAccion,
  ] = useState("");

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    tipoDocumento,
    setTipoDocumento,
  ] = useState("");

  const [
    archivo,
    setArchivo,
  ] = useState(null);

  const [
    creando,
    setCreando,
  ] = useState(false);

  const [
    subiendo,
    setSubiendo,
  ] = useState(false);

  useEffect(() => {
    const controller =
      new AbortController();

    let activo = true;

    async function cargar() {
      try {
        const [
          datosConvocatoria,
          solicitudes,
        ] = await Promise.all([
          obtenerConvocatoria(
            id,
            {
              signal:
                controller.signal,
            }
          ),

          listarMisSolicitudes({
            signal:
              controller.signal,
          }),
        ]);

        if (!activo) {
          return;
        }

        if (!datosConvocatoria) {
          setErrorCarga(
            "La convocatoria solicitada no existe."
          );

          setEstadoCarga("error");
          return;
        }

        const existente =
          solicitudes.find(
            (item) =>
              String(
                item.convocatoriaId
              ) === String(id)
          ) || null;

        let archivosExistentes = [];

        if (existente) {
          archivosExistentes =
            await listarDocumentos(
              existente.id,
              {
                signal:
                  controller.signal,
              }
            );
        }

        if (!activo) {
          return;
        }

        setConvocatoria(
          datosConvocatoria
        );

        setSolicitud(existente);

        setDocumentos(
          archivosExistentes
        );

        setEstadoCarga("listo");
      } catch (error) {
        if (
          !activo ||
          error.name === "AbortError"
        ) {
          return;
        }

        setErrorCarga(
          error.message ||
            "No fue posible cargar la información."
        );

        setEstadoCarga("error");
      }
    }

    cargar();

    return () => {
      activo = false;
      controller.abort();
    };
  }, [id]);

  const vigencia = useMemo(
    () =>
      obtenerVigencia(
        convocatoria
      ),
    [convocatoria]
  );

  const puedeSolicitar =
    vigencia.codigo === "abierta";

  const manejarCrearSolicitud =
    async () => {
      if (
        creando ||
        solicitud
      ) {
        return;
      }

      if (!puedeSolicitar) {
        setErrorAccion(
          "La convocatoria todavía no está disponible para recibir solicitudes."
        );

        return;
      }

      setCreando(true);
      setErrorAccion("");
      setMensaje("");

      try {
        const nuevaSolicitud =
          await crearSolicitud(
            convocatoria.id
          );

        setSolicitud(
          nuevaSolicitud
        );

        setDocumentos([]);

        setMensaje(
          `Solicitud #${nuevaSolicitud.id} creada correctamente. Ahora puedes adjuntar tus documentos.`
        );
      } catch (error) {
        setErrorAccion(
          error.message ||
            "No fue posible crear la solicitud."
        );
      } finally {
        setCreando(false);
      }
    };

  const manejarSubirDocumento =
    async (event) => {
      event.preventDefault();

      if (
        subiendo ||
        !solicitud
      ) {
        return;
      }

      if (!tipoDocumento.trim()) {
        setErrorAccion(
          "Escribe el tipo de documento."
        );

        return;
      }

      if (!archivo) {
        setErrorAccion(
          "Selecciona un archivo."
        );

        return;
      }

      setSubiendo(true);
      setErrorAccion("");
      setMensaje("");

      try {
        const documento =
          await subirDocumento(
            solicitud.id,
            archivo,
            tipoDocumento
          );

        setDocumentos(
          (actuales) => [
            ...actuales,
            documento,
          ]
        );

        setTipoDocumento("");
        setArchivo(null);

        if (archivoRef.current) {
          archivoRef.current.value = "";
        }

        setMensaje(
          "Documento cargado correctamente."
        );
      } catch (error) {
        setErrorAccion(
          error.message ||
            "No fue posible cargar el documento."
        );
      } finally {
        setSubiendo(false);
      }
    };

  if (
    estadoCarga === "cargando"
  ) {
    return (
      <main className="solb-page">
        <div
          className="solb-grid"
          aria-hidden="true"
        />

        <section
          className="solb-estado"
          role="status"
        >
          <div
            className="solb-loader"
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </div>

          <strong>
            PREPARANDO EXPEDIENTE
          </strong>

          <p>
            Consultando la convocatoria y
            tus solicitudes.
          </p>
        </section>
      </main>
    );
  }

  if (
    estadoCarga === "error"
  ) {
    return (
      <main className="solb-page">
        <div
          className="solb-grid"
          aria-hidden="true"
        />

        <section
          className="solb-estado solb-error"
          role="alert"
        >
          <span
            className="solb-error-icono"
            aria-hidden="true"
          >
            !
          </span>

          <strong>
            NO FUE POSIBLE ABRIR EL EXPEDIENTE
          </strong>

          <p>
            {errorCarga}
          </p>

          <TransitionLink
            to="/convocatorias"
            className="solb-link"
          >
            ← VOLVER A CONVOCATORIAS
          </TransitionLink>
        </section>
      </main>
    );
  }

  return (
    <main className="solb-page">
      <div
        className="solb-grid"
        aria-hidden="true"
      />

      <div
        className="solb-orbe solb-orbe-uno"
        aria-hidden="true"
      />

      <div
        className="solb-orbe solb-orbe-dos"
        aria-hidden="true"
      />

      <header className="solb-header">
        <div className="solb-marca">
          <span
            className="solb-pulso"
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
          to="/convocatorias"
          className="solb-volver"
        >
          ← VOLVER A CONVOCATORIAS
        </TransitionLink>
      </header>

      <section className="solb-shell">
        <div className="solb-intro">
          <div>
            <p className="solb-kicker">
              NODO 03 · POSTULACIÓN
            </p>

            <h1>
              Expediente de
              <strong>
                {" "}solicitud
              </strong>
            </h1>

            <p className="solb-descripcion">
              Revisa la convocatoria antes
              de registrar tu solicitud y
              adjunta la documentación
              correspondiente.
            </p>
          </div>

          <div className="solb-identidad">
            <small>
              SOLICITANTE
            </small>

            <strong>
              {sesion?.nombreCompleto ||
                "Estudiante"}
            </strong>

            <span>
              {sesion?.correo ||
                "Sin correo"}
            </span>
          </div>
        </div>

        <div className="solb-layout">
          <section className="solb-convocatoria">
            <div className="solb-panel-top">
              <div>
                <small>
                  CONVOCATORIA
                </small>

                <strong>
                  #
                  {String(
                    convocatoria.id
                  ).padStart(
                    3,
                    "0"
                  )}
                </strong>
              </div>

              <span
                className={`solb-vigencia solb-vigencia-${vigencia.codigo}`}
              >
                {vigencia.texto}
              </span>
            </div>

            <p className="solb-tipo">
              {TIPOS_BECA[
                convocatoria.tipoBeca
              ] ||
                convocatoria.tipoBeca}
            </p>

            <h2>
              {convocatoria.nombre}
            </h2>

            <div className="solb-separador" />

            <div className="solb-bloque">
              <small>
                BENEFICIO
              </small>

              <p>
                {convocatoria.beneficio?.trim() ||
                  "Beneficio pendiente de publicación."}
              </p>
            </div>

            <div className="solb-bloque">
              <small>
                REQUISITOS
              </small>

              <p>
                {convocatoria.requisitos?.trim() ||
                  "Requisitos pendientes de publicación."}
              </p>
            </div>

            <div className="solb-fechas">
              <div>
                <small>
                  APERTURA
                </small>

                <strong>
                  {formatearFecha(
                    convocatoria.fechaApertura
                  )}
                </strong>
              </div>

              <div>
                <small>
                  CIERRE
                </small>

                <strong>
                  {formatearFecha(
                    convocatoria.fechaCierre
                  )}
                </strong>
              </div>
            </div>
          </section>

          <section className="solb-operacion">
            {!solicitud ? (
              <>
                <div className="solb-paso">
                  <span>
                    01
                  </span>

                  <div>
                    <small>
                      REGISTRO
                    </small>

                    <strong>
                      Crear solicitud
                    </strong>
                  </div>
                </div>

                <p className="solb-operacion-texto">
                  Al continuar se
                  registrará una solicitud
                  asociada a esta
                  convocatoria y a tu
                  cuenta actual.
                </p>

                {!puedeSolicitar && (
                  <div
                    className="solb-aviso"
                    role="status"
                  >
                    Esta convocatoria no
                    está abierta en este
                    momento. Podrás
                    postularte cuando
                    corresponda según sus
                    fechas.
                  </div>
                )}

                <button
                  type="button"
                  className="solb-principal"
                  onClick={
                    manejarCrearSolicitud
                  }
                  disabled={
                    creando ||
                    !puedeSolicitar
                  }
                >
                  {creando
                    ? "REGISTRANDO..."
                    : "CREAR SOLICITUD"}

                  {!creando && (
                    <span
                      aria-hidden="true"
                    >
                      →
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <div className="solb-paso">
                  <span>
                    02
                  </span>

                  <div>
                    <small>
                      DOCUMENTACIÓN
                    </small>

                    <strong>
                      Cargar archivos
                    </strong>
                  </div>
                </div>

                <div className="solb-solicitud-meta">
                  <div>
                    <small>
                      SOLICITUD
                    </small>

                    <strong>
                      #
                      {String(
                        solicitud.id
                      ).padStart(
                        4,
                        "0"
                      )}
                    </strong>
                  </div>

                  <div>
                    <small>
                      ESTADO
                    </small>

                    <strong>
                      {solicitud.estado}
                    </strong>
                  </div>

                  <div>
                    <small>
                      REGISTRADA
                    </small>

                    <strong>
                      {formatearFechaHora(
                        solicitud.fechaSolicitud
                      )}
                    </strong>
                  </div>
                </div>

                <form
                  className="solb-form"
                  onSubmit={
                    manejarSubirDocumento
                  }
                >
                  <label>
                    <span>
                      Tipo de documento
                    </span>

                    <input
                      type="text"
                      value={
                        tipoDocumento
                      }
                      onChange={(
                        event
                      ) =>
                        setTipoDocumento(
                          event.target.value
                        )
                      }
                      placeholder="Ej. Constancia de inscripción"
                      disabled={subiendo}
                    />
                  </label>

                  <label>
                    <span>
                      Archivo
                    </span>

                    <input
                      ref={archivoRef}
                      type="file"
                      onChange={(
                        event
                      ) =>
                        setArchivo(
                          event.target
                            .files?.[0] ||
                            null
                        )
                      }
                      disabled={subiendo}
                    />
                  </label>

                  <button
                    type="submit"
                    className="solb-principal"
                    disabled={subiendo}
                  >
                    {subiendo
                      ? "CARGANDO..."
                      : "SUBIR DOCUMENTO"}

                    {!subiendo && (
                      <span
                        aria-hidden="true"
                      >
                        ↑
                      </span>
                    )}
                  </button>
                </form>
              </>
            )}

            {errorAccion && (
              <div
                className="solb-mensaje solb-mensaje-error"
                role="alert"
              >
                {errorAccion}
              </div>
            )}

            {mensaje && (
              <div
                className="solb-mensaje solb-mensaje-ok"
                role="status"
              >
                {mensaje}
              </div>
            )}
          </section>
        </div>

        {solicitud && (
          <section className="solb-documentos">
            <div className="solb-documentos-header">
              <div>
                <small>
                  EXPEDIENTE DIGITAL
                </small>

                <h2>
                  Documentos cargados
                </h2>
              </div>

              <span>
                {String(
                  documentos.length
                ).padStart(
                  2,
                  "0"
                )}
              </span>
            </div>

            {documentos.length === 0 ? (
              <div className="solb-sin-documentos">
                <strong>
                  AÚN NO HAY DOCUMENTOS
                </strong>

                <p>
                  Usa el formulario
                  superior para agregar el
                  primer archivo a esta
                  solicitud.
                </p>
              </div>
            ) : (
              <div className="solb-documentos-lista">
                {documentos.map(
                  (
                    documento,
                    indice
                  ) => (
                    <article
                      key={
                        documento.id
                      }
                      className="solb-documento"
                    >
                      <span
                        className="solb-documento-numero"
                        aria-hidden="true"
                      >
                        {String(
                          indice + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <div>
                        <small>
                          {documento.tipoDocumento ||
                            "Documento"}
                        </small>

                        <strong>
                          {documento.nombreArchivo}
                        </strong>

                        <p>
                          Cargado:{" "}
                          {formatearFechaHora(
                            documento.fechaCarga
                          )}
                        </p>
                      </div>

                      <span className="solb-documento-ok">
                        REGISTRADO
                      </span>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        )}

        <footer className="solb-footer">
          <span>
            SISTEMA NACIONAL DE BECAS
          </span>

          <span>
            EXPEDIENTE DIGITAL · HU-06
          </span>
        </footer>
      </section>
    </main>
  );
}

export default SolicitudBeca;