"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { createRequest, getFreeSlots } from "@/app/(client)/my/_actions/requests";
import { durationHours, formatCOP, formatHour, formatLongDate, isoDay } from "@/lib/format";
import type { Worker } from "@/types/worker";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Notice from "@/shared/ui/notice";
import PersonPhoto from "@/shared/ui/person-photo";
import { RatingInline } from "@/shared/ui/stars";
import SubmitButton from "@/shared/ui/submit-button";

type Props = { worker: Worker; initialServiceId?: string; defaultAddress: string };

const hoursText = (hours: number) => (hours === 1 ? "1 hora" : `${hours} horas`);

// Crea una solicitud: profesional elegido + servicio (con su duración en horas),
// fecha, una de las horas realmente libres del trabajador, dirección y detalle.
 
export default function NewRequestForm({ worker, initialServiceId, defaultAddress }: Props) {
  const services = worker.services;
  const [state, action] = useActionState(createRequest, undefined);
  const [serviceId, setServiceId] = useState(initialServiceId && services.some((s) => s.id === initialServiceId) ? initialServiceId : (services[0]?.id ?? ""));
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [taken, setTaken] = useState<string[]>([]);
  const [slotsError, setSlotsError] = useState("");
  const [loading, startLoading] = useTransition();
  const selected = services.find((item) => item.id === serviceId);
  const hours = selected ? durationHours(selected.durationMinutes) : 0;
  const first = worker.user.name.split(" ")[0];
  // Libres y ocupadas por otros clientes, en orden; cada botón muestra inicio – fin según la duración del servicio.
  const options = [...slots.map((slot) => ({ slot, free: true })), ...taken.map((slot) => ({ slot, free: false }))].sort((a, b) =>
    a.slot.localeCompare(b.slot),
  );
  const rangeOf = (slot: string) => {
    const end = Number(slot.slice(0, 2)) + hours;
    return `${formatHour(slot)} – ${end >= 24 ? "12:00 am" : formatHour(`${String(end).padStart(2, "0")}:00`)}`;
  };

  useEffect(() => {
    if (!serviceId || !date) return;
    startLoading(async () => {
      const result = await getFreeSlots(worker.id, serviceId, date);
      setSlots(result.slots);
      setTaken(result.taken);
      setSlotsError(result.error ?? "");
      setTime("");
    });
  }, [worker.id, serviceId, date]);

  if (!services.length) return <EmptyState icon="briefcase" title={`${worker.user.name} aún no tiene servicios publicados`} />;

  return (
    <form action={action} className="layout-aside layout-aside--sidebar">
      <input name="workerId" type="hidden" value={worker.id} />
      <input name="serviceId" type="hidden" value={serviceId} />
      <input name="date" type="hidden" value={date} />
      <input name="time" type="hidden" value={time} />

      <div className="stack stack--lg">
        <section className="card card--lg">
          <div className="row">
            <PersonPhoto name={worker.user.name} src={worker.user.avatarUrl} />
            <div className="stack stack--sm">
              <h3>{worker.user.name}</h3>
              <p className="text-sm muted">{worker.approvedCategories.map((item) => item.name).join(" · ") || "Profesional"}</p>
              <RatingInline rating={Number(worker.averageRating)} />
            </div>
          </div>
        </section>

        <div className="form">
          {state?.error && (
            <p className="form-error" role="alert">
              {state.error}
            </p>
          )}
          <div className="field">
            <label className="label" htmlFor="service">
              Servicio
            </label>
            <select className="select" id="service" onChange={(event) => setServiceId(event.target.value)} value={serviceId}>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} · {formatCOP(service.price)}
                </option>
              ))}
            </select>
            {selected && (
              <span className="field__hint">
                Este servicio dura {hoursText(hours)}. Reservamos ese tiempo completo en la agenda de {first}.
              </span>
            )}
          </div>

          <div className="form-grid form-grid--2">
            <div className="field">
              <label className="label" htmlFor="date">
                Fecha
              </label>
              <input className="input" id="date" min={isoDay()} onChange={(event) => setDate(event.target.value)} type="date" value={date} />
            </div>
            <div className="field">
              <span className="label" id="time-label">
                Hora
              </span>
              {!date ? (
                <span className="field__hint">Elige una fecha para ver las horas libres.</span>
              ) : loading ? (
                <span className="field__hint">Buscando horarios libres…</span>
              ) : slotsError ? (
                <span className="field__error">{slotsError}</span>
              ) : options.length ? (
                <div aria-labelledby="time-label" className="chip-group time-slots" role="radiogroup">
                  {options.map(({ slot, free }) => (
                    <button
                      aria-checked={time === slot}
                      className={`tab time-slot${time === slot ? " is-active" : ""}`}
                      disabled={!free}
                      key={slot}
                      onClick={() => setTime(slot)}
                      role="radio"
                      title={free ? undefined : "Ocupado por otra solicitud"}
                      type="button"
                    >
                      {rangeOf(slot)}
                    </button>
                  ))}
                  {!slots.length && <span className="field__hint">Todas las horas de ese día ya están ocupadas. Prueba otra fecha.</span>}
                </div>
              ) : (
                <span className="field__hint">
                  {first} no tiene horas libres ese día para un servicio de {hoursText(hours)}. Prueba otra fecha.
                </span>
              )}
            </div>
          </div>

          <div className="field">
            <label className="label" htmlFor="address">
              Dirección
            </label>
            <input
              className="input"
              defaultValue={defaultAddress}
              id="address"
              maxLength={255}
              name="address"
              placeholder="Calle, número, apartamento y barrio"
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="description">
              Cuéntale qué necesitas
            </label>
            <textarea
              className="textarea"
              id="description"
              maxLength={500}
              minLength={10}
              name="description"
              placeholder="Ej: instalar 3 lámparas en la sala"
              required
            />
          </div>
        </div>
      </div>

      <aside className="stack sticky-aside">
        <section className="card card--lg card--outline">
          <h3>Resumen</h3>
          <div className="list">
            <div className="list-row">
              <span className="muted">Servicio</span>
              <span className="strong">{selected?.name}</span>
            </div>
            <div className="list-row">
              <span className="muted">Duración</span>
              <span className="strong">{selected ? hoursText(hours) : "—"}</span>
            </div>
            <div className="list-row">
              <span className="muted">Fecha</span>
              <span className="strong">{date ? formatLongDate(`${date}T12:00:00-05:00`) : "—"}</span>
            </div>
            <div className="list-row">
              <span className="muted">Hora</span>
              <span className="strong">{time ? rangeOf(time) : "—"}</span>
            </div>
            <div className="list-row">
              <span className="muted">Total</span>
              <strong className="price" style={{ fontSize: 22 }}>
                {selected ? formatCOP(selected.price) : "—"}
              </strong>
            </div>
          </div>
          {!time && date && !loading && slots.length > 0 && <Notice tone="neutral">Elige una de las horas libres.</Notice>}
          <SubmitButton className="btn btn--primary btn--block" disabled={!time} pendingLabel="Enviando solicitud…">
            Enviar solicitud <Icon name="chevronRight" size={16} />
          </SubmitButton>
          <p className="text-xs muted">El profesional confirmará la fecha. Pagas al terminar el servicio.</p>
        </section>
      </aside>
    </form>
  );
}
