"use client";

import { useState } from "react";
import { fileSize } from "@/lib/format";
import type { StoredFile } from "@/types/file";
import Icon from "./icon";
import Modal from "./modal";

/** Archivo enviado con botón "Vista previa" que abre un visor (imagen o PDF). */
export default function FilePreview({ file, label }: { file: StoredFile; label?: string }) {
  const [open, setOpen] = useState(false);
  const isPdf = file.type === "application/pdf";
  const titleId = `preview-${file.name.replace(/\W/g, "")}`;

  return (
    <div className="file-item">
      <span className="file-item__kind">{isPdf ? "PDF" : "FOTO"}</span>
      <span className="file-item__name truncate">{label ?? file.name}</span>
      <span className="text-xs muted">{fileSize(file.size)}</span>
      <button className="btn btn--secondary btn--sm" disabled={!file.dataUrl} onClick={() => setOpen(true)} type="button">
        <Icon name="eye" size={16} /> Vista previa
      </button>
      <Modal labelledBy={titleId} onClose={() => setOpen(false)} open={open} wide>
        <div className="stack">
          <h2 id={titleId}>{file.name}</h2>
          {file.dataUrl &&
            (isPdf ? (
              <iframe className="preview-frame" src={file.dataUrl} title={file.name} />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- data URL del archivo enviado
              <img alt={file.name} className="preview-image" src={file.dataUrl} />
            ))}
          <div className="btn-row">
            <button className="btn btn--outline" onClick={() => setOpen(false)} type="button">
              Cerrar
            </button>
            {file.dataUrl && (
              <a className="btn btn--primary" download={file.name} href={file.dataUrl}>
                Descargar archivo
              </a>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
