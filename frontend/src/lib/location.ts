/** "Cali, Valle del Cauca" → "cali, valle del cauca" (sin tildes ni espacios de más), igual que el backend. */
export function normalizeLocation(location?: string | null) {
  return (location ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Ubicación lista para terminar una oración: sin punto final ("Bogotá D.C." → "Bogotá D.C"), así no queda "D.C..". */
export const placeName = (location?: string | null, fallback = "otra ciudad") => (location?.trim() || fallback).replace(/\.+$/, "");

/** Cliente y trabajador en la misma ciudad ("Ciudad, Departamento" completo, como lo compara el backend). */
export function sameCity(a?: string | null, b?: string | null) {
  const first = normalizeLocation(a);
  return first !== "" && first === normalizeLocation(b);
}
