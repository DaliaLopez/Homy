"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Avatar from "@/shared/ui/avatar";
import Icon from "@/shared/ui/icon";
import Logo from "@/shared/ui/logo";
import { NavPill } from "@/shared/layout/nav-links";
import { adminNav } from "@/shared/layout/nav-config";
import NotificationsBell, { type AppNotification } from "@/shared/layout/notifications-bell";

/**
 * Encabezado de administración: logo, nav en pill (≥1100px), recargar,
 * notificaciones y acceso al perfil. En pantallas más estrechas la navegación
 * va en la barra flotante inferior (ver app/admin/layout.tsx).
 */
export default function AdminHeader({ adminName, adminPhoto, notifications }: { adminName: string; adminPhoto?: string | null; notifications: AppNotification[] }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  return (
    <header className="admin-header">
      <div className="app-header__inner">
        <Logo href="/admin" tag="ADMIN" />
        <NavPill items={adminNav} label="Administración" />
        <div className="header-actions">
          <button
            aria-label="Recargar esta página"
            className="icon-btn"
            disabled={refreshing}
            onClick={() => startRefresh(() => router.refresh())}
            title="Recargar esta página"
            type="button"
          >
            <Icon className={refreshing ? "spin" : undefined} name="refresh" size={19} />
          </button>
          <NotificationsBell notifications={notifications} />
          {/* Misma foto que en el perfil (o las iniciales si no tiene). */}
          <Link aria-label={`${adminName}, ver perfil`} className="avatar-btn" href="/admin/profile" title={adminName}>
            <Avatar name={adminName} round src={adminPhoto} style={{ ["--avatar" as string]: "40px", fontSize: 14 }} />
          </Link>
        </div>
      </div>
    </header>
  );
}
