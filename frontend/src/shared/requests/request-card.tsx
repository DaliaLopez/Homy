import Link from "next/link";
import type { ReactNode } from "react";
import { formatCOP, formatLongDate, formatTime } from "@/lib/format";
import type { ServiceRequest } from "@/types/request";
import Avatar from "@/shared/ui/avatar";
import Icon from "@/shared/ui/icon";
import StatusChip from "@/shared/ui/status-chip";

type RequestCardProps = {
  request: ServiceRequest;
  viewer: "client" | "worker";
  href?: string;
  /** Botones al pie (Aceptar / Rechazar, Ver detalle...). */
  actions?: ReactNode;
};

/** Tarjeta de solicitud: foto · estado y lugar · nombre y servicio · precio · fecha y hora. */
export default function RequestCard({ request, viewer, href, actions }: RequestCardProps) {
  const person = viewer === "client" ? request.worker : request.client;
  const personName = person?.name ?? (viewer === "client" ? "Profesional" : "Cliente");
  const place = request.address.split(",")[0];
  const cancelledByOther = request.cancelledBy && request.cancelledBy !== viewer;

  return (
    <article className="card request-card">
      <div className="request-card__top">
        <Avatar name={personName} src={person?.avatarUrl} />
        <div className="request-card__body">
          <div className="chip-group">
            <StatusChip kind="request" status={request.status} />
            <span className="chip chip--sage">
              <Icon name="pin" size={14} />
              {place}
            </span>
          </div>
          <div className="request-card__heading">
            <div>
              <h3 className="request-card__name">{href ? <Link href={href}>{personName}</Link> : personName}</h3>
              <p className="request-card__service">{request.service?.name ?? "Servicio"}</p>
            </div>
            <strong className="price">{formatCOP(Number(request.price))}</strong>
          </div>
          <div className="meta">
            <span className="meta__item">
              <Icon name="calendar" size={16} />
              {formatLongDate(request.scheduledAt)}
            </span>
            <span className="meta__item">
              <Icon name="clock" size={16} />
              {formatTime(request.scheduledAt)}
            </span>
          </div>
        </div>
      </div>
      {request.status === "cancelled" && request.cancellationReason && (
        <div className="notice notice--danger">
          <Icon name="alert" size={18} />
          <span>
            <strong>{cancelledByOther ? (viewer === "worker" ? "El cliente canceló" : "El profesional canceló") : "Cancelaste"}:</strong> {request.cancellationReason}
            {request.cancellationNote && ` · “${request.cancellationNote}”`}
          </span>
        </div>
      )}
      {actions}
    </article>
  );
}
