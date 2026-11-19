import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import PageHeader from "@/shared/ui/page-header";
import RequestCard from "@/shared/requests/request-card";
import StatusActions from "@/shared/requests/status-actions";
import StatusChip, { serviceDot } from "@/shared/ui/status-chip";
import Approved from "@/app/worker/_components/verification/approved";
import InReview from "@/app/worker/_components/verification/in-review";
import PublishGate from "@/app/worker/_components/verification/publish-gate";
import ReviewModal from "@/app/worker/_components/verification/review-modal";
import { getMyServices, getReceivedRequests } from "@/lib/data";
import { formatLongDate, formatTime, isoDay } from "@/lib/format";
import { getProfile, requireRole } from "@/lib/session";
import { getWorkerState } from "@/lib/worker-state";
import { serviceStatusLabel, type ServiceStatus } from "@/types/service";

export const metadata: Metadata = { title: "Inicio" };

const publicationOrder: ServiceStatus[] = ["published", "in_review", "changes_requested", "rejected"];

/**
 * Inicio del trabajador según su verificación:
 * sin verificar · en revisión (modal la primera vez) · correcciones ·
 * aprobado (una vez) · verificado activo (resumen, próximos servicios, pendientes y agenda de hoy).
 */
export default async function WorkerHomePage({ searchParams }: PageProps<"/worker">) {
  await requireRole("worker");
  const [{ enviado }, state, profile, requests] = await Promise.all([searchParams, getWorkerState(), getProfile(), getReceivedRequests()]);
  const name = profile?.name ?? "";

  if (state.stage === "verified" && state.worker) {
    const seen = (await cookies()).get("homy_verified_seen")?.value;
    if (seen !== state.worker.id) return <Approved worker={state.worker} />;
  }

  if (state.stage !== "verified") {
    const copy = {
      unverified: {
        icon: "shield" as const,
        eyebrow: "Perfil sin verificar",
        title: "Verifica tu perfil para empezar a publicar servicios",
        text: "Sube tus documentos y la evidencia de tus categorías. Cuando un administrador apruebe tu perfil podrás publicar servicios y recibir solicitudes.",
        cta: "Verificar mi perfil",
      },
      review: {
        icon: "clock" as const,
        eyebrow: "En revisión",
        title: "Estamos revisando tu perfil",
        text: "Un administrador está revisando tus documentos. Te avisaremos apenas tengamos respuesta.",
        cta: "Ver estado de mi verificación",
      },
      changes: {
        icon: "alert" as const,
        eyebrow: "Requiere correcciones",
        title: "Tu verificación necesita correcciones",
        text: "Algunos documentos no fueron aprobados. Vuelve a subir solo los que tienen observaciones; lo aprobado se conserva.",
        cta: "Corregir y reenviar",
      },
    }[state.stage];

    return (
      <div className="stack stack--xl">
        {state.stage === "review" && enviado === "1" && state.initial && (
          <ReviewModal>
            <InReview verification={state.initial} />
          </ReviewModal>
        )}
        <PageHeader actions={<PublishGate />} greeting="Hola," title={name} />
        <div className="layout-aside layout-aside--sidebar">
          <section className="empty" style={state.stage === "changes" ? { background: "var(--color-danger-soft)" } : undefined}>
            <span className="empty__icon">
              <Icon name={copy.icon} size={28} />
            </span>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2>{copy.title}</h2>
            <p className="lead" style={{ maxWidth: 480 }}>
              {copy.text}
            </p>
            <Link className="btn btn--primary" href="/worker/verification">
              {copy.cta}
            </Link>
          </section>
          <aside className="stack sticky-aside">
            <nav aria-label="Mientras tanto" className="menu-list">
              <Link className="menu-list__item" href="/worker/profile">
                <Icon name="edit" />
                Escribe tu descripción
                <Icon name="chevronRight" size={16} />
              </Link>
              <Link className="menu-list__item" href="/worker/availability">
                <Icon name="calendar" />
                Define tu disponibilidad
                <Icon name="chevronRight" size={16} />
              </Link>
              {/* Sin "Agrega una buena foto": la foto de perfil se envía en la verificación y no se cambia desde el perfil. */}
            </nav>
          </aside>
        </div>
      </div>
    );
  }

  const services = await getMyServices();
  const pending = requests.filter((request) => request.status === "requested");
  const upcoming = requests
    .filter((request) => request.status === "accepted")
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const active = requests.filter((request) => ["accepted", "in_progress"].includes(request.status));
  const completed = requests.filter((request) => request.status === "completed").length;
  const todayKey = isoDay();
  const today = active.filter((request) => isoDay(request.scheduledAt) === todayKey).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  return (
    <div className="stack stack--xl">
      <PageHeader
        actions={
          <Link className="btn btn--primary" href="/worker/services/new">
            <Icon name="plus" size={18} /> Publicar servicio
          </Link>
        }
        greeting="Hola,"
        title={name}
      />

      <div className="layout-aside layout-aside--sidebar">
        <div className="stack stack--xl">
          <section aria-label="Resumen" className="grid grid--stats">
            <Link className="stat" href="/worker/requests?estado=requested">
              <Icon name="alert" size={22} />
              <span className="stat__value">{pending.length}</span>
              <span className="stat__label">Solicitudes nuevas</span>
            </Link>
            <Link className="stat stat--olive" href="/worker/requests?estado=accepted">
              <Icon name="refresh" size={22} />
              <span className="stat__value">{active.length}</span>
              <span className="stat__label">Solicitudes activas</span>
            </Link>
            <Link className="stat stat--dark" href="/worker/requests?estado=completed">
              <Icon name="checkCircle" size={22} />
              <span className="stat__value">{completed}</span>
              <span className="stat__label">Solicitudes completadas</span>
            </Link>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Próximos servicios</h2>
              <Link className="link-more" href="/worker/availability">
                Ver agenda
              </Link>
            </div>
            {upcoming.length ? (
              <div className="grid grid--2">
                {upcoming.slice(0, 4).map((request) => (
                  <RequestCard href={`/worker/requests/${request.id}`} key={request.id} request={request} viewer="worker" />
                ))}
              </div>
            ) : (
              <EmptyState icon="calendar" title="No tienes servicios confirmados">
                Cuando aceptes una solicitud aparecerá aquí.
              </EmptyState>
            )}
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Solicitudes pendientes</h2>
              <Link className="link-more" href="/worker/requests?estado=requested">
                Ver todas
              </Link>
            </div>
            {pending.length ? (
              <div className="grid grid--2">
                {pending.slice(0, 4).map((request) => (
                  <RequestCard
                    actions={<StatusActions compact id={request.id} name={request.client?.name ?? "el cliente"} status="requested" />}
                    href={`/worker/requests/${request.id}`}
                    key={request.id}
                    request={request}
                    viewer="worker"
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon="file" title="Estás al día">
                Te avisaremos cuando llegue una nueva.
              </EmptyState>
            )}
          </section>
        </div>

        <aside className="stack stack--lg sticky-aside">
          <section className="card card--lg">
            <p className="eyebrow">Agenda de hoy</p>
            <h3 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.8 }}>{formatLongDate(new Date())}</h3>
            {today.length ? (
              <div>
                {today.map((request) => (
                  <Link className="agenda-item" href={`/worker/requests/${request.id}`} key={request.id}>
                    <span className="agenda-item__time">{formatTime(request.scheduledAt).replace(/ (am|pm)$/, "")}</span>
                    <span className="stack stack--sm">
                      <strong>{request.service?.name ?? "Servicio"}</strong>
                      <span className="text-sm muted">
                        {request.client?.name ?? "Cliente"} · {request.address.split(",")[0]}
                      </span>
                      {request.status === "in_progress" && (
                        <span>
                          <StatusChip kind="request" status={request.status} />
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm muted">No tienes servicios programados para hoy.</p>
            )}
            <Link className="link-strong row" href="/worker/availability" style={{ gap: 4 }}>
              Ver agenda completa <Icon name="chevronRight" size={16} />
            </Link>
          </section>

          <section className="card card--lg card--outline">
            <p className="eyebrow">Mis servicios</p>
            <h3 style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.8 }}>Estado de publicación</h3>
            <p className="text-sm muted" style={{ lineHeight: 1.6 }}>
              Cada servicio nuevo o editado lo revisa un administrador antes de mostrarse a los clientes.
            </p>
            <div className="stack stack--sm">
              {publicationOrder.map((status) => (
                <Link className="pill-row" href={`/worker/services?estado=${status}`} key={status}>
                  <span className="row" style={{ gap: 10 }}>
                    <span className={serviceDot[status]} />
                    {status === "in_review" ? "En revisión del admin" : serviceStatusLabel[status]}
                  </span>
                  <strong>{services.filter((service) => service.status === status).length}</strong>
                </Link>
              ))}
            </div>
            <Link className="link-strong row" href="/worker/services" style={{ gap: 4 }}>
              Ver mis servicios <Icon name="chevronRight" size={16} />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
