import Link from "next/link";
import type { ItemStatus, Verification } from "@/types/verification";
import Icon from "@/shared/ui/icon";

const itemLabel: Record<ItemStatus, string> = { pending: "En revisión", approved: "Aprobado", rejected: "Por corregir" };
const itemTone: Record<ItemStatus, string> = { pending: "chip--sage", approved: "chip--dark", rejected: "chip--danger" };

type Props = {
  verification: Verification;
  /** Título y subtítulo: se muestran en el modal tras enviar; en la página de estado se ocultan. */
  intro?: boolean;
};

/** Estado "Tus documentos están en revisión": progreso, cada documento y categoría, y qué puedes hacer mientras tanto. */
export default function InReview({ verification, intro = true }: Props) {
  const isCategory = verification.type === "category";
  const steps = [
    { label: "Enviado", state: "done" },
    { label: "En revisión", state: "current" },
    { label: isCategory ? "Categoría aprobada" : "Perfil verificado", state: "next" },
  ];

  return (
    <section aria-labelledby={intro ? "review-modal-title" : undefined} aria-label={intro ? undefined : "Estado de tu verificación"} className="review-status">
      <span aria-hidden="true" className="review-status__icon">
        <Icon name="shieldClock" size={30} />
      </span>

      {intro && (
        <div className="review-status__intro">
          <h2 className="review-status__title" id="review-modal-title">
            Tus documentos están en revisión
          </h2>
          <p className="review-status__lead">
            Un administrador de Homy está revisando tu perfil. Te notificaremos cuando sea aprobado o si necesitas corregir algún documento.
          </p>
        </div>
      )}

      <ol aria-label="Progreso de la verificación" className="review-steps">
        {steps.map((step, index) => (
          <li aria-current={step.state === "current" ? "step" : undefined} className={`review-steps__item is-${step.state}`} key={step.label}>
            <span className="review-steps__dot">{step.state === "done" ? <Icon name="check" size={18} strokeWidth={2.4} /> : index + 1}</span>
            <span className="review-steps__label">{step.label}</span>
          </li>
        ))}
      </ol>

      <div className={`review-status__grid${verification.documents.length ? "" : " review-status__grid--single"}`}>
        {verification.documents.length > 0 && (
          <div className="review-status__card">
            <p className="eyebrow">Paso 1 · Documentos</p>
            <ul className="list">
              {verification.documents.map((doc) => (
                <li className="list-row" key={doc.key}>
                  <span>{doc.label}</span>
                  <span className={`chip ${itemTone[doc.status]}`}>{itemLabel[doc.status]}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="review-status__card">
          <p className="eyebrow">{verification.documents.length ? "Paso 2 · Categorías" : "Categoría"}</p>
          <ul className="list">
            {verification.categories.map((category) => (
              <li className="list-row" key={category.categoryId}>
                <span>{category.name} · evidencia</span>
                <span className={`chip ${itemTone[category.status]}`}>{itemLabel[category.status]}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm muted">Cada categoría se aprueba por separado.</p>
        </div>
      </div>

      <div className="review-status__note">
        <Icon name="lock" size={20} />
        <p>
          {isCategory
            ? "Mientras tanto, sigues publicando servicios en tus categorías ya verificadas."
            : "Mientras tanto, la publicación de servicios sigue bloqueada. Puedes ir completando tu descripción y tu disponibilidad."}
        </p>
      </div>

      <div className="review-status__actions">
        <Link className="btn btn--primary" href="/worker">
          Volver al inicio
        </Link>
        <Link className="btn btn--secondary" href="/worker/availability">
          Definir disponibilidad
        </Link>
      </div>
    </section>
  );
}
