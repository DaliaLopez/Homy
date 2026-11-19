import Link from "next/link";
import { notFound } from "next/navigation";
import CloseReport from "@/app/admin/_components/close-report";
import SuspendUser from "@/app/admin/_components/suspend-user";
import Avatar from "@/shared/ui/avatar";
import FilePreview from "@/shared/ui/file-preview";
import Icon from "@/shared/ui/icon";
import PageHeader from "@/shared/ui/page-header";
import StatusChip from "@/shared/ui/status-chip";
import { homyGet } from "@/lib/homy-api";
import { formatLongDate, formatShortDate } from "@/lib/format";
import { deadlineOf, responseExpired } from "@/lib/report-utils";
import { requireRole } from "@/lib/session";
import type { Report } from "@/types/report";
import { roleLabel, type AppUser } from "@/types/user";

/** Detalle del reporte: versión de ambas partes y acciones del administrador. */
export default async function AdminReportDetailPage({ params }: PageProps<"/admin/reports/[id]">) {
  await requireRole("admin");
  const { id } = await params;
  const report = await homyGet<Report | null>(`/reports/${id}`, null);
  if (!report) notFound();
  const reported = await homyGet<AppUser | null>(`/users/${report.reportedUserId}`, null);
  const closed = report.status === "resolved" || report.status === "dismissed";
  const expired = responseExpired(report);
  const reportedName = report.reportedUser?.name ?? "la persona reportada";

  return (
    <div className="stack stack--lg">
      <PageHeader backHref="/admin/reports" backLabel="Reportes" eyebrow="Reporte" title="Revisar reporte" />
      <div className="layout-aside layout-aside--sidebar">
        <div className="stack stack--lg">
          <section className="card card--lg">
            <div className="row row--between row--wrap">
              <StatusChip kind="report" status={report.status} />
              <span className="text-sm muted">{formatShortDate(report.createdAt)}</span>
            </div>
            <h2>{report.reason}</h2>
            <p className="text-sm muted">Servicio: {report.request?.serviceName ?? "—"}</p>
            {/* Lo que escribió quien reporta, con título y alineado a la izquierda con la tarjeta. */}
            <div className="request-notes">
              <h3 className="request-notes__title">Observaciones</h3>
              <p className="request-notes__text">{report.description}</p>
            </div>
            {report.evidence.length ? (
              <div className="stack stack--sm">
                {report.evidence.map((file, index) => (
                  <FilePreview file={file} key={index} />
                ))}
              </div>
            ) : (
              <div className="row">
                <span className="upload" style={{ flex: 1, padding: 16, cursor: "default" }}>
                  <Icon name="camera" size={22} />
                  <span className="text-xs">Sin fotos adjuntas</span>
                </span>
              </div>
            )}
          </section>

          <section className="card card--lg">
            <h3>Versión de {reportedName}</h3>
            {report.response ? (
              <>
                <div className="request-notes">
                  <h4 className="request-notes__title">Observaciones</h4>
                  <p className="request-notes__text">{report.response}</p>
                </div>
                {report.responseEvidence.map((file, index) => (
                  <FilePreview file={file} key={index} />
                ))}
              </>
            ) : expired ? (
              <div className="notice notice--danger">
                <Icon name="clock" size={18} />
                <span>No respondió. El plazo venció el {formatLongDate(deadlineOf(report))}.</span>
              </div>
            ) : (
              <div className="notice notice--neutral">
                <Icon name="clock" size={18} />
                <span>Esperando respuesta. Tiene hasta el {formatLongDate(deadlineOf(report))} para contar su versión.</span>
              </div>
            )}
          </section>
        </div>

        <aside className="stack sticky-aside">
          <section className="card card--lg">
            <p className="eyebrow">Personas</p>
            {[
              { user: report.reporter, role: "Reporta" },
              { user: report.reportedUser, role: `Reportado · ${roleLabel[report.reportedUser?.role ?? "user"]}` },
            ].map((person) => (
              <div className="row" key={person.role}>
                <Avatar name={person.user?.name ?? "?"} round size="sm" src={person.user?.avatarUrl} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{person.user?.name ?? "—"}</strong>
                  <p className="text-xs muted">{person.role}</p>
                </div>
                {person.user && (
                  <Link className="link-more text-xs" href={`/admin/users/${person.user.id}?reporte=${report.id}`}>
                    Ver perfil
                  </Link>
                )}
              </div>
            ))}
          </section>
          {!closed ? (
            <section className="card card--lg card--outline">
              <CloseReport id={report.id} />
              {reported && reported.role !== "admin" && (
                <SuspendUser danger id={reported.id} label={`Suspender a ${reported.name.split(" ")[0]}`} name={reported.name} suspended={reported.status === "suspended"} />
              )}
            </section>
          ) : (
            <section className="card card--lg">
              <p className="notice">
                <Icon name="checkCircle" size={18} /> Este reporte ya está cerrado.
              </p>
              <div className="list">
                <div className="list-row">
                  <span className="muted">{report.status === "resolved" ? "Qué se hizo" : "Motivo"}</span>
                  <span className="strong" style={{ textAlign: "right" }}>
                    {report.resolutionActions ?? "—"}
                  </span>
                </div>
                {report.closedAt && (
                  <div className="list-row">
                    <span className="muted">Cerrado</span>
                    <span className="strong">{formatShortDate(report.closedAt)}</span>
                  </div>
                )}
              </div>
              {report.resolution && <p className="text-sm">“{report.resolution}”</p>}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
