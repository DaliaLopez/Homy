import Icon from "./icon";

/** Calificación con estrellas (solo lectura). */
export default function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span aria-label={`${value} de 5 estrellas`} className="stars" role="img">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          className={star <= Math.round(value) ? undefined : "stars__off"}
          filled
          key={star}
          name="star"
          size={size}
          strokeWidth={1.2}
        />
      ))}
    </span>
  );
}

/** "★ 4.9 | 87 reseñas" como en las tarjetas del cliente. */
export function RatingInline({ rating, reviews }: { rating: number; reviews?: number }) {
  return (
    <span className="rating">
      <Icon filled name="star" size={12} strokeWidth={1.2} />
      {Number(rating).toFixed(1)}
      {reviews !== undefined && (
        <>
          <span aria-hidden="true">|</span>
          <span>{reviews} {reviews === 1 ? "reseña" : "reseñas"}</span>
        </>
      )}
    </span>
  );
}
