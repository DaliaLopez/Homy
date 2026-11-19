"use client";

import { useActionState, useState } from "react";
import { submitVerification } from "@/app/worker/_actions/verification";
import type { Category } from "@/types/category";
import { documentDefs, type DocumentKey } from "@/types/verification";
import Icon, { type IconName } from "@/shared/ui/icon";
import CategoryTiles from "./category-tiles";
import EvidenceTiles from "./evidence-tiles";
import SubmitButton from "@/shared/ui/submit-button";
import UploadTile from "./upload-tile";

const docIcons: Record<DocumentKey, IconName> = { profile: "camera", id: "file", selfie: "user" };
const stepNames = ["Documentos generales", "Categorías y evidencia", "Tu perfil"];

/**
 * Verificación en 3 pasos: documentos generales, categorías con evidencia y la
 * descripción del perfil. Todo viaja en un solo envío al administrador.
 */
export default function VerificationWizard({ categories }: { categories: Category[] }) {
  const [state, action] = useActionState(submitVerification, undefined);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [docs, setDocs] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<Record<string, number>>({});

  const docsReady = documentDefs.every((doc) => docs[doc.key]);

  // Un solo paso visible a la vez; al cambiar se vuelve al inicio del asistente (útil en móvil).
  const goTo = (next: 1 | 2 | 3) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const categoriesReady = selected.length > 0 && selected.every((id) => evidence[id]);

  return (
    <form action={action} className="stack stack--lg">
      <input name="categories" type="hidden" value={JSON.stringify(selected)} />
      {state?.error && (
        <div className="notice notice--danger">
          <Icon name="alert" size={20} />
          <span>{state.error}</span>
        </div>
      )}

      <div className="stack stack--sm">
        <div className="row row--between">
          <span className="eyebrow">Paso {step} de 3</span>
          <span className="text-sm muted">{stepNames[step - 1]}</span>
        </div>
        <div className="steps">
          {[1, 2, 3].map((index) => (
            <span className={`steps__item${step >= index ? " is-done" : ""}`} key={index} />
          ))}
        </div>
      </div>

      {/* Los tres pasos quedan en el DOM para no perder los archivos al avanzar. */}
      <section className="stack" hidden={step !== 1}>
        <h2>Documentos generales</h2>
        <p className="lead">No pedimos antecedentes. La foto de perfil es obligatoria.</p>
        <div className="grid grid--3">
          {documentDefs.map((doc) => (
            <UploadTile
              hint={doc.hint}
              icon={docIcons[doc.key]}
              key={doc.key}
              label={doc.label}
              maxSide={doc.key === "profile" ? 600 : 1600}
              name={`doc-${doc.key}`}
              onChange={(count) => setDocs((current) => ({ ...current, [doc.key]: count }))}
            />
          ))}
        </div>
        <div className="wizard-actions">
          <button className="btn btn--primary" disabled={!docsReady} onClick={() => goTo(2)} type="button">
            Continuar <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </section>

      <section className="stack" hidden={step !== 2}>
        <h2>¿En qué categorías trabajas?</h2>
        <p className="lead">
          Sube una evidencia por categoría: fotos de trabajos, referencias o cursos. Si aprendiste de forma empírica no necesitas certificado. El administrador
          aprueba cada categoría por separado.
        </p>
        <CategoryTiles
          categories={categories}
          multiple
          onToggle={(id) => setSelected((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]))}
          selected={selected}
        />
        {categories
          .filter((category) => selected.includes(category.id))
          .map((category) => (
            <section className="stack" key={category.id}>
              <h2>Evidencia de {category.name}</h2>
              <EvidenceTiles
                label={`Evidencia de ${category.name}`}
                name={`files-${category.id}`}
                noteName={`note-${category.id}`}
                onChange={(count) => setEvidence((current) => ({ ...current, [category.id]: count }))}
              />
            </section>
          ))}
        <div className="wizard-actions">
          <button className="btn btn--outline" onClick={() => goTo(1)} type="button">
            <Icon name="arrowLeft" size={16} /> Atrás
          </button>
          <button className="btn btn--primary" disabled={!categoriesReady} onClick={() => goTo(3)} type="button">
            Continuar <Icon name="chevronRight" size={16} />
          </button>
        </div>
      </section>

      <section className="stack" hidden={step !== 3}>
        <h2>Cuéntales a los clientes sobre ti</h2>
        <div className="form">
          <div className="field">
            <label className="label" htmlFor="v-description">
              Sobre mí
            </label>
            <textarea
              className="textarea"
              id="v-description"
              maxLength={1000}
              minLength={10}
              name="description"
              placeholder="Ej. Electricista con experiencia en instalaciones residenciales. Puntual y ordenado."
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="v-experience">
              Años de experiencia
            </label>
            <input className="input" id="v-experience" inputMode="numeric" max={60} min={0} name="experience" placeholder="Ej. 8" type="number" />
          </div>
        </div>
        <div className="wizard-actions">
          <button className="btn btn--outline" onClick={() => goTo(2)} type="button">
            <Icon name="arrowLeft" size={16} /> Atrás
          </button>
          <SubmitButton pendingLabel="Enviando a revisión…">Enviar a revisión</SubmitButton>
        </div>
      </section>
    </form>
  );
}
