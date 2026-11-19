"use client";

import { useActionState, useState } from "react";
import { reviewVerification } from "@/app/admin/_actions/admin";
import { cityOf, relativeDay } from "@/lib/format";
import { categoryRejectReasons, documentRejectReasons, type Verification } from "@/types/verification";
import Avatar from "@/shared/ui/avatar";
import FilePreview from "@/shared/ui/file-preview";
import Icon from "@/shared/ui/icon";
import Modal from "@/shared/ui/modal";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";

type Decision = {
  status?: "approved" | "rejected";
  reasons: string[];
  comment: string;
};
type Item = {
  key: string;
  label: string;
  group: "Documentos" | "Categorías";
  reasons: string[];
};

/** Revisar verificación: aprobar o rechazar cada documento y cada categoría, con motivo. */
export default function VerificationReview({ verification }: { verification: Verification }) {
  const [state, action] = useActionState(reviewVerification, undefined);
  const [confirming, setConfirming] = useState(false);
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const docs = verification.documents.filter((doc) => doc.status === "pending");
  const cats = verification.categories.filter((cat) => cat.status === "pending");
  const name = verification.worker?.user.name ?? "Trabajador";
  const first = name.split(" ")[0];

  const items: Item[] = [
    ...docs.map((doc) => ({
      key: `doc:${doc.key}`,
      label: doc.label,
      group: "Documentos" as const,
      reasons: documentRejectReasons,
    })),
    ...cats.map((cat) => ({
      key: `cat:${cat.categoryId}`,
      label: cat.name,
      group: "Categorías" as const,
      reasons: categoryRejectReasons,
    })),
  ];
  const get = (key: string): Decision => decisions[key] ?? { reasons: [], comment: "" };
  const set = (key: string, patch: Partial<Decision>) => setDecisions((all) => ({ ...all, [key]: { ...get(key), ...patch } }));
  const decidedCount = items.filter((item) => get(item.key).status).length;
  const missingReason = items.some((item) => get(item.key).status === "rejected" && !get(item.key).reasons.length);
  const rejectedCount = items.filter((item) => get(item.key).status === "rejected").length;

  const payload = {
    documents: docs.map((doc) => ({
      key: doc.key,
      status: get(`doc:${doc.key}`).status,
      reasons: get(`doc:${doc.key}`).reasons,
      comment: get(`doc:${doc.key}`).comment || undefined,
    })),
    categories: cats.map((cat) => ({
      categoryId: cat.categoryId,
      status: get(`cat:${cat.categoryId}`).status,
      reasons: get(`cat:${cat.categoryId}`).reasons,
      comment: get(`cat:${cat.categoryId}`).comment || undefined,
    })),
  };

  // El título del primer grupo va encima de las dos columnas: así el resumen queda alineado con la primera tarjeta.
  const firstGroup = docs.length ? "Documentos" : "Categorías";

  return (
    <div className="section">
      <h2>{firstGroup}</h2>
      <div className="layout-aside layout-aside--sidebar">
        <div className="stack stack--xl">
          {(["Documentos", "Categorías"] as const).map((group) => {
            const groupItems = items.filter((item) => item.group === group);
            if (!groupItems.length) return null;
            return (
              <section className="section" key={group}>
                {group !== firstGroup && <h2>{group}</h2>}
                <div className="grid">
                  {groupItems.map((item) => {
                    const decision = get(item.key);
                    const doc = docs.find((d) => `doc:${d.key}` === item.key);
                    const cat = cats.find((c) => `cat:${c.categoryId}` === item.key);
                    const files = doc ? [doc.file] : (cat?.files ?? []);
                    return (
                      <article className={`card card--lg${decision.status === "rejected" ? " card--danger" : ""}`} key={item.key}>
                        <div className="row row--between row--wrap">
                          <div className="row">
                            <span className="option-card__icon">
                              <Icon name={group === "Documentos" ? "file" : "briefcase"} />
                            </span>
                            <div>
                              <h3 style={{ fontSize: "var(--fs-lg)" }}>{item.label}</h3>
                              <p className="text-sm muted">{files.map((file) => file.name).join(", ") || "Sin archivo"}</p>
                            </div>
                          </div>
                          <div className="row">
                            <button
                              aria-pressed={decision.status === "approved"}
                              className={`btn btn--sm ${decision.status === "approved" ? "btn--primary" : "btn--secondary"}`}
                              onClick={() =>
                                set(item.key, {
                                  status: "approved",
                                  reasons: [],
                                })
                              }
                              type="button"
                            >
                              <Icon name="check" size={16} /> Aprobar
                            </button>
                            <button
                              aria-pressed={decision.status === "rejected"}
                              className={`btn btn--sm ${decision.status === "rejected" ? "btn--danger" : "btn--outline"}`}
                              onClick={() => set(item.key, { status: "rejected" })}
                              type="button"
                            >
                              <Icon name="x" size={16} /> Rechazar
                            </button>
                          </div>
                        </div>
                        <div className="stack stack--sm">
                          {files.map((file, index) => (
                            <FilePreview file={file} key={index} />
                          ))}
                        </div>
                        {cat && (
                          <p className="text-sm muted">
                            <strong>Lo que escribió {first}:</strong> {cat.note ? `“${cat.note}”` : "No escribió un comentario."}
                          </p>
                        )}
                        {decision.status === "rejected" && (
                          <div className="field">
                            <span className="label">Motivo del rechazo (lo verá el profesional)</span>
                            <div className="chip-group">
                              {item.reasons.map((reason) => (
                                <button
                                  aria-pressed={decision.reasons.includes(reason)}
                                  className={`tab${decision.reasons.includes(reason) ? " is-active" : ""}`}
                                  key={reason}
                                  onClick={() =>
                                    set(item.key, {
                                      reasons: decision.reasons.includes(reason) ? decision.reasons.filter((r) => r !== reason) : [...decision.reasons, reason],
                                    })
                                  }
                                  type="button"
                                >
                                  {reason}
                                </button>
                              ))}
                            </div>
                            <textarea
                              aria-label="Comentario para el profesional"
                              className="textarea"
                              maxLength={1000}
                              onChange={(event) => set(item.key, { comment: event.target.value })}
                              placeholder="Ej: la foto está borrosa, no se leen los datos"
                              style={{ background: "#fff", minHeight: 88 }}
                              value={decision.comment}
                            />
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="stack sticky-aside">
          <section className="card card--lg">
            <div className="row">
              <Avatar name={name} />
              <div>
                <h3>{name}</h3>
                <p className="text-sm muted">{cityOf(verification.worker?.user.location)}</p>
              </div>
            </div>
            <div className="chip-group">
              <span className="chip chip--dark">{verification.type === "category" ? "Nueva categoría" : "Verificación inicial"}</span>
              <span className="chip chip--sage">{relativeDay(verification.createdAt)}</span>
            </div>
            <div className="list">
              <div className="list-row">
                <span className="muted">Ítems revisados</span>
                <strong>
                  {decidedCount} de {items.length}
                </strong>
              </div>
              <div className="list-row">
                <span className="muted">Rechazados</span>
                <strong>{rejectedCount}</strong>
              </div>
            </div>
            {missingReason && <p className="field__error">Elige el motivo de cada ítem rechazado.</p>}
            <button
              className="btn btn--primary btn--block"
              disabled={decidedCount < items.length || missingReason}
              onClick={() => setConfirming(true)}
              type="button"
            >
              Enviar revisión
            </button>
          </section>
        </aside>

        <Modal labelledBy="confirm-verification" onClose={() => setConfirming(false)} open={confirming}>
          <form action={action} className="stack">
            <input name="id" type="hidden" value={verification.id} />
            <input name="decision" type="hidden" value={JSON.stringify(payload)} />
            <h2 id="confirm-verification">¿Enviar la revisión?</h2>
            <p className="lead">
              {rejectedCount
                ? `${first} verá ${rejectedCount} ${rejectedCount === 1 ? "ítem rechazado" : "ítems rechazados"} con su motivo.`
                : `Aprobarás todo y ${first} podrá publicar servicios.`}
            </p>
            {state?.error && <Notice tone="danger">{state.error}</Notice>}
            <div className="btn-row">
              <button className="btn btn--outline" onClick={() => setConfirming(false)} type="button">
                Revisar de nuevo
              </button>
              <SubmitButton className="btn btn--primary" pendingLabel="Enviando…">
                Enviar
              </SubmitButton>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
