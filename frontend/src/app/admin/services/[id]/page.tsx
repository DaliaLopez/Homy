import Link from "next/link";
import { notFound } from "next/navigation";
import ServiceReview from "@/app/admin/_components/service-review";
import Avatar from "@/shared/ui/avatar";
import Icon from "@/shared/ui/icon";
import Notice from "@/shared/ui/notice";
import StatusChip from "@/shared/ui/status-chip";
import { homyGet } from "@/lib/homy-api";
import { durationLabel, formatCOP, formatShortDate } from "@/lib/format";
import { requireRole } from "@/lib/session";
import type { Service } from "@/types/service";

/** Revisar un servicio: aprobar, rechazar o pedir cambios (con motivo). A la derecha, el resumen del profesional. */
export default async function AdminServiceDetailPage({ params, searchParams }: PageProps<"/admin/services/[id]">) {
  await requireRole("admin");
  const [{ id }, { revisado }] = await Promise.all([params, searchParams]);
  const service = await homyGet<Service | null>(`/services/review/${id}`, null);
  if (!service) notFound();
  const worker = service.worker?.user;
  const workerName = worker?.name ?? "El profesional";

  return (
    <div className="stack stack--lg">
      <Link className="back-link" href="/admin/services">
        <Icon name="arrowLeft" size={18} />
        Servicios
      </Link>
      {revisado === "1" && <Notice>Guardamos tu decisión y notificamos al profesional.</Notice>}

      <div className="layout-aside layout-aside--sidebar">
        <section className="card card--lg service-detail">
          <div className="chip-group">
            <span className="chip chip--sage">{service.category.name}</span>
            <StatusChip kind="service" status={service.status} />
          </div>
          <h1 className="title-xl">{service.name}</h1>
          <p className="lead">{service.description}</p>

          <div className="service-detail__facts">
            <div className="service-detail__fact">
              <span className="text-sm muted">Precio</span>
              <strong>{formatCOP(Number(service.price))}</strong>
            </div>
            <div className="service-detail__fact">
              <span className="text-sm muted">Duración</span>
              <strong>{durationLabel(service.durationMinutes)}</strong>
            </div>
            <div className="service-detail__fact">
              <span className="text-sm muted">Enviado</span>
              <strong>{formatShortDate(service.submittedAt ?? service.createdAt)}</strong>
            </div>
          </div>

          <div className="notice">
            <Icon name="shield" size={20} />
            <span>
              {workerName} está verificado en {service.category.name}. Solo revisa que el servicio corresponda y la información sea clara.
            </span>
          </div>

          {service.reviewNote && service.status !== "in_review" && (
            <div className="notice notice--neutral">
              <Icon name="chat" size={18} />
              <span>
                <strong>Comentario enviado:</strong> {service.reviewNote}
              </span>
            </div>
          )}

          {service.status === "in_review" ? <ServiceReview id={service.id} /> : <p className="text-sm muted">Este servicio ya fue revisado.</p>}
        </section>

        <aside className="stack sticky-aside">
          {worker && (
            <section className="card card--lg">
              <p className="eyebrow">Profesional</p>
              <div className="row">
                <Avatar name={worker.name} src={worker.avatarUrl} />
                <div>
                  <h3>{worker.name}</h3>
                  <p className="text-sm muted">{worker.location ?? "—"}</p>
                </div>
              </div>
              <Link className="btn btn--secondary btn--block" href={`/admin/users/${worker.id}`}>
                Ver perfil
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
