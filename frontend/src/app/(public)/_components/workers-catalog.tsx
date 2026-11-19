"use client";

import { useEffect, useMemo, useState } from "react";
import { formatCOP } from "@/lib/format";
import type { Category } from "@/types/category";
import type { Worker } from "@/types/worker";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import WorkerCard from "./worker-card";

type Tab = "all" | "top" | "favorites";
type Props = { workers: Worker[]; categories: Category[]; availableNow: string[]; initialQuery: string; initialCategory: string };

const FAVORITES_KEY = "homy.favorites";
const DEFAULT_MAX = 150_000;
const STEP = 5_000;
const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "top", label: "Mejor recomendados" },
  { key: "favorites", label: "Mis favoritos" },
];
const ratings = [
  { value: 0, label: "Todas" },
  { value: 4, label: "4+" },
  { value: 4.8, label: "4.8+" },
];

const normalize = (text: string) => text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const worksIn = (worker: Worker, categoryId: string) =>
  worker.approvedCategories.some((item) => item.id === categoryId) || worker.services.some((service) => service.category.id === categoryId);

/** Favoritos guardados en este navegador (los mismos del botón "Añadir a favoritos"). */
function readFavorites(): string[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Catálogo de profesionales: banner, búsqueda, pestañas, filtros y resultados. */
export default function WorkersCatalog({ workers, categories, availableNow, initialQuery, initialCategory }: Props) {
  // Desde el inicio se llega con ?q=Plomería: si coincide con una categoría, se usa como filtro.
  const fromQuery = categories.find((category) => normalize(category.name) === normalize(initialQuery));
  const [query, setQuery] = useState(fromQuery ? "" : initialQuery);
  const [tab, setTab] = useState<Tab>("all");
  const [category, setCategory] = useState(categories.some((item) => item.id === initialCategory) ? initialCategory : (fromQuery?.id ?? ""));
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    // Los favoritos viven en el navegador: se leen después de montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorites(readFavorites());
  }, []);

  // Rango de precios de la categoría elegida (redondeado hacia arriba).
  const priceCeiling = useMemo(() => {
    if (!category) return DEFAULT_MAX;
    const prices = workers.flatMap((worker) => worker.services.filter((service) => service.category.id === category).map((service) => Number(service.price)));
    return prices.length ? Math.max(STEP, Math.ceil(Math.max(...prices) / STEP) * STEP) : DEFAULT_MAX;
  }, [category, workers]);
  const max = Math.min(maxPrice ?? priceCeiling, priceCeiling);

  const pickCategory = (id: string) => {
    setCategory(id);
    setMinPrice(0);
    setMaxPrice(null);
  };

  const reset = () => {
    pickCategory("");
    setMinRating(0);
    setOnlyAvailable(false);
  };

  const results = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    const list = workers.filter((worker) => {
      if (tab === "favorites" && !favorites.includes(worker.id)) return false;
      if (terms.length) {
        const haystack = normalize(
          [
            worker.user.name,
            worker.description,
            ...worker.approvedCategories.map((c) => c.name),
            ...worker.services.map((s) => `${s.name} ${s.category.name}`),
          ].join(" "),
        );
        if (!terms.every((term) => haystack.includes(term))) return false;
      }
      if (category) {
        if (!worksIn(worker, category)) return false;
        const priced = worker.services.filter((service) => service.category.id === category);
        // Con precio: al menos un servicio de la categoría dentro del rango.
        if ((minPrice > 0 || max < priceCeiling) && !priced.some((service) => Number(service.price) >= minPrice && Number(service.price) <= max)) return false;
      }
      if (minRating && Number(worker.averageRating) < minRating) return false;
      if (onlyAvailable && !availableNow.includes(worker.id)) return false;
      return true;
    });
    if (tab === "top") {
      return [...list].sort((a, b) => Number(b.averageRating) - Number(a.averageRating) || b.completedCount - a.completedCount);
    }
    return list;
  }, [workers, query, tab, favorites, category, minPrice, max, priceCeiling, minRating, onlyAvailable, availableNow]);

  const activeFilters = [category, minRating, onlyAvailable].filter(Boolean).length;

  return (
    <div className="stack stack--lg catalog">
      <section className="catalog-hero">
        <p className="eyebrow">Servicios para tu hogar</p>
        <h1 className="catalog-hero__title">Encuentra a la persona indicada, no solo un servicio</h1>
        <p className="catalog-hero__lead">Compara experiencia, disponibilidad y precio antes de solicitar.</p>
      </section>

      <form className="input-wrap" onSubmit={(event) => event.preventDefault()} role="search">
        <label className="sr-only" htmlFor="catalog-search">
          Buscar profesional o servicio
        </label>
        <input
          className="input"
          id="catalog-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="¿Qué servicio necesitas?"
          type="search"
          value={query}
        />
        <button aria-label="Buscar" className="input-wrap__action" type="submit">
          <Icon name="search" size={18} />
        </button>
      </form>

      <div aria-label="Ver profesionales" className="tabs" role="tablist">
        {tabs.map((item) => (
          <button
            aria-selected={tab === item.key}
            className={`tab${tab === item.key ? " is-active" : ""}`}
            key={item.key}
            onClick={() => setTab(item.key)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="catalog-layout">
        <aside className={`catalog-filters${filtersOpen ? " is-open" : ""}`}>
          <button aria-expanded={filtersOpen} className="catalog-filters__toggle" onClick={() => setFiltersOpen((open) => !open)} type="button">
            <Icon name="filter" size={18} />
            Filtros{activeFilters ? ` (${activeFilters})` : ""}
            <Icon className="catalog-filters__chevron" name="chevronRight" size={18} />
          </button>

          <div className="catalog-filters__panel">
            <div className="catalog-filters__head">
              <h2>Filtros</h2>
              <button className="catalog-filters__reset" onClick={reset} type="button">
                Restablecer
              </button>
            </div>

            <div className="field">
              <label className="label" htmlFor="filter-category">
                Categoría
              </label>
              <select className="select catalog-filters__select" id="filter-category" onChange={(event) => pickCategory(event.target.value)} value={category}>
                <option value="">Todas</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className={`catalog-price${category ? "" : " is-disabled"}`} disabled={!category}>
              <legend className="label">Precio del servicio</legend>
              {!category && <p className="catalog-price__hint">Selecciona una categoría para habilitar el rango de precios.</p>}
              <div className="catalog-price__inputs">
                <label className="catalog-price__field">
                  <span>Mínimo</span>
                  <span className="catalog-price__box">
                    $
                    <input
                      inputMode="numeric"
                      max={max}
                      min={0}
                      onChange={(event) => setMinPrice(Math.max(0, Math.min(Number(event.target.value) || 0, max)))}
                      step={STEP}
                      type="number"
                      value={minPrice}
                    />
                  </span>
                </label>
                <label className="catalog-price__field">
                  <span>Máximo</span>
                  <span className="catalog-price__box">
                    $
                    <input
                      inputMode="numeric"
                      max={priceCeiling}
                      min={minPrice}
                      onChange={(event) => setMaxPrice(Math.max(minPrice, Math.min(Number(event.target.value) || 0, priceCeiling)))}
                      step={STEP}
                      type="number"
                      value={max}
                    />
                  </span>
                </label>
              </div>
              <input
                aria-label="Precio máximo"
                className="catalog-price__range"
                max={priceCeiling}
                min={0}
                onChange={(event) => setMaxPrice(Math.max(minPrice, Number(event.target.value)))}
                step={STEP}
                type="range"
                value={max}
              />
              <div className="catalog-price__scale">
                <span>{formatCOP(0)}</span>
                <span>{formatCOP(priceCeiling)}</span>
              </div>
            </fieldset>

            <div className="field">
              <span className="label" id="filter-rating">
                Calificación mínima
              </span>
              <div aria-labelledby="filter-rating" className="catalog-rating" role="radiogroup">
                {ratings.map((item) => (
                  <button
                    aria-checked={minRating === item.value}
                    className={`catalog-rating__option${minRating === item.value ? " is-active" : ""}`}
                    key={item.label}
                    onClick={() => setMinRating(item.value)}
                    role="radio"
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="catalog-available">
              <span>Disponibles ahora</span>
              <input checked={onlyAvailable} onChange={(event) => setOnlyAvailable(event.target.checked)} type="checkbox" />
            </label>

            <p className="catalog-filters__note">Los resultados están ordenados por reputación, experiencia y cercanía.</p>
          </div>
        </aside>

        <section aria-live="polite" className="stack catalog-results">
          <div className="catalog-results__head">
            <div>
              <p className="muted">Profesionales verificados</p>
              <h2 className="catalog-results__count">
                {results.length} {results.length === 1 ? "resultado" : "resultados"}
              </h2>
            </div>
            <p className="muted catalog-results__order">{tab === "top" ? "Ordenados por calificación" : "Ordenados por mejor coincidencia"}</p>
          </div>

          {results.length ? (
            <div className="catalog-grid">
              {results.map((worker) => (
                <WorkerCard key={worker.id} worker={worker} />
              ))}
            </div>
          ) : (
            <EmptyState icon="search" title={tab === "favorites" && !favorites.length ? "Aún no tienes favoritos" : "No encontramos profesionales"}>
              {tab === "favorites" && !favorites.length
                ? "Abre el perfil de un profesional y toca “Añadir a favoritos”."
                : "Prueba con otra palabra o quita algunos filtros."}
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
