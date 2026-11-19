import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Stars, { RatingInline } from "@/shared/ui/stars";
import FavoriteButton from "@/app/(public)/_components/favorite-button";
import { getWorker, getWorkerAvailability, getWorkerReviews } from "@/lib/data";
import { cityOf, experienceYears, firstName, formatCOP, initials, relativeDay } from "@/lib/format";
import { placeName, sameCity } from "@/lib/location";
import { prettyTime } from "@/lib/schedule";
import { getProfile } from "@/lib/session";
import { weekdays } from "@/types/worker";
import WorkerServices from "@/app/(public)/_components/worker-services";

/**
 * Perfil público del profesional. Orden de arriba hacia abajo:
 * nombre → favoritos → métricas → sobre él → disponibilidad → contratar →
 * servicios → reseñas.
 */
export default async function WorkerProfilePage({ params }: PageProps<"/workers/[id]">) {
  const { id } = await params;
  const worker = await getWorker(id);
  if (!worker) notFound();

  const [availability, reviews, viewer] = await Promise.all([getWorkerAvailability(id), getWorkerReviews(id), getProfile()]);
  // Un cliente solo puede contratar profesionales de su misma ciudad.
  const otherCity = viewer?.role === "user" && !sameCity(viewer.location, worker.user.location);
  const name = firstName(worker.user.name);
  const years = experienceYears(worker.experience);
  const week = weekdays.map((day) => ({
    ...day,
    ranges: availability
      .filter((item) => item.day === day.key)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((item) => ({ start: prettyTime(item.startTime), end: prettyTime(item.endTime) })),
  }));
  const role = worker.approvedCategories.map((category) => category.name).join(" · ") || "Profesional";
  const rating = Number(worker.averageRating);

  return (
    <div className="stack stack--lg">
      <Link className="back-link" href="/workers">
        <Icon name="arrowLeft" size={18} />
        Volver a servicios
      </Link>

      {/* Misma diagramación del perfil privado del trabajador: tarjeta con foto a la izquierda, contenido a la derecha. */}
      <div className="profile-worker">
        <section className="profile-card">
          <div className="profile-card__photo">
            <FavoriteButton iconOnly name={name} workerId={worker.id} />
            {worker.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- foto en data URL desde la API
              <img alt={worker.user.name} src={worker.user.avatarUrl} />
            ) : (
              <span aria-label={worker.user.name} role="img">
                {initials(worker.user.name)}
              </span>
            )}
          </div>
          {/* 1. Nombre y 2. Favoritos */}
          <div className="profile-card__info">
            <h1 className="profile-card__name">{worker.user.name}</h1>
            <p className="profile-card__meta">{role}</p>
            <div className="chip-group">
              {worker.verificationStatus === "verified" && (
                <span className="chip chip--dark">
                  <Icon name="shield" size={14} />
                  Verificado
                </span>
              )}
              <span className="chip chip--sage">
                <Icon name="pin" size={14} />
                {cityOf(worker.user.location)}
              </span>
            </div>
          </div>
          {/* 3. Métricas */}
          <div className="profile-card__stats">
            <div className="profile-card__stat">
              <Icon name="clock" size={22} />
              <strong>{years !== null ? `${years} ${years === 1 ? "año" : "años"}` : "—"}</strong>
              <span>Experiencia</span>
            </div>
            <div className="profile-card__stat">
              <Icon name="user" size={22} />
              <strong>{worker.completedCount}</strong>
              <span>Clientes</span>
            </div>
            <div className="profile-card__stat">
              <Icon name="star" size={22} />
              <strong>{rating.toFixed(1)}</strong>
              <span>Calificación</span>
            </div>
          </div>
        </section>

        <div className="profile-worker__main stack stack--lg">
          {/* 4. Sobre él */}
          <section className="profile-box section">
            <h2>Sobre {name}</h2>
            <p className="profile-box__text">{worker.description}</p>
          </section>

          {/* 5. Disponibilidad: un recuadro por día (verde si atiende, gris si no) con sus horas debajo */}
          <section className="profile-box section">
            <h2>Horarios</h2>
            <div className="week-days">
              {week.map((day) => (
                <div className={`week-day${day.ranges.length ? " is-available" : ""}`} key={day.key}>
                  <strong>{day.short}</strong>
                  {day.ranges.length ? (
                    day.ranges.map((range) => (
                      <span className="week-day__hours" key={range.start}>
                        <span>{range.start}</span>
                        <span>{range.end}</span>
                      </span>
                    ))
                  ) : (
                    <span className="week-day__hours">No disponible</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 6. Contratar: precio a la izquierda y el botón a la derecha, al nivel del precio */}
          <section className="profile-box hire-box">
            <div className="hire-box__row">
              <div>
                <p className="eyebrow">Desde</p>
                <strong className="price">{worker.minPrice !== null ? formatCOP(worker.minPrice) : "—"}</strong>
              </div>
              {!otherCity && (
                <Link className="btn btn--primary" href={`/my/requests/new?profesional=${worker.id}`}>
                  Contratar a {name}
                </Link>
              )}
            </div>
            <p className="text-xs muted">Este es el precio del servicio más económico.</p>
            {otherCity && (
              <div className="notice notice--neutral">
                <Icon name="pin" size={18} />
                <span>
                  {name} trabaja en {placeName(worker.user.location)}. Solo puedes contratar profesionales de tu misma ciudad.
                </span>
              </div>
            )}
          </section>

          {/* 7. Servicios (con filtro por categoría) */}
          <WorkerServices canHire={!otherCity} name={name} services={worker.services} workerId={worker.id} />

          {/* 8. Reseñas (siempre al final) */}
          <section className="profile-box section">
            <div className="section-head">
              <h2>Reseñas</h2>
              <RatingInline rating={rating} reviews={reviews.length} />
            </div>
            {reviews.length ? (
              <div className="grid">
                {reviews.map((review) => (
                  <article className="card" key={review.id}>
                    <div className="review">
                      <Avatar name={review.user.name} round size="sm" />
                      <div className="stack stack--sm" style={{ flex: 1 }}>
                        <div className="row row--between row--wrap">
                          <strong>{review.user.name}</strong>
                          <span className="text-xs muted">{relativeDay(review.createdAt)}</span>
                        </div>
                        <Stars size={14} value={review.rating} />
                        {review.comment && (
                          <p className="text-sm" style={{ lineHeight: 1.6 }}>
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState icon="star" title="Aún no tiene reseñas" />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
