"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/shared/ui/icon";
import Modal from "@/shared/ui/modal";

/** Botón "Publicar servicio" bloqueado: explica que primero hay que verificarse. */
export default function PublishGate() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn--outline" onClick={() => setOpen(true)} type="button">
        <Icon name="lock" size={16} /> Publicar servicio
      </button>
      <Modal labelledBy="gate-title" onClose={() => setOpen(false)} open={open}>
        <div className="stack">
          <h2 id="gate-title">Primero verifica tu perfil</h2>
          <p className="lead">Para publicar servicios, un administrador de Homy debe aprobar tus documentos.</p>
          <div className="btn-row">
            <button className="btn btn--outline" onClick={() => setOpen(false)} type="button">
              Ahora no
            </button>
            <Link className="btn btn--primary" href="/worker/verification">
              Verificar mi perfil
            </Link>
          </div>
        </div>
      </Modal>
    </>
  );
}
