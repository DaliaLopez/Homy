import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/shared/ui/page-header";
import ServiceForm from "@/app/worker/_components/services/service-form";
import { getMyServices } from "@/lib/data";
import { requireRole } from "@/lib/session";
import { getWorkerState } from "@/lib/worker-state";

export const metadata: Metadata = { title: "Editar servicio" };

/** Editar servicio: al guardar vuelve a revisión del administrador. */
export default async function EditServicePage({ params }: PageProps<"/worker/services/[id]/edit">) {
  await requireRole("worker");
  const [{ id }, services, state] = await Promise.all([params, getMyServices(), getWorkerState()]);
  const service = services.find((item) => item.id === id);
  if (!service || service.status === "rejected") notFound();

  return (
    <div className="stack stack--lg">
      <PageHeader backHref="/worker/services" backLabel="Mis servicios" eyebrow="Editar servicio" title="Edita tu servicio" />
      <ServiceForm categories={state.worker?.approvedCategories ?? [service.category]} service={service} />
    </div>
  );
}
