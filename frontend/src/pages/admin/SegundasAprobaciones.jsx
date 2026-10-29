import { useEffect, useRef, useState } from "react";
import { mostrarFechaHora as fecha } from "../../utils/formatoPresentacion.js";
import { obtenerSesion } from "../../services/authService.js";
import {
  listarPendientesSegundaAprobacion,
  obtenerAprobacionesSolicitud,
  obtenerAuditoriaSolicitud,
  resolverSegundaAprobacionSolicitud,
  obtenerSolicitud,
  listarDocumentos,
  obtenerHistorialSolicitud,
} from "../../services/solicitudService.js";
import { listarEvaluacionesSolicitud } from "../../services/evaluacionService.js";
import { usePageTransition } from "../../components/usePageTransition.js";
import "../../styles/requisitos-nuevos.css";

const monto = (valor) => valor == null ? "Por verificar" : Number(valor).toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SegundasAprobaciones() {
  const { irA, transicionActiva } = usePageTransition();
  const [lista, setLista] = useState([]);
  const [seleccion, setSeleccion] = useState(null);
  const [aprobaciones, setAprobaciones] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [expediente, setExpediente] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [observacion, setObservacion] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [revision, setRevision] = useState(0);
  const correo = obtenerSesion()?.correo ?? "";
  const seleccionActual = useRef(0);
  const decisionEnCurso = useRef(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    listarPendientesSegundaAprobacion({ signal: controller.signal })
      .then((datos) => { if (!controller.signal.aborted) setLista(datos); })
      .catch((e) => { if (e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [revision]);

  async function elegir(s) {
    if (decisionEnCurso.current) return;
    const intentoDetalle = ++seleccionActual.current;
    setCargandoDetalle(true);
    setError(""); setAviso(""); setSeleccion(s); setObservacion("");
    setAprobaciones([]); setAuditoria([]);
    setExpediente(null); setEvaluaciones([]); setDocumentos([]); setHistorial([]);
    try {
      const [a, acciones, datosSolicitud, evals, docs, movimientos] = await Promise.all([
        obtenerAprobacionesSolicitud(s.id),
        obtenerAuditoriaSolicitud(s.id),
        obtenerSolicitud(s.id),
        listarEvaluacionesSolicitud(s.id),
        listarDocumentos(s.id),
        obtenerHistorialSolicitud(s.id),
      ]);
      if (intentoDetalle !== seleccionActual.current) return;
      setAprobaciones(a); setAuditoria(acciones); setExpediente(datosSolicitud);
      setEvaluaciones(evals); setDocumentos(docs); setHistorial(movimientos);
    } catch (e) { if (intentoDetalle === seleccionActual.current) setError(e.message); }
    finally { if (intentoDetalle === seleccionActual.current) setCargandoDetalle(false); }
  }

  const primera = aprobaciones.find((a) => a.etapa === 1);
  const mismoAprobador = Boolean(primera && (primera.actorCorreo || "").toLowerCase() === correo.toLowerCase());
  const puedeDecidir = seleccion && expediente && primera && !mismoAprobador && !guardando && !cargandoDetalle;

  async function decidir(aprobada) {
    if (!puedeDecidir || decisionEnCurso.current) return;
    if (!aprobada && !observacion.trim()) {
      setError("Describe el motivo para rechazar la segunda aprobación."); return;
    }
    if (!window.confirm(aprobada ? "¿Autorizar definitivamente esta beca?" : "¿Rechazar esta solicitud?")) return;
    decisionEnCurso.current = true;
    setGuardando(true); setError(""); setAviso("");
    try {
      await resolverSegundaAprobacionSolicitud(seleccion.id, {
        aprobada, observacion: observacion.trim(),
      });
      setSeleccion(null); setAprobaciones([]); setAuditoria([]);
      setExpediente(null); setDocumentos([]); setEvaluaciones([]); setHistorial([]);
      setAviso(aprobada ? "La segunda aprobación fue registrada." : "El rechazo fue registrado.");
      setCargando(true);
      setRevision((n) => n + 1);
    } catch (e) { setError(e.message || "No fue posible registrar la decisión."); }
    finally { decisionEnCurso.current = false; setGuardando(false); }
  }

  return (
    <main className="nreq-page">
      <header className="nreq-header">
        <div><small>SISTEMA NACIONAL DE BECAS · CONTROL</small><strong>Segundas aprobaciones</strong></div>
        <button type="button" onClick={() => irA("/dashboard")} disabled={transicionActiva}>← VOLVER AL PANEL</button>
      </header>
      <section className="nreq-shell">
        <p className="nreq-kicker">CONTROL ADICIONAL · MONTO SUPERIOR A 10,000</p>
        <h1>Autorización de <span>becas</span></h1>
        <p className="nreq-intro">La evaluación del comité constituye la primera aprobación. Otro administrador debe tomar la segunda decisión antes de autorizar la beca.</p>
        {error && <p className="nreq-error" role="alert">{error}</p>}
        {aviso && <p className="nreq-success" role="status">{aviso}</p>}
        <button type="button" onClick={() => { setError(""); setCargando(true); setSeleccion(null); seleccionActual.current++; setCargandoDetalle(false); setRevision((n) => n + 1); }} disabled={cargando || guardando}>ACTUALIZAR LISTADO</button>
        {cargando ? <p role="status">Consultando solicitudes pendientes...</p> : (
          <section className="nreq-grid">
            <div className="nreq-panel">
              <h2>Expedientes pendientes <small>({lista.length})</small></h2>
              {lista.length === 0 && <p>No hay segundas aprobaciones pendientes.</p>}
              {lista.map((s) => (
                <button key={s.id} type="button" className="nreq-item" disabled={guardando} aria-pressed={seleccion?.id === s.id} onClick={() => elegir(s)}>
                  <strong>Solicitud #{s.id}</strong>
                  <span>Estudiante #{s.estudianteId} · Monto: {monto(s.montoSolicitado)}</span>
                  <small>VER APROBACIONES Y AUDITORÍA</small>
                </button>
              ))}
            </div>
            <div className="nreq-panel">
              <h2>Revisión y decisión</h2>
              {!seleccion ? <p>Selecciona una solicitud de la lista.</p> : cargandoDetalle ? <p role="status">Consultando aprobaciones y auditoría...</p> : (
                <>
                  <p><strong>Solicitud #{seleccion.id}</strong> · Monto: {monto(seleccion.montoSolicitado)}</p>
                  <div className="nreq-timeline">
                    {aprobaciones.length === 0 && <p>Consultando aprobaciones...</p>}
                    {aprobaciones.map((a) => <p key={a.id}>Etapa {a.etapa} · {a.decision} · {a.actorCorreo} · {fecha(a.fecha)}</p>)}
                  </div>
                  {mismoAprobador && <p className="nreq-error">No puedes tomar la segunda decisión porque realizaste la primera aprobación.</p>}
                  <label className="nreq-field">Observación de la decisión
                    <textarea rows="3" maxLength="500" value={observacion} disabled={guardando || mismoAprobador} onChange={(e) => setObservacion(e.target.value)} />
                  </label>
                  <div className="nreq-actions">
                    <button type="button" disabled={!puedeDecidir} onClick={() => decidir(true)}>{guardando ? "REGISTRANDO..." : "APROBAR DEFINITIVAMENTE"}</button>
                    <button type="button" disabled={!puedeDecidir} onClick={() => decidir(false)}>RECHAZAR SOLICITUD</button>
                  </div>
                  <h3>Evaluación y documentación</h3>
                  <div className="nreq-timeline">
                    <p>Evaluaciones del comité: {evaluaciones.length}</p>
                    {evaluaciones.map((ev) => <p key={ev.id}>Evaluador #{ev.evaluadorId} · Puntaje: {ev.puntaje}/100 · {ev.observaciones || "Sin observación"}</p>)}
                    <p>Documentos: {documentos.length}</p>
                    {documentos.map((doc) => <p key={doc.id}>{doc.tipoDocumento || "Documento"}: {doc.nombreArchivo}</p>)}
                  </div>
                  <h3>Historial de cambios</h3>
                  <div className="nreq-timeline">
                    {historial.map((mov) => <p key={mov.id}>{fecha(mov.fechaCambio)} · {mov.estadoAnterior || "Inicio"} → {mov.estadoNuevo}</p>)}
                  </div>
                  <h3>Auditoría del expediente</h3>
                  <div className="nreq-timeline">
                    {auditoria.length === 0 ? <p>Aún no hay acciones registradas.</p> : auditoria.map((a) => (
                      <p key={a.id}>{fecha(a.fecha)} · <strong>{a.operacion}</strong> · {a.actorCorreo} · {a.resultado}<br /><span>{a.detalle}</span></p>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
