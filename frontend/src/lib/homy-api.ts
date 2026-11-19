import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** URL de la API de NestJS (Render). Solo se usa en el servidor de Next.js. */
export const API_URL = (process.env.HOMY_API_URL ?? "https://homy-backend-qph1.onrender.com").replace(/\/$/, "");

/** Cookie httpOnly donde se guarda el JWT que entrega NestJS al iniciar sesión. */
export const TOKEN_COOKIE = "homy_token";

export async function getToken() {
  return (await cookies()).get(TOKEN_COOKIE)?.value ?? null;
}

/** Sin cookie no hay sesión: vuelve al login antes de llamar a la API. */
export async function requireToken() {
  const token = await getToken();
  if (!token) redirect("/login");
  return token;
}

/**
 * Petición privada a NestJS con el Bearer leído de la cookie.
 * Si NestJS responde 401 (token vencido o cuenta suspendida) vuelve al login.
 * El .catch() solo captura fallos de red: así redirect() no queda atrapado.
 */
export async function homyFetch(path: string, options: RequestInit = {}) {
  const token = await requireToken();
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  }).catch(() => null);

  if (response?.status === 401) redirect("/login?error=expired");
  return response;
}

/** Petición sin sesión (login, registro y datos públicos). */
export async function publicFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = await getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" }).catch(() => null);
}

/** GET privado que devuelve el JSON o el valor por defecto si algo falla. */
export async function homyGet<T>(path: string, fallback: T): Promise<T> {
  const response = await homyFetch(path);
  if (!response?.ok) return fallback;
  return ((await response.json().catch(() => null)) ?? fallback) as T;
}

/** GET público con valor por defecto. */
export async function publicGet<T>(path: string, fallback: T): Promise<T> {
  const response = await publicFetch(path);
  if (!response?.ok) return fallback;
  return ((await response.json().catch(() => null)) ?? fallback) as T;
}

/** Envía JSON con un verbo de escritura y devuelve el resultado listo para la acción. */
export async function homySend<T = unknown>(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
  const response = await homyFetch(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response) return { ok: false as const, status: 0, error: "No pudimos conectar con Homy. Revisa tu conexión." };
  const data = await response.json().catch(() => null);
  if (!response.ok) return { ok: false as const, status: response.status, error: translateError(data, response.status) };
  return { ok: true as const, status: response.status, data: data as T };
}

const MESSAGES: [RegExp, string][] = [
  [/Invalid credentials/i, "Correo o contraseña incorrectos."],
  [/account is suspended/i, "Tu cuenta está suspendida. Escríbenos por WhatsApp si crees que es un error."],
  [/only hire workers in your city/i, "Solo puedes contratar profesionales de tu misma ciudad."],
  [/only accept requests from clients in your city/i, "Solo puedes aceptar solicitudes de clientes de tu misma ciudad."],
  [/email is already registered/i, "Ese correo ya está registrado."],
  [/does not fit within the worker availability/i, "Ese horario ya no está dentro de la disponibilidad del profesional."],
  [/already has another active request/i, "El profesional ya tiene otro servicio a esa hora. Elige otro horario."],
  [/scheduled date must be in the future/i, "Elige una fecha y hora futuras."],
  [/start on the hour/i, "Los servicios empiezan en punto (por ejemplo 08:00)."],
  [/cannot request your own service/i, "No puedes solicitar tu propio servicio."],
  [/must be verified before publishing/i, "Tu perfil debe estar verificado para publicar servicios."],
  [/only publish services in your verified categories/i, "Solo puedes publicar en tus categorías verificadas."],
  [/cannot be modified or deleted while it has active requests/i, "No puedes cambiar ni eliminar un servicio con solicitudes activas."],
  [/rejected service cannot be edited/i, "Un servicio no aprobado no se puede editar."],
  [/already verified/i, "Esa categoría ya está verificada."],
  [/already in review/i, "Esa categoría ya está en revisión."],
  [/pending verification request/i, "Ya tienes una verificación en revisión."],
  [/Complete your initial verification/i, "Primero completa tu verificación inicial."],
  [/needs the profile photo/i, "Sube la foto de perfil, la cédula y la foto con tu cédula."],
  [/Upload a new file for every item/i, "Vuelve a subir todos los elementos marcados para corregir."],
  [/Each category can only be requested once/i, "Elige cada categoría una sola vez."],
  [/overlap/i, "Ese horario se cruza con otra franja del mismo día."],
  [/active service requests are scheduled/i, "Tienes servicios agendados en esa franja; no la puedes cambiar."],
  [/end time must be later/i, "La hora final debe ser posterior a la inicial."],
  [/already inactive/i, "La categoría ya está inactiva."],
  [/cannot report yourself/i, "No puedes reportarte a ti mismo."],
  [/already sent your version/i, "Ya enviaste tu versión."],
  [/terminal state|already closed/i, "El reporte ya está cerrado."],
  [/already rated|already been reviewed/i, "Ya enviaste tu calificación."],
  [/cannot suspend or delete your own account|cannot delete your own account/i, "No puedes suspender ni eliminar tu propia cuenta."],
  [/Administrator accounts cannot be suspended/i, "Las cuentas de administrador no se pueden suspender."],
  [/active services/i, "La categoría tiene servicios activos; no se puede desactivar."],
  [/name is already|already exists/i, "Ya existe una categoría con ese nombre."],
  [/cannot change from/i, "Esta solicitud ya cambió de estado. Actualiza la página."],
  [/not allowed to set the request/i, "No puedes hacer ese cambio en la solicitud."],
  [/request entity too large|payload too large/i, "Los archivos son muy pesados. Usa archivos más livianos."],
];

/** Convierte el mensaje de NestJS (en inglés) en un texto claro para la persona. */
export function translateError(data: unknown, status?: number) {
  const raw = (data as { message?: string | string[] } | null)?.message;
  const text = Array.isArray(raw) ? raw.join(" · ") : (raw ?? "");
  for (const [pattern, message] of MESSAGES) if (pattern.test(text)) return message;
  if (status === 403) return "No tienes permiso para hacer esto.";
  if (status === 404) return "No encontramos lo que buscas.";
  if (status === 413) return "Los archivos son muy pesados. Usa archivos más livianos.";
  if (status === 400) return "Revisa los datos del formulario.";
  return "No pudimos completar la acción. Intenta de nuevo.";
}
