import "server-only";
import type { AppNotification } from "@/shared/layout/notifications-bell";
import type { Role } from "@/types/user";
import { decisionMessage } from "./category-decisions";
import { getAdminVerifications, getAllReports, getMyRequests, getMyServices, getMyVerifications, getReceivedRequests, getServicesForReview } from "./data";
import { firstName, relativeDay } from "./format";

const recent = (date: string) => Date.now() - new Date(date).getTime() < 3 * 86_400_000;

/**
 * La campana conserva el mismo diseño; sus avisos salen de los datos reales
 * de cada rol (la API no tiene un módulo de notificaciones propio).
 */
export async function getNotifications(role: Role): Promise<AppNotification[]> {
  if (role === "user") {
    const requests = await getMyRequests();
    return requests
      .filter((item) => item.status !== "requested")
      .slice(0, 6)
      .map((item) => {
        const who = firstName(item.worker?.name ?? "El profesional");
        const service = item.service?.name ?? "tu servicio";
        const text: Record<string, string> = {
          accepted: `${who} confirmó ${service}.`,
          in_progress: `${who} empezó ${service}.`,
          completed: item.review ? `Calificaste ${service}.` : `${service} terminó. Califica a ${who}.`,
          rejected: `${who} no pudo tomar ${service}.`,
          cancelled: item.cancelledBy === "worker" ? `${who} canceló ${service}.` : `Cancelaste ${service}.`,
          expired: `La solicitud de ${service} venció.`,
        };
        return {
          id: item.id,
          title: "Mis servicios",
          body: text[item.status] ?? service,
          when: relativeDay(item.updatedAt),
          href: `/my/requests/${item.id}`,
          unread: recent(item.updatedAt),
        };
      });
  }

  if (role === "worker") {
    const [requests, verifications, services] = await Promise.all([getReceivedRequests(), getMyVerifications(), getMyServices()]);
    const items: (AppNotification & { at: string })[] = [];

    for (const item of requests) {
      if (item.status !== "requested" && !(item.status === "cancelled" && item.cancelledBy === "client")) continue;
      items.push({
        id: item.id,
        title: item.status === "requested" ? "Nueva solicitud" : "Servicio cancelado",
        body:
          item.status === "requested"
            ? `${item.client?.name ?? "Un cliente"} solicitó ${item.service?.name ?? "un servicio"}.`
            : `${item.client?.name ?? "El cliente"} canceló ${item.service?.name ?? "un servicio"}.`,
        when: relativeDay(item.updatedAt),
        href: `/worker/requests/${item.id}`,
        unread: recent(item.updatedAt),
        at: item.updatedAt,
      });
    }

    // Decisiones del administrador sobre la verificación y las categorías.
    for (const verification of verifications) {
      const at = verification.reviewedAt;
      if (!at) continue;
      if (verification.type === "initial" && verification.documents.some((doc) => doc.status === "rejected")) {
        items.push({
          id: `v-${verification.id}`,
          title: "Verificación",
          body: "El administrador pidió correcciones en tus documentos.",
          when: relativeDay(at),
          href: "/worker/verification",
          unread: recent(at),
          at,
        });
      }
      for (const category of verification.categories) {
        if (category.status === "pending") continue;
        const approved = category.status === "approved";
        const reason = approved ? "" : decisionMessage(category);
        items.push({
          id: `v-${verification.id}-${category.categoryId}`,
          title: approved ? "Categoría aprobada" : "Categoría no aprobada",
          body: approved ? `Ya puedes publicar servicios de ${category.name}.` : `${category.name}: ${reason || "revisa tu evidencia y vuelve a enviarla."}`,
          when: relativeDay(at),
          href: "/worker/profile",
          unread: recent(at),
          at,
        });
      }
    }

    // Decisiones del administrador sobre los servicios enviados a revisión.
    for (const service of services) {
      const at = service.reviewedAt;
      if (!at || service.status === "in_review") continue;
      const text = {
        published: { title: "Servicio aprobado", body: `${service.name} ya está publicado.` },
        changes_requested: { title: "Servicio con cambios", body: `${service.name}: ${service.reviewNote || "el administrador pidió cambios."}` },
        rejected: { title: "Servicio no aprobado", body: `${service.name}: ${service.reviewNote || "el administrador no lo aprobó."}` },
      }[service.status];
      items.push({ id: `s-${service.id}`, ...text, when: relativeDay(at), href: `/worker/services/${service.id}`, unread: recent(at), at });
    }

    return items
      .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
      .slice(0, 8)
      .map(({ id, title, body, when, href, unread }) => ({ id, title, body, when, href, unread }));
  }

  const [verifications, services, reports] = await Promise.all([getAdminVerifications(), getServicesForReview(), getAllReports()]);
  const items: AppNotification[] = [];
  const pendingVerifications = verifications.filter((item) => item.status === "pending").length;
  const pendingServices = services.filter((item) => item.status === "in_review").length;
  const openReports = reports.filter((item) => item.status === "pending" || item.status === "investigating").length;
  if (pendingVerifications)
    items.push({ id: "v", title: "Verificaciones", body: `${pendingVerifications} por revisar.`, when: "Ahora", href: "/admin/verifications", unread: true });
  if (pendingServices)
    items.push({ id: "s", title: "Servicios", body: `${pendingServices} esperando aprobación.`, when: "Ahora", href: "/admin/services", unread: true });
  if (openReports) items.push({ id: "r", title: "Reportes", body: `${openReports} sin resolver.`, when: "Ahora", href: "/admin/reports", unread: true });
  return items;
}
