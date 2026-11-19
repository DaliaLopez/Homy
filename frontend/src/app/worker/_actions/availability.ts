"use server";

import { revalidatePath } from "next/cache";
import { homyGet, homySend } from "@/lib/homy-api";
import { requireRole } from "@/lib/session";
import type { FormState } from "@/shared/actions/auth";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

/** Agrega una franja en horas enteras (por ejemplo 08:00–12:00). */
export async function addAvailability(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("worker");
  const day = String(formData.get("day"));
  const start = Number(formData.get("start"));
  const end = Number(formData.get("end"));
  if (!DAYS.includes(day)) return { error: "Elige un día." };
  if (!(end > start)) return { error: "La hora final debe ser posterior a la inicial." };
  const pad = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
  const result = await homySend("/availability", "POST", { day, startTime: pad(start), endTime: end === 24 ? "23:59" : pad(end) });
  if (!result.ok) return { error: result.error };
  revalidatePath("/worker", "layout");
  return { ok: "Franja agregada." };
}

export async function removeAvailability(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("worker");
  const result = await homySend(`/availability/${String(formData.get("id"))}`, "DELETE");
  if (!result.ok) return { error: result.error };
  revalidatePath("/worker", "layout");
  return { ok: "Franja eliminada." };
}

type DayInput = { day: string; enabled: boolean; start: number; end: number };

/**
 * Guarda la semana completa del editor (un rango por día en horas enteras):
 * borra las franjas que cambiaron y crea las nuevas.
 */
export async function saveWeek(_state: FormState, formData: FormData): Promise<FormState> {
  await requireRole("worker");
  let days: DayInput[];
  try {
    days = JSON.parse(String(formData.get("days") ?? "[]"));
  } catch {
    return { error: "No pudimos leer los horarios." };
  }
  if (days.some((item) => item.enabled && !(item.end > item.start))) return { error: "La hora de inicio debe ser antes de la hora de fin." };

  const current = await homyGet<{ id: string; day: string; startTime: string; endTime: string }[]>("/availability/mine", []);
  const pad = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
  const errors: string[] = [];

  for (const item of days) {
    if (!DAYS.includes(item.day)) continue;
    const existing = current.filter((range) => range.day === item.day);
    const endTime = item.end === 24 ? "23:59" : pad(item.end);
    const same =
      item.enabled && existing.length === 1 && existing[0].startTime.slice(0, 5) === pad(item.start) && existing[0].endTime.slice(0, 5) === endTime;
    if (same || (!item.enabled && existing.length === 0)) continue;

    let removed = true;
    for (const range of existing) {
      const result = await homySend(`/availability/${range.id}`, "DELETE");
      if (!result.ok) {
        errors.push(result.error);
        removed = false;
        break;
      }
    }
    if (removed && item.enabled) {
      const result = await homySend("/availability", "POST", { day: item.day, startTime: pad(item.start), endTime });
      if (!result.ok) errors.push(result.error);
    }
  }

  revalidatePath("/worker", "layout");
  if (errors.length) return { error: [...new Set(errors)].join(" ") };
  return { ok: "Guardamos tus horarios." };
}
