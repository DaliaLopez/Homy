"use client";

import type { Category } from "@/types/category";
import Icon from "@/shared/ui/icon";
import { categoryIcon } from "@/app/worker/_components/services/category-icon";

type Props = {
  categories: Category[];
  selected: string[];
  onToggle: (id: string) => void;
  /** Se puede elegir más de una (verificación inicial) o solo una (agregar categoría). */
  multiple?: boolean;
  /** Categorías que no se pueden elegir, con su etiqueta ("Verificada", "En revisión"). */
  locked?: Record<string, string>;
  labelledBy?: string;
};

/** Categorías como tarjetas: ícono, nombre y, si no se pueden elegir, su estado. */
export default function CategoryTiles({ categories, selected, onToggle, multiple, locked = {}, labelledBy }: Props) {
  return (
    <div aria-labelledby={labelledBy} className="category-picker category-picker--grid" role={multiple ? "group" : "radiogroup"}>
      {categories.map((category) => {
        const isSelected = selected.includes(category.id);
        const badge = locked[category.id];
        return (
          <button
            aria-checked={multiple ? undefined : isSelected}
            aria-pressed={multiple ? isSelected : undefined}
            className={`category-picker__option${isSelected ? " is-selected" : ""}`}
            disabled={Boolean(badge)}
            key={category.id}
            onClick={() => onToggle(category.id)}
            role={multiple ? undefined : "radio"}
            type="button"
          >
            <Icon name={categoryIcon(category.name)} size={20} />
            <span className="category-picker__name">{category.name}</span>
            {badge && <span className="category-picker__badge">{badge}</span>}
            {isSelected && multiple && <Icon name="check" size={18} />}
          </button>
        );
      })}
    </div>
  );
}
