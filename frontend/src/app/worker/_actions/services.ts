"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { homySend } from "@/lib/homy-api";
import { requireRole } from "@/lib/session";
import type { FormState } from "@/shared/actions/auth";

function readService(formData: FormData) {
  return {
    categoryId: String(formData.get("categoryId") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: Number(String(formData.get("price") ?? "").replace(/\D/g, "")),
    durationMinutes: Number(formData.get("hours") ?? 0) * 60,
  };
}

function validate(service: ReturnType<typeof readService>) {
  if (!service.categoryId) return "Elige una de tus categorías verificadas.";
  if (service.name.length < 3) return "Escribe el nombre del servicio.";
  if (!(service.price > 0)) return "Escribe el precio del servicio.";
  if (service.description.length < 10) return "La descripción debe tener al menos 10 caracteres.";
  if (!(service.durationMinutes >= 60)) return "Elige la duración estimada.";
  return null;
}

export async function createService(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("worker");
  const service = readService(formData);
  const error = validate(service);
  if (error) return { error };
  const result = await homySend<{ id: string }>("/services", "POST", service);
  if (!result.ok) return { error: result.error };
  revalidatePath("/worker", "layout");
  redirect(`/worker/services/${result.data.id}`);
}

export async function updateService(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("worker");
  const id = String(formData.get("id"));
  const service = readService(formData);
  const error = validate(service);
  if (error) return { error };
  const result = await homySend(`/services/${id}`, "PATCH", service);
  if (!result.ok) return { error: result.error };
  revalidatePath("/worker", "layout");
  redirect(`/worker/services/${id}`);
}

export async function deleteService(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("worker");
  const result = await homySend(`/services/${String(formData.get("id"))}`, "DELETE");
  if (!result.ok) return { error: result.error };
  revalidatePath("/worker", "layout");
  return { ok: "Eliminaste el servicio." };
}
