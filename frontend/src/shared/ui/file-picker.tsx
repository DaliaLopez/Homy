"use client";

import { useId, useState } from "react";
import { fileSize } from "@/lib/format";
import { toStoredFile } from "@/lib/files";
import type { StoredFile } from "@/types/file";
import Icon from "./icon";

type FilePickerProps = {
  /** Nombre del campo oculto: la Server Action recibe la lista en JSON. */
  name: string;
  label?: string;
  hint?: string;
  max?: number;
  accept?: string;
  maxSide?: number;
  compact?: boolean;
  /** Solo el texto en negrita, sin el enlace "selecciónalos" (todo el recuadro ya es clicable). */
  plain?: boolean;
  onChange?: (files: StoredFile[]) => void;
};

/** Zona para arrastrar o elegir archivos (fotos, videos cortos o PDF). */
export default function FilePicker({
  name,
  label = "Arrastra tus archivos o",
  hint = "JPG, PNG o PDF · máximo 4 MB cada uno",
  max = 5,
  accept = "image/*,application/pdf",
  maxSide,
  compact,
  plain,
  onChange,
}: FilePickerProps) {
  const inputId = useId();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (next: StoredFile[]) => {
    setFiles(next);
    onChange?.(next);
  };

  const add = async (list: FileList | null) => {
    if (!list?.length) return;
    setError("");
    setBusy(true);
    try {
      const room = Math.max(0, max - files.length);
      const picked = await Promise.all(
        Array.from(list)
          .slice(0, room)
          .map((file) => toStoredFile(file, maxSide)),
      );
      update([...files, ...picked].slice(0, max));
      if (list.length > room) setError(`Puedes adjuntar hasta ${max} archivo${max === 1 ? "" : "s"}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos leer el archivo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack stack--sm">
      <input name={name} type="hidden" value={JSON.stringify(files)} />
      {files.length < max && (
        <label
          className={compact ? "upload upload--compact" : "upload"}
          htmlFor={inputId}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void add(event.dataTransfer.files);
          }}
        >
          <Icon name="upload" size={22} />
          {plain ? (
            <strong>{busy ? "Preparando archivos…" : label}</strong>
          ) : (
            <span>
              {busy ? "Preparando archivos…" : label} {!busy && <span className="link-strong">selecciónalos</span>}
            </span>
          )}
          <span className="text-xs muted">{hint}</span>
          <input accept={accept} className="sr-only" id={inputId} multiple={max > 1} onChange={(event) => void add(event.target.files)} type="file" />
        </label>
      )}
      {error && <p className="field__error">{error}</p>}
      {files.length > 0 && (
        <ul className="file-list">
          {files.map((file, index) => (
            <li className="file-item" key={`${file.name}-${index}`}>
              <span className="file-item__kind">{file.type === "application/pdf" ? "PDF" : "FOTO"}</span>
              <span className="file-item__name truncate">{file.name}</span>
              <span className="text-xs muted">{fileSize(file.size)}</span>
              <button
                aria-label={`Quitar ${file.name}`}
                className="icon-btn icon-btn--plain"
                onClick={() => update(files.filter((_, i) => i !== index))}
                type="button"
              >
                <Icon name="x" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
