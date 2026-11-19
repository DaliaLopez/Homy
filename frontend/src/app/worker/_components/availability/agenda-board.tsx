"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { capitalize } from "@/lib/format";
import Icon from "@/shared/ui/icon";

export type AgendaItem = {
  id: string;
  /** Fecha en Bogotá, YYYY-MM-DD. */
  date: string;
  /** Hora en 24 h, HH:MM. */
  time: string;
  title: string;
  client: string;
  place: string;
  status: "requested" | "accepted" | "in_progress";
};

const WEEK = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const statusChip: Record<AgendaItem["status"], { label: string; tone: string }> = {
  requested: { label: "Solicitado", tone: "chip--olive" },
  accepted: { label: "Confirmado", tone: "chip--dark" },
  in_progress: { label: "En proceso", tone: "chip--sage" },
};

type Props = {
  items: AgendaItem[];
  /** Hoy en Bogotá (YYYY-MM-DD), calculado en el servidor. */
  today: string;
  /** Resumen semanal (a la derecha, alineado con las tarjetas del editor). */
  weekly: ReactNode;
  /** Título de la sección para editar la disponibilidad. */
  editorHead: ReactNode;
  /** Editor de disponibilidad (debajo del calendario). */
  editor: ReactNode;
};

/**
 * Agenda y disponibilidad en una sola pantalla: calendario y editor a la
 * izquierda; servicios del día elegido y resumen semanal a la derecha
 * (el resumen arranca a la altura de las tarjetas del editor).
 */
export default function AgendaBoard({ items, today, weekly, editorHead, editor }: Props) {
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => {
    const [y, m] = today.split("-").map(Number);
    return new Date(y, m - 1, 1);
  });

  const cells = useMemo(() => {
    const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7; // lunes primero
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array<null>(offset).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
  }, [month]);

  const keyOf = (day: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const busy = new Set(items.map((item) => item.date));
  const dayItems = items.filter((item) => item.date === selected).sort((a, b) => a.time.localeCompare(b.time));
  const [sy, sm, sd] = selected.split("-").map(Number);
  const selectedTitle = capitalize(new Date(sy, sm - 1, sd).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" }));
  const moveMonth = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <div className="agenda">
      <section aria-label="Calendario" className="agenda-calendar">
        <div className="agenda-calendar__head">
          <button aria-label="Mes anterior" className="agenda-calendar__nav" onClick={() => moveMonth(-1)} type="button">
            <Icon name="arrowLeft" size={18} />
          </button>
          <h2 className="agenda-calendar__month">{capitalize(month.toLocaleDateString("es-CO", { month: "long", year: "numeric" }).replace(" de ", " "))}</h2>
          <button aria-label="Mes siguiente" className="agenda-calendar__nav" onClick={() => moveMonth(1)} type="button">
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
        <div className="agenda-calendar__grid">
          {WEEK.map((label) => (
            <span className="agenda-calendar__weekday" key={label}>
              {label}
            </span>
          ))}
          {cells.map((day, index) =>
            day === null ? (
              <span key={`vacio-${index}`} />
            ) : (
              <button
                aria-label={`${day}${busy.has(keyOf(day)) ? ", día con servicios" : ""}`}
                aria-pressed={selected === keyOf(day)}
                className={`agenda-calendar__day${selected === keyOf(day) ? " is-selected" : ""}${keyOf(day) === today ? " is-today" : ""}`}
                key={day}
                onClick={() => setSelected(keyOf(day))}
                type="button"
              >
                {day}
                {busy.has(keyOf(day)) && <span className="agenda-calendar__dot" />}
              </button>
            ),
          )}
        </div>
        <div className="agenda-calendar__legend">
          <span>
            <span className="agenda-calendar__dot agenda-calendar__dot--legend" /> Día con servicios
          </span>
          <span>
            <span className="agenda-calendar__swatch" /> Día seleccionado
          </span>
        </div>
      </section>

      <section className="agenda-day">
        <p className="eyebrow">Servicios del día</p>
        <h2 className="agenda-day__title">{selectedTitle}</h2>
        {dayItems.length ? (
          <ul className="agenda-day__list">
            {dayItems.map((item) => (
              <li key={item.id}>
                <Link className="agenda-day__item" href={`/worker/requests/${item.id}`}>
                  <span className="agenda-day__time">{item.time}</span>
                  <span className="agenda-day__body">
                    <strong>{item.title}</strong>
                    <span className="text-sm muted">
                      {item.client} · {item.place}
                    </span>
                  </span>
                  <span className={`chip ${statusChip[item.status].tone}`}>{statusChip[item.status].label}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm muted agenda-day__empty">No tienes servicios programados este día.</p>
        )}
        <Link className="link-strong agenda-day__more" href="/worker/requests">
          Ver en solicitudes <Icon name="chevronRight" size={16} />
        </Link>
      </section>

      <div className="agenda__weekly">{weekly}</div>
      <div className="agenda__editor-head">{editorHead}</div>
      <div className="agenda__editor">{editor}</div>
    </div>
  );
}
