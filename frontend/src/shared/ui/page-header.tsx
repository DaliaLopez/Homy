import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "./icon";

type PageHeaderProps = {
  title: string;
  eyebrow?: string;
  greeting?: string;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
};

/** Encabezado de página: "Hola," + nombre, o eyebrow + título, con acciones a la derecha. */
export default function PageHeader({ title, eyebrow, greeting, description, backHref, backLabel = "Volver", actions }: PageHeaderProps) {
  return (
    <header className="stack">
      {backHref && (
        <Link className="back-link" href={backHref}>
          <Icon name="arrowLeft" size={18} />
          {backLabel}
        </Link>
      )}
      <div className="page-head">
        <div className="page-head__text">
          {greeting && <p className="greeting">{greeting}</p>}
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="title-xl">{title}</h1>
          {description && <p className="lead">{description}</p>}
        </div>
        {actions && <div className="row row--wrap">{actions}</div>}
      </div>
    </header>
  );
}
