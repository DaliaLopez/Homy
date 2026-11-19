"use client";

import { useEffect, useState } from "react";
import Icon from "@/shared/ui/icon";

const KEY = "homy.favorites";

function read(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

/** Añadir a favoritos. Se recuerda en este navegador. */
export default function FavoriteButton({
  workerId,
  name,
  iconOnly = false,
}: {
  workerId: string;
  name: string;
  /** Solo el corazón (sobre la foto del perfil). */ iconOnly?: boolean;
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Lee la preferencia guardada después de montar (no existe en el servidor).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(read().includes(workerId));
  }, [workerId]);

  const toggle = () => {
    const list = read();
    const next = list.includes(workerId) ? list.filter((id) => id !== workerId) : [...list, workerId];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* sin almacenamiento disponible: el estado vive solo en esta vista */
    }
    setSaved(next.includes(workerId));
  };

  if (iconOnly) {
    const label = saved ? `Quitar a ${name} de favoritos` : `Añadir a ${name} a favoritos`;
    return (
      <button aria-label={label} aria-pressed={saved} className={`favorite-fab${saved ? " is-saved" : ""}`} onClick={toggle} title={label} type="button">
        <Icon filled={saved} name="heart" size={20} />
      </button>
    );
  }

  return (
    <button aria-pressed={saved} className={`btn ${saved ? "btn--primary" : "btn--secondary"} btn--sm`} onClick={toggle} type="button">
      <Icon filled={saved} name="heart" size={16} />
      {saved ? `Quitar a ${name} de favoritos` : "Añadir a favoritos"}
    </button>
  );
}
