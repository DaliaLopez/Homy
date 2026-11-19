import type { Category } from "./category";

export type ServiceStatus = "in_review" | "published" | "changes_requested" | "rejected";

export type Service = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  durationMinutes: number;
  isActive: boolean;
  status: ServiceStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  category: Pick<Category, "id" | "name">;
  worker?: { id: string; user?: { id: string; name: string; location: string | null; avatarUrl: string | null } };
};

export const serviceStatusLabel: Record<ServiceStatus, string> = {
  published: "Publicado",
  in_review: "En revisión",
  changes_requested: "Requiere cambios",
  rejected: "No aprobado",
};
