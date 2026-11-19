"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Avatar from "@/shared/ui/avatar";
import Icon from "@/shared/ui/icon";
import NotificationsBell, { type AppNotification } from "./notifications-bell";

export type { AppNotification };

type HeaderActionsProps = {
  city: string;
  profileHref: string;
  profileName: string;
  profilePhoto: string | null;
  notifications: AppNotification[];
};

/** Ciudad · recargar · notificaciones · avatar (encabezado de cliente y trabajador). */
export default function HeaderActions({ city, profileHref, profileName, profilePhoto, notifications }: HeaderActionsProps) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();

  return (
    <div className="header-actions">
      <span className="city-chip">
        <Icon name="pin" size={16} />
        {city}
      </span>
      <button
        aria-label="Actualizar información"
        className="icon-btn"
        disabled={refreshing}
        onClick={() => startRefresh(() => router.refresh())}
        title="Actualizar"
        type="button"
      >
        <Icon className={refreshing ? "spin" : undefined} name="refresh" size={19} />
      </button>
      <NotificationsBell notifications={notifications} />
      <Link aria-label={`Abrir perfil de ${profileName}`} className="avatar-btn" href={profileHref}>
        <Avatar name={profileName} round src={profilePhoto} style={{ ["--avatar" as string]: "40px", fontSize: 14 }} />
      </Link>
    </div>
  );
}
