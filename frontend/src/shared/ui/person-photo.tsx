import { initials } from "@/lib/format";

type PersonPhotoProps = { name: string; src?: string | null; size?: number; radius?: number };

/** Foto cuadrada de las tarjetas de profesional (`person-card__photo`); sin foto muestra las iniciales. */
export default function PersonPhoto({ name, src, size, radius }: PersonPhotoProps) {
  const box = size ? { width: size, height: size, borderRadius: radius } : undefined;
  return (
    <span className="person-card__photo" style={{ display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: (size ?? 64) * 0.3, ...box }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- fotos en data URL desde la API
        <img alt={name} src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span aria-label={name} role="img">{initials(name)}</span>
      )}
    </span>
  );
}
