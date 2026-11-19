/** Pesos colombianos sin decimales: 75000 → "$75.000". */
export const formatCOP = (value: number) => `$${Math.round(value).toLocaleString("es-CO")}`;

/** Iniciales para avatares sin foto: "Luisa Martínez" → "LM". */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export const firstName = (name: string) => name.split(" ")[0] ?? name;

const TZ = "America/Bogota";

/** "Domingo 13, Septiembre" (como en los diseños). */
export function formatLongDate(value: string | Date) {
  const date = new Date(value);
  const weekday = date.toLocaleDateString("es-CO", { weekday: "long", timeZone: TZ });
  const day = date.toLocaleDateString("es-CO", { day: "numeric", timeZone: TZ });
  const month = date.toLocaleDateString("es-CO", { month: "long", timeZone: TZ });
  return `${capitalize(weekday)} ${day}, ${capitalize(month)}`;
}

/** "18 feb 2025". */
export function formatShortDate(value: string | Date) {
  return new Date(value)
    .toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: TZ })
    .replace(".", "");
}

/** "10:00 am". */
export function formatTime(value: string | Date) {
  return new Date(value)
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ })
    .replace("AM", "am")
    .replace("PM", "pm");
}

/** "08:00" → "8:00 am". */
export function formatHour(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

/** "Hoy", "Ayer", "Hace 3 días" o la fecha corta. */
export function relativeDay(value: string | Date) {
  const date = new Date(value);
  const today = new Date();
  const key = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: TZ });
  const diff = Math.round((Date.parse(key(today)) - Date.parse(key(date))) / 86_400_000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff > 1 && diff < 7) return `Hace ${diff} días`;
  return formatShortDate(date);
}

/** Fecha local de Bogotá en formato YYYY-MM-DD. */
export function isoDay(value: string | Date = new Date()) {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Duración en horas enteras: 90 min → "2 horas". */
export function durationHours(minutes: number) {
  return Math.max(1, Math.ceil(minutes / 60));
}

export function durationLabel(minutes: number) {
  const hours = durationHours(minutes);
  if (hours === 8) return "Día completo · 8 horas";
  if (hours === 4) return "Medio día · 4 horas";
  return hours === 1 ? "1 hora" : `${hours} horas`;
}

export function fileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Ciudad de "Ciudad, Departamento". */
export const cityOf = (location: string | null | undefined) => location?.split(",")[0]?.trim() || "Colombia";

/** Años de experiencia a partir del texto libre del perfil ("8 años", "8"). */
export function experienceYears(text: string | null | undefined) {
  const match = text?.match(/\d+/);
  return match ? Number(match[0]) : null;
}
