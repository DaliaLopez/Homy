import type { Metadata } from "next";
import WorkersCatalog from "@/app/(public)/_components/workers-catalog";
import { getCategories, getWorkers } from "@/lib/data";
import { publicGet } from "@/lib/homy-api";
import { getProfile } from "@/lib/session";
import { isAvailableNow } from "@/lib/schedule";
import type { Availability } from "@/types/worker";

export const metadata: Metadata = { title: "Servicios" };

/** Catálogo de profesionales: búsqueda, pestañas (todos, recomendados, favoritos) y filtros. */
export default async function WorkersPage({ searchParams }: PageProps<"/workers">) {
  const { q, categoria } = await searchParams;
  // Con sesión de cliente solo se listan profesionales de su misma ciudad.
  const user = await getProfile();
  const [workers, categories] = await Promise.all([getWorkers(user?.role === "user" ? user.location : undefined), getCategories()]);

  // "Disponibles ahora": horario público de cada profesional comparado con la hora de Bogotá.
  const schedules = await Promise.all(workers.map((worker) => publicGet<Availability[]>(`/availability/worker/${worker.id}`, [])));
  const availableNow = workers.filter((_, index) => isAvailableNow(schedules[index])).map((worker) => worker.id);

  return (
    <WorkersCatalog
      availableNow={availableNow}
      categories={categories.filter((category) => category.isActive !== false)}
      initialCategory={typeof categoria === "string" ? categoria : ""}
      initialQuery={typeof q === "string" ? q.trim() : ""}
      workers={workers}
    />
  );
}
