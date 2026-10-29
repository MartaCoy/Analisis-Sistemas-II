import { useEffect, useRef, useState } from "react";
import { usePageTransition } from "../components/usePageTransition.js";
import { listarMisNotificaciones, marcarNotificacionLeida } from "../services/notificacionService.js";
import { mostrarFechaHora, mostrarEstado } from "../utils/formatoPresentacion.js";
import "../styles/requisitos-nuevos.css";

export default function Notificaciones() {
  const { irA, transicionActiva } = usePageTransition();
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [revision, setRevision] = useState(0);
  const [procesando, setProcesando] = useState(null);
  const marcando = useRef(false);
  const pendientes = datos.filter((n) => !n.leida).length;

  useEffect(() => {
    const controller = new AbortController();
    listarMisNotificaciones({ signal: controller.signal })
      .then((resultado) => { if (!controller.signal.aborted) setDatos(resultado); })
      .catch((e) => { if (!controller.signal.aborted && e.name !== "AbortError") setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [revision]);

  async function marcar(id) {
    if (marcando.current) return;
    marcando.current = true; setProcesando(id); setError(""); setAviso("");
    try {
      const resultado = await marcarNotificacionLeida(id);
      if (String(resultado?.id) !== String(id) || resultado?.leida !== true) throw new Error("No recibimos confirmación. Actualiza tus notificaciones.");
      setDatos((anterior) => anterior.map((n) => n.id === id ? { ...n, leida: true } : n));
      setAviso("Notificación marcada como leída.");
    } catch (e) { setError(e.message || "No pudimos guardar la lectura. Actualiza el listado."); }
    finally { marcando.current = false; setProcesando(null); }
  }
  function actualizar() { setError(""); setAviso(""); setCargando(true); setRevision((n) => n + 1); }
  return <main className="nreq-page">
    <header className="nreq-header"><div><small>SISTEMA NACIONAL DE BECAS</small><strong>Notificaciones</strong></div>
      <button type="button" onClick={() => irA("/dashboard")} disabled={transicionActiva}>← VOLVER AL PANEL</button>
    </header>
    <section className="nreq-shell">
      <p className="nreq-kicker">SEGUIMIENTO ESTUDIANTIL</p>
      <h1>Mis <span>notificaciones</span></h1>
      <p className="nreq-intro">Aquí puedes consultar los cambios de estado de tus solicitudes. Las horas sin zona conservan la hora informada por el servidor.</p>
      <div className="nreq-toolbar"><button type="button" onClick={actualizar} disabled={cargando || procesando !== null}>{cargando ? "ACTUALIZANDO..." : "ACTUALIZAR"}</button>
        {!cargando && <span role="status">{pendientes} sin leer · {datos.length} en total</span>}</div>
      {error && <p role="alert" className="nreq-error">{error}</p>}
      {aviso && <p role="status" className="nreq-success">{aviso}</p>}
      {cargando ? <p role="status">Cargando notificaciones...</p> : <div className="nreq-panel">
        {datos.length === 0 && !error && <p>Aún no tienes notificaciones. Te avisaremos aquí cuando cambie el estado de una solicitud.</p>}
        {datos.map((n) => <article key={n.id} className={`nreq-notif ${n.leida ? "nreq-leida" : ""}`}>
          <div><div className="nreq-notif-meta"><time dateTime={n.fecha}>{mostrarFechaHora(n.fecha)}</time><strong className="nreq-read-label">{n.leida ? "LEÍDA" : "SIN LEER"}</strong></div>
            <h2>Solicitud #{n.solicitudId} · {mostrarEstado(n.estadoNuevo)}</h2><p>{n.mensaje}</p></div>
          <div className="nreq-actions"><button type="button" onClick={() => irA(`/mis-solicitudes/${n.solicitudId}`)} disabled={transicionActiva}>VER EXPEDIENTE</button>
            {!n.leida && <button type="button" onClick={() => marcar(n.id)} disabled={procesando !== null}>{procesando === n.id ? "GUARDANDO..." : "MARCAR LEÍDA"}</button>}</div>
        </article>)}
      </div>}
    </section>
  </main>;
}
