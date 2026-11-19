import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import PageHeader from "@/shared/ui/page-header";
import CategoryFilter from "@/app/worker/_components/services/category-filter";
import DeleteService from "@/app/worker/_components/services/delete-service";
import StatusChip from "@/shared/ui/status-chip";
import PublishGate from "@/app/worker/_components/verification/publish-gate";
import { getMyServices } from "@/lib/data";
import { durationLabel, formatCOP } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { getWorkerState } from "@/lib/worker-state";
import { serviceStatusLabel, type ServiceStatus } from "@/types/service";

export const metadata: Metadata = { title: "Mis servicios" };

const statuses = ["all", "published", "in_review", "changes_requested", "rejected"] as const;

/** Mis servicios: filtros por estado y categoría, comentario del admin y acciones. */
export default async function WorkerServicesPage({ searchParams }: PageProps<"/worker/services">) {
  await requireRole("worker");
  const [{ estado, categoria }, services, state] = await Promise.all([searchParams, getMyServices(), getWorkerState()]);
  const status = (statuses.find((item) => item === estado) ?? "all") as "all" | ServiceStatus;
  const categories = [...new Map(services.map((service) => [service.category.id, service.category])).values()];
  const byCategory = services.filter((service) => !categoria || service.category.id === categoria);
  const visible = byCategory.filter((service) => status === "all" || service.status === status);
  const href = (key: string) => {
    const params = new URLSearchParams();
    if (key !== "all") params.set("estado", key);
    if (typeof categoria === "string") params.set("categoria", categoria);
    return `/worker/services${params.size ? `?${params}` : ""}`;
  };

  return (
    <div className="stack stack--lg">
      <PageHeader
        actions={
          state.stage === "verified" ? (
            <Link className="btn btn--primary" href="/worker/services/new">
              <Icon name="plus" size={18} /> Publicar servicio
            </Link>
          ) : (
            <PublishGate />
          )
        }
        description="El administrador revisa cada servicio antes de mostrarlo a los clientes."
        eyebrow="Mis servicios"
        title="Tus servicios"
      />

      <div className="stack stack--lg">
        <div className="row row--between row--wrap" style={{ alignItems: "flex-start" }}>
          <nav aria-label="Filtrar por estado" className="tabs">
            {statuses.map((value) => (
              <Link aria-current={status === value ? "page" : undefined} className={`tab${status === value ? " is-active" : ""}`} href={href(value)} key={value}>
                {value === "all" ? "Todos" : serviceStatusLabel[value]}
                <span className="tab__count">{byCategory.filter((service) => value === "all" || service.status === value).length}</span>
              </Link>
            ))}
          </nav>
          <Suspense fallback={null}>
            <CategoryFilter categories={categories} />
          </Suspense>
        </div>

        {visible.length ? (
          <div className="grid grid--2">
            {visible.map((service) => (
              <article className="card card--lg" key={service.id}>
                <div className="row row--between">
                  <div className="chip-group">
                    <StatusChip kind="service" status={service.status} />
                    <span className="chip chip--sage">{service.category.name}</span>
                  </div>
                  <DeleteService id={service.id} name={service.name} />
                </div>
                <div className="row row--between" style={{ alignItems: "flex-start" }}>
                  <div>
                    <h3>{service.name}</h3>
                    <p className="text-sm muted" style={{ marginTop: 4 }}>
                      {service.description}
                    </p>
                  </div>
                  <strong className="price">{formatCOP(Number(service.price))}</strong>
                </div>
                <span className="meta__item text-sm muted">
                  <Icon name="clock" size={16} />
                  {durationLabel(service.durationMinutes)}
                </span>
                {service.reviewNote && service.status !== "published" && (
                  <div className={`notice ${service.status === "rejected" ? "notice--neutral" : "notice--danger"}`}>
                    <Icon name="alert" size={18} />
                    <span>
                      <strong>{service.status === "rejected" ? "Motivo" : "Comentario del administrador"}:</strong> {service.reviewNote}
                    </span>
                  </div>
                )}
                {service.status === "changes_requested" ? (
                  <Link className="btn btn--primary btn--sm" href={`/worker/services/${service.id}/edit`}>
                    Corregir y reenviar
                  </Link>
                ) : service.status === "in_review" ? (
                  <Link className="btn btn--outline btn--sm" href={`/worker/services/${service.id}`}>
                    <Icon name="clock" size={16} /> Ver estado
                  </Link>
                ) : service.status === "published" ? (
                  <Link className="btn btn--outline btn--sm" href={`/worker/services/${service.id}/edit`}>
                    <Icon name="edit" size={16} /> Editar
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              state.stage === "verified" ? (
                <Link className="btn btn--primary" href="/worker/services/new">
                  Publicar servicio
                </Link>
              ) : undefined
            }
            icon="briefcase"
            title="No hay servicios aquí"
          >
            Prueba con otro filtro o publica un servicio nuevo.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
