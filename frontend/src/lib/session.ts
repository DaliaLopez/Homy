import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { AppUser, Role, SessionUser } from "@/types/user";
import { API_URL, getToken } from "./homy-api";

export function homeForRole(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "worker") return "/worker";
  return "/";
}

/**
 * Usuario de la sesión según NestJS (GET /auth/me). Se consulta una vez por
 * petición gracias a cache(): el layout y la página comparten el resultado.
 * Que exista la cookie no demuestra que el JWT sea válido; lo decide NestJS.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getToken();
  if (!token) return null;
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok) return null;
  return (await response.json().catch(() => null)) as SessionUser | null;
});

/** Perfil completo (nombre, ciudad, foto) para el encabezado y la pantalla de perfil. */
export const getProfile = cache(async (): Promise<AppUser | null> => {
  const token = await getToken();
  if (!token) return null;
  const response = await fetch(`${API_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);
  if (!response?.ok) return null;
  return (await response.json().catch(() => null)) as AppUser | null;
});

/**
 * Exige un rol. Sin sesión válida vuelve al login; con otro rol, a su propio
 * inicio. Se usa en layouts, páginas y Server Actions (el backend también valida).
 */
export async function requireRole(role: Role) {
  const user = await getSessionUser();
  if (!user) redirect((await getToken()) ? "/login?error=expired" : "/login");
  if (user.role !== role) redirect(homeForRole(user.role));
  return user;
}

/** Para las páginas públicas: un trabajador o un admin no navega como cliente. */
export async function allowGuestOrClient() {
  const user = await getSessionUser();
  if (user && user.role !== "user") redirect(homeForRole(user.role));
  return user;
}
