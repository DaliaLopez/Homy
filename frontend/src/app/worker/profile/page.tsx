import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Icon from "@/shared/ui/icon";
import ProfileForm from "@/shared/profile/profile-form";
import ProfileView from "@/shared/profile/profile-view";
import { categoryIcon } from "@/app/worker/_components/services/category-icon";
import { decisionMessage, latestCategoryDecisions } from "@/lib/category-decisions";
import { getMyReviews, getReceivedRequests } from "@/lib/data";
import { getProfile, requireRole } from "@/lib/session";
import { supportWhatsAppUrl } from "@/lib/support";
import { getWorkerState } from "@/lib/worker-state";

export const metadata: Metadata = { title: "Mi perfil" };

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Perfil profesional: datos, categorías, accesos y edición (nombre bloqueado tras verificar). */
export default async function WorkerProfilePage() {
  await requireRole("worker");
  const [user, state, reviews, requests] = await Promise.all([getProfile(), getWorkerState(), getMyReviews(), getReceivedRequests()]);
  if (!user) redirect("/login");
  const worker = state.worker;
  const verified = state.stage === "verified";
  const rating = Number(worker?.averageRating ?? 0);
  // Última decisión de cada categoría enviada: en revisión o no aprobada (con el motivo del administrador).
  const approvedIds = (worker?.approvedCategories ?? []).map((category) => category.id);
  const decisions = latestCategoryDecisions(state.verifications).filter((item) => !approvedIds.includes(item.categoryId));
  const pendingCategories = decisions.filter((item) => item.status === "pending");
  const rejectedCategories = decisions.filter((item) => item.status === "rejected");

  // Métricas de la tarjeta: experiencia (si la escribió con años), clientes atendidos y calificación.
  const completed = requests.filter((request) => request.status === "completed");
  const years = /(\d+)\s*años?/i.exec(worker?.experience ?? "")?.[1];
  const clients = new Set(completed.flatMap((request) => (request.client ? [request.client.id] : []))).size;
  const stats = [
    years
      ? { value: plural(Number(years), "año", "años"), label: "Experiencia", icon: "clock" as const }
      : { value: String(completed.length), label: "Servicios hechos", icon: "briefcase" as const },
    { value: String(clients), label: "Clientes", icon: "user" as const },
    { value: reviews.length ? rating.toFixed(1) : "—", label: "Calificación", icon: "star" as const },
  ];

  const categories = [
    ...(worker?.approvedCategories ?? []).map((category) => ({ key: category.id, name: category.name, badge: "" })),
    ...pendingCategories.map((category) => ({ key: category.categoryId, name: category.name, badge: "En revisión" })),
    ...rejectedCategories.map((category) => ({ key: category.categoryId, name: category.name, badge: "No aprobada" })),
  ];
  const trade = (worker?.approvedCategories ?? []).map((category) => category.name).join(", ");

  return (
    <ProfileView
      about={worker?.description ?? ""}
      chips={
        verified ? (
          <span className="chip chip--dark">
            <Icon name="shield" size={14} /> Perfil verificado
          </span>
        ) : (
          <span className="chip chip--olive">Sin verificar</span>
        )
      }
      form={
        <ProfileForm
          email={user.email}
          location={user.location}
          lockIdentity
          name={user.name}
          phone={user.phone}
          worker={{ description: worker?.description ?? "", experience: worker?.experience ?? "" }}
        />
      }
      formHint="Nombre, contacto, ubicación y descripción"
      formTitle="Datos de mi cuenta"
      menu={[
        {
          href: "/worker/reviews",
          label: "Calificaciones y reseñas",
          icon: "star",
          description: reviews.length ? `${rating.toFixed(1)} de promedio · ${plural(reviews.length, "reseña", "reseñas")}` : "Aún no tienes reseñas",
        },
        {
          href: "/worker/verification",
          label: "Verificación",
          icon: "shield",
          description: verified
            ? "Documentos aprobados por el administrador"
            : state.stage === "review"
              ? "Documentos en revisión"
              : "Verifica tu perfil para publicar servicios",
        },
        { href: "/worker/reports", label: "Mis reportes", icon: "flag", description: "Reportes que hiciste o que te hicieron" },
        { href: supportWhatsAppUrl(), label: "Contactar soporte", icon: "whatsapp", external: true, description: "Te atendemos por WhatsApp" },
      ]}
      menuLabel="Opciones del perfil"
      stats={stats}
      location={user.location}
      subtitle={trade ? <p className="profile-card__meta">{trade}</p> : undefined}
      user={user}
    >
      <section className="profile-box section">
        <div className="section-head">
          <div className="stack stack--sm">
            <h2>Mis categorías</h2>
            <p className="profile-box__text">Solo puedes publicar servicios en categorías verificadas por el administrador.</p>
          </div>
          {verified && (
            <Link className="btn btn--secondary btn--sm" href="/worker/categories/new">
              <Icon name="plus" size={16} /> Agregar categoría
            </Link>
          )}
        </div>
        {categories.length ? (
          <div className="profile-categories">
            {categories.map((category) => (
              // Mismo estilo que las categorías al verificar, agregar categoría o publicar un servicio.
              <div className={`category-picker__option${category.badge ? " is-locked" : ""}`} key={category.key}>
                <Icon name={categoryIcon(category.name)} size={20} />
                <span className="category-picker__name">{category.name}</span>
                {category.badge && <span className="category-picker__badge">{category.badge}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm muted">Elige tus categorías al verificar tu perfil.</p>
        )}
        {/* Decisión del administrador sobre las categorías que no aprobó, con el motivo y cómo volver a intentarlo. */}
        {rejectedCategories.map((category) => (
          <div className="notice notice--danger category-decision" key={category.categoryId} role="status">
            <Icon name="alert" size={18} />
            <div className="stack stack--sm">
              <strong>El administrador no aprobó {category.name}</strong>
              <span>{decisionMessage(category) || "Revisa tu evidencia y vuelve a enviarla."}</span>
              <Link className="btn btn--outline btn--sm" href={verified ? `/worker/categories/new?categoria=${category.categoryId}` : "/worker/verification"}>
                {verified ? "Enviar nueva evidencia" : "Corregir mi verificación"}
              </Link>
            </div>
          </div>
        ))}
      </section>
    </ProfileView>
  );
}
