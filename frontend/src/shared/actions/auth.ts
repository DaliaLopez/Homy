"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { publicFetch, TOKEN_COOKIE, translateError } from "@/lib/homy-api";
import { homeForRole } from "@/lib/session";
import type { Role } from "@/types/user";

/** suspended: el login falló porque la cuenta está suspendida (el formulario ofrece contactar a soporte). */
export type FormState = { error?: string; ok?: string; suspended?: boolean } | undefined;

/** Lee el vencimiento del JWT (sin verificarlo) para que la cookie dure lo mismo. */
function secondsUntilExpiry(token: string) {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    return Math.max(60, Math.floor(payload.exp - Date.now() / 1000));
  } catch {
    return 15 * 60;
  }
}

async function startSession(email: string, password: string) {
  const response = await publicFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!response) return { error: "No pudimos conectar con Homy. Revisa tu conexión." };
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // Cuenta suspendida (403): se muestra el motivo que escribió el administrador, si lo hay.
    const message = typeof data?.message === "string" ? data.message : "";
    if (response.status === 403 && /account is suspended/i.test(message)) {
      const reason = message.split(/suspended:\s*/i)[1]?.trim();
      return { error: `Tu cuenta está suspendida.${reason ? ` Motivo: ${reason}` : ""}`, suspended: true };
    }
    return { error: translateError(data, response.status) };
  }

  const token = data?.access_token;
  if (typeof token !== "string" || !token) return { error: "No pudimos iniciar sesión. Intenta de nuevo." };

  // Se guarda el token, nunca la contraseña. httpOnly: el JavaScript del navegador no lo lee.
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: secondsUntilExpiry(token),
  });
  return { role: (data.user?.role ?? "user") as Role };
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };

  const result = await startSession(email, password);
  if ("error" in result) return { error: result.error, suspended: "suspended" in result ? result.suspended : undefined };

  const home = homeForRole(result.role);
  // Solo se respeta "next" si pertenece al área del rol (evita saltar a otra área).
  const safeNext = next.startsWith("/") && !next.startsWith("//") && (home === "/" ? next.startsWith("/my") : next.startsWith(home));
  redirect(safeNext ? next : home);
}

export async function register(_state: FormState, formData: FormData): Promise<FormState> {
  const role = String(formData.get("role") ?? "user");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const department = String(formData.get("department") ?? "");
  const city = String(formData.get("city") ?? "");

  if (!["user", "worker"].includes(role)) return { error: "Elige si quieres contratar o trabajar." };
  if (name.length < 2) return { error: "Escribe tu nombre completo." };
  if (password.length < 15) return { error: "La contraseña debe tener al menos 15 caracteres." };
  if (/\s/.test(password)) return { error: "La contraseña no puede tener espacios." };
  if (!/^[0-9+\s-]{7,20}$/.test(phone)) return { error: "Escribe un celular válido." };
  if (!department || !city) return { error: "Elige tu departamento y tu ciudad." };

  const response = await publicFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role, phone, location: `${city}, ${department}` }),
  });
  if (!response) return { error: "No pudimos conectar con Homy. Revisa tu conexión." };
  if (!response.ok) return { error: translateError(await response.json().catch(() => null), response.status) };

  // Registrarse no entrega token: se inicia sesión con los mismos datos.
  const result = await startSession(email, password);
  if ("error" in result) redirect("/login?registered=1");
  redirect(homeForRole(result.role));
}

export async function logout() {
  (await cookies()).delete(TOKEN_COOKIE);
  redirect("/login");
}
