import type { StoredFile } from "./file";

export type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";

type Person = { id: string; name: string; role: "user" | "worker" | "admin"; avatarUrl: string | null };

export type Report = {
  id: string;
  reason: string;
  description: string;
  status: ReportStatus;
  reporter: Person;
  reportedUser: Person;
  reportedUserId: string;
  requestId: string;
  evidence: StoredFile[];
  response: string | null;
  responseEvidence: StoredFile[];
  respondedAt: string | null;
  resolutionActions: string | null;
  resolution: string | null;
  closedAt: string | null;
  createdAt: string;
  request: { id: string; scheduledAt: string; serviceName: string | null } | null;
};

export const reportStatusLabel: Record<ReportStatus, string> = {
  pending: "Pendiente",
  investigating: "En investigación",
  resolved: "Resuelto",
  dismissed: "Descartado",
};

/** Motivos para reportar, según quién reporta. */
export const workerReportReasons = [
  "El cliente no estuvo",
  "Trato irrespetuoso",
  "No pagó o pagó incompleto",
  "Pidió trabajos no acordados",
  "Canceló cuando ya iba en camino",
  "Otro motivo",
];

export const clientReportReasons = [
  "El profesional no llegó",
  "Trato irrespetuoso",
  "Cobró más de lo acordado",
  "Trabajo incompleto o mal hecho",
  "Canceló a última hora",
  "Otro motivo",
];

/** Días que tiene la persona reportada para dar su versión. */
export const RESPONSE_DAYS = 4;
