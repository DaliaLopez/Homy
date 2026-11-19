import Link from "next/link";
import { formatLongDate, formatShortDate } from "@/lib/format";
import { deadlineOf } from "@/lib/report-utils";
import type { Report } from "@/types/report";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import PageHeader from "@/shared/ui/page-header";
import StatusChip from "@/shared/ui/status-chip";
import RespondForm from "./respond-form";

type Props = {
  base: string;
  home: string;
  tab: "hechos por mi" | "recibidos";
  made: Report[];
  received: Report[];
};

const isOpen = (report: Report) => report.status === "pending" || report.status === "investigating";

/** Mis reportes: pestañas hechos / recibidos, crear reporte y responder a uno recibido. */
export default function ReportsView({ base, home, tab, made, received }: Props) {
  const visible = tab === "hechos por mi" ? made : received;

  return (
    <div className="stack stack--lg">
      <PageHeader
        backHref={home}
        backLabel="Perfil"
        description="Reportes que hiciste y los que recibiste. El administrador los revisa."
        eyebrow="Reportes"
        title="Mis reportes"
      />

      <div className="stack stack--lg">
        <div className="row row--between row--wrap">
          <nav aria-label="Tipo de reporte" className="tabs" style={{ marginInline: 0, padding: 0 }}>
            <Link aria-current={tab === "hechos por mi" ? "page" : undefined} className={`tab${tab === "hechos por mi" ? " is-active" : ""}`} href={base}>
              Hechos por mí
              <span className="tab__count">{made.length}</span>
            </Link>
            <Link aria-current={tab === "recibidos" ? "page" : undefined} className={`tab${tab === "recibidos" ? " is-active" : ""}`} href={`${base}?tab=recibidos`}>
              Recibidos
              <span className="tab__count">{received.length}</span>
            </Link>
          </nav>
          <Link className="btn btn--primary btn--sm" href={`${base}/new`}>
            <Icon name="plus" size={16} /> Nuevo reporte
          </Link>
        </div>

        {visible.length ? (
          <div className="grid grid--2">
            {visible.map((report) => (
              <article className="card card--lg" key={report.id}>
                <div className="row row--between row--wrap">
                  <StatusChip kind="report" status={report.status} />
                  <span className="text-xs muted">{formatShortDate(report.createdAt)}</span>
                </div>
                <div>
                  <h3>{report.reason}</h3>
                  <p className="text-sm muted" style={{ marginTop: 4 }}>
                    {report.request?.serviceName ?? "Servicio"} ·{" "}
                    {tab === "hechos por mi" ? `Reportaste a ${report.reportedUser?.name ?? "—"}` : `${report.reporter?.name ?? "Alguien"} te reportó`}
                  </p>
                </div>
                <p className="text-sm" style={{ lineHeight: 1.6 }}>
                  {report.description}
                </p>
                {report.evidence.length > 0 && (
                  <span className="meta__item text-sm muted">
                    <Icon name="image" size={16} />
                    {report.evidence.length} {report.evidence.length === 1 ? "archivo de evidencia" : "archivos de evidencia"}
                  </span>
                )}
                {report.response && (
                  <div className="notice notice--neutral">
                    <Icon name="chat" size={18} />
                    <span>
                      <strong>{tab === "recibidos" ? "Tu respuesta" : "Respuesta"}:</strong> {report.response}
                    </span>
                  </div>
                )}
                {!isOpen(report) && (
                  <div className="notice">
                    <Icon name="checkCircle" size={18} />
                    <span>
                      <strong>Decisión:</strong>{" "}
                      {report.resolution ?? (report.status === "dismissed" ? "El administrador descartó el reporte." : "El administrador cerró el caso.")}
                    </span>
                  </div>
                )}
                {tab === "recibidos" && !report.response && isOpen(report) && (
                  <RespondForm deadline={formatLongDate(deadlineOf(report))} description={report.description} id={report.id} />
                )}
                {tab === "hechos por mi" && (
                  <Link className="link-more" href={`${base}/${report.id}`}>
                    Ver detalle <Icon name="chevronRight" size={16} />
                  </Link>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon="flag" title={tab === "hechos por mi" ? "No has hecho reportes" : "No tienes reportes"}>
            {tab === "hechos por mi" ? "Si tuviste un problema con un servicio, cuéntanos." : "Nadie te ha reportado."}
          </EmptyState>
        )}
      </div>
    </div>
  );
}
