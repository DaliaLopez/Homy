import type { Metadata } from "next";
import PageHeader from "@/shared/ui/page-header";
import RequestBoard from "@/shared/requests/request-board";
import { getReceivedRequests } from "@/lib/data";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Solicitudes" };

/** Solicitudes recibidas (trabajador). */
export default async function WorkerRequestsPage({ searchParams }: PageProps<"/worker/requests">) {
  await requireRole("worker");
  const [{ estado }, requests] = await Promise.all([searchParams, getReceivedRequests()]);
  return (
    <div className="stack stack--lg">
      <PageHeader description="Acepta las nuevas y sigue el estado de las que ya confirmaste." eyebrow="Solicitudes" title="Solicitudes recibidas" />
      <RequestBoard base="/worker/requests" estado={estado} requests={requests} viewer="worker" />
    </div>
  );
}
