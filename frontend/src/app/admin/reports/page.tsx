import type { Metadata } from "next";
import Link from "next/link";
import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import PageHeader from "@/shared/ui/page-header";
import StatusChip from "@/shared/ui/status-chip";
import { getAllReports } from "@/lib/data";
import { formatShortDate } from "@/lib/format";
import { requireRole } from "@/lib/session";
import type { Report } from "@/types/report";
import { roleLabel } from "@/types/user";

export const metadata: Metadata = { title: "Reportes" };

const filters = {
  open: { label: "Sin resolver", matches: (report: Report) => report.status === "pending" },
  waiting: { label: "En revisión", matches: (report: Report) => report.status === "investigating" },
  resolved: { label: "Resueltos", matches: (report: Report) => report.status === "resolved" || report.status === "dismissed" },
};
type Filter = keyof typeof filters;

/** Reportes (administración) con filtros por estado, en tabla como Usuarios y Verificaciones. */
export default async function AdminReportsPage({ searchParams }: PageProps<"/admin/reports">) {
  await requireRole("admin");
  const [{ estado }, reports] = await Promise.all([searchParams, getAllReports()]);
  // Compatibilidad con los enlaces del panel (?estado=pending|resolved|dismissed).
  const alias: Record<string, Filter> = { pending: "open", investigating: "waiting", dismissed: "resolved" };
  const key = typeof estado === "string" ? (alias[estado] ?? estado) : "open";
  const filter: Filter = key in filters ? (key as Filter) : "open";
  const visible = reports.filter(filters[filter].matches);

  return (
    <div className="stack stack--lg">
      <PageHeader
        description="Escucha a ambas partes antes de resolver. El reportado puede contar su versión."
        eyebrow="Reportes"
        title="Reportes de la comunidad"
      />
      <div className="stack stack--lg">
        <nav aria-label="Filtrar reportes" className="tabs">
          {(Object.keys(filters) as Filter[]).map((value) => (
            <Link
              aria-current={filter === value ? "page" : undefined}
              className={`tab${filter === value ? " is-active" : ""}`}
              href={`/admin/reports?estado=${value}`}
              key={value}
            >
              {filters[value].label}
              <span className="tab__count">{reports.filter(filters[value].matches).length}</span>
            </Link>
          ))}
        </nav>

        {visible.length ? (
          // Tabla como Usuarios y Verificaciones (en móvil cada fila se ve como tarjeta).
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Motivo</th>
                  <th scope="col">Reporta</th>
                  <th scope="col">Reportado</th>
                  <th scope="col">Respuesta</th>
                  <th scope="col">Creado</th>
                  <th scope="col">Estado</th>
                  <th scope="col">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((report) => (
                  <tr key={report.id}>
                    <td className="table__main">
                      <strong style={{ display: "block" }}>{report.reason}</strong>
                      <span className="text-xs muted">{report.request?.serviceName ?? "Servicio"}</span>
                    </td>
                    <td data-label="Reporta">
                      <div className="row">
                        <Avatar name={report.reporter?.name ?? "—"} round size="sm" />
                        <strong>{report.reporter?.name ?? "—"}</strong>
                      </div>
                    </td>
                    <td data-label="Reportado">
                      <div className="row">
                        <Avatar name={report.reportedUser?.name ?? "—"} round size="sm" />
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ display: "block" }}>{report.reportedUser?.name ?? "—"}</strong>
                          <span className="text-xs muted">{roleLabel[report.reportedUser?.role ?? "user"]}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Respuesta">
                      {report.response ? (
                        <span className="chip chip--sage">
                          <Icon name="chat" size={14} /> Con respuesta
                        </span>
                      ) : (
                        <span className="chip chip--neutral">
                          <Icon name="clock" size={14} /> Esperando
                        </span>
                      )}
                    </td>
                    <td data-label="Creado">{formatShortDate(report.createdAt)}</td>
                    <td data-label="Estado">
                      <StatusChip kind="report" status={report.status} />
                    </td>
                    <td className="table__actions">
                      <Link className={`btn btn--sm ${filter === "resolved" ? "btn--secondary" : "btn--primary"}`} href={`/admin/reports/${report.id}`}>
                        {filter === "resolved" ? "Ver detalle" : "Revisar"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="flag" title="No hay reportes aquí" />
        )}
      </div>
    </div>
  );
}
