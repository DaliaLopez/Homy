"use client";

import { useActionState, useState } from "react";
import { cancelRequest } from "@/shared/actions/requests";
import Modal from "@/shared/ui/modal";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";

const cancelReasons = {
  client: ["Cambié la fecha del servicio", "Ya no necesito el servicio", "Encontré otra opción", "Otro motivo"],
  worker: ["No puedo asistir en ese horario", "Emergencia personal", "El servicio no es de mi categoría", "Otro motivo"],
};

/** Botón "Cancelar solicitud" con el modal de motivo (la nota es obligatoria, mínimo 10 caracteres). */
export default function CancelRequest({ id, viewer, otherName }: { id: string; viewer: "client" | "worker"; otherName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [state, action] = useActionState(cancelRequest, undefined);

  return (
    <>
      <button className="btn btn--outline btn--block" onClick={() => setOpen(true)} type="button">
        Cancelar solicitud
      </button>
      <Modal labelledBy="cancel-title" onClose={() => setOpen(false)} open={open}>
        <form action={action} className="stack">
          <input name="id" type="hidden" value={id} />
          <input name="viewer" type="hidden" value={viewer} />
          <input name="reason" type="hidden" value={reason} />
          <h2 id="cancel-title">¿Por qué cancelas?</h2>
          <p className="lead">Le enviaremos el motivo a {otherName.split(" ")[0]}.</p>
          {state?.error && <Notice tone="danger">{state.error}</Notice>}
          <div className="stack stack--sm" role="radiogroup">
            {cancelReasons[viewer].map((item) => (
              <button
                aria-checked={reason === item}
                className={`option-card${reason === item ? " is-selected" : ""}`}
                key={item}
                onClick={() => setReason(item)}
                role="radio"
                style={{ padding: "14px 18px", borderRadius: 18 }}
                type="button"
              >
                <span style={{ flex: 1 }}>{item}</span>
                <span className="option-card__radio" />
              </button>
            ))}
          </div>
          <div className="field">
            <label className="label" htmlFor="cancel-note">
              Comentario
            </label>
            <textarea
              className="textarea"
              id="cancel-note"
              maxLength={500}
              minLength={10}
              name="note"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Cuéntale algo más (mínimo 10 caracteres)"
              required
              value={note}
            />
          </div>
          <div className="btn-row">
            <button className="btn btn--outline" onClick={() => setOpen(false)} type="button">
              Volver
            </button>
            <SubmitButton className="btn btn--primary" disabled={!reason || note.trim().length < 10} pendingLabel="Cancelando…">
              Cancelar
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
