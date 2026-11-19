import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import PersonPhoto from "@/shared/ui/person-photo";
import { RatingInline } from "@/shared/ui/stars";
import { getCategories, getWorkers } from "@/lib/data";
import { cityOf } from "@/lib/format";
import { getProfile } from "@/lib/session";

const slug = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const localImages = ["electricidad", "electrodomesticos", "jardineria", "limpieza", "pintura", "plomeria"];

/** Imagen de la categoría: la que subió el admin o, si no hay, la ilustración local con nombre parecido. */
function categoryImage(category: { name: string; imageUrl: string | null }) {
  if (category.imageUrl) return category.imageUrl;
  const local = localImages.find((name) => slug(category.name).startsWith(name.slice(0, 6)));
  return local ? `/assets/categories/${local}.png` : null;
}

/** Inicio del cliente: saludo, banner, categorías y profesionales recomendados. */
export default async function HomePage() {
  const [user, categories] = await Promise.all([getProfile(), getCategories()]);
  // Sin sesión válida (o con la cookie vencida) el sitio empieza en la bienvenida de registro.
  if (!user) redirect("/register");
  // Solo profesionales de la misma ciudad del cliente.
  const workers = await getWorkers(user.location);
  const recommended = workers.slice(0, 3);

  return (
    <>
      <header className="row row--between row--end">
        <div>
          <p className="greeting">Hola,</p>
          <h1 className="title-xl" style={{ marginTop: 4 }}>
            {user.name}
          </h1>
        </div>
        <span className="city-chip city-chip--dark">
          <Icon name="pin" size={15} />
          {cityOf(user.location)}
        </span>
      </header>

      <div className="layout-aside" style={{ marginTop: "var(--space-8)" }}>
        <div className="stack stack--lg">
          <Link className="media-card media-card--hero" href="/workers">
            <Image
              alt="Equipo de trabajadores conversando"
              className="media-card__img"
              fill
              priority
              sizes="(min-width: 1024px) 600px, 100vw"
              src="/assets/brand/hero-team.png"
              style={{ objectPosition: "center 42%" }}
            />
            <span className="media-card__body">
              <span className="text-xs">Aquí podrás ver...</span>
              <span className="media-card__title">Profesionales verificados para tu hogar</span>
            </span>
          </Link>

          <section aria-labelledby="categories-title" className="section">
            <h2 id="categories-title">Categorías</h2>
            {categories.length ? (
              <div className="scroller scroller--cards scroller--to-grid">
                {categories.map((category) => {
                  const src = categoryImage(category);
                  return (
                    <Link className="media-card media-card--category" href={`/workers?q=${encodeURIComponent(category.name)}`} key={category.id}>
                      {src && (
                        // eslint-disable-next-line @next/next/no-img-element -- imagen subida por el admin (data URL) o ilustración local
                        <img
                          alt=""
                          className="media-card__img"
                          src={src}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                      <span className="media-card__body media-card__title">{category.name}</span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon="tag" title="Aún no hay categorías activas" />
            )}
          </section>
        </div>

        <section aria-labelledby="workers-title" className="section sticky-aside">
          <div className="section-head">
            <h2 id="workers-title">Profesionales recomendados</h2>
            <Link className="link-more" href="/workers">
              Ver todos
            </Link>
          </div>
          {recommended.length ? (
            <div className="grid">
              {recommended.map((worker) => (
                <Link className="person-card" href={`/workers/${worker.id}`} key={worker.id}>
                  <PersonPhoto name={worker.user.name} src={worker.user.avatarUrl} />
                  <span className="person-card__body">
                    <span className="person-card__name truncate">{worker.user.name}</span>
                    <span className="text-sm" style={{ display: "block", marginTop: 4, color: "var(--color-text-soft)" }}>
                      {worker.approvedCategories[0]?.name ?? "Profesional"}
                    </span>
                    <span className="person-card__meta">
                      <RatingInline rating={Number(worker.averageRating)} />
                    </span>
                  </span>
                  <span className="person-card__status">
                    <span className="status-dot status-dot--olive" />
                    Verificado
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon="users" title="Todavía no hay profesionales verificados">
              Cuando el equipo de Homy apruebe a los primeros profesionales, aparecerán aquí.
            </EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
