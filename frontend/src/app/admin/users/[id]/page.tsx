import Link from "next/link";
import { notFound } from "next/navigation";
import SuspendUser from "@/app/admin/_components/suspend-user";
import Avatar from "@/shared/ui/avatar";
import Icon from "@/shared/ui/icon";
import PageHeader from "@/shared/ui/page-header";
import StatusChip from "@/shared/ui/status-chip";
import { getAllReports } from "@/lib/data";
import { homyGet, publicGet } from "@/lib/homy-api";
import { formatShortDate } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { roleLabel, type AppUser } from "@/types/user";
import type { Worker } from "@/types/worker";

/** Perfil de un usuario visto por el administrador (también se abre desde "Ver perfil" de un reporte). */
export default async function AdminUserPage({ params, searchParams }: PageProps<"/admin/users/[id]">) {
  const admin = await requireRole("admin");
  const [{ id }, { reporte }] = await Promise.all([params, searchParams]);
  const user = await homyGet<(AppUser & { requestsCount?: number }) | null>(`/users/${id}`, null);
  if (!user) notFound();
  const [reports, workers] = await Promise.all([getAllReports(), user.role === "worker" ? publicGet<Worker[]>("/workers?limit=100", []) : Promise.resolve([])]);
  const worker = workers.find((item) => item.user.id === user.id);
  const involved = reports.filter((item) => item.reporter?.id === user.id || item.reportedUserId === user.id);
  const suspended = user.status === "suspended";
  const fromReport = typeof reporte === "string";

  return (
    // El encabezado va arriba de las dos columnas: así la tarjeta del perfil y "Suspender cuenta" empiezan a la misma altura.
    <div className="stack stack--lg">
      <PageHeader
        backHref={fromReport ? `/admin/reports/${reporte}` : "/admin/users"}
        backLabel={fromReport ? "Volver al reporte" : "Usuarios"}
        eyebrow="Usuario"
        title={user.name}
      />
      <div className="layout-aside layout-aside--sidebar">
        <div className="stack stack--xl">
          <section className="card card--lg">
            <div className="profile-hero">
              <Avatar name={user.name} round size="lg" src={user.avatarUrl} />
              <div className="stack stack--sm">
                <div className="chip-group">
                  <span className={`chip ${user.role === "worker" ? "chip--olive" : user.role === "admin" ? "chip--dark" : "chip--sage"}`}>
                    {roleLabel[user.role]}
                  </span>
                  <span className={`chip ${suspended ? "chip--danger" : "chip--sage"}`}>{suspended ? "Suspendido" : "Activo"}</span>
                </div>
                <p className="muted meta__item">
                  <Icon name="pin" size={16} />
                  {user.location ?? "Sin ubicación"}
                </p>
                <p className="text-sm">
                  {user.email} · {user.phone ?? "Sin teléfono"}
                </p>
                <p className="text-xs muted">Registrado el {formatShortDate(user.createdAt)}</p>
              </div>
            </div>
            {suspended && user.suspensionReason && (
              <div className="notice notice--danger">
                <Icon name="lock" size={18} />
                <span>
                  <strong>Motivo de la suspensión:</strong> {user.suspensionReason}
                </span>
              </div>
            )}
            <div className="grid grid--stats">
              <div className="stat">
                <span className="stat__value">{involved.filter((item) => item.reportedUserId === user.id).length}</span>
                <span className="stat__label">Reportes recibidos</span>
              </div>
              <div className="stat stat--olive">
                <span className="stat__value">{involved.filter((item) => item.reporter?.id === user.id).length}</span>
                <span className="stat__label">Reportes hechos</span>
              </div>
              {/* Cliente: cuántas solicitudes ha hecho; trabajador: su calificación. */}
              {user.role === "user" ? (
                <div className="stat stat--dark">
                  <span className="stat__value">{user.requestsCount ?? 0}</span>
                  <span className="stat__label">Solicitudes</span>
                </div>
              ) : (
                <div className="stat stat--dark">
                  <span className="stat__value">{worker ? Number(worker.averageRating).toFixed(1) : "—"}</span>
                  <span className="stat__label">Calificación</span>
                </div>
              )}
            </div>
          </section>

          {worker && (
            <section className="section">
              <h2>Categorías verificadas</h2>
              <div className="chip-group">
                {worker.approvedCategories.length ? (
                  worker.approvedCategories.map((category) => (
                    <span className="chip chip--dark" key={category.id}>
                      {category.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm muted">Sin categorías verificadas</span>
                )}
              </div>
            </section>
          )}

          <section className="section">
            <h2>Reportes en los que aparece</h2>
            {involved.length ? (
              <div className="grid grid--2">
                {involved.map((report) => (
                  <Link className="card" href={`/admin/reports/${report.id}`} key={report.id}>
                    <div className="row row--between">
                      <StatusChip kind="report" status={report.status} />
                      <span className="text-xs muted">{formatShortDate(report.createdAt)}</span>
                    </div>
                    <h3>{report.reason}</h3>
                    <p className="text-sm muted">{report.reporter?.id === user.id ? "Hizo el reporte" : "Fue reportado"}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm muted">No aparece en ningún reporte.</p>
            )}
          </section>
        </div>

        <aside className="stack sticky-aside">
          {user.role !== "admin" && user.id !== admin.id && (
            <section className="card card--lg card--outline">
              <SuspendUser danger={!suspended} id={user.id} label="Suspender cuenta" name={user.name} suspended={suspended} />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
