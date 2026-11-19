import { initials } from "@/lib/format";

type AvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  round?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

/** Foto de la persona o, si no tiene, sus iniciales sobre fondo salvia. */
export default function Avatar({ name, src, size = "md", round, className = "", style }: AvatarProps) {
  const classes = ["avatar", size !== "md" && `avatar--${size}`, round && "avatar--round", className].filter(Boolean).join(" ");
  return (
    <span aria-label={src ? undefined : name} className={classes} role={src ? undefined : "img"} style={style}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- fotos en data URL desde la API
        <img alt={name} src={src} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
