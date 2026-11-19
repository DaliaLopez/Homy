"use client";

import { useActionState, useState } from "react";
import { reactivateUser, suspendUser } from "@/app/admin/_actions/admin";
import Icon from "@/shared/ui/icon";
import Modal from "@/shared/ui/modal";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";

type Props = { id: string; name: string; suspended?: boolean; label?: string; small?: boolean; danger?: boolean };

/** Suspender (con motivo obligatorio) o reactivar una cuenta. La cuenta no se elimina. */
export default function SuspendUser({ id, name, suspended, label = "Suspender", small, danger }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(suspended ? reactivateUser : suspendUser, undefined);
  const size = small ? " btn--sm" : " btn--block";

  if (suspended) {
    return (
      <form action={action}>
        <input name="id" type="hidden" value={id} />
        <SubmitButton className={`btn btn--secondary${size}`} pendingLabel="Reactivando…">
          Reactivar
        </SubmitButton>
        {state?.error && <span className="field__error">{state.error}</span>}
      </form>
    );
  }

  return (
    <>
      <button className={`btn ${danger ? "btn--danger" : "btn--secondary"}${size}`} onClick={() => setOpen(true)} type="button">
        {danger && <Icon name="lock" size={18} />} {label}
      </button>
      <Modal labelledBy={`suspend-${id}`} onClose={() => setOpen(false)} open={open}>
        {state?.ok ? (
          <div className="stack" style={{ textAlign: "center" }}>
            <h2 id={`suspend-${id}`}>Suspendiste a {name}</h2>
            <p className="lead">No podrá iniciar sesión hasta que lo reactives desde Usuarios. Su cuenta se conserva.</p>
            <button className="btn btn--primary btn--block" onClick={() => setOpen(false)} type="button">
              Listo
            </button>
          </div>
        ) : (
          <form action={action} className="stack" style={{ textAlign: "center" }}>
            <input name="id" type="hidden" value={id} />
            <span className="empty__icon" style={{ margin: "0 auto", background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
              <Icon name="lock" size={26} />
            </span>
            <h2 id={`suspend-${id}`}>¿Suspender a {name}?</h2>
            <p className="lead">No podrá solicitar ni ofrecer servicios hasta que lo reactives desde Usuarios.</p>
            {state?.error && <Notice tone="danger">{state.error}</Notice>}
            <textarea
              aria-label="Motivo de la suspensión"
              className="textarea"
              maxLength={500}
              minLength={5}
              name="reason"
              placeholder="Motivo de la suspensión (obligatorio)"
              required
              style={{ textAlign: "left" }}
            />
            <div className="btn-row">
              <button className="btn btn--outline" onClick={() => setOpen(false)} type="button">
                Cancelar
              </button>
              <SubmitButton className="btn btn--primary" pendingLabel="Suspendiendo…">
                Suspender
              </SubmitButton>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
