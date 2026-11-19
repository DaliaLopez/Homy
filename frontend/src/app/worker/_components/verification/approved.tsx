import { acknowledgeVerified } from "@/app/worker/_actions/verification";
import { initials } from "@/lib/format";
import type { Worker } from "@/types/worker";
import Icon, { type IconName } from "@/shared/ui/icon";
import { categoryIcon } from "@/app/worker/_components/services/category-icon";

const perks: { icon: IconName; label: string }[] = [
  { icon: "plus", label: "Publicar servicios" },
  { icon: "bell", label: "Recibir solicitudes" },
  { icon: "shield", label: "Sello de verificado" },
];

/** "¡Tu perfil fue verificado!" (se muestra una vez al aprobarse la verificación). */
export default function Approved({ worker }: { worker: Worker }) {
  return (
    <section className="approved">
      <div className="approved__photo">
        {worker.user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto en data URL desde la API
          <img alt={worker.user.name} src={worker.user.avatarUrl} />
        ) : (
          <span aria-label={worker.user.name} role="img">
            {initials(worker.user.name)}
          </span>
        )}
        <span aria-hidden="true" className="approved__badge">
          <Icon name="shield" size={20} />
        </span>
      </div>

      <h1 className="approved__title">¡Tu perfil fue verificado!</h1>
      <p className="approved__lead">
        El administrador aprobó tus documentos y tus categorías. Ya puedes publicar servicios en ellas; cada servicio nuevo pasa por una revisión rápida antes
        de mostrarse a los clientes.
      </p>

      <p className="approved__eyebrow">Categorías aprobadas</p>
      <div className="approved__categories">
        {worker.approvedCategories.map((category) => (
          <span className="approved__category" key={category.id}>
            <Icon name={categoryIcon(category.name)} size={18} />
            {category.name}
          </span>
        ))}
      </div>

      <div className="approved__perks">
        {perks.map((perk) => (
          <div className="approved__perk" key={perk.label}>
            <Icon name={perk.icon} size={22} />
            <strong>{perk.label}</strong>
          </div>
        ))}
      </div>

      <div className="approved__actions">
        <form action={acknowledgeVerified}>
          <input name="workerId" type="hidden" value={worker.id} />
          <input name="next" type="hidden" value="/worker/services/new" />
          <button className="approved__btn approved__btn--light" type="submit">
            <Icon name="plus" size={18} /> Publicar mi primer servicio
          </button>
        </form>
        <form action={acknowledgeVerified}>
          <input name="workerId" type="hidden" value={worker.id} />
          <button className="approved__btn approved__btn--ghost" type="submit">
            Ir al inicio
          </button>
        </form>
      </div>
    </section>
  );
}
