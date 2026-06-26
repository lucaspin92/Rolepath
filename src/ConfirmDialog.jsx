import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

export default function ConfirmDialog({ confirmation, resolve }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (!confirmation) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();
    const onKeyDown = (event) => { if (event.key === "Escape") resolve(false); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [confirmation, resolve]);

  if (!confirmation) return null;
  return <div className="confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) resolve(false); }}>
    <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <button className="confirm-close" onClick={() => resolve(false)} aria-label="Close confirmation"><X size={17} /></button>
      <span className="confirm-icon"><AlertTriangle size={21} /></span>
      <div className="confirm-copy"><p>{confirmation.eyebrow || "Please confirm"}</p><h2 id="confirm-title">{confirmation.title}</h2><span id="confirm-message">{confirmation.message}</span></div>
      <div className="confirm-actions"><button className="button ghost" onClick={() => resolve(false)}>{confirmation.cancelLabel || "Cancel"}</button><button ref={confirmRef} className="button destructive" onClick={() => resolve(true)}><Trash2 size={15} />{confirmation.confirmLabel || "Delete"}</button></div>
    </section>
  </div>;
}
