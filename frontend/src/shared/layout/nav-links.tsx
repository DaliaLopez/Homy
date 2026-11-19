"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/shared/ui/icon";
import { isActive, type NavItem } from "./nav-config";

type NavProps = { items: NavItem[]; label?: string };

/** Nav superior en pill (tablet y escritorio). */
export function NavPill({ items, label = "Navegación principal" }: NavProps) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="nav-pill">
      {items
        .filter((item) => !item.mobileOnly)
        .map((item) => {
          const active = isActive(item, pathname);
          return (
            <Link aria-current={active ? "page" : undefined} className={`nav-pill__link${active ? " is-active" : ""}`} href={item.href} key={item.href}>
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}

/** Barra inferior flotante (móvil): ícono y, en la activa, el nombre. */
export function BottomNav({ items, className }: { items: NavItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Navegación móvil" className={className ? `bottom-nav ${className}` : "bottom-nav"}>
      {items.map((item) => {
        const active = isActive(item, pathname);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            className={`bottom-nav__item${active ? " is-active" : ""}`}
            href={item.href}
            key={item.href}
          >
            <Icon name={item.icon} size={19} />
            <span className="bottom-nav__label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
