"use client";

import { useActionState, useState } from "react";
import { reviewService } from "@/app/admin/_actions/admin";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";

type Mode = "rejected" | "changes_requested";

const copy: Record<Mode, { label: string; reasons: string[]; placeholder: string; confirm: string }> = {
  rejected: {
    label: "¿Por qué no se aprueba?",
    reasons: ["No corresponde a la categoría", "Información falsa o engañosa", "Servicio no permitido en Homy", "Precio no coherente", "Otro"],
    placeholder: "Ej: el servicio no corresponde a la categoría verificada.",
    confirm: "Confirmar rechazo",
  },
  changes_requested: {
    label: "¿Qué debe cambiar el profesional?",
    reasons: ["Falta describir qué incluye", "Precio poco claro", "Nombre poco claro", "Duración no coherente", "Ortografía o redacción", "Otro"],
    placeholder: "Ej: aclara qué incluye el precio y si llevas los materiales.",
    confirm: "Enviar cambios",
  },
};

/**
 * Decisión del administrador: "Aprobar servicio" publica de inmediato;
 * "Rechazar" y "Pedir cambios" despliegan los motivos (seleccionables) y un comentario,
 * como en la revisión de verificaciones.
 */
export default function ServiceReview({ id }: { id: string }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [state, action] = useActionState(reviewService, undefined);
  // La API guarda un solo texto: los motivos elegidos y, si hay, el comentario.
  const note = [reasons.join(" · "), comment.trim()].filter(Boolean).join(". ");

  const toggleMode = (next: Mode) => {
    setMode((current) => (current === next ? null : next));
    setReasons([]);
    setComment("");
  };
  const toggleReason = (reason: string) => setReasons((list) => (list.includes(reason) ? list.filter((item) => item !== reason) : [...list, reason]));

  return (
    <div className="stack">
      {state?.error && <Notice tone="danger">{state.error}</Notice>}
      <div className="service-decision">
        <form action={action}>
          <input name="id" type="hidden" value={id} />
          <input name="status" type="hidden" value="published" />
          <SubmitButton className="btn btn--primary btn--block" pendingLabel="Publicando…">
            <span>
              Aprobar<span className="service-decision__long"> servicio</span>
            </span>
          </SubmitButton>
        </form>
        <button aria-expanded={mode === "rejected"} className={`btn btn--block ${mode === "rejected" ? "btn--danger" : "btn--secondary"}`} onClick={() => toggleMode("rejected")} type="button">
          Rechazar
        </button>
        <button
          aria-expanded={mode === "changes_requested"}
          className={`btn btn--block ${mode === "changes_requested" ? "btn--primary" : "btn--secondary"}`}
          onClick={() => toggleMode("changes_requested")}
          type="button"
        >
          Pedir cambios
        </button>
      </div>

      {mode && (
        <form action={action} className={`service-decision__reason${mode === "rejected" ? " card--danger" : ""}`}>
          <input name="id" type="hidden" value={id} />
          <input name="status" type="hidden" value={mode} />
          <input name="note" type="hidden" value={note} />
          <span className="label">{copy[mode].label}</span>
          <div className="chip-group">
            {copy[mode].reasons.map((reason) => (
              <button aria-pressed={reasons.includes(reason)} className={`tab${reasons.includes(reason) ? " is-active" : ""}`} key={reason} onClick={() => toggleReason(reason)} type="button">
                {reason}
              </button>
            ))}
          </div>
          <textarea
            aria-label="Comentario para el profesional"
            className="textarea"
            maxLength={900}
            onChange={(event) => setComment(event.target.value)}
            placeholder={copy[mode].placeholder}
            style={{ minHeight: 88 }}
            value={comment}
          />
          <p className="field__hint">El profesional verá los motivos y tu comentario en su servicio.</p>
          <div className="btn-row">
            <button className="btn btn--outline" onClick={() => setMode(null)} type="button">
              Cancelar
            </button>
            <SubmitButton className={`btn ${mode === "rejected" ? "btn--danger" : "btn--primary"}`} disabled={!reasons.length} pendingLabel="Enviando…">
              {copy[mode].confirm}
            </SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}
