import type { IconName } from "@/shared/ui/icon";

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Ícono de cada oficio para los botones de categoría. */
export function categoryIcon(name: string): IconName {
  const key = normalize(name);
  if (key.startsWith("electrodom")) return "washer";
  if (key.startsWith("electric")) return "bolt";
  if (key.startsWith("plomer")) return "droplet";
  if (key.startsWith("pintur")) return "brush";
  if (key.startsWith("jardin")) return "leaf";
  if (key.startsWith("limpie")) return "sparkle";
  return "tool";
}
