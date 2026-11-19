import type { Metadata } from "next";
import Link from "next/link";
import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import PageHeader from "@/shared/ui/page-header";
import StatusChip from "@/shared/ui/status-chip";
import { getAdminCategories, getAdminVerifications, getAllReports, getServicesForReview, getUsers } from "@/lib/data";
import { capitalize, cityOf, formatCOP, formatShortDate, relativeDay } from "@/lib/format";
import { getProfile, requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Panel de administración" };

/** Panel: resumen y pendientes (verificaciones, servicios y reportes). */
export default async function AdminHomePage() {
  await requireRole("admin");
  const [profile, verifications, services, reports, users, categories] = await Promise.all([
    getProfile(),
    getAdminVerifications(),
    getServicesForReview(),
    getAllReports(),
    getUsers(),
    getAdminCategories(),
  ]);
  const pendingVerifications = verifications.filter((item) => item.status === "pending");
  const pendingServices = services.filter((item) => item.status === "in_review");
  const openReports = reports.filter((item) => item.status === "pending" || item.status === "investigating");
  const today = capitalize(new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" }));

  return (
    <div className="stack stack--xl">
      <PageHeader
        actions={
          <span className="chip chip--neutral" style={{ height: 44, padding: "0 18px", fontSize: 14 }}>
            <Icon name="calendar" size={16} />
            {today}
          </span>
        }
        greeting="Hola,"
        title={profile?.name ?? "Administración"}
      />

      <section aria-label="Resumen" className="grid grid--stats-5">
        <Link className="stat stat--dark" href="/admin/verifications">
          <Icon name="shield" size={22} />
          <span className="stat__value">{pendingVerifications.length}</span>
          <span className="stat__label">Verificaciones pendientes</span>
        </Link>
        <Link className="stat stat--olive" href="/admin/services">
          <Icon name="tag" size={22} />
          <span className="stat__value">{pendingServices.length}</span>
          <span className="stat__label">Servicios por revisar</span>
        </Link>
        <Link className="stat stat--sage" href="/admin/reports">
          <Icon name="flag" size={22} />
          <span className="stat__value">{openReports.length}</span>
          <span className="stat__label">Reportes sin resolver</span>
        </Link>
        <Link className="stat stat--grey" href="/admin/users">
          <Icon name="users" size={22} />
          <span className="stat__value">{users.length.toLocaleString("es-CO")}</span>
          <span className="stat__label">Usuarios registrados</span>
        </Link>
        <Link className="stat stat--grey" href="/admin/categories">
          <Icon name="briefcase" size={22} />
          <span className="stat__value">{categories.filter((item) => item.isActive).length}</span>
          <span className="stat__label">Categorías activas</span>
        </Link>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Verificaciones pendientes</h2>
          <Link className="link-more" href="/admin/verifications">
            Ver todas
          </Link>
        </div>
        {pendingVerifications.length ? (
          <div className="grid grid--auto">
            {pendingVerifications.slice(0, 3).map((item) => {
              const name = item.worker?.user.name ?? "Trabajador";
              return (
                <article className="card card--lg" key={item.id}>
                  <div className="request-card__top">
                    <Avatar name={name} />
                    <div className="request-card__body">
                      <div className="chip-group">
                        <span className={`chip ${item.type === "category" ? "chip--olive" : "chip--dark"}`}>
                          {item.type === "category" ? "Nueva categoría" : "Verificación inicial"}
                        </span>
                        <span className="chip chip--sage">
                          <Icon name="pin" size={14} />
                          {cityOf(item.worker?.user.location)}
                        </span>
                      </div>
                      <h3>{name}</h3>
                      <p className="text-sm">{item.categories.map((category) => category.name).join(", ")}</p>
                      <span className="meta__item text-sm muted">
                        <Icon name="clock" size={15} />
                        Enviada {relativeDay(item.createdAt).toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <Link className="btn btn--primary" href={`/admin/verifications/${item.id}`}>
                    Revisar
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="shield" title="No hay verificaciones pendientes" />
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Servicios pendientes</h2>
          <Link className="link-more" href="/admin/services">
            Ver todos
          </Link>
        </div>
        {pendingServices.length ? (
          <div className="grid grid--auto">
            {pendingServices.slice(0, 3).map((service) => {
              const name = service.worker?.user?.name ?? "Trabajador";
              return (
                <article className="card card--lg" key={service.id}>
                  <div className="request-card__top">
                    <Avatar name={name} src={service.worker?.user?.avatarUrl} />
                    <div className="request-card__body">
                      <div className="chip-group">
                        <StatusChip kind="service" status={service.status} />
                        <span className="chip chip--sage">{service.category.name}</span>
                      </div>
                      <h3>{service.name}</h3>
                      <p className="text-sm">
                        {name} · {formatCOP(Number(service.price))}
                      </p>
                      <span className="meta__item text-sm muted">
                        <Icon name="clock" size={15} />
                        Enviado el {formatShortDate(service.submittedAt ?? service.createdAt)}
                      </span>
                    </div>
                  </div>
                  <Link className="btn btn--primary" href={`/admin/services/${service.id}`}>
                    Revisar
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState icon="briefcase" title="No hay servicios por revisar" />
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Reportes recientes</h2>
          <Link className="link-more" href="/admin/reports">
            Ver todos
          </Link>
        </div>
        {openReports.length ? (
          <div className="grid grid--auto">
            {openReports.slice(0, 6).map((report) => (
              <Link className="card card--lg" href={`/admin/reports/${report.id}`} key={report.id}>
                <div className="row row--between">
                  <StatusChip kind="report" status={report.status} />
                  <span className="text-xs muted">{formatShortDate(report.createdAt)}</span>
                </div>
                <h3>{report.reason}</h3>
                <p className="text-sm muted">
                  {report.reporter?.name ?? "—"} reportó a {report.reportedUser?.name ?? "—"} · {report.request?.serviceName ?? "Servicio"}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState icon="flag" title="No hay reportes sin resolver" />
        )}
      </section>
    </div>
  );
}
