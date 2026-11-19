"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { homyFetch, homySend } from "@/lib/homy-api";
import { requireRole } from "@/lib/session";
import type { FormState } from "@/shared/actions/auth";

// Acciones de solicitudes que solo hace el cliente.

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

// Horarios libres reales del profesional para el servicio elegido (horas enteras). 
export async function getFreeSlots(workerId: string, serviceId: string, date: string) {
  await requireRole("user");
  const response = await homyFetch(`/availability/worker/${workerId}/slots?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`);
  if (!response?.ok) return { slots: [] as string[], taken: [] as string[], durationHours: 0, error: "No pudimos consultar la disponibilidad." };
  const data = (await response.json()) as { slots: string[]; taken?: string[]; durationHours: number };
  return { slots: data.slots, taken: data.taken ?? [], durationHours: data.durationHours };
}

export async function createRequest(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("user");
  const date = text(formData, "date");
  const time = text(formData, "time");
  if (!text(formData, "serviceId")) return { error: "Elige el servicio que necesitas." };
  if (!date || !time) return { error: "Elige el día y la hora del servicio." };
  if (text(formData, "address").length < 5) return { error: "Escribe la dirección completa." };
  if (text(formData, "description").length < 10) return { error: "Cuéntale al profesional qué necesitas (mínimo 10 caracteres)." };

  const result = await homySend<{ id: string }>("/requests", "POST", {
    workerId: text(formData, "workerId"),
    serviceId: text(formData, "serviceId"),
    // Hora de Colombia (UTC-5) para que coincida con la agenda del profesional.
    scheduledAt: `${date}T${time}:00-05:00`,
    address: text(formData, "address"),
    description: text(formData, "description"),
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/my/requests", "layout");
  redirect(`/my/requests/${result.data.id}?nuevo=1`);
}

//El cliente califica al profesional al terminar. 
export async function reviewWorker(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("user");
  const rating = Number(formData.get("rating"));
  if (!(rating >= 1 && rating <= 5)) return { error: "Elige de 1 a 5 estrellas." };
  const result = await homySend("/reviews", "POST", {
    requestId: text(formData, "id"),
    rating,
    ...(text(formData, "comment") ? { comment: text(formData, "comment") } : {}),
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/my/requests", "layout");
  return { ok: "¡Gracias por tu calificación!" };
}
