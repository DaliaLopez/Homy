"use client";

import { useEffect, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  labelledBy: string;
  onClose?: () => void;
  children: ReactNode;
  maxWidth?: number;
  /** Atajo para modales anchos (vista previa de archivos). */
  wide?: boolean;
  /** Sin fondo ni relleno propios: el contenido trae su propia tarjeta. */
  bare?: boolean;
};

/** Modal reutilizable: hoja inferior en móvil y tarjeta centrada en escritorio. */
export default function Modal({ open, labelledBy, onClose, children, maxWidth, wide, bare }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={bare ? "modal modal--bare" : "modal"}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        style={{ maxWidth: maxWidth ?? (wide ? 760 : 520) }}
      >
        {children}
      </div>
    </div>
  );
}
