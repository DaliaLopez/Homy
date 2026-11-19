import type { Metadata } from "next";
import AgendaBoard, { type AgendaItem } from "@/app/worker/_components/availability/agenda-board";
import AvailabilityEditor from "@/app/worker/_components/availability/availability-editor";
import { getMyAvailability, getReceivedRequests } from "@/lib/data";
import { isoDay } from "@/lib/format";
import { weeklySummary } from "@/lib/schedule";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Agenda y disponibilidad" };

const timeOf = (value: string) => new Date(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Bogota" });

/** Agenda y disponibilidad en una sola pantalla: calendario, servicios del día, resumen semanal y editor de horarios. */
export default async function AvailabilityPage() {
  await requireRole("worker");
  const [requests, availability] = await Promise.all([getReceivedRequests(), getMyAvailability()]);

  const items: AgendaItem[] = requests
    .filter((request) => request.status === "requested" || request.status === "accepted" || request.status === "in_progress")
    .map((request) => ({
      id: request.id,
      date: isoDay(request.scheduledAt),
      time: timeOf(request.scheduledAt),
      title: request.service?.name ?? "Servicio",
      client: request.client?.name ?? "Cliente",
      place: request.address.split(",")[0],
      status: request.status as AgendaItem["status"],
    }));
  const week = weeklySummary(availability, true);

  return (
    <div className="stack stack--lg">
      <header className="page-head">
        <div className="page-head__text">
          <p className="greeting">Tus servicios programados</p>
          <h1 className="title-xl">Agenda y disponibilidad</h1>
        </div>
      </header>

      <AgendaBoard
        editor={<AvailabilityEditor availability={availability} />}
        editorHead={
          <div>
            <h2 id="editar-disponibilidad">Editar disponibilidad</h2>
            <p className="text-sm muted">Los clientes solo pueden solicitarte en los horarios que actives.</p>
          </div>
        }
        items={items}
        today={isoDay()}
        weekly={
          <section className="agenda-week">
            <div>
              <h2 className="agenda-week__title">Tu disponibilidad semanal</h2>
              <p className="text-sm muted">Los clientes solo pueden solicitarte en estos horarios.</p>
            </div>
            <dl className="agenda-week__list">
              {week.map((day) => (
                <div key={day.key}>
                  <dt>{day.label}</dt>
                  <dd className={day.ranges ? undefined : "muted"}>{day.ranges || "Sin disponibilidad"}</dd>
                </div>
              ))}
            </dl>
          </section>
        }
      />
    </div>
  );
}
