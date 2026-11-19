"use server";

import { revalidatePath } from "next/cache";
import { homySend } from "@/lib/homy-api";
import { parseFiles } from "@/lib/files";
import { getSessionUser } from "@/lib/session";
import type { FormState } from "./auth";

/** Editar perfil: datos de la cuenta y, si es trabajador, su descripción. */
export async function updateProfile(_state: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) return { error: "Tu sesión terminó. Vuelve a iniciar sesión." };

  // El trabajador no puede cambiar su nombre ni su foto (son los que aprobó el administrador en la
  // verificación), así que para él no se envían esos campos. El backend también lo bloquea.
  const isWorker = user.role === "worker";
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const [avatar] = isWorker ? [] : parseFiles(formData.get("avatar"));
  if (!isWorker && name.length < 2) return { error: "Escribe tu nombre completo." };
  if (phone && !/^[0-9+\s-]{7,20}$/.test(phone)) return { error: "Escribe un celular válido." };

  const result = await homySend("/auth/profile", "PATCH", {
    ...(isWorker ? {} : { name }),
    ...(phone ? { phone } : {}),
    ...(location ? { location } : {}),
    ...(avatar ? { avatarUrl: avatar.dataUrl } : {}),
  });
  if (!result.ok) return { error: result.error };

  if (user.role === "worker") {
    const description = String(formData.get("description") ?? "").trim();
    const experience = String(formData.get("experience") ?? "").trim();
    if (description || experience) {
      if (description && description.length < 10) return { error: "La descripción debe tener al menos 10 caracteres." };
      const worker = await homySend("/workers/me", "PATCH", {
        ...(description ? { description } : {}),
        ...(experience ? { experience: experience.length >= 10 ? experience : `${experience} años de experiencia` } : {}),
      });
      if (!worker.ok) return { error: worker.error };
    }
  }

  revalidatePath("/", "layout");
  return { ok: "Guardamos los cambios de tu perfil." };
}
