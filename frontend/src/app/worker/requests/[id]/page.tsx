import { notFound } from "next/navigation";
import RequestDetail from "@/shared/requests/request-detail";
import { getReceivedRequests } from "@/lib/data";
import { requireRole } from "@/lib/session";

/** Detalle de la solicitud: aceptar, rechazar, iniciar, completar y calificar al cliente. */
export default async function WorkerRequestDetailPage({ params }: PageProps<"/worker/requests/[id]">) {
  await requireRole("worker");
  const [{ id }, requests] = await Promise.all([params, getReceivedRequests()]);
  const request = requests.find((item) => item.id === id);
  if (!request) notFound();
  return <RequestDetail request={request} viewer="worker" />;
}
