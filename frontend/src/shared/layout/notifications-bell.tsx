"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "@/shared/ui/icon";

export type AppNotification = { id: string; title: string; body: string; when: string; href: string; unread: boolean };

/** Campana con el panel de notificaciones (la misma para cliente, trabajador y administración). */
export default function NotificationsBell({ notifications: initial }: { notifications: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
  const anchor = useRef<HTMLDivElement>(null);
  const notifications = initial.map((item) => ({ ...item, unread: item.unread && !readIds.includes(item.id) }));
  const unread = notifications.filter((item) => item.unread).length;

  // Cierra el panel al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!anchor.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="popover-anchor" ref={anchor}>
      <button aria-expanded={open} aria-label={`Ver notificaciones, ${unread} sin leer`} className="icon-btn" onClick={() => setOpen((value) => !value)} type="button">
        <Icon name="bell" size={20} />
        {unread > 0 && <span className="badge-count">{unread}</span>}
      </button>
      {open && (
        <div className="popover">
          <div className="popover__head">
            <div>
              <h2 style={{ fontSize: "var(--fs-lg)" }}>Notificaciones</h2>
              <p className="text-xs muted" style={{ marginTop: 4 }}>
                {unread ? `${unread} pendientes por leer` : "Estás al día"}
              </p>
            </div>
            <button className="link-more link-strong text-xs" onClick={() => setReadIds(initial.map((item) => item.id))} type="button">
              Marcar todas
            </button>
          </div>
          <div className="popover__body">
            {notifications.length === 0 && (
              <p className="text-xs muted" style={{ padding: "var(--space-4)" }}>
                No tienes notificaciones.
              </p>
            )}
            {notifications.map((item) => (
              <Link
                className={`notification${item.unread ? " is-unread" : ""}`}
                href={item.href}
                key={item.id}
                onClick={() => {
                  setReadIds((ids) => [...ids, item.id]);
                  setOpen(false);
                }}
              >
                <span className="notification__dot" />
                <span>
                  <strong className="text-sm" style={{ display: "block", fontWeight: 600 }}>
                    {item.title}
                  </strong>
                  <span className="text-xs muted" style={{ display: "block", marginTop: 4, lineHeight: 1.5 }}>
                    {item.body}
                  </span>
                  <span className="text-olive" style={{ display: "block", marginTop: 6, fontSize: 11 }}>
                    {item.when}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
