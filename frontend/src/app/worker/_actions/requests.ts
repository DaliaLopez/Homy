"use server";

import { revalidatePath } from "next/cache";
import { homySend } from "@/lib/homy-api";
import { requireRole } from "@/lib/session";
import type { FormState } from "@/shared/actions/auth";

/** Acciones de solicitudes que solo hace el trabajador. */

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

/** Aceptar, rechazar, iniciar o completar. */
export async function changeRequestStatus(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("worker");
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!["accepted", "rejected", "in_progress", "completed"].includes(status)) return { error: "Acción no válida." };
  const result = await homySend(`/requests/${id}/status`, "PATCH", { status });
  if (!result.ok) return { error: result.error };
  revalidatePath("/worker", "layout");
  const messages: Record<string, string> = {
    accepted: "Aceptaste la solicitud. El cliente ya recibió la confirmación.",
    rejected: "Rechazaste la solicitud.",
    in_progress: "Iniciaste el servicio.",
    completed: "Marcaste el servicio como completado.",
  };
  return { ok: messages[status] };
}
