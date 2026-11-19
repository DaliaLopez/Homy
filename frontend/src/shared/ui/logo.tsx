import Image from "next/image";
import Link from "next/link";

type LogoProps = { href?: string; tag?: string; height?: number };

/** Logo de Homy (public/assets/brand/homy-logo.svg). Relación 216.57 × 125.89. */
export default function Logo({ href = "/", tag, height = 60 }: LogoProps) {
  const width = Math.round(height * (216.57 / 125.89));
  return (
    <Link aria-label="Homy, ir al inicio" className="brand" href={href}>
      <Image alt="Homy" className="brand__logo" height={height} priority src="/assets/brand/homy-logo.svg" style={{ height, width }} width={width} />
      {tag && <span className="brand__tag">{tag}</span>}
    </Link>
  );
}
