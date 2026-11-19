import { formatShortDate, relativeDay } from "@/lib/format";
import type { Report } from "@/types/report";
import FilePreview from "@/shared/ui/file-preview";
import Icon from "@/shared/ui/icon";
import Notice from "@/shared/ui/notice";
import PageHeader from "@/shared/ui/page-header";
import StatusChip from "@/shared/ui/status-chip";

const updates: Record<Report["status"], string> = {
  pending: "Tu reporte fue recibido y será revisado por el equipo de soporte.",
  investigating: "El administrador está revisando el caso y la versión de la otra persona.",
  resolved: "El administrador resolvió el caso.",
  dismissed: "El administrador descartó el reporte.",
};

/** Detalle de un reporte que hice. */
export default function ReportDetail({ report, base, created }: { report: Report; base: string; created?: boolean }) {
  return (
    <div className="stack stack--lg">
      <PageHeader backHref={base} backLabel="Mis reportes" eyebrow="Reporte" title="Detalle del reporte" />
      {created && <Notice>Enviamos tu reporte. El equipo de Homy lo revisará.</Notice>}
      <div className="layout-aside layout-aside--sidebar">
        <section className="card card--lg">
          <div className="row row--between row--wrap">
            <StatusChip kind="report" status={report.status} />
            <span className="text-sm muted">Creado {relativeDay(report.createdAt).toLowerCase()}</span>
          </div>
          <h2>{report.reason}</h2>
          <p className="text-sm muted">Caso #{report.id.slice(0, 6).toUpperCase()}</p>
          {/* Lo que escribió quien reporta, alineado a la izquierda con el resto de la tarjeta. */}
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
            <p className="text-sm muted">Sin evidencia adjunta</p>
          )}
          <div className={report.status === "resolved" || report.status === "dismissed" ? "notice" : "notice notice--neutral"}>
            <Icon name={report.status === "resolved" || report.status === "dismissed" ? "checkCircle" : "clock"} size={18} />
            <span>
              <strong>Última actualización:</strong> {report.resolution ?? updates[report.status]}
              {report.resolutionActions && ` · ${report.resolutionActions}`}
            </span>
          </div>
        </section>
        <aside className="card card--lg sticky-aside">
          <p className="eyebrow">Servicio relacionado</p>
          <div className="list">
            <div className="list-row">
              <span className="muted">{report.reportedUser?.role === "worker" ? "Profesional" : "Cliente"}</span>
              <span className="strong">{report.reportedUser?.name ?? "—"}</span>
            </div>
            <div className="list-row">
              <span className="muted">Servicio</span>
              <span className="strong">{report.request?.serviceName ?? "—"}</span>
            </div>
            <div className="list-row">
              <span className="muted">Fecha</span>
              <span className="strong">{formatShortDate(report.createdAt)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
