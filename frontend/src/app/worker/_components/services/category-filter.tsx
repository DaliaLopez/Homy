"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Selector de categoría que actualiza la URL (?categoria=). */
export default function CategoryFilter({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <label className="field" style={{ minWidth: 200 }}>
      <span className="sr-only">Filtrar por categoría</span>
      <select
        className="select"
        onChange={(event) => {
          const next = new URLSearchParams(params);
          if (event.target.value) next.set("categoria", event.target.value);
          else next.delete("categoria");
          router.push(`${pathname}${next.size ? `?${next}` : ""}`);
        }}
        value={params.get("categoria") ?? ""}
      >
        <option value="">Todas las categorías</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
    </label>
  );
}
