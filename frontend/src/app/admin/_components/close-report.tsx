"use client";

import { useActionState, useState } from "react";
import { closeReport } from "@/app/admin/_actions/admin";
import Icon from "@/shared/ui/icon";
import Modal from "@/shared/ui/modal";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";

const options = {
  resolved: ["Se habló con ambas partes", "Se reembolsó al cliente", "Se advirtió al usuario", "Se suspendió la cuenta", "Otro"],
  dismissed: ["Sin pruebas suficientes", "Reporte duplicado", "No incumple las normas", "Otro"],
};

/** "Marcar como resuelto" y "Descartar" abren el mismo modal con la decisión. */
export default function CloseReport({ id }: { id: string }) {
  const [mode, setMode] = useState<"resolved" | "dismissed" | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [state, action] = useActionState(closeReport, undefined);
  const open = (next: "resolved" | "dismissed") => {
    setMode(next);
    setPicked([]);
    setNote("");
  };

  return (
    <>
      <button className="btn btn--primary btn--block" onClick={() => open("resolved")} type="button">
        <Icon name="checkCircle" size={18} /> Marcar como resuelto
      </button>
      <button className="btn btn--secondary btn--block" onClick={() => open("dismissed")} type="button">
        <Icon name="x" size={18} /> Descartar
      </button>
      <Modal labelledBy="close-report-title" onClose={() => setMode(null)} open={mode !== null}>
        {mode && (
          <form action={action} className="stack">
            <input name="id" type="hidden" value={id} />
            <input name="status" type="hidden" value={mode} />
            <input name="actions" type="hidden" value={JSON.stringify(picked)} />
            <h2 id="close-report-title">{mode === "resolved" ? "Marcar como resuelto" : "Descartar reporte"}</h2>
            <p className="lead">Escribe la decisión. La verán quien reportó y la persona reportada.</p>
            {state?.error && <Notice tone="danger">{state.error}</Notice>}
            <div className="field">
              <span className="label">{mode === "resolved" ? "¿Qué se hizo?" : "¿Por qué se descarta?"}</span>
              <div className="chip-group">
                {options[mode].map((option) => (
                  <button
                    aria-pressed={picked.includes(option)}
                    className={`tab${picked.includes(option) ? " is-active" : ""}`}
                    key={option}
                    onClick={() => setPicked((list) => (list.includes(option) ? list.filter((item) => item !== option) : [...list, option]))}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              aria-label="Nota para las dos partes"
              className="textarea"
              maxLength={1000}
              name="resolution"
              onChange={(event) => setNote(event.target.value)}
              placeholder={mode === "resolved" ? "Ej: se habló con ambas partes y se acordó…" : "Ej: no encontramos pruebas del cobro adicional."}
              value={note}
            />
            <div className="btn-row">
              <button className="btn btn--outline" onClick={() => setMode(null)} type="button">
                Cancelar
              </button>
              <SubmitButton className="btn btn--primary" disabled={!picked.length || note.trim().length < 5}>
                {mode === "resolved" ? "Resolver" : "Descartar"}
              </SubmitButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
