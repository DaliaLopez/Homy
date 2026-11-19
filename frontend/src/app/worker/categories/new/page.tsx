import type { Metadata } from "next";
import Icon from "@/shared/ui/icon";
import PageHeader from "@/shared/ui/page-header";
import AddCategoryForm from "@/app/worker/_components/verification/add-category-form";
import { latestCategoryDecisions } from "@/lib/category-decisions";
import { getCategories } from "@/lib/data";
import { requireRole } from "@/lib/session";
import { getWorkerState } from "@/lib/worker-state";

export const metadata: Metadata = { title: "Agregar categoría" };

/** Agregar una categoría nueva con su evidencia (el administrador la aprueba aparte). */
export default async function AddCategoryPage({ searchParams }: PageProps<"/worker/categories/new">) {
  await requireRole("worker");
  const [state, categories, { categoria }] = await Promise.all([getWorkerState(), getCategories(), searchParams]);
  const verified = state.worker?.approvedCategories.map((item) => item.id) ?? [];
  const inReview = latestCategoryDecisions(state.verifications)
    .filter((item) => item.status === "pending" && !verified.includes(item.categoryId))
    .map((item) => item.categoryId);
  // Desde el aviso "no aprobada" del perfil llega la categoría ya elegida para reenviar la evidencia.
  const initial = typeof categoria === "string" && !verified.includes(categoria) && !inReview.includes(categoria) ? categoria : "";

  return (
    <div className="stack stack--lg" style={{ maxWidth: 880 }}>
      <PageHeader
        backHref="/worker/profile"
        backLabel="Mi perfil"
        description="Si aprendiste de forma empírica no necesitas certificado: fotos de trabajos o referencias son suficientes."
        eyebrow="Verificación"
        title="Agregar una categoría"
      />
      {state.stage !== "verified" ? (
        <div className="notice notice--neutral">
          <Icon name="alert" size={18} />
          <span>Primero completa tu verificación inicial. Allí eliges tus primeras categorías.</span>
        </div>
      ) : (
        <AddCategoryForm categories={categories} inReview={inReview} initial={initial} verified={verified} />
      )}
    </div>
  );
}
