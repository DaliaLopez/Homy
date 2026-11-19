"use client";

import { useActionState, useState } from "react";
import { deleteService } from "@/app/worker/_actions/services";
import Icon from "@/shared/ui/icon";
import Modal from "@/shared/ui/modal";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";

/** Papelera de la tarjeta de servicio, con confirmación. */
export default function DeleteService({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(deleteService, undefined);

  return (
    <>
      <button aria-label={`Eliminar ${name}`} className="icon-btn icon-btn--danger-soft" onClick={() => setOpen(true)} title="Eliminar" type="button">
        <Icon name="trash" size={18} />
      </button>
      <Modal labelledBy={`delete-${id}`} onClose={() => setOpen(false)} open={open}>
        <form action={action} className="stack">
          <input name="id" type="hidden" value={id} />
          <h2 id={`delete-${id}`}>¿Eliminar “{name}”?</h2>
          <p className="lead">Dejará de aparecer en tu perfil. Esta acción no se puede deshacer.</p>
          {state?.error && <Notice tone="danger">{state.error}</Notice>}
          <div className="btn-row">
            <button className="btn btn--outline" onClick={() => setOpen(false)} type="button">
              Volver
            </button>
            <SubmitButton className="btn btn--primary" pendingLabel="Eliminando…">
              Sí, eliminar
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
