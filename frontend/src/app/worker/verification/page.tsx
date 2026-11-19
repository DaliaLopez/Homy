import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/shared/ui/icon";
import PageHeader from "@/shared/ui/page-header";
import StatusChip from "@/shared/ui/status-chip";
import Corrections from "@/app/worker/_components/verification/corrections";
import InReview from "@/app/worker/_components/verification/in-review";
import VerificationWizard from "@/app/worker/_components/verification/verification-wizard";
import { decisionMessage } from "@/lib/category-decisions";
import { getCategories } from "@/lib/data";
import { formatShortDate } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { getWorkerState } from "@/lib/worker-state";

export const metadata: Metadata = { title: "Verificación" };

/** Solicitar la verificación del perfil y ver su estado. */
export default async function VerificationPage() {
  await requireRole("worker");
  const [state, categories] = await Promise.all([getWorkerState(), getCategories()]);

  // Ya enviada y en revisión: el mismo diseño del modal de envío, centrado en la pantalla.
  if (state.stage === "review" && state.initial) {
    return (
      <div className="review-page">
        <Link className="back-link" href="/worker">
          <Icon name="arrowLeft" size={18} />
          Inicio
        </Link>
        <div className="review-page__center">
          <InReview verification={state.initial} />
        </div>
      </div>
    );
  }

  return (
    // El contenedor de la verificación queda centrado en la pantalla (vertical y horizontalmente).
    <div className="stack stack--lg wizard-page">
      <PageHeader
        backHref="/worker"
        backLabel="Inicio"
        description="Necesitamos verificar tu identidad y tus categorías antes de que publiques servicios."
        eyebrow="Verificación"
        title="Verifica tu perfil"
      />

      {state.stage === "unverified" && <VerificationWizard categories={categories} />}
      {state.stage === "changes" && state.initial && <Corrections verification={state.initial} />}

      {state.stage === "verified" && (
        <>
          <section className="empty" style={{ background: "var(--color-sage)" }}>
            <span className="empty__icon" style={{ background: "var(--color-dark)", color: "#fff" }}>
              <Icon name="shield" size={28} />
            </span>
            <p className="eyebrow">Perfil verificado</p>
            <h2>Tus documentos fueron aprobados</h2>
            <div className="chip-group" style={{ justifyContent: "center" }}>
              {state.worker?.approvedCategories.map((category) => (
                <span className="chip chip--dark" key={category.id}>
                  {category.name}
                </span>
              ))}
            </div>
            <Link className="btn btn--primary" href="/worker/categories/new">
              <Icon name="plus" size={16} /> Agregar otra categoría
            </Link>
          </section>

          <section className="section">
            <h2>Historial</h2>
            <div className="grid grid--2">
              {state.verifications.map((item) => (
                <article className="card" key={item.id}>
                  <div className="row row--between row--wrap">
                    <strong>{item.type === "initial" ? "Verificación inicial" : "Nueva categoría"}</strong>
                    <StatusChip kind="verification" status={item.status} />
                  </div>
                  <p className="text-sm muted">
                    {item.categories
                      .map((cat) => `${cat.name} (${cat.status === "approved" ? "aprobada" : cat.status === "rejected" ? "no aprobada" : "en revisión"})`)
                      .join(" · ")}
                  </p>
                  {item.categories
                    .filter((cat) => cat.status === "rejected")
                    .map((cat) => (
                      <p className="text-xs text-danger" key={cat.categoryId}>
                        Motivo ({cat.name}): {decisionMessage(cat) || "revisa tu evidencia y vuelve a enviarla."}
                      </p>
                    ))}
                  <p className="text-xs muted">Enviada el {formatShortDate(item.createdAt)}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
