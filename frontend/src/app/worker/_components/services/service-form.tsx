"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createService, updateService } from "@/app/worker/_actions/services";
import { durationHours, formatCOP } from "@/lib/format";
import type { Service } from "@/types/service";
import Icon from "@/shared/ui/icon";
import { categoryIcon } from "./category-icon";
import SubmitButton from "@/shared/ui/submit-button";

const durations = [
  { hours: 1, label: "1 hora" },
  { hours: 2, label: "2 horas" },
  { hours: 3, label: "3 horas" },
  { hours: 4, label: "Medio día (4 horas)" },
  { hours: 8, label: "Día completo (8 horas)" },
];

type Props = { categories: { id: string; name: string }[]; service?: Service };


/** Publicar o editar un servicio (solo en categorías verificadas). Al enviarlo queda "En revisión". */
export default function ServiceForm({ categories, service }: Props) {
  const [state, action] = useActionState(service ? updateService : createService, undefined);
  const [values, setValues] = useState({
    categoryId: service?.category.id ?? categories[0]?.id ?? "",
    name: service?.name ?? "",
    description: service?.description ?? "",
    price: service ? String(Math.round(Number(service.price))) : "",
    hours: String(service ? durationHours(service.durationMinutes) : 1),
  });
  const set = (key: keyof typeof values) => (value: string) => setValues((current) => ({ ...current, [key]: value }));
  const categoryName = categories.find((item) => item.id === values.categoryId)?.name ?? "";

  return (
    <form action={action} className="stack service-form">
      <input name="categoryId" type="hidden" value={values.categoryId} />
      {service && <input name="id" type="hidden" value={service.id} />}
      {state?.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {service?.reviewNote && service.status !== "published" && (
        <div className="notice notice--danger">
          <Icon name="alert" size={20} />
          <span>
            <strong>Comentario del administrador:</strong> {service.reviewNote}
          </span>
        </div>
      )}
      {/* Título y ayuda de "Categoría" encima de las columnas: los botones y la tarjeta de la derecha quedan a la misma altura. */}
      <div className="field">
        <span className="label" id="service-category-label">
          Categoría
        </span>
        <p className="field__hint service-form__category-hint">
          Solo aparecen tus categorías verificadas. Para agregar otra ve a{" "}
          <Link className="link-strong" href="/worker/categories/new">
            agregar categoría
          </Link>
          .
        </p>
      </div>

      <div className="layout-aside layout-aside--sidebar">
        <div className="form">
          <div className="field">
            <div aria-labelledby="service-category-label" className="category-picker" role="radiogroup">
              {categories.map((category) => {
                const selected = values.categoryId === category.id;
                return (
                  <button
                    aria-checked={selected}
                    className={`category-picker__option${selected ? " is-selected" : ""}`}
                    key={category.id}
                    onClick={() => set("categoryId")(category.id)}
                    role="radio"
                    type="button"
                  >
                    <Icon name={categoryIcon(category.name)} size={20} />
                    <span className="category-picker__name">{category.name}</span>
                    <Icon className="category-picker__check" name="shield" size={18} title="Categoría verificada" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="field">
            <label className="label" htmlFor="service-name">
              Nombre del servicio
            </label>
            <input
              className="input"
              id="service-name"
              maxLength={120}
              name="name"
              onChange={(event) => set("name")(event.target.value)}
              placeholder="Ej: Instalación de lámparas"
              required
              value={values.name}
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="service-description">
              ¿Qué incluye?
            </label>
            <textarea
              className="textarea"
              id="service-description"
              maxLength={300}
              minLength={10}
              name="description"
              onChange={(event) => set("description")(event.target.value)}
              placeholder="Materiales, tiempo, garantía…"
              required
              value={values.description}
            />
          </div>
          <div className="form-grid form-grid--2">
            <div className="field">
              <label className="label" htmlFor="service-price">
                Precio (COP)
              </label>
              <input
                className="input"
                id="service-price"
                inputMode="numeric"
                name="price"
                onChange={(event) => set("price")(event.target.value.replace(/\D/g, ""))}
                placeholder="75000"
                required
                value={values.price}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="service-duration">
                Duración aproximada
              </label>
              <select className="select" id="service-duration" name="hours" onChange={(event) => set("hours")(event.target.value)} value={values.hours}>
                {durations.map((item) => (
                  <option key={item.hours} value={item.hours}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="field__hint">Se agenda en horas completas: un servicio de 2 horas a las 8:00 ocupa hasta las 10:00.</p>
            </div>
          </div>
          <SubmitButton className="btn btn--primary btn--block" pendingLabel="Enviando…">
            {service ? "Guardar y reenviar" : "Enviar a revisión"}
          </SubmitButton>
        </div>

        <aside className="stack sticky-aside">
          <section className="card card--lg">
            <p className="eyebrow">Así lo verán los clientes</p>
            <span className="chip chip--sage" style={{ alignSelf: "flex-start" }}>
              {categoryName}
            </span>
            <h3>{values.name || "Nombre del servicio"}</h3>
            <p className="text-sm muted">{values.description || "Descripción del servicio"}</p>
            <strong className="price">{values.price ? formatCOP(Number(values.price)) : "$0"}</strong>
          </section>
          <section className="card card--lg card--dark publish-guide">
            <p className="eyebrow">Aprobación del admin</p>
            <h3>¿Cómo se publica tu servicio?</h3>
            <div className="list">
              <div className="list-row">
                <span className="strong">1. Envías el servicio</span>
                <span className="text-sm muted">Categoría, precio y lo que incluye</span>
              </div>
              <div className="list-row">
                <span className="strong">2. El administrador lo revisa</span>
                <span className="text-sm muted">Información clara y precio coherente</span>
              </div>
              <div className="list-row">
                <span className="strong">3. Aprobado o con cambios</span>
                <span className="text-sm muted">Si pide ajustes verás su comentario</span>
              </div>
            </div>
          </section>
          <div className="notice">
            <Icon name="shield" size={20} />
            <span>Un administrador revisa cada servicio nuevo o editado antes de publicarlo.</span>
          </div>
        </aside>
      </div>
    </form>
  );
}
