"use client";

import { useActionState, useState } from "react";
import { reviewWorker } from "@/app/(client)/my/_actions/requests";
import Avatar from "@/shared/ui/avatar";
import Icon from "@/shared/ui/icon";
import Modal from "@/shared/ui/modal";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";

type Props = { id: string; name: string; photo?: string | null };

/** Botón "Calificar al profesional" (solo el cliente califica) que abre el modal de estrellas con comentario opcional. */
export default function RatingForm({ id, name, photo }: Props) {
  const [state, action] = useActionState(reviewWorker, undefined);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);

  if (state?.ok)
    return (
      <p className="notice">
        <Icon name="checkCircle" size={18} /> {state.ok}
      </p>
    );

  return (
    <>
      <button className="btn btn--primary btn--block" onClick={() => setOpen(true)} type="button">
        <Icon name="star" size={18} /> Calificar al profesional
      </button>
      <Modal labelledBy="review-title" onClose={() => setOpen(false)} open={open}>
        <form action={action} className="stack" style={{ textAlign: "center" }}>
          <input name="id" type="hidden" value={id} />
          <input name="rating" type="hidden" value={rating} />
          <Avatar className="avatar--center" name={name} round size="lg" src={photo} />
          <h2 id="review-title">¿Cómo te fue con {name.split(" ")[0]}?</h2>
          {state?.error && <Notice tone="danger">{state.error}</Notice>}
          <div aria-label="Calificación" className="row" role="radiogroup" style={{ justifyContent: "center" }}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-checked={rating === value}
                aria-label={`${value} estrellas`}
                className="icon-btn icon-btn--plain"
                key={value}
                onClick={() => setRating(value)}
                role="radio"
                style={{ width: 48, height: 48, color: value <= rating ? "var(--color-olive)" : "var(--color-sage-3)" }}
                type="button"
              >
                <Icon filled name="star" size={34} strokeWidth={1} />
              </button>
            ))}
          </div>
          <textarea className="textarea" maxLength={1000} name="comment" placeholder="Escribe un comentario (opcional)" />
          <SubmitButton className="btn btn--primary btn--block" disabled={!rating}>
            Enviar calificación
          </SubmitButton>
        </form>
      </Modal>
    </>
  );
}
