import { useRef, useState } from "react";

export default function CampoPassword({ id, etiqueta = "Contraseña", ...props }) {
  const [visible, setVisible] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const ref = useRef(null);
  function alternar() {
    const input = ref.current;
    const inicio = input?.selectionStart;
    const fin = input?.selectionEnd;
    setVisible((value) => !value);
    window.requestAnimationFrame(() => {
      input?.focus();
      if (inicio != null && fin != null) input?.setSelectionRange(inicio, fin);
    });
  }
  const descripcion = [props["aria-describedby"], mayusculas ? `${id}-caps` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <>
      <div className="auth-password">
        <input {...props} id={id} ref={ref} type={visible ? "text" : "password"}
          spellCheck={false} autoCapitalize="none" autoCorrect="off" aria-describedby={descripcion}
          onKeyUp={(event) => setMayusculas(Boolean(event.getModifierState?.("CapsLock")))}
          onBlur={(event) => { setMayusculas(false); props.onBlur?.(event); }} />
        <button type="button" className="auth-eye" onClick={alternar} disabled={props.disabled}
          aria-controls={id} aria-label={`${visible ? "Ocultar" : "Mostrar"} ${etiqueta.toLowerCase()}`}
          title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" focusable="false">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {visible && <path d="m3 3 18 18" />}
          </svg>
        </button>
      </div>
      {mayusculas && <small className="auth-caps" id={`${id}-caps`} role="status">Bloq Mayús está activado.</small>}
    </>
  );
}
