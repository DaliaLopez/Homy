"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { homySend } from "@/lib/homy-api";
import { parseFiles } from "@/lib/files";
import { getSessionUser } from "@/lib/session";
import type { FormState } from "./auth";

async function reportsBase() {
  const user = await getSessionUser();
  if (!user || user.role === "admin") redirect("/login");
  return user.role === "worker" ? "/worker/reports" : "/my/reports";
}

export async function createReport(_state: FormState, formData: FormData): Promise<FormState> {
  const base = await reportsBase();
  const reason = String(formData.get("reason") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  if (!formData.get("requestId")) return { error: "Elige el servicio relacionado." };
  if (!reason) return { error: "Elige el motivo del reporte." };
  if (description.length < 20) return { error: "Describe qué pasó con al menos 20 caracteres." };

  const result = await homySend<{ id: string }>("/reports", "POST", {
    reason,
    description,
    requestId: String(formData.get("requestId")),
    reportedUserId: String(formData.get("reportedUserId")),
    evidence: parseFiles(formData.get("evidence")),
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(base, "layout");
  redirect(`${base}/${result.data.id}?nuevo=1`);
}

/** La persona reportada cuenta su versión (con evidencia opcional). */
export async function respondReport(_state: FormState, formData: FormData): Promise<FormState> {
  const base = await reportsBase();
  const response = String(formData.get("response") ?? "").trim();
  if (response.length < 20) return { error: "Tu versión debe tener al menos 20 caracteres." };
  const result = await homySend(`/reports/${String(formData.get("id"))}/response`, "PATCH", {
    response,
    evidence: parseFiles(formData.get("evidence")),
  });
  if (!result.ok) return { error: result.error };
  revalidatePath(base, "layout");
  return { ok: "Enviamos tu versión al administrador." };
}
