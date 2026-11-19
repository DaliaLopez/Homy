"use client";

import { useActionState, useId, useState } from "react";
import { saveCategory, toggleCategory } from "@/app/admin/_actions/admin";
import type { FormState } from "@/shared/actions/auth";
import { toStoredFile } from "@/lib/files";
import type { Category } from "@/types/category";
import type { StoredFile } from "@/types/file";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Modal from "@/shared/ui/modal";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";

const slug = (name: string) => name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const localImages = ["electricidad", "electrodomesticos", "jardineria", "limpieza", "pintura", "plomeria"];
const imageOf = (category: Category) => {
  if (category.imageUrl) return category.imageUrl;
  const local = localImages.find((name) => slug(category.name).startsWith(name.slice(0, 6)));
  return local ? `/assets/categories/${local}.png` : "/assets/brand/hero-team.png";
};

/**
 * Imagen de la categoría: sin imagen se ve el recuadro para subirla; con imagen
 * se ve la foto y, encima, el botón "Cambiar foto".
 */
function ImagePicker({ initial }: { initial: string | null }) {
  const inputId = useId();
  const [file, setFile] = useState<StoredFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const preview = file?.dataUrl ?? initial;

  const pick = async (list: FileList | null) => {
    const picked = list?.[0];
    if (!picked) return;
    setBusy(true);
    setError("");
    try {
      setFile(await toStoredFile(picked, 1200));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos leer la imagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="field">
      <span className="label">Imagen</span>
      <input name="image" type="hidden" value={JSON.stringify(file ? [file] : [])} />
      <input accept="image/*" className="sr-only" id={inputId} onChange={(event) => void pick(event.target.files)} type="file" />
      {preview ? (
        <div className="image-picker">
          {/* eslint-disable-next-line @next/next/no-img-element -- vista previa (data URL) */}
          <img alt="Imagen de la categoría" src={preview} />
          <label className="image-picker__edit" htmlFor={inputId}>
            <Icon name="camera" size={16} />
            {busy ? "Cargando…" : "Cambiar foto"}
          </label>
        </div>
      ) : (
        <label className="upload" htmlFor={inputId}>
          <Icon name="image" size={28} />
          <strong>{busy ? "Preparando imagen…" : "Subir imagen"}</strong>
          <span className="text-xs">JPG o PNG · se muestra en el inicio del cliente</span>
        </label>
      )}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

type FormProps = { category: Category | null; onClose: () => void; onSaved: (message: string) => void };

function CategoryForm({ category, onClose, onSaved }: FormProps) {
  // Al guardar bien se cierra el modal (el siguiente "Nueva categoría" abre limpio) y la lista se actualiza.
  const [state, action] = useActionState(async (previous: FormState, formData: FormData) => {
    const result = await saveCategory(previous, formData);
    if (result?.ok) onSaved(result.ok);
    return result;
  }, undefined);

  return (
    <Modal labelledBy="category-form-title" onClose={onClose} open>
      <form action={action} className="form">
        {category && <input name="id" type="hidden" value={category.id} />}
        <h2 id="category-form-title">{category ? "Editar categoría" : "Nueva categoría"}</h2>
        {state?.error && <Notice tone="danger">{state.error}</Notice>}
        <ImagePicker initial={category?.imageUrl ?? null} />
        <div className="field">
          <label className="label" htmlFor="category-name">
            Nombre
          </label>
          <input className="input" defaultValue={category?.name} id="category-name" maxLength={100} name="name" placeholder="Ej: Carpintería" required />
        </div>
        <div className="field">
          <label className="label" htmlFor="category-description">
            Descripción
          </label>
          <textarea className="textarea" defaultValue={category?.description ?? ""} id="category-description" maxLength={500} name="description" placeholder="Qué servicios incluye" />
        </div>
        <div className="btn-row">
          <button className="btn btn--outline" onClick={onClose} type="button">
            Cancelar
          </button>
          <SubmitButton className="btn btn--primary" pendingLabel="Guardando…">
            Guardar
          </SubmitButton>
        </div>
      </form>
    </Modal>
  );
}

function Toggle({ category, onClose }: { category: Category; onClose: () => void }) {
  const [state, action] = useActionState(toggleCategory, undefined);
  const blocked = category.isActive && (category.servicesCount ?? 0) > 0;
  return (
    <Modal labelledBy="deactivate-title" onClose={onClose} open>
      {state?.ok ? (
        <div className="stack">
          <h2 id="deactivate-title">{state.ok}</h2>
          <button className="btn btn--primary btn--block" onClick={onClose} type="button">
            Listo
          </button>
        </div>
      ) : blocked ? (
        <div className="stack">
          <h2 id="deactivate-title">No se puede desactivar</h2>
          <p className="lead">
            {category.name} tiene {category.servicesCount} servicios activos. Primero deben pasar sus servicios a otra categoría o eliminarlos.
          </p>
          <button className="btn btn--primary btn--block" onClick={onClose} type="button">
            Entendido
          </button>
        </div>
      ) : (
        <form action={action} className="stack">
          <input name="id" type="hidden" value={category.id} />
          <input name="active" type="hidden" value={String(category.isActive)} />
          <h2 id="deactivate-title">{category.isActive ? `¿Desactivar ${category.name}?` : `¿Activar ${category.name}?`}</h2>
          <p className="lead">{category.isActive ? "Los clientes ya no la verán y los profesionales no podrán publicar en ella." : "Volverá a aparecer para clientes y profesionales."}</p>
          {state?.error && <Notice tone="danger">{state.error}</Notice>}
          <div className="btn-row">
            <button className="btn btn--outline" onClick={onClose} type="button">
              Cancelar
            </button>
            <SubmitButton className="btn btn--primary">{category.isActive ? "Desactivar" : "Activar"}</SubmitButton>
          </div>
        </form>
      )}
    </Modal>
  );
}

type Filter = "all" | "active" | "inactive";

const filters: { key: Filter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "active", label: "Activas" },
  { key: "inactive", label: "Inactivas" },
];

/** Crear, editar (con imagen), filtrar y activar/desactivar categorías. */
export default function CategoriesManager({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState<Category | null | undefined>(undefined);
  const [toggling, setToggling] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const visible = categories.filter((category) => filter === "all" || (filter === "active" ? category.isActive : !category.isActive));

  return (
    <div className="stack stack--lg">
      <div className="categories-toolbar">
        <div aria-label="Filtrar categorías" className="tabs" role="tablist">
          {filters.map((item) => (
            <button aria-selected={filter === item.key} className={`tab${filter === item.key ? " is-active" : ""}`} key={item.key} onClick={() => setFilter(item.key)} role="tab" type="button">
              {item.label}
            </button>
          ))}
        </div>
        <button
          aria-label="Nueva categoría"
          className="btn btn--primary btn--sm categories-toolbar__new"
          onClick={() => {
            setMessage("");
            setEditing(null);
          }}
          type="button"
        >
          <Icon name="plus" size={16} />
          <span className="categories-toolbar__label">Nueva categoría</span>
        </button>
      </div>
      {message && <Notice>{message}</Notice>}

      {visible.length === 0 && (
        <EmptyState icon="tag" title={filter === "inactive" ? "No hay categorías inactivas" : filter === "active" ? "No hay categorías activas" : "Aún no hay categorías"} />
      )}
      <div className="grid grid--auto">
        {visible.map((category) => (
          <article className="card card--lg category-card" key={category.id} style={{ opacity: category.isActive ? 1 : 0.7 }}>
            <div className="category-card__media">
              {/* eslint-disable-next-line @next/next/no-img-element -- imagen subida por el admin (data URL) o ilustración local */}
              <img alt="" src={imageOf(category)} />
              <span className={`chip ${category.isActive ? "chip--sage" : "chip--neutral"} category-card__status`}>{category.isActive ? "Activa" : "Inactiva"}</span>
              <span className="category-card__count">
                <Icon name="briefcase" size={14} /> {category.servicesCount ?? 0} {(category.servicesCount ?? 0) === 1 ? "servicio" : "servicios"}
              </span>
            </div>
            <div>
              <h3>{category.name}</h3>
              <p className="text-sm muted" style={{ marginTop: 4 }}>
                {category.description || "Sin descripción"}
              </p>
            </div>
            <div className="btn-row">
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => {
                  setMessage("");
                  setEditing(category);
                }}
                type="button"
              >
                <Icon name="edit" size={16} /> Editar
              </button>
              <button className="btn btn--outline btn--sm" onClick={() => setToggling(category)} type="button">
                {category.isActive ? "Desactivar" : "Activar"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {editing !== undefined && (
        <CategoryForm
          category={editing}
          key={editing?.id ?? "new"}
          onClose={() => setEditing(undefined)}
          onSaved={(text) => {
            setEditing(undefined);
            setMessage(text);
          }}
        />
      )}
      {toggling && <Toggle category={toggling} onClose={() => setToggling(null)} />}
    </div>
  );
}
