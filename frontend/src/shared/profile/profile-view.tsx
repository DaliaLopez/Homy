import Link from "next/link";
import type { ReactNode } from "react";
import { logout } from "@/shared/actions/auth";
import { initials } from "@/lib/format";
import type { AppUser } from "@/types/user";
import Icon, { type IconName } from "@/shared/ui/icon";

export type MenuItem = { href: string; label: string; icon: IconName; external?: boolean; /** Renglón bajo el título. */ description?: string };

type Props = {
  user: AppUser;
  /** Chips bajo el nombre (rol, verificado…). */
  chips?: ReactNode;
  /** Renglón bajo el nombre (oficio…). */
  subtitle?: ReactNode;
  /** Ubicación: etiqueta con el ícono de ubicación junto a los chips de estado. */
  location?: string | null;
  stats?: { value: string; label: string; icon?: IconName }[];
  /** "Sobre mí" (solo el trabajador); sin definir no se muestra la tarjeta. */
  about?: string;
  /** Formulario de los datos de la cuenta (va en un desplegable). */
  form: ReactNode;
  formTitle?: string;
  /** Texto bajo el título del formulario desplegable. */
  formHint?: string;
  /** El formulario desplegable empieza abierto. */
  formOpen?: boolean;
  /** Secciones propias del rol (categorías del trabajador…). */
  children?: ReactNode;
  menu: MenuItem[];
  menuLabel?: string;
};

/**
 * Estructura común de perfil (cliente, trabajador y administrador). Izquierda: foto grande, nombre,
 * renglón, estado y métricas. Derecha (tarjetas solo con borde): Sobre mí, secciones propias, datos
 * de la cuenta desplegables y la lista de accesos con "Cerrar sesión". En móvil, una sola columna.
 */
export default function ProfileView({
  user,
  chips,
  subtitle,
  location,
  stats,
  about,
  form,
  formTitle = "Datos de tu cuenta",
  formHint = "Nombre, contacto y ubicación",
  formOpen = false,
  children,
  menu,
  menuLabel = "Opciones de la cuenta",
}: Props) {
  return (
    <div className="profile-worker">
      <section className="profile-card">
        <div className="profile-card__photo">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- foto en data URL desde la API
            <img alt={user.name} src={user.avatarUrl} />
          ) : (
            <span aria-label={user.name} role="img">
              {initials(user.name)}
            </span>
          )}
        </div>
        <div className="profile-card__info">
          <h1 className="profile-card__name">{user.name}</h1>
          {subtitle}
          {(chips || location !== undefined) && (
            <div className="chip-group">
              {chips}
              {location !== undefined && (
                <span className="chip chip--sage">
                  <Icon name="pin" size={14} />
                  {location || "Sin ubicación"}
                </span>
              )}
            </div>
          )}
        </div>
        {stats && (
          <div className="profile-card__stats">
            {stats.map((stat) => (
              <div className="profile-card__stat" key={stat.label}>
                {stat.icon && <Icon name={stat.icon} size={22} />}
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="profile-worker__main stack stack--lg">
        {about !== undefined && (
          <section className="profile-box section">
            <h2>Sobre mí</h2>
            <p className="profile-box__text">{about || "Aún no has escrito tu descripción. Cuéntales a los clientes quién eres y cómo trabajas."}</p>
          </section>
        )}
        {children}
        <details className="profile-box profile-disclosure" open={formOpen}>
          <summary className="profile-disclosure__summary">
            <span className="profile-disclosure__icon" aria-hidden="true">
              <Icon name="edit" size={18} />
            </span>
            <span className="profile-disclosure__text">
              <h2>{formTitle}</h2>
              <span className="text-sm muted">{formHint}</span>
            </span>
            <Icon className="profile-disclosure__chevron" name="chevronRight" size={20} />
          </summary>
          <div className="profile-disclosure__body">{form}</div>
        </details>
        <nav aria-label={menuLabel} className="profile-box profile-links">
          {menu.map((item) => {
            const content = (
              <>
                <span className="profile-links__text">
                  <strong>{item.label}</strong>
                  {item.description && <span>{item.description}</span>}
                </span>
                <Icon name="chevronRight" size={18} />
              </>
            );
            return item.external ? (
              <a className="profile-links__item" href={item.href} key={item.label} rel="noreferrer" target="_blank">
                {content}
              </a>
            ) : (
              <Link className="profile-links__item" href={item.href} key={item.label}>
                {content}
              </Link>
            );
          })}
          <form action={logout}>
            <button className="profile-links__item profile-links__item--danger" type="submit">
              <span className="profile-links__text">
                <strong>Cerrar sesión</strong>
                <span>Salir de tu cuenta de Homy</span>
              </span>
              <Icon name="chevronRight" size={18} />
            </button>
          </form>
        </nav>
      </div>
    </div>
  );
}
