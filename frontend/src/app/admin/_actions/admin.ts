"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { homySend } from "@/lib/homy-api";
import { parseFiles } from "@/lib/files";
import { requireRole } from "@/lib/session";
import type { FormState } from "@/shared/actions/auth";

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

/** Envía la decisión por documento y por categoría de una verificación. */
export async function reviewVerification(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = text(formData, "id");
  const result = await homySend(`/verifications/${id}/review`, "PATCH", JSON.parse(text(formData, "decision") || "{}"));
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin", "layout");
  redirect(`/admin/verifications/${id}?enviada=1`);
}

export async function reviewService(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = text(formData, "id");
  const status = text(formData, "status");
  const note = text(formData, "note");
  if (status !== "published" && note.length < 5) return { error: "Escribe un comentario para el trabajador." };
  const result = await homySend(`/services/${id}/review`, "PATCH", { status, ...(note ? { note } : {}) });
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin", "layout");
  redirect(`/admin/services/${id}?revisado=1`);
}

/** Marcar como resuelto o descartar, con lo que se hizo y una nota para las dos partes. */
export async function closeReport(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = text(formData, "id");
  const status = text(formData, "status");
  const actions: string[] = JSON.parse(text(formData, "actions") || "[]");
  const resolution = text(formData, "resolution");
  if (!["resolved", "dismissed"].includes(status)) return { error: "Acción no válida." };
  if (!actions.length) return { error: status === "resolved" ? "Elige qué se hizo." : "Elige por qué se descarta." };
  if (resolution.length < 5) return { error: "Escribe una nota para las dos partes." };
  const result = await homySend(`/reports/${id}/status`, "PATCH", { status, actions: actions.join(" · "), resolution });
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin", "layout");
  redirect(`/admin/reports/${id}`);
}

/** Suspender: la cuenta queda inhabilitada (no puede iniciar sesión) pero no se borra. */
export async function suspendUser(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const reason = text(formData, "reason");
  if (reason.length < 5) return { error: "Escribe el motivo de la suspensión (mínimo 5 caracteres)." };
  const result = await homySend(`/users/${text(formData, "id")}/suspend`, "PATCH", { reason });
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin", "layout");
  return { ok: "La cuenta quedó suspendida." };
}

export async function reactivateUser(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const result = await homySend(`/users/${text(formData, "id")}/reactivate`, "PATCH");
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin", "layout");
  return { ok: "La cuenta está activa de nuevo." };
}

export async function deleteUser(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const result = await homySend(`/users/${text(formData, "id")}`, "DELETE");
  if (!result.ok) return { error: result.error };
  revalidatePath("/admin", "layout");
  return { ok: "Eliminaste la cuenta." };
}

export async function saveUser(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = text(formData, "id");
  const body = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    location: text(formData, "location"),
    role: text(formData, "role"),
  };
  if (body.name.length < 2) return { error: "Escribe el nombre." };
  if (!id) {
    const password = String(formData.get("password") ?? "");
    if (password.length < 15) return { error: "La contraseña debe tener al menos 15 caracteres." };
    if (!body.phone || !body.location) return { error: "Escribe el teléfono y la ubicación." };
    const result = await homySend("/users", "POST", { ...body, password });
    if (!result.ok) return { error: result.error };
  } else {
    const result = await homySend(`/users/${id}`, "PATCH", Object.fromEntries(Object.entries(body).filter(([, value]) => value)));
    if (!result.ok) return { error: result.error };
  }
  revalidatePath("/admin/users");
  return { ok: id ? "Guardamos los cambios." : "Creaste el usuario." };
}

export async function saveCategory(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = text(formData, "id");
  const name = text(formData, "name");
  const description = text(formData, "description");
  const [image] = parseFiles(formData.get("image"));
  if (name.length < 2) return { error: "Escribe el nombre de la categoría." };
  const body = { name, description, ...(image ? { imageUrl: image.dataUrl } : {}) };
  const result = id ? await homySend(`/categories/${id}`, "PATCH", body) : await homySend("/categories", "POST", body);
  if (!result.ok) return { error: result.error };
  revalidatePath("/", "layout");
  return { ok: id ? `Guardamos los cambios de ${name}.` : `Creaste la categoría ${name}.` };
}

export async function toggleCategory(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("admin");
  const id = text(formData, "id");
  const active = text(formData, "active") === "true";
  const result = await homySend(`/categories/${id}/${active ? "deactivate" : "activate"}`, "PATCH");
  if (!result.ok) return { error: result.error };
  revalidatePath("/", "layout");
  return { ok: active ? "Desactivaste la categoría." : "Activaste la categoría." };
}
