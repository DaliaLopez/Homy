import type { Metadata } from "next";
import CategoriesManager from "@/app/admin/_components/categories-manager";
import PageHeader from "@/shared/ui/page-header";
import { getAdminCategories } from "@/lib/data";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Categorías" };

/** Crear, editar y desactivar categorías. */
export default async function AdminCategoriesPage() {
  await requireRole("admin");
  const categories = await getAdminCategories();
  return (
    <div className="stack stack--lg">
      <PageHeader description="Las categorías activas aparecen en el inicio del cliente y en la verificación del profesional." eyebrow="Categorías" title="Categorías de servicio" />
      <CategoriesManager categories={categories} />
    </div>
  );
}
