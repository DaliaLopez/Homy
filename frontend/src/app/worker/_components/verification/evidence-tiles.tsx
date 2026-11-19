"use client";

import { useId, useState } from "react";
import { fileSize } from "@/lib/format";
import { toStoredFile } from "@/lib/files";
import type { StoredFile } from "@/types/file";
import Icon from "@/shared/ui/icon";

type Props = {
  /** Campo oculto: la Server Action recibe la lista de archivos en JSON. */
  name: string;
  /** Campo de la nota para el administrador. */
  noteName: string;
  notePlaceholder?: string;
  /** Título de la tarjeta para subir (p. ej. "Evidencia de Pintura"). */
  label: string;
  hint?: string;
  max?: number;
  onChange?: (count: number) => void;
};

/**
 * Evidencias de una categoría en una rejilla de 2 columnas:
 * - una tarjeta por archivo; con cantidad impar, la última ocupa todo el ancho (con 1 archivo, ese archivo va a todo el ancho);
 * - la tarjeta para seguir subiendo va a todo el ancho (grande si aún no hay archivos, delgada si ya hay);
 * - la nota para el administrador siempre en su propia fila, a todo el ancho.
 */
export default function EvidenceTiles({
  name,
  noteName,
  notePlaceholder = "Cuéntale al administrador qué subiste (opcional)",
  label,
  hint = "Foto de un trabajo, referencia o curso",
  max = 5,
  onChange,
}: Props) {
  const inputId = useId();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (next: StoredFile[]) => {
    setFiles(next);
    onChange?.(next.length);
  };

  const add = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setError("");
    try {
      const room = Math.max(0, max - files.length);
      const picked = await Promise.all(
        Array.from(list)
          .slice(0, room)
          .map((file) => toStoredFile(file)),
      );
      update([...files, ...picked]);
      if (list.length > room) setError(`Puedes subir hasta ${max} archivos por categoría.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos leer el archivo.");
    } finally {
      setBusy(false);
    }
  };

  const odd = files.length % 2 === 1;

  return (
    <div className="evidence-files">
      <input name={name} type="hidden" value={JSON.stringify(files)} />
      {files.map((file, index) => (
        <div className={`upload is-done evidence-file${odd && index === files.length - 1 ? " evidence-files__full" : ""}`} key={`${file.name}-${index}`}>
          <button
            aria-label={`Quitar ${file.name}`}
            className="evidence-file__remove"
            onClick={() => update(files.filter((_, i) => i !== index))}
            type="button"
          >
            <Icon name="x" size={14} />
          </button>
          <Icon name={file.type === "application/pdf" ? "file" : "checkCircle"} size={28} />
          <strong className="evidence-file__name">{file.name}</strong>
          <span className="text-xs">{fileSize(file.size)}</span>
        </div>
      ))}

      {files.length < max && (
        <label className={`upload evidence-files__full${files.length ? " evidence-add--compact" : ""}`} htmlFor={inputId}>
          <Icon name={files.length ? "plus" : "upload"} size={files.length ? 20 : 28} />
          <strong>{busy ? "Preparando archivos…" : files.length ? "Agregar otro archivo" : label}</strong>
          <span className="text-xs">{files.length ? `Puedes subir hasta ${max} archivos` : hint}</span>
          <input accept="image/*,application/pdf" className="sr-only" id={inputId} multiple onChange={(event) => void add(event.target.files)} type="file" />
        </label>
      )}

      {error && <p className="field__error evidence-files__full">{error}</p>}

      <textarea
        aria-label="Nota para el administrador"
        className="textarea evidence-files__full"
        maxLength={500}
        name={noteName}
        placeholder={notePlaceholder}
      />
    </div>
  );
}
