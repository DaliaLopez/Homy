"use client";

import { startTransition, useActionState, useState } from "react";
import { saveWeek } from "@/app/worker/_actions/availability";
import { formatHour } from "@/lib/format";
import { weekdays, type Availability, type Weekday } from "@/types/worker";
import Icon from "@/shared/ui/icon";
import Notice from "@/shared/ui/notice";

type Day = { day: Weekday; label: string; enabled: boolean; start: number; end: number };

const hourOf = (time: string) => (time.startsWith("23:59") ? 24 : Number(time.slice(0, 2)));
const hourLabel = (hour: number) => (hour === 24 ? "12:00 am (fin del día)" : formatHour(`${String(hour).padStart(2, "0")}:00`));

/** Horarios por día: interruptor + rango de horas enteras. */
export default function AvailabilityEditor({ availability }: { availability: Availability[] }) {
  const [state, action, pending] = useActionState(saveWeek, undefined);
  const [days, setDays] = useState<Day[]>(() =>
    weekdays.map((day) => {
      const ranges = availability.filter((item) => item.day === day.key);
      return ranges.length
        ? {
            day: day.key,
            label: day.label,
            enabled: true,
            start: Math.min(...ranges.map((r) => hourOf(r.startTime))),
            end: Math.max(...ranges.map((r) => hourOf(r.endTime))),
          }
        : { day: day.key, label: day.label, enabled: false, start: 8, end: 18 };
    }),
  );

  const update = (index: number, patch: Partial<Day>) => setDays((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const invalid = days.some((item) => item.enabled && item.start >= item.end);

  return (
    // Se envía con onSubmit (no con action) para que React no reinicie los campos al terminar:
    // los días y las horas se quedan tal como el trabajador los dejó al guardar.
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <input name="days" type="hidden" value={JSON.stringify(days.map(({ day, enabled, start, end }) => ({ day, enabled, start, end })))} />
      {days.map((item, index) => (
        <div className={`schedule-row${item.enabled ? "" : " is-off"}`} key={item.day}>
          <label className="schedule-row__day">
            <span className="switch">
              <input checked={item.enabled} onChange={(event) => update(index, { enabled: event.target.checked })} type="checkbox" />
              <span className="switch__track" />
            </span>
            {item.label}
          </label>
          {item.enabled ? (
            <div className="time-range">
              <label className="sr-only" htmlFor={`start-${index}`}>
                Hora de inicio del {item.label}
              </label>
              <select className="select" id={`start-${index}`} onChange={(event) => update(index, { start: Number(event.target.value) })} value={item.start}>
                {Array.from({ length: 24 }, (_, hour) => (
                  <option key={hour} value={hour}>
                    {hourLabel(hour)}
                  </option>
                ))}
              </select>
              <span className="muted">a</span>
              <label className="sr-only" htmlFor={`end-${index}`}>
                Hora de fin del {item.label}
              </label>
              <select className="select" id={`end-${index}`} onChange={(event) => update(index, { end: Number(event.target.value) })} value={item.end}>
                {Array.from({ length: 24 }, (_, hour) => hour + 1).map((hour) => (
                  <option key={hour} value={hour}>
                    {hourLabel(hour)}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <span className="text-sm">No disponible</span>
          )}
        </div>
      ))}
      {invalid && (
        <p className="form-error" role="alert">
          La hora de inicio debe ser antes de la hora de fin.
        </p>
      )}
      {state?.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && <Notice>{state.ok}</Notice>}
      <p className="field__hint">Las franjas son en horas completas. Si tienes un servicio de 2 horas a las 8:00, quedas libre desde las 10:00.</p>
      <div>
        <button className="btn btn--primary" disabled={invalid || pending} type="submit">
          {pending ? (
            "Guardando…"
          ) : (
            <>
              <Icon name="check" size={18} /> Guardar horarios
            </>
          )}
        </button>
      </div>
    </form>
  );
}
