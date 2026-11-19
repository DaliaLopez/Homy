import type { StoredFile } from "@/types/file";

export const MAX_FILE_BYTES = 4 * 1024 * 1024;

function readAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Prepara un archivo para enviarlo a la API: las imágenes se reducen y pasan a
 * JPEG (así una foto de 5 MB queda en unos cientos de KB); los PDF se envían tal cual.
 */
export async function toStoredFile(file: File, maxSide = 1600): Promise<StoredFile> {
  if (file.type.startsWith("image/") && file.type !== "image/gif") {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const size = Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
    return { name: file.name.replace(/\.\w+$/, ".jpg"), type: "image/jpeg", size, dataUrl };
  }
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} pesa más de 4 MB.`);
  return { name: file.name, type: file.type || "application/octet-stream", size: file.size, dataUrl: await readAsDataUrl(file) };
}

/** Lee del FormData la lista de archivos que dejó el FilePicker en un campo oculto. */
export function parseFiles(value: FormDataEntryValue | null): StoredFile[] {
  try {
    const list = JSON.parse(String(value ?? "[]"));
    return Array.isArray(list) ? list.filter((item) => item?.dataUrl && item?.name) : [];
  } catch {
    return [];
  }
}
