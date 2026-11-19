import Image from "next/image";
import Link from "next/link";

/** Logo de las pantallas de acceso (SVG recortado, sin margen interno); el tamaño lo pone cada pantalla con `className`. */
export default function AuthLogo({ className = "" }: { className?: string }) {
  return (
    <Link aria-label="Homy, ir al inicio" className={`auth-logo ${className}`} href="/">
      <Image alt="Homy" height={74} priority src="/assets/brand/homy-logo-tight.svg" width={181} />
    </Link>
  );
}
