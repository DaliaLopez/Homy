export type RequestStatus = "requested" | "accepted" | "in_progress" | "completed" | "rejected" | "cancelled" | "expired";

export type ServiceRequest = {
  id: string;
  description: string;
  scheduledAt: string;
  address: string;
  price: number | string;
  status: RequestStatus;
  workerId: string;
  serviceId: string;
  cancellationReason: string | null;
  cancellationNote: string | null;
  cancelledBy: "client" | "worker" | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: string; name: string; phone: string | null; location: string | null; avatarUrl: string | null } | null;
  service: { id: string; name: string; durationMinutes: number; category: { id: string; name: string } | null } | null;
  worker: { id: string; userId: string; name: string; phone: string | null; avatarUrl: string | null } | null;
  review: { rating: number; comment: string | null } | null;
};

export const requestStatusLabel: Record<RequestStatus, string> = {
  requested: "Solicitado",
  accepted: "Confirmado",
  in_progress: "En proceso",
  completed: "Completado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
  expired: "Vencido",
};

/** Pestañas de "Mis servicios" y "Solicitudes", en el orden de los diseños. */
export const requestTabs: { key: "all" | RequestStatus; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "requested", label: "Solicitado" },
  { key: "accepted", label: "Confirmado" },
  { key: "in_progress", label: "En proceso" },
  { key: "completed", label: "Completado" },
  { key: "cancelled", label: "Cancelado" },
];
