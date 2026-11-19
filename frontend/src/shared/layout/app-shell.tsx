import Link from "next/link";
import type { ReactNode } from "react";
import { cityOf } from "@/lib/format";
import { getNotifications } from "@/lib/notifications";
import type { AppUser } from "@/types/user";
import Logo from "@/shared/ui/logo";
import HeaderActions from "./header-actions";
import { clientNav, workerNav } from "./nav-config";
import { BottomNav, NavPill } from "./nav-links";

type AppShellProps = { role: "user" | "worker"; user: AppUser | null; children: ReactNode };

/**
 * Estructura común de cliente y trabajador:
 * encabezado con nav en pill (≥768px) y barra inferior flotante (<768px).
 */
export default async function AppShell({ role, user, children }: AppShellProps) {
  const nav = role === "worker" ? workerNav : clientNav;
  const home = role === "worker" ? "/worker" : "/";
  const profile = role === "worker" ? "/worker/profile" : "/my/profile";
  const notifications = user ? await getNotifications(role) : [];

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <Logo href={home} />
          <NavPill items={nav} />
          {user ? (
            <HeaderActions
              city={cityOf(user.location)}
              notifications={notifications}
              profileHref={profile}
              profileName={user.name}
              profilePhoto={user.avatarUrl}
            />
          ) : (
            <div className="header-actions">
              <Link className="btn btn--outline btn--sm" href="/register">
                Crear cuenta
              </Link>
              <Link className="btn btn--primary btn--sm" href="/login">
                Iniciar sesión
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className={user ? "page" : "page page--no-bottom-nav"}>{children}</main>

      {user && <BottomNav items={nav} />}
    </div>
  );
}
