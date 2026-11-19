import type { IconName } from "@/shared/ui/icon";

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  /** Solo se marca activo en la ruta exacta (para "/", "/worker", "/admin"). */
  exact?: boolean;
  /** Se muestra solo en la barra inferior móvil. */
  mobileOnly?: boolean;
  /** Otras rutas que también marcan este enlace como activo. */
  also?: string[];
};

export const clientNav: NavItem[] = [
  { href: "/", label: "Inicio", icon: "home", exact: true },
  { href: "/workers", label: "Buscar servicios", icon: "search" },
  { href: "/my/requests", label: "Mis servicios", icon: "briefcase", also: ["/my/reports"] },
  { href: "/my/profile", label: "Perfil", icon: "user", mobileOnly: true },
];

export const workerNav: NavItem[] = [
  { href: "/worker", label: "Inicio", icon: "home", exact: true, also: ["/worker/verification"] },
  { href: "/worker/requests", label: "Solicitudes", icon: "file" },
  { href: "/worker/availability", label: "Agenda", icon: "calendar" },
  { href: "/worker/services", label: "Mis servicios", icon: "briefcase" },
  { href: "/worker/profile", label: "Mi perfil", icon: "user", also: ["/worker/reviews", "/worker/reports", "/worker/categories"] },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Panel", icon: "grid", exact: true },
  { href: "/admin/verifications", label: "Verificaciones", icon: "shield" },
  { href: "/admin/services", label: "Servicios", icon: "tag" },
  { href: "/admin/reports", label: "Reportes", icon: "flag" },
  { href: "/admin/categories", label: "Categorías", icon: "briefcase" },
  { href: "/admin/users", label: "Usuarios", icon: "users" },
];

const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export const isActive = (item: NavItem, pathname: string | null) => {
  if (!pathname) return false;
  const also = (item.also ?? []).some((href) => matches(pathname, href));
  if (item.exact) return pathname === item.href || also;
  return matches(pathname, item.href) || also;
};
