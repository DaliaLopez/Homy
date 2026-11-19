"use client";

import { useActionState, useState } from "react";
import { resubmitVerification } from "@/app/worker/_actions/verification";
import { supportWhatsAppUrl } from "@/lib/support";
import type { Verification } from "@/types/verification";
import Icon from "@/shared/ui/icon";
import SubmitButton from "@/shared/ui/submit-button";
import UploadTile from "./upload-tile";

/** El administrador pidió correcciones: se vuelven a subir solo los elementos con observaciones. */
export default function Corrections({ verification }: { verification: Verification }) {
  const [state, action] = useActionState(resubmitVerification, undefined);
  const rejectedDocs = verification.documents.filter((doc) => doc.status === "rejected");
  const rejectedCats = verification.categories.filter((cat) => cat.status === "rejected");
  const approved = [
    ...verification.documents.filter((doc) => doc.status === "approved").map((doc) => doc.label),
    ...verification.categories.filter((cat) => cat.status === "approved").map((cat) => cat.name),
  ];
  const pendingKeys = [...rejectedDocs.map((doc) => `doc-${doc.key}`), ...rejectedCats.map((cat) => `files-${cat.categoryId}`)];
  const [uploaded, setUploaded] = useState<Record<string, number>>({});
  const missing = pendingKeys.filter((key) => !uploaded[key]).length;

  const tile = (key: string, title: string, reasons: string[], comment: string | null, multiple: boolean) => (
    <div className="stack stack--sm" key={key}>
      <UploadTile
        hint="Vuelve a subir el archivo corregido"
        label={title}
        multiple={multiple}
        name={key}
        onChange={(count) => setUploaded((current) => ({ ...current, [key]: count }))}
      />
      <p className="field__error">
        {[...reasons, comment].filter(Boolean).join(" · ") || "El administrador pidió volver a subirlo."}
      </p>
    </div>
  );

  return (
    <form action={action} className="stack stack--lg">
      <input name="id" type="hidden" value={verification.id} />
      <input name="docKeys" type="hidden" value={JSON.stringify(rejectedDocs.map((doc) => doc.key))} />
      <input name="categories" type="hidden" value={JSON.stringify(rejectedCats.map((cat) => cat.categoryId))} />

      <div className="notice notice--danger">
        <Icon name="alert" size={20} />
        <span>
          <strong>Algunos documentos no fueron aprobados.</strong> Vuelve a subir solo los que tienen observaciones.
        </span>
      </div>
      {state?.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="grid grid--2">
        {rejectedDocs.map((doc) => tile(`doc-${doc.key}`, doc.label, doc.reasons, doc.comment, false))}
        {rejectedCats.map((cat) => tile(`files-${cat.categoryId}`, `Evidencia de ${cat.name}`, cat.reasons, cat.comment, true))}
      </div>

      {approved.length > 0 && (
        <div className="stack stack--sm">
          <p className="eyebrow">Ya aprobado</p>
          <div className="chip-group">
            {approved.map((label) => (
              <span className="chip chip--sage" key={label}>
                <Icon name="check" size={14} /> {label}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="row row--wrap">
        <SubmitButton disabled={missing > 0} pendingLabel="Reenviando…">
          {missing > 0 ? `Falta subir ${missing}` : "Reenviar a revisión"}
        </SubmitButton>
        <a className="btn btn--outline" href={supportWhatsAppUrl("Hola, necesito ayuda con las correcciones de mi verificación en Homy.")} rel="noreferrer" target="_blank">
          <Icon name="whatsapp" size={18} /> ¿Dudas? Escríbenos
        </a>
      </div>
    </form>
  );
}
