import type { Metadata } from "next";
import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import PageHeader from "@/shared/ui/page-header";
import Stars from "@/shared/ui/stars";
import { getMyReviews, getMyWorker } from "@/lib/data";
import { relativeDay } from "@/lib/format";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Reseñas" };

/** Reseñas recibidas con su distribución de estrellas. */
export default async function WorkerReviewsPage() {
  await requireRole("worker");
  const [reviews, worker] = await Promise.all([getMyReviews(), getMyWorker()]);
  const average = Number(worker?.averageRating ?? 0);
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const total = reviews.filter((review) => review.rating === stars).length;
    return { stars, percent: reviews.length ? Math.round((total / reviews.length) * 100) : 0 };
  });

  return (
    <div className="stack stack--xl">
      <PageHeader backHref="/worker/profile" backLabel="Mi perfil" eyebrow="Reseñas" title="Lo que dicen tus clientes" />
      <div className="layout-aside layout-aside--sidebar">
        {reviews.length ? (
          <div className="grid grid--2">
            {reviews.map((review) => (
              <article className="card card--lg" key={review.id}>
                <div className="review">
                  <Avatar name={review.user.name} round size="sm" />
                  <div className="stack stack--sm" style={{ flex: 1, minWidth: 0 }}>
                    <div className="row row--between row--wrap">
                      <strong>{review.user.name}</strong>
                      <span className="text-xs muted">{relativeDay(review.createdAt)}</span>
                    </div>
                    <Stars size={14} value={review.rating} />
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm" style={{ lineHeight: 1.6 }}>
                    {review.comment}
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon="star" title="Aún no tienes reseñas">
            Cuando completes servicios, tus clientes podrán calificarte.
          </EmptyState>
        )}
        <aside className="card card--lg sticky-aside">
          <div className="row" style={{ alignItems: "flex-end", gap: 12 }}>
            <span className="rating-big">{average.toFixed(1)}</span>
            <div className="stack stack--sm">
              <Stars value={average} />
              <span className="text-sm muted">
                {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
              </span>
            </div>
          </div>
          <div className="stack stack--sm">
            {distribution.map((row) => (
              <div className="row" key={row.stars}>
                <span className="text-sm" style={{ width: 14 }}>
                  {row.stars}
                </span>
                <span aria-label={`${row.percent}% con ${row.stars} estrellas`} className="bar" role="img">
                  <span style={{ width: `${row.percent}%` }} />
                </span>
                <span className="text-xs muted" style={{ width: 34, textAlign: "right" }}>
                  {row.percent}%
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
