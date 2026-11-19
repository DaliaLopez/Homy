import Link from "next/link";
import { durationLabel, firstName, formatCOP, formatLongDate, formatTime } from "@/lib/format";
import type { RequestStatus, ServiceRequest } from "@/types/request";
import Avatar from "@/shared/ui/avatar";
import Icon, { type IconName } from "@/shared/ui/icon";
import Stars from "@/shared/ui/stars";
import StatusChip from "@/shared/ui/status-chip";
import CancelRequest from "./cancel-request";
import RatingForm from "./rating-form";
import StatusActions from "./status-actions";

const timeline: { status: RequestStatus; label: string }[] = [
  { status: "requested", label: "Solicitado" },
  { status: "accepted", label: "Confirmado" },
  { status: "in_progress", label: "En proceso" },
  { status: "completed", label: "Completado" },
];

const whatsapp = (phone?: string | null) => (phone ? `https://wa.me/57${phone.replace(/\D/g, "").replace(/^57/, "")}` : null);

type Props = { request: ServiceRequest; viewer: "client" | "worker" };

/**
 * Detalle de una solicitud.
 * Cliente: cancelar, calificar al terminar y reportar.
 * Trabajador: aceptar, rechazar, iniciar, completar y reportar (solo el cliente califica).
 */
export default function RequestDetail({ request, viewer }: Props) {
  const isClient = viewer === "client";
  const person = isClient
    ? {
        name: request.worker?.name ?? "Profesional",
        photo: request.worker?.avatarUrl,
        phone: request.worker?.phone,
        place: request.service?.category?.name ?? "",
      }
    : { name: request.client?.name ?? "Cliente", photo: request.client?.avatarUrl, phone: request.client?.phone, place: request.client?.location ?? "" };
  const first = firstName(person.name);
  const step = timeline.findIndex((item) => item.status === request.status);
  const closed = ["cancelled", "rejected", "expired"].includes(request.status);
  const canCancel = isClient ? ["requested", "accepted"].includes(request.status) : request.status === "accepted";
  const chat = whatsapp(person.phone);
  const backHref = isClient ? "/my/requests" : "/worker/requests";
  const reportHref = `${isClient ? "/my" : "/worker"}/reports/new?solicitud=${request.id}`;
  const cancelledByMe = request.cancelledBy === viewer;

  return (
    <div className="stack stack--lg">
      <Link className="back-link" href={backHref}>
        <Icon name="arrowLeft" size={18} />
        {isClient ? "Mis servicios" : "Solicitudes"}
      </Link>

      <div className="layout-aside layout-aside--sidebar">
        <div className="stack stack--lg">
          <header className="stack stack--sm">
            <div className="chip-group">
              <StatusChip kind="request" status={request.status} />
              {request.service?.category && <span className="chip chip--sage">{request.service.category.name}</span>}
            </div>
            <h1 className="title-xl">{request.service?.name ?? "Servicio"}</h1>
            <p className="muted">Solicitud #{request.id.slice(0, 8).toUpperCase()}</p>
          </header>

          {!closed && (
            <ol aria-label="Progreso de la solicitud" className="steps">
              {timeline.map((item, index) => (
                <li
                  aria-current={index === step ? "step" : undefined}
                  className={`steps__item${index <= step ? " is-done" : ""}`}
                  key={item.status}
                  title={item.label}
                >
                  <span className="sr-only">{item.label}</span>
                </li>
              ))}
            </ol>
          )}

          {request.status === "cancelled" && (
            <div className="notice notice--danger">
              <Icon name="alert" size={20} />
              <div>
                <strong>{cancelledByMe ? "Cancelaste esta solicitud" : `${isClient ? "El profesional" : "El cliente"} canceló esta solicitud`}</strong>
                {request.cancellationReason && <p>Motivo: {request.cancellationReason}</p>}
                {request.cancellationNote && <p>“{request.cancellationNote}”</p>}
              </div>
            </div>
          )}
          {request.status === "rejected" && (
            <div className="notice notice--neutral">
              <Icon name="alert" size={20} />
              <span>{isClient ? `${first} no pudo tomar este servicio.` : "Rechazaste esta solicitud."}</span>
            </div>
          )}
          {request.status === "expired" && (
            <div className="notice notice--neutral">
              <Icon name="alert" size={20} />
              <span>La solicitud venció sin respuesta.</span>
            </div>
          )}

          <section className="card card--lg">
            <h2 style={{ fontSize: "var(--fs-h3)" }}>Detalles del servicio</h2>
            <div className="list">
              <DetailRow icon="calendar" label="Fecha" value={formatLongDate(request.scheduledAt)} />
              <DetailRow icon="clock" label="Hora" value={formatTime(request.scheduledAt)} />
              {request.service && <DetailRow icon="clock" label="Duración" value={durationLabel(request.service.durationMinutes)} />}
              <DetailRow icon="pin" label="Dirección" value={request.address} />
              <DetailRow icon="briefcase" label="Valor" value={formatCOP(Number(request.price))} />
            </div>
            {/* Lo que escribió el cliente al solicitar, alineado a la izquierda con el resto de la tarjeta. */}
            {request.description && (
              <div className="request-notes">
                <h3 className="request-notes__title">Observaciones</h3>
                <p className="request-notes__text">{request.description}</p>
              </div>
            )}
          </section>

          {!isClient && request.status === "in_progress" && <StatusActions id={request.id} name={person.name} status="in_progress" />}
        </div>

        <aside className="stack sticky-aside">
          <section className="card card--lg">
            <p className="eyebrow">{isClient ? "Profesional" : "Cliente"}</p>
            <div className="row">
              <Avatar name={person.name} src={person.photo} />
              <div>
                <h3>{person.name}</h3>
                {person.place && <p className="text-sm muted">{person.place}</p>}
              </div>
            </div>
            {chat && !closed && (
              <a className="btn btn--secondary btn--block" href={chat} rel="noreferrer" target="_blank">
                <Icon name="chat" size={18} /> Chatear
              </a>
            )}
          </section>

          <section className="card card--lg card--outline">
            {!isClient && request.status === "requested" && <StatusActions id={request.id} name={person.name} status="requested" />}
            {!isClient && request.status === "accepted" && <StatusActions id={request.id} name={person.name} status="accepted" />}

            {request.status === "completed" && isClient && !request.review && <RatingForm id={request.id} name={person.name} photo={person.photo} />}
            {request.status === "completed" && isClient && request.review && (
              <div className="stack stack--sm">
                <p className="notice">
                  <Icon name="checkCircle" size={18} /> Ya enviaste tu calificación.
                </p>
                <Stars value={request.review.rating} />
                {request.review.comment && <p className="text-sm">{request.review.comment}</p>}
              </div>
            )}
            {request.status === "completed" && !isClient && <p className="text-sm muted">Completaste este servicio.</p>}
            {/* Reportar: solo en servicios completados, debajo de la calificación (cliente) o en su lugar (trabajador). */}
            {request.status === "completed" && (
              <Link className="btn btn--outline btn--block" href={reportHref}>
                <Icon name="flag" size={18} /> Reportar un problema
              </Link>
            )}

            {canCancel && <CancelRequest id={request.id} otherName={person.name} viewer={viewer} />}
            {closed && <p className="text-sm muted">Esta solicitud ya está cerrada.</p>}
            {closed && isClient && (
              <Link className="btn btn--primary btn--block" href={`/my/requests/new?profesional=${request.workerId}&servicio=${request.serviceId}`}>
                Solicitar de nuevo
              </Link>
            )}
            {request.status === "in_progress" && isClient && <p className="text-sm muted">{first} está trabajando en tu servicio.</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="list-row">
      <span className="meta__item muted">
        <Icon name={icon} size={16} />
        {label}
      </span>
      <span className="strong" style={{ textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}
