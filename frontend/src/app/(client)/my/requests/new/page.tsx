import type { Metadata } from "next";
import Link from "next/link";
import EmptyState from "@/shared/ui/empty-state";
import PageHeader from "@/shared/ui/page-header";
import NewRequestForm from "@/app/(client)/my/_components/new-request-form";
import { getWorker } from "@/lib/data";
import { placeName, sameCity } from "@/lib/location";
import { getProfile, requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Nueva solicitud" };

/** Crear solicitud (cliente). */
export default async function NewRequestPage({ searchParams }: PageProps<"/my/requests/new">) {
  await requireRole("user");
  const { profesional, servicio } = await searchParams;
  const worker = typeof profesional === "string" ? await getWorker(profesional) : null;

  if (!worker) {
    return (
      <div className="stack stack--lg">
        <PageHeader backHref="/my/requests" backLabel="Mis servicios" eyebrow="Nueva solicitud" title="Solicita tu servicio" />
        <EmptyState
          action={
            <Link className="btn btn--primary" href="/workers">
              Buscar profesionales
            </Link>
          }
          title="Primero elige un profesional"
        >
          Busca el servicio que necesitas y elige a la persona indicada.
        </EmptyState>
      </div>
    );
  }

  const profile = await getProfile();
  // Solo se contrata a profesionales de la misma ciudad del cliente.
  if (!sameCity(profile?.location, worker.user.location)) {
    return (
      <div className="stack stack--lg">
        <PageHeader backHref={`/workers/${worker.id}`} backLabel="Volver al perfil" eyebrow="Nueva solicitud" title="Solicita tu servicio" />
        <EmptyState
          action={
            <Link className="btn btn--primary" href="/workers">
              Ver profesionales de tu ciudad
            </Link>
          }
          icon="pin"
          title="Este profesional no atiende en tu ciudad"
        >
          {worker.user.name} trabaja en {placeName(worker.user.location)}. Solo puedes contratar profesionales de {placeName(profile?.location, "tu ciudad")}.
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="stack stack--lg">
      <PageHeader backHref={`/workers/${worker.id}`} backLabel="Volver al perfil" eyebrow="Nueva solicitud" title="Solicita tu servicio" />
      <NewRequestForm defaultAddress={profile?.location ?? ""} initialServiceId={typeof servicio === "string" ? servicio : undefined} worker={worker} />
    </div>
  );
}
