"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { homySend } from "@/lib/homy-api";
import { parseFiles } from "@/lib/files";
import { requireRole } from "@/lib/session";
import type { FormState } from "@/shared/actions/auth";

const DOCS = ["profile", "id", "selfie"] as const;

function readCategories(formData: FormData) {
  const ids: string[] = JSON.parse(String(formData.get("categories") ?? "[]"));
  return ids.map((categoryId) => ({
    categoryId,
    note: String(formData.get(`note-${categoryId}`) ?? "").trim() || undefined,
    files: parseFiles(formData.get(`files-${categoryId}`)),
  }));
}

/** Primera verificación: documentos generales + categorías con evidencia. */
export async function submitVerification(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("worker");
  const documents = DOCS.map((key) => ({ key, file: parseFiles(formData.get(`doc-${key}`))[0] }));
  if (documents.some((doc) => !doc.file)) return { error: "Sube la foto de perfil, la cédula y la foto con tu cédula." };
  const categories = readCategories(formData);
  if (!categories.length) return { error: "Elige al menos una categoría." };
  if (categories.some((cat) => !cat.files.length)) return { error: "Cada categoría necesita al menos una evidencia." };
  const description = String(formData.get("description") ?? "").trim();
  if (description.length < 10) return { error: "Escribe una descripción de al menos 10 caracteres." };
  const years = String(formData.get("experience") ?? "").trim();

  const result = await homySend("/verifications", "POST", {
    type: "initial",
    description,
    ...(years ? { experience: /^\d+$/.test(years) ? `${years} años de experiencia` : years } : {}),
    documents,
    categories,
  });
  if (!result.ok) return { error: result.error };
  revalidatePath("/worker", "layout");
  redirect("/worker?enviado=1");
}

/** Reenvío después de que el administrador pidió correcciones. */
export async function resubmitVerification(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("worker");
  const id = String(formData.get("id"));
  const docKeys: string[] = JSON.parse(String(formData.get("docKeys") ?? "[]"));
  const documents = docKeys.map((key) => ({ key, file: parseFiles(formData.get(`doc-${key}`))[0] })).filter((doc) => doc.file);
  const categories = readCategories(formData).filter((cat) => cat.files.length);
  const result = await homySend(`/verifications/${id}/resubmit`, "PATCH", { documents, categories });
  if (!result.ok) return { error: result.error };
  revalidatePath("/worker", "layout");
  redirect("/worker?enviado=1");
}

/** Un trabajador verificado pide sumar una categoría nueva. */
export async function requestCategory(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("worker");
  const [category] = readCategories(formData);
  if (!category) return { error: "Elige la categoría." };
  if (!category.files.length) return { error: "Sube al menos una evidencia." };
  const result = await homySend("/verifications", "POST", { type: "category", categories: [category] });
  if (!result.ok) return { error: result.error };
  revalidatePath("/worker", "layout");
  return { ok: String(formData.get("categoryName") ?? "la categoría") };
}

/** Guarda que el trabajador ya vio la pantalla "¡Tu perfil fue verificado!". */
export async function acknowledgeVerified(formData: FormData) {
  await requireRole("worker");
  (await cookies()).set("homy_verified_seen", String(formData.get("workerId") ?? "1"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  redirect(String(formData.get("next") ?? "/worker") === "/worker/services/new" ? "/worker/services/new" : "/worker");
}
