import { weekdays, type Availability, type Weekday } from "@/types/worker";
import { formatHour } from "./format";

const hhmm = (time: string) => time.slice(0, 5);

/** Hora en formato de 12 horas con am/pm; "23:59" (fin del día) se muestra como 12:00 am. */
export const prettyTime = (time: string) => (hhmm(time) === "23:59" ? "12:00 am" : formatHour(hhmm(time)));

/** Franjas de un día ordenadas: "08:00–12:00 · 14:00–18:00". */
export function dayRanges(availability: Availability[], day: Weekday, pretty = false) {
  const ranges = availability
    .filter((item) => item.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((item) => (pretty ? `${prettyTime(item.startTime)} – ${prettyTime(item.endTime)}` : `${hhmm(item.startTime)}–${hhmm(item.endTime)}`));
  return ranges.join(" · ");
}

/** Resumen semanal: un renglón por día (los días sin franjas dicen "No disponible"). */
export function weeklySummary(availability: Availability[], pretty = false) {
  return weekdays.map((day) => ({
    ...day,
    ranges: dayRanges(availability, day.key, pretty),
  }));
}

/** Día de la semana (MONDAY…) de una fecha YYYY-MM-DD. */
export function weekdayOf(isoDate: string): Weekday {
  const [y, m, d] = isoDate.split("-").map(Number);
  const index = new Date(y, m - 1, d).getDay();
  return (["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const)[index];
}

/** La fecha todavía no pasó (con un día de margen para los servicios de hoy). */
export function isUpcoming(value: string) {
  return new Date(value).getTime() > Date.now() - 86_400_000;
}

/** El profesional tiene una franja de disponibilidad que incluye este momento (hora de Bogotá). */
export function isAvailableNow(availability: Availability[], now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const day = get("weekday").toUpperCase() as Weekday;
  const time = `${get("hour").padStart(2, "0")}:${get("minute").padStart(2, "0")}`;
  return availability.some((item) => item.day === day && hhmm(item.startTime) <= time && time < hhmm(item.endTime));
}
