import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/shared/ui/icon";
import PageHeader from "@/shared/ui/page-header";
import RequestBoard from "@/shared/requests/request-board";
import { getMyRequests } from "@/lib/data";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Mis servicios" };

// Mis solicitudes (cliente). 
export default async function MyRequestsPage({ searchParams }: PageProps<"/my/requests">) {
  await requireRole("user");
  const [{ estado }, requests] = await Promise.all([searchParams, getMyRequests()]);

  return (
    <div className="stack stack--lg">
      <PageHeader
        actions={
          <Link className="btn btn--primary" href="/workers">
            <Icon name="plus" size={18} /> Solicitar nuevo servicio
          </Link>
        }
        description="Sigue el estado de cada servicio que solicitaste."
        eyebrow="Mis servicios"
        title="Tus solicitudes"
      />
      <RequestBoard base="/my/requests" estado={estado} requests={requests} viewer="client" />
    </div>
  );
}
