"use client";

import { useActionState } from "react";
import { changeRequestStatus } from "@/app/worker/_actions/requests";
import Icon from "@/shared/ui/icon";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";

type Props = { id: string; status: "requested" | "accepted" | "in_progress"; name: string; compact?: boolean };

/** Acciones del trabajador según el estado: aceptar/rechazar, iniciar o terminar. */
export default function StatusActions({ id, status, name, compact }: Props) {
  const [state, action] = useActionState(changeRequestStatus, undefined);

  const button = (next: string, label: string, className: string, icon: "check" | "x" | "play" | "checkCircle") => (
    <form action={action} style={{ display: "contents" }}>
      <input name="id" type="hidden" value={id} />
      <input name="status" type="hidden" value={next} />
      <SubmitButton className={className} pendingLabel="Guardando…">
        <Icon name={icon} size={18} /> {label}
      </SubmitButton>
    </form>
  );

  return (
    <>
      {state?.error && <Notice tone="danger">{state.error}</Notice>}
      {state?.ok && <Notice>{state.ok}</Notice>}
      {status === "requested" && (
        <div className="btn-row">
          {button("accepted", "Aceptar", "btn btn--primary", "check")}
          {button("rejected", "Rechazar", "btn btn--secondary", "x")}
        </div>
      )}
      {status === "accepted" && !compact && button("in_progress", "Iniciar servicio", "btn btn--primary btn--block", "play")}
      {status === "in_progress" && !compact && (
        <section className="card card--lg card--sage">
          <h2 style={{ fontSize: "var(--fs-h3)" }}>¿Terminaste el servicio?</h2>
          <p className="text-sm">Le pediremos a {name.split(" ")[0]} que confirme y califique tu trabajo.</p>
          <div>{button("completed", "Sí, terminé", "btn btn--primary", "checkCircle")}</div>
        </section>
      )}
    </>
  );
}
