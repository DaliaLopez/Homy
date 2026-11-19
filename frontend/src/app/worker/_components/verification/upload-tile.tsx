"use client";

import { useId, useState } from "react";
import { toStoredFile } from "@/lib/files";
import type { StoredFile } from "@/types/file";
import Icon, { type IconName } from "@/shared/ui/icon";

type UploadTileProps = {
  /** Campo oculto: la Server Action recibe la lista de archivos en JSON. */
  name: string;
  label: string;
  hint: string;
  icon?: IconName;
  multiple?: boolean;
  maxSide?: number;
  accept?: string;
  onChange?: (count: number) => void;
  onFiles?: (files: StoredFile[]) => void;
};

/** Recuadro para subir un documento o evidencia; al elegirlo muestra el nombre y queda marcado. */
export default function UploadTile({ name, label, hint, icon = "upload", multiple, maxSide, accept = "image/*,application/pdf", onChange, onFiles }: UploadTileProps) {
  const inputId = useId();
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pick = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    setError("");
    try {
      const picked = await Promise.all(Array.from(list).slice(0, multiple ? 5 : 1).map((file) => toStoredFile(file, maxSide)));
      setFiles(picked);
      onChange?.(picked.length);
      onFiles?.(picked);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos leer el archivo.");
    } finally {
      setBusy(false);
    }
  };

  const done = files.length > 0;
  return (
    <label className={`upload${done ? " is-done" : ""}`} htmlFor={inputId}>
      <input name={name} type="hidden" value={JSON.stringify(files)} />
      <Icon name={done ? "checkCircle" : icon} size={28} />
      <strong>{label}</strong>
      <span className="text-xs">{busy ? "Preparando archivo…" : done ? files.map((file) => file.name).join(", ") : hint}</span>
      {error && <span className="field__error">{error}</span>}
      <input accept={accept} className="sr-only" id={inputId} multiple={multiple} onChange={(event) => void pick(event.target.files)} type="file" />
    </label>
  );
}
