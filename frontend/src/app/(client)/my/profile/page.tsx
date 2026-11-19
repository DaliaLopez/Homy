import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProfileForm from "@/shared/profile/profile-form";
import ProfileView from "@/shared/profile/profile-view";
import { getMyRequests, getReportsMade } from "@/lib/data";
import { getProfile, requireRole } from "@/lib/session";
import { supportWhatsAppUrl } from "@/lib/support";

export const metadata: Metadata = { title: "Mi perfil" };

// Datos del perfil del cliente 
export default async function MyProfilePage() {
  await requireRole("user");
  const [user, requests, reports] = await Promise.all([getProfile(), getMyRequests(), getReportsMade()]);
  if (!user) redirect("/login");

  return (
    <ProfileView
      chips={<span className="chip chip--sage">Cliente</span>}
      form={<ProfileForm email={user.email} location={user.location} name={user.name} phone={user.phone} />}
      menu={[
        { href: "/my/requests", label: "Mis servicios", icon: "briefcase", description: "Solicitudes que has hecho y su estado" },
        { href: "/my/reports", label: "Mis reportes", icon: "flag", description: "Reportes que hiciste o que te hicieron" },
        { href: supportWhatsAppUrl(), label: "Contactar soporte", icon: "whatsapp", external: true, description: "Te atendemos por WhatsApp" },
      ]}
      stats={[
        { value: String(requests.length), label: "Solicitudes", icon: "file" },
        { value: String(requests.filter((request) => request.status === "completed").length), label: "Completadas", icon: "checkCircle" },
        { value: String(reports.length), label: "Reportes", icon: "flag" },
      ]}
      location={user.location}
      user={user}
    />
  );
}
