import Link from "next/link";
import { experienceYears, formatCOP } from "@/lib/format";
import type { Worker } from "@/types/worker";
import PersonPhoto from "@/shared/ui/person-photo";
import { RatingInline } from "@/shared/ui/stars";

/** Tarjeta de profesional para el listado de servicios. */
export default function WorkerCard({ worker }: { worker: Worker }) {
  const category = worker.approvedCategories[0]?.name ?? worker.services[0]?.category.name ?? "Profesional";
  const role = worker.approvedCategories.map((item) => item.name).join(" · ") || "Profesional verificado";
  const years = experienceYears(worker.experience);

  return (
    <Link className="card card--lg" href={`/workers/${worker.id}`} style={{ "--card-gap": "14px" } as React.CSSProperties}>
      <div className="row" style={{ alignItems: "flex-start", gap: "var(--space-4)" }}>
        <PersonPhoto name={worker.user.name} radius={18} size={76} src={worker.user.avatarUrl} />
        <div className="stack stack--sm" style={{ flex: 1, minWidth: 0 }}>
          <div className="chip-group">
            <span className="chip chip--sage">{category}</span>
            {worker.verificationStatus === "verified" && <span className="chip chip--dark">Verificado</span>}
          </div>
          <div>
            <h3 className="request-card__name truncate">{worker.user.name}</h3>
            <p className="text-sm muted">{role}</p>
          </div>
          <RatingInline rating={Number(worker.averageRating)} />
        </div>
      </div>
      <div className="row row--between" style={{ borderTop: "1px solid var(--color-border-neutral)", paddingTop: 14 }}>
        <span className="text-sm muted">
          {worker.completedCount} servicios{years !== null ? ` · ${years} años` : ""}
        </span>
        <span className="text-sm">
          Desde <strong style={{ fontSize: 18 }}>{worker.minPrice !== null ? formatCOP(worker.minPrice) : "—"}</strong>
        </span>
      </div>
    </Link>
  );
}
