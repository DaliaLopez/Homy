import type { Metadata } from "next";
import Link from "next/link";
import EmptyState from "@/shared/ui/empty-state";
import PageHeader from "@/shared/ui/page-header";
import ServiceForm from "@/app/worker/_components/services/service-form";
import { requireRole } from "@/lib/session";
import { getWorkerState } from "@/lib/worker-state";

export const metadata: Metadata = { title: "Publicar servicio" };

/** Publicar servicio (solo en categorías verificadas). */
export default async function NewServicePage() {
  await requireRole("worker");
  const state = await getWorkerState();
  const categories = state.worker?.approvedCategories ?? [];

  return (
    <div className="stack stack--lg">
      <PageHeader backHref="/worker/services" backLabel="Mis servicios" eyebrow="Nuevo servicio" title="Publicar servicio" />
      {state.stage !== "verified" || categories.length === 0 ? (
        <EmptyState action={<Link className="btn btn--primary" href="/worker/verification">Verificar mi perfil</Link>} icon="lock" title="Primero verifica tu perfil">
          Para publicar servicios, un administrador de Homy debe aprobar tus documentos y al menos una categoría.
        </EmptyState>
      ) : (
        <ServiceForm categories={categories} />
      )}
    </div>
  );
}
