import AdminHeader from "@/app/admin/_components/admin-header";
import { adminNav } from "@/shared/layout/nav-config";
import { BottomNav } from "@/shared/layout/nav-links";
import { getNotifications } from "@/lib/notifications";
import { getProfile, requireRole } from "@/lib/session";

/** Administración: solo el rol "admin". */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireRole("admin");
  const [profile, notifications] = await Promise.all([getProfile(), getNotifications("admin")]);
  return (
    <div className="app">
      <AdminHeader adminName={profile?.name ?? session.name} adminPhoto={profile?.avatarUrl} notifications={notifications} />
      <main className="page page--admin">{children}</main>
      <BottomNav className="bottom-nav--admin" items={adminNav} />
    </div>
  );
}
