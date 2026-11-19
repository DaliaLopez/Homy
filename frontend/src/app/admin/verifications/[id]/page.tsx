import Link from "next/link";
import { notFound } from "next/navigation";
import VerificationReview from "@/app/admin/_components/verification-review";
import FilePreview from "@/shared/ui/file-preview";
import Icon from "@/shared/ui/icon";
import PageHeader from "@/shared/ui/page-header";
import StatusChip from "@/shared/ui/status-chip";
import { homyGet } from "@/lib/homy-api";
import { formatShortDate } from "@/lib/format";
import { requireRole } from "@/lib/session";
import type { ItemStatus, Verification } from "@/types/verification";

const itemLabel: Record<ItemStatus, string> = { pending: "Sin revisar", approved: "Aprobado", rejected: "Rechazado" };
const itemTone: Record<ItemStatus, string> = { pending: "chip--neutral", approved: "chip--sage", rejected: "chip--danger" };

/** Revisar una verificación o ver el resultado (con los archivos reales que envió el profesional). */
export default async function AdminVerificationDetailPage({ params, searchParams }: PageProps<"/admin/verifications/[id]">) {
  await requireRole("admin");
  const [{ id }, { enviada }] = await Promise.all([params, searchParams]);
  const verification = await homyGet<Verification | null>(`/verifications/${id}`, null);
  if (!verification) notFound();
  const name = verification.worker?.user.name ?? "Trabajador";
  const first = name.split(" ")[0];

  return (
    <div className="stack stack--lg">
      <PageHeader backHref="/admin/verifications" backLabel="Verificaciones" eyebrow={verification.status === "pending" ? "Revisar verificación" : "Verificación"} title={name} />

      {verification.status === "pending" ? (
        <VerificationReview verification={verification} />
      ) : (
        <div className="stack stack--xl">
          {enviada === "1" && (
            <section className="empty">
              <span className="empty__icon">
                <Icon name="checkCircle" size={28} />
              </span>
              <StatusChip kind="verification" status={verification.status} />
              <h2>Resultado enviado a {first}</h2>
              <p className="lead">
                {verification.status === "verified" ? "Ya puede publicar servicios en las categorías aprobadas." : "Verá el motivo de cada ítem rechazado y podrá subir solo esos de nuevo."}
              </p>
              <Link className="btn btn--primary" href="/admin/verifications">
                Volver a verificaciones
              </Link>
            </section>
          )}

          {verification.documents.length > 0 && (
            <section className="section">
              <h2>Documentos</h2>
              <div className="grid">
                {verification.documents.map((doc) => (
                  <article className={`card card--lg${doc.status === "rejected" ? " card--danger" : ""}`} key={doc.key}>
                    <div className="row row--between row--wrap">
                      <div className="row">
                        <span className="option-card__icon">
                          <Icon name="file" />
                        </span>
                        <h3 style={{ fontSize: "var(--fs-lg)" }}>{doc.label}</h3>
                      </div>
                      <span className={`chip ${itemTone[doc.status]}`}>{itemLabel[doc.status]}</span>
                    </div>
                    <FilePreview file={doc.file} />
                    {doc.status === "rejected" && <p className="field__error">{[...doc.reasons, doc.comment].filter(Boolean).join(" · ")}</p>}
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="section">
            <h2>Categorías</h2>
            <div className="grid">
              {verification.categories.map((cat) => (
                <article className={`card card--lg${cat.status === "rejected" ? " card--danger" : ""}`} key={cat.categoryId}>
                  <div className="row row--between row--wrap">
                    <div className="row">
                      <span className="option-card__icon">
                        <Icon name="briefcase" />
                      </span>
                      <h3 style={{ fontSize: "var(--fs-lg)" }}>{cat.name}</h3>
                    </div>
                    <span className={`chip ${itemTone[cat.status]}`}>{itemLabel[cat.status]}</span>
                  </div>
                  <div className="stack stack--sm">
                    {cat.files.map((file, index) => (
                      <FilePreview file={file} key={index} />
                    ))}
                  </div>
                  <p className="text-sm muted">
                    <strong>Lo que escribió {first}:</strong> {cat.note ? `“${cat.note}”` : "No escribió un comentario."}
                  </p>
                  {cat.status === "rejected" && <p className="field__error">{[...cat.reasons, cat.comment].filter(Boolean).join(" · ")}</p>}
                </article>
              ))}
            </div>
          </section>

          <p className="text-sm muted">
            Revisada{verification.reviewedBy?.name ? ` por ${verification.reviewedBy.name}` : ""}
            {verification.reviewedAt ? ` el ${formatShortDate(verification.reviewedAt)}` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}
