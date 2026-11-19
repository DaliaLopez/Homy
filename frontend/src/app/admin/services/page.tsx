import type { Metadata } from "next";
import Link from "next/link";
import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import PageHeader from "@/shared/ui/page-header";
import StatusChip from "@/shared/ui/status-chip";
import { getServicesForReview } from "@/lib/data";
import { durationLabel, formatCOP, formatShortDate } from "@/lib/format";
import { requireRole } from "@/lib/session";
import type { ServiceStatus } from "@/types/service";

export const metadata: Metadata = { title: "Servicios" };

const tabs: { key: ServiceStatus; label: string }[] = [
  { key: "in_review", label: "Por revisar" },
  { key: "published", label: "Publicados" },
  { key: "changes_requested", label: "Con cambios" },
  { key: "rejected", label: "No aprobados" },
];

/** Servicios enviados por los profesionales, por estado de revisión, en tabla como Usuarios (en móvil cada fila se ve como tarjeta). */
export default async function AdminServicesPage({ searchParams }: PageProps<"/admin/services">) {
  await requireRole("admin");
  const [{ estado }, services] = await Promise.all([searchParams, getServicesForReview()]);
  const tab = tabs.find((item) => item.key === estado)?.key ?? "in_review";
  const visible = services.filter((item) => item.status === tab);

  return (
    <div className="stack stack--lg">
      <PageHeader description="Aprueba cada servicio antes de que los clientes lo vean." eyebrow="Servicios" title="Servicios de los profesionales" />
      <div className="stack stack--lg">
        <nav aria-label="Filtrar por estado" className="tabs">
          {tabs.map((item) => (
            <Link aria-current={tab === item.key ? "page" : undefined} className={`tab${tab === item.key ? " is-active" : ""}`} href={`/admin/services?estado=${item.key}`} key={item.key}>
              {item.label}
              <span className="tab__count">{services.filter((service) => service.status === item.key).length}</span>
            </Link>
          ))}
        </nav>

        {visible.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Servicio</th>
                  <th scope="col">Profesional</th>
                  <th scope="col">Categoría</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Duración</th>
                  <th scope="col">Enviado</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((service) => {
                  const name = service.worker?.user?.name ?? "Trabajador";
                  return (
                    <tr key={service.id}>
                      <td className="table__main">
                        <strong>{service.name}</strong>
                      </td>
                      <td data-label="Profesional">
                        <div className="row">
                          <Avatar name={name} round size="sm" src={service.worker?.user?.avatarUrl} />
                          <span>{name}</span>
                        </div>
                      </td>
                      <td data-label="Categoría">
                        <span className="chip chip--sage">{service.category.name}</span>
                      </td>
                      <td data-label="Precio">{formatCOP(Number(service.price))}</td>
                      <td data-label="Duración">{durationLabel(service.durationMinutes)}</td>
                      <td data-label="Enviado">{formatShortDate(service.submittedAt ?? service.createdAt)}</td>
                      <td data-label="Estado">
                        <StatusChip kind="service" status={service.status} />
                      </td>
                      <td className="table__actions">
                        <Link className={`btn btn--sm ${tab === "in_review" ? "btn--primary" : "btn--secondary"}`} href={`/admin/services/${service.id}`}>
                          {tab === "in_review" ? "Revisar" : "Ver detalle"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="briefcase" title="No hay servicios en este estado" />
        )}
      </div>
    </div>
  );
}
