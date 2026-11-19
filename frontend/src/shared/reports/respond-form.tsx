"use client";

import { useActionState, useState } from "react";
import { respondReport } from "@/shared/actions/reports";
import FilePicker from "@/shared/ui/file-picker";
import Modal from "@/shared/ui/modal";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";

/** Botón "Contar mi versión" con el modal para responder un reporte recibido. */
export default function RespondForm({ id, description, deadline }: { id: string; description: string; deadline: string }) {
  const [state, action] = useActionState(respondReport, undefined);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  if (state?.ok) return <Notice>{state.ok}</Notice>;

  return (
    <>
      <button className="btn btn--secondary btn--sm" onClick={() => setOpen(true)} type="button">
        Contar mi versión
      </button>
      <Modal labelledBy={`respond-title-${id}`} onClose={() => setOpen(false)} open={open}>
        <form action={action} className="form">
          <input name="id" type="hidden" value={id} />
          <h2 id={`respond-title-${id}`}>Cuenta tu versión</h2>
          <p className="lead">{description}</p>
          <p className="text-sm muted">Tienes hasta el {deadline} para responder.</p>
          {state?.error && <Notice tone="danger">{state.error}</Notice>}
          <textarea
            className="textarea"
            maxLength={500}
            minLength={20}
            name="response"
            onChange={(event) => setText(event.target.value)}
            placeholder="Escribe tu respuesta para el administrador (mínimo 20 caracteres)"
            required
            value={text}
          />
          <FilePicker compact label="Adjuntar evidencia (opcional):" name="evidence" />
          <SubmitButton className="btn btn--primary btn--block" disabled={text.trim().length < 20}>
            Enviar respuesta
          </SubmitButton>
        </form>
      </Modal>
    </>
  );
}
