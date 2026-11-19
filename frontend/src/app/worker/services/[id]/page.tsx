import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon, { type IconName } from "@/shared/ui/icon";
import { categoryIcon } from "@/app/worker/_components/services/category-icon";
import { getMyServices } from "@/lib/data";
import { durationLabel, formatCOP } from "@/lib/format";
import { requireRole } from "@/lib/session";
import type { ServiceStatus } from "@/types/service";

export const metadata: Metadata = { title: "Estado del servicio" };

type Step = { label: string; state: "done" | "current" | "next" };

const copy: Record<ServiceStatus, { icon: IconName; title: (name: string) => string; text: string; chip: string; chipTone: string; steps: Step[] }> = {
  in_review: {
    icon: "clock",
    title: () => "Tu servicio fue enviado a revisión",
    text: "Un administrador de Homy lo revisará. Te enviaremos una notificación cuando sea aprobado o si necesita cambios.",
    chip: "En revisión del admin",
    chipTone: "chip--sage",
    steps: [
      { label: "Enviado", state: "done" },
      { label: "En revisión", state: "current" },
      { label: "Publicado", state: "next" },
    ],
  },
  published: {
    icon: "checkCircle",
    title: () => "¡Tu servicio está publicado!",
    text: "El administrador lo aprobó. Ya aparece en tu perfil y los clientes pueden solicitarlo.",
    chip: "Publicado",
    chipTone: "chip--dark",
    steps: [
      { label: "Enviado", state: "done" },
      { label: "Revisado", state: "done" },
      { label: "Publicado", state: "done" },
    ],
  },
  changes_requested: {
    icon: "alert",
    title: () => "El administrador pidió cambios",
    text: "Revisa su comentario, corrige el servicio y reenvíalo. Volverá a revisión antes de publicarse.",
    chip: "Requiere cambios",
    chipTone: "chip--danger",
    steps: [
      { label: "Enviado", state: "done" },
      { label: "Requiere cambios", state: "current" },
      { label: "Publicado", state: "next" },
    ],
  },
  rejected: {
    icon: "x",
    title: () => "Tu servicio no fue aprobado",
    text: "Lee el motivo del administrador. Este servicio no se puede publicar.",
    chip: "No aprobado",
    chipTone: "chip--neutral",
    steps: [
      { label: "Enviado", state: "done" },
      { label: "No aprobado", state: "current" },
      { label: "Publicado", state: "next" },
    ],
  },
};

/** "Tu servicio fue enviado a revisión": muestra en vivo en qué va (al recargar se actualiza). */
export default async function ServiceStatusPage({ params }: PageProps<"/worker/services/[id]">) {
  await requireRole("worker");
  const [{ id }, services] = await Promise.all([params, getMyServices()]);
  const service = services.find((item) => item.id === id);
  if (!service) notFound();
  const text = copy[service.status];

  return (
    <div className="review-page">
      <Link className="back-link" href="/worker/services">
        <Icon name="arrowLeft" size={18} />
        Mis servicios
      </Link>
      <div className="review-page__center">
        <section aria-labelledby="service-status-title" className="review-status">
          <span aria-hidden="true" className="review-status__icon">
            <Icon name={text.icon} size={32} />
          </span>

          <div className="review-status__intro">
            <h1 className="review-status__title" id="service-status-title">
              {text.title(service.name)}
            </h1>
            <p className="review-status__lead">{text.text}</p>
          </div>

          <ol aria-label="Progreso del servicio" className="review-steps">
            {text.steps.map((step, index) => (
              <li aria-current={step.state === "current" ? "step" : undefined} className={`review-steps__item is-${step.state}`} key={step.label}>
                <span className="review-steps__dot">{step.state === "done" ? <Icon name="check" size={18} strokeWidth={2.4} /> : index + 1}</span>
                <span className="review-steps__label">{step.label}</span>
              </li>
            ))}
          </ol>

          <article className="service-summary">
            <span aria-hidden="true" className="service-summary__icon">
              <Icon name={categoryIcon(service.category.name)} size={26} />
            </span>
            <div className="service-summary__body">
              <p className="text-sm muted">
                {service.category.name} · {durationLabel(service.durationMinutes)}
              </p>
              <h2 className="service-summary__name">{service.name}</h2>
            </div>
            <div className="service-summary__side">
              <strong className="service-summary__price">{formatCOP(Number(service.price))}</strong>
              <span className={`chip ${text.chipTone}`}>{text.chip}</span>
            </div>
          </article>

          {service.reviewNote && service.status !== "in_review" && (
            <div className="review-status__note">
              <Icon name="chat" size={20} />
              <p>
                <strong>Comentario del administrador:</strong> {service.reviewNote}
              </p>
            </div>
          )}

          <div className="review-status__actions">
            {service.status === "changes_requested" ? (
              <Link className="btn btn--primary" href={`/worker/services/${service.id}/edit`}>
                Corregir y reenviar
              </Link>
            ) : (
              <Link className="btn btn--primary" href="/worker/services">
                Ver mis servicios
              </Link>
            )}
            <Link className="btn btn--secondary" href="/worker">
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
