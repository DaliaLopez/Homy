"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { requestCategory } from "@/app/worker/_actions/verification";
import type { Category } from "@/types/category";
import Icon from "@/shared/ui/icon";
import SubmitButton from "@/shared/ui/submit-button";
import CategoryTiles from "./category-tiles";
import EvidenceTiles from "./evidence-tiles";

type Props = { categories: Category[]; verified: string[]; inReview: string[]; /** Categoría elegida al abrir (reenviar evidencia). */ initial?: string };

/** Agregar una categoría nueva. Cada "Agregar otra categoría" vuelve a montar el formulario limpio. */
export default function AddCategoryForm(props: Props) {
  const [round, setRound] = useState(0);
  return <AddCategoryRound {...props} initial={round === 0 ? props.initial : ""} key={round} onAnother={() => setRound((value) => value + 1)} />;
}

function AddCategoryRound({ categories, verified, inReview, initial = "", onAnother }: Props & { onAnother: () => void }) {
  const [state, action] = useActionState(requestCategory, undefined);
  const [picked, setPicked] = useState(categories.some((item) => item.id === initial) ? initial : "");
  const [hasFile, setHasFile] = useState(false);
  const category = categories.find((item) => item.id === picked);

  if (state?.ok) {
    return (
      <section className="empty">
        <span className="empty__icon">
          <Icon name="clock" size={28} />
        </span>
        <p className="eyebrow">En revisión</p>
        <h2>Enviamos tu solicitud para {state.ok}</h2>
        <p className="lead">El administrador revisará tu evidencia. Cuando apruebe la categoría podrás publicar servicios en ella.</p>
        <div className="row row--wrap" style={{ justifyContent: "center" }}>
          <button className="btn btn--primary" onClick={onAnother} type="button">
            Agregar otra categoría
          </button>
          <Link className="btn btn--outline" href="/worker/profile">
            Volver a mi perfil
          </Link>
        </div>
      </section>
    );
  }

  return (
    <form action={action} className="stack stack--lg">
      <input name="categories" type="hidden" value={JSON.stringify(picked ? [picked] : [])} />
      <input name="categoryName" type="hidden" value={category?.name ?? ""} />
      {state?.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <section className="stack">
        <h2 id="add-category-title">Elige la categoría</h2>
        <CategoryTiles
          categories={categories}
          labelledBy="add-category-title"
          locked={Object.fromEntries([...verified.map((id) => [id, "Verificada"]), ...inReview.map((id) => [id, "En revisión"])])}
          onToggle={(id) => setPicked(id)}
          selected={picked ? [picked] : []}
        />
      </section>
      {category && (
        <section className="stack">
          <h2>Evidencia de {category.name}</h2>
          <EvidenceTiles
            label={`Evidencia de ${category.name}`}
            name={`files-${category.id}`}
            noteName={`note-${category.id}`}
            notePlaceholder="Ej. Terminé un curso de pintura decorativa y adjunto fotos de dos trabajos."
            onChange={(count) => setHasFile(count > 0)}
          />
        </section>
      )}
      <div>
        <SubmitButton disabled={!category || !hasFile}>
          {!category ? "Elige una categoría" : !hasFile ? "Sube tu evidencia para enviar" : "Enviar a revisión"}
        </SubmitButton>
      </div>
    </form>
  );
}
