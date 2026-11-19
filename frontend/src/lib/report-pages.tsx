import "server-only";
import { notFound, redirect } from "next/navigation";
import EmptyState from "@/shared/ui/empty-state";
import Link from "next/link";
import Icon from "@/shared/ui/icon";
import ReportDetail from "@/shared/reports/report-detail";
import ReportForm, { type ReportableRequest } from "@/shared/reports/report-form";
import ReportsView from "@/shared/reports/reports-view";
import type { Report } from "@/types/report";
import type { ServiceRequest } from "@/types/request";
import { getReportsMade, getReportsReceived } from "./data";
import { homyGet } from "./homy-api";
import { getSessionUser } from "./session";

// Las tres pantallas de reportes son iguales para cliente y trabajador;
// cambia la ruta base y con quién se relaciona cada solicitud.

export async function ReportsListPage({ role, tab }: { role: "user" | "worker"; tab?: string | string[] }) {
  const [made, received] = await Promise.all([getReportsMade(), getReportsReceived()]);
  const base = role === "worker" ? "/worker/reports" : "/my/reports";
  return (
    <ReportsView
      base={base}
      home={role === "worker" ? "/worker/profile" : "/my/profile"}
      made={made}
      received={received}
      tab={tab === "recibidos" ? "recibidos" : "hechos por mi"}
    />
  );
}

export async function NewReportPage({ role, requests, solicitud }: { role: "user" | "worker"; requests: ServiceRequest[]; solicitud?: string | string[] }) {
  const base = role === "worker" ? "/worker/reports" : "/my/reports";
  // Solo se reportan servicios completados.
  const reportable: ReportableRequest[] = requests
    .filter((item) => item.status === "completed")
    .map((item) =>
      role === "worker"
        ? {
            id: item.id,
            otherUserId: item.client?.id ?? "",
            otherName: item.client?.name ?? "Cliente",
            otherPhoto: item.client?.avatarUrl ?? null,
            serviceName: item.service?.name ?? "Servicio",
            date: item.scheduledAt,
          }
        : {
            id: item.id,
            otherUserId: item.worker?.userId ?? "",
            otherName: item.worker?.name ?? "Profesional",
            otherPhoto: item.worker?.avatarUrl ?? null,
            serviceName: item.service?.name ?? "Servicio",
            date: item.scheduledAt,
          },
    )
    .filter((item) => item.otherUserId);
  // Desde el detalle del servicio llega ?solicitud=ID: ese servicio queda fijo y "volver" regresa al detalle.
  const fromDetail = typeof solicitud === "string" && reportable.some((item) => item.id === solicitud) ? solicitud : undefined;
  const backHref = fromDetail ? `${role === "worker" ? "/worker/requests" : "/my/requests"}/${fromDetail}` : base;

  return (
    <div className="stack stack--lg">
      <header className="report-head">
        <Link aria-label={fromDetail ? "Volver al servicio" : "Volver a mis reportes"} className="report-head__back" href={backHref}>
          <Icon name="arrowLeft" size={20} />
        </Link>
        <div>
          <h1 className="title-xl">Reportar un problema</h1>
          <p className="lead">Cuéntanos qué pasó con {role === "worker" ? "un cliente" : "un profesional"}. El administrador lo revisará.</p>
        </div>
      </header>
      {reportable.length ? (
        <div className="report-layout">
          <ReportForm initialId={fromDetail} locked={Boolean(fromDetail)} requests={reportable} role={role} />
          <aside className="report-tips">
            <p className="eyebrow">Qué sirve como evidencia</p>
            <ul>
              <li>Capturas del chat o de llamadas</li>
              <li>Fotos del lugar o del trabajo</li>
              <li>Comprobantes de pago</li>
            </ul>
            <p className="report-tips__note">No es obligatoria, pero ayuda a resolver más rápido.</p>
          </aside>
        </div>
      ) : (
        <EmptyState icon="calendar" title="Aún no tienes servicios para reportar">
          Podrás reportar un problema cuando tengas un servicio completado.
        </EmptyState>
      )}
    </div>
  );
}

export async function ReportDetailPage({ role, id, nuevo }: { role: "user" | "worker"; id: string; nuevo?: string | string[] }) {
  const base = role === "worker" ? "/worker/reports" : "/my/reports";
  const [report, user] = await Promise.all([homyGet<Report | null>(`/reports/${id}`, null), getSessionUser()]);
  if (!report) notFound();
  if (report.reporter?.id !== user?.id) redirect(`${base}?tab=recibidos`);
  return <ReportDetail base={base} created={nuevo === "1"} report={report} />;
}
