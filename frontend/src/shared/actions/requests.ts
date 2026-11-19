"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { homySend } from "@/lib/homy-api";
import { requireRole } from "@/lib/session";
import type { FormState } from "./auth";

/**
 * Acciones de solicitudes que hacen cliente Y trabajador.
 * Las de un solo rol están en:
 *   - app/(client)/my/_actions/requests.ts  (crear, horarios libres, calificar)
 *   - app/worker/_actions/requests.ts       (aceptar, rechazar, iniciar, completar)
 */

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function viewerBase(formData: FormData) {
  return text(formData, "viewer") === "worker" ? "/worker/requests" : "/my/requests";
}

/** Cancelar con motivo y nota obligatoria (cliente o trabajador). */
export async function cancelRequest(_state: FormState, formData: FormData): Promise<FormState> {
  const viewer = text(formData, "viewer") === "worker" ? "worker" : "user";
  await requireRole(viewer);
  const id = text(formData, "id");
  const reason = text(formData, "reason");
  const note = text(formData, "note");
  if (!reason) return { error: "Elige el motivo de la cancelación." };
  if (note.length < 10) return { error: "La nota debe tener al menos 10 caracteres." };
  const result = await homySend(`/requests/${id}/status`, "PATCH", { status: "cancelled", reason, note });
  if (!result.ok) return { error: result.error };
  revalidatePath(viewerBase(formData), "layout");
  redirect(`${viewerBase(formData)}/${id}`);
}
