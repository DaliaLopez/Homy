"use client";

import { useState } from "react";
import Modal from "@/shared/ui/modal";

/** Modal que aparece la primera vez que el trabajador envía su verificación. */
export default function ReviewModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <Modal bare labelledBy="review-modal-title" maxWidth={920} onClose={() => setOpen(false)} open={open}>
      {children}
    </Modal>
  );
}
