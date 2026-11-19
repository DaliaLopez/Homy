import type { Metadata } from "next";
import Link from "next/link";
import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import PageHeader from "@/shared/ui/page-header";
import StatusChip from "@/shared/ui/status-chip";
import { getAdminVerifications } from "@/lib/data";
import { cityOf, formatShortDate } from "@/lib/format";
import { requireRole } from "@/lib/session";
import type { Verification } from "@/types/verification";

export const metadata: Metadata = { title: "Verificaciones" };

const tabs = [
  { key: "pending", label: "Pendientes" },
  { key: "verified", label: "Aprobadas" },
  { key: "rejected", label: "Rechazadas" },
] as const;

const inTab = (item: Verification, key: string) => (key === "rejected" ? ["rejected", "changes_requested"].includes(item.status) : item.status === key);

/** Verificaciones por estado, en tabla como Usuarios (en móvil cada fila se ve como tarjeta). */
export default async function AdminVerificationsPage({ searchParams }: PageProps<"/admin/verifications">) {
  await requireRole("admin");
  const [{ estado }, verifications] = await Promise.all([searchParams, getAdminVerifications()]);
  const tab = tabs.find((item) => item.key === estado)?.key ?? "pending";
  const visible = verifications.filter((item) => inTab(item, tab));

  return (
    <div className="stack stack--lg">
      <PageHeader
        description="Revisa los documentos de cada profesional y aprueba sus categorías por separado."
        eyebrow="Verificaciones"
        title="Verificaciones de profesionales"
      />
      <div className="stack stack--lg">
        <nav aria-label="Filtrar por estado" className="tabs">
          {tabs.map((item) => (
            <Link aria-current={tab === item.key ? "page" : undefined} className={`tab${tab === item.key ? " is-active" : ""}`} href={`/admin/verifications?estado=${item.key}`} key={item.key}>
              {item.label}
              <span className="tab__count">{verifications.filter((verification) => inTab(verification, item.key)).length}</span>
            </Link>
          ))}
        </nav>

        {visible.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Profesional</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Categorías</th>
                  <th scope="col">Enviada</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const name = item.worker?.user.name ?? "Trabajador";
                  return (
                    <tr key={item.id}>
                      <td className="table__main">
                        <div className="row">
                          <Avatar name={name} round size="sm" />
                          <div style={{ minWidth: 0 }}>
                            <strong style={{ display: "block" }}>{name}</strong>
                            <span className="text-xs muted">{cityOf(item.worker?.user.location)}</span>
                          </div>
                        </div>
                      </td>
                      <td data-label="Tipo">
                        <span className={`chip ${item.type === "category" ? "chip--olive" : "chip--dark"}`}>
                          {item.type === "category" ? "Nueva categoría" : "Verificación inicial"}
                        </span>
                      </td>
                      <td data-label="Categorías">{item.categories.map((category) => category.name).join(", ")}</td>
                      <td data-label="Enviada">{formatShortDate(item.createdAt)}</td>
                      <td data-label="Estado">
                        <StatusChip kind="verification" status={item.status} />
                      </td>
                      <td className="table__actions">
                        <Link className={`btn btn--sm ${item.status === "pending" ? "btn--primary" : "btn--secondary"}`} href={`/admin/verifications/${item.id}`}>
                          {item.status === "pending" ? "Revisar" : "Ver detalle"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="shield" title="No hay verificaciones en este estado" />
        )}
      </div>
    </div>
  );
}
