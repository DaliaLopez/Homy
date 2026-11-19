import { notFound } from "next/navigation";
import Notice from "@/shared/ui/notice";
import RequestDetail from "@/shared/requests/request-detail";
import { getMyRequests } from "@/lib/data";
import { requireRole } from "@/lib/session";

// Detalle de la solicitud del cliente: cancelar, calificar y reportar.
export default async function MyRequestDetailPage({ params, searchParams }: PageProps<"/my/requests/[id]">) {
  await requireRole("user");
  const [{ id }, { nuevo }, requests] = await Promise.all([params, searchParams, getMyRequests()]);
  const request = requests.find((item) => item.id === id);
  if (!request) notFound();

  return (
    <div className="stack stack--lg">
      {nuevo === "1" && <Notice>Enviamos tu solicitud. Te avisaremos cuando el profesional la confirme.</Notice>}
      <RequestDetail request={request} viewer="client" />
    </div>
  );
}
