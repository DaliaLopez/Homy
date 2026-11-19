import { RESPONSE_DAYS, type Report } from "@/types/report";

/** Fecha límite para que la persona reportada dé su versión. */
export function deadlineOf(report: Report) {
  const date = new Date(report.createdAt);
  date.setDate(date.getDate() + RESPONSE_DAYS);
  return date;
}

export function responseLabel(report: Report) {
  if (report.response) return "Respondió";
  if (report.status === "resolved" || report.status === "dismissed" || deadlineOf(report).getTime() < Date.now()) return "No respondió";
  return "Esperando respuesta";
}

/** Venció el plazo sin que la persona reportada respondiera. */
export function responseExpired(report: Report) {
  return !report.response && deadlineOf(report).getTime() < Date.now();
}
