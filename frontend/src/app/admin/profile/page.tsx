import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Icon from "@/shared/ui/icon";
import ProfileForm from "@/shared/profile/profile-form";
import ProfileView from "@/shared/profile/profile-view";
import { getAdminVerifications, getAllReports, getUsers } from "@/lib/data";
import { getProfile, requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Mi perfil" };

/** Perfil del administrador con la misma diagramación que el del trabajador (tarjeta con foto a la izquierda, datos y salida a la derecha). */
export default async function AdminProfilePage() {
  await requireRole("admin");
  const [user, verifications, reports, users] = await Promise.all([getProfile(), getAdminVerifications(), getAllReports(), getUsers()]);
  if (!user) redirect("/login");

  return (
    <ProfileView
      chips={
        <span className="chip chip--dark">
          <Icon name="shield" size={14} /> Administrador
        </span>
      }
      form={<ProfileForm email={user.email} location={user.location} name={user.name} phone={user.phone} />}
      formOpen
      menu={[]}
      stats={[
        { value: String(verifications.filter((item) => item.status === "pending").length), label: "Verificaciones", icon: "shield" },
        {
          value: String(reports.filter((item) => item.status === "pending" || item.status === "investigating").length),
          label: "Reportes abiertos",
          icon: "flag",
        },
        { value: users.length.toLocaleString("es-CO"), label: "Usuarios", icon: "users" },
      ]}
      location={user.location}
      user={user}
    />
  );
}
