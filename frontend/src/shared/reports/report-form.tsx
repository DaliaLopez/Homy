"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { createReport } from "@/shared/actions/reports";
import { formatShortDate } from "@/lib/format";
import { clientReportReasons, workerReportReasons } from "@/types/report";
import FilePicker from "@/shared/ui/file-picker";

export type ReportableRequest = {
  id: string;
  otherUserId: string;
  otherName: string;
  otherPhoto: string | null;
  serviceName: string;
  date: string;
};

const MIN = 20;
const MAX = 500;

type Props = {
  requests: ReportableRequest[];
  initialId?: string;
  /** Desde el detalle del servicio: el servicio queda fijo ("Servicio reportado"). */
  locked?: boolean;
  role: "user" | "worker";
};

const label = (item: ReportableRequest) => `${item.serviceName} · ${item.otherName} · ${formatShortDate(item.date)}`;

/** Botón de envío: dice qué falta ("Elige un motivo", "Describe qué pasó") hasta que el reporte está listo. */
function SubmitReport({ missing }: { missing: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn--primary btn--block report-form__submit" disabled={pending || Boolean(missing)} type="submit">
      {pending ? "Enviando…" : missing || "Enviar reporte"}
    </button>
  );
}

/** Reportar un problema: servicio, motivo, descripción obligatoria y evidencia opcional. */
export default function ReportForm({ requests, initialId, locked = false, role }: Props) {
  const [state, action] = useActionState(createReport, undefined);
  const [selectedId, setSelectedId] = useState(initialId && requests.some((r) => r.id === initialId) ? initialId : (requests[0]?.id ?? ""));
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const selected = requests.find((item) => item.id === selectedId);
  const reasons = role === "worker" ? workerReportReasons : clientReportReasons;
  const missing = !reason ? "Elige un motivo" : description.trim().length < MIN ? "Describe qué pasó" : "";

  return (
    <form action={action} className="report-form">
      <input name="requestId" type="hidden" value={selectedId} />
      <input name="reportedUserId" type="hidden" value={selected?.otherUserId ?? ""} />
      <input name="reason" type="hidden" value={reason} />
      {state?.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="field">
        {locked && selected ? (
          <>
            <span className="label">Servicio reportado</span>
            <p className="report-form__service">{label(selected)}</p>
          </>
        ) : (
          <>
            <label className="label" htmlFor="report-service">
              ¿Sobre qué servicio?
            </label>
            <select className="select" id="report-service" onChange={(event) => setSelectedId(event.target.value)} value={selectedId}>
              {requests.map((item) => (
                <option key={item.id} value={item.id}>
                  {label(item)}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      <div className="field">
        <span className="label" id="report-reason">
          Motivo
        </span>
        <div aria-labelledby="report-reason" className="report-form__reasons" role="radiogroup">
          {reasons.map((item) => (
            <button
              aria-checked={reason === item}
              className={`report-form__reason${reason === item ? " is-active" : ""}`}
              key={item}
              onClick={() => setReason(item)}
              role="radio"
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label className="label" htmlFor="report-description">
          Describe qué pasó <span className="report-form__required">(obligatorio)</span>
        </label>
        <div className="report-form__textarea">
          <textarea
            className="textarea"
            id="report-description"
            maxLength={MAX}
            name="description"
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Cuenta con detalle: qué pasó, cuándo y qué hiciste. Entre más claro, más rápido lo resolvemos."
            value={description}
          />
          <span aria-live="polite" className="report-form__count">
            {description.length}/{MAX}
          </span>
        </div>
        <span className="field__hint">Mínimo {MIN} caracteres.</span>
      </div>

      <div className="field">
        <span className="label">
          Evidencia <span className="report-form__optional">(opcional)</span>
        </span>
        <FilePicker hint="Fotos, capturas del chat o comprobantes · PDF, JPG o PNG" label="Adjuntar archivos" name="evidence" plain />
      </div>

      <SubmitReport missing={missing} />
    </form>
  );
}
