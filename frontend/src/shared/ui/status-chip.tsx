import { reportStatusLabel, type ReportStatus } from "@/types/report";
import { requestStatusLabel, type RequestStatus } from "@/types/request";
import { serviceStatusLabel, type ServiceStatus } from "@/types/service";
import { verificationStatusLabel, type VerificationStatus } from "@/types/verification";

type Variant = "dark" | "olive" | "sage" | "neutral" | "danger";

const requestVariant: Record<RequestStatus, Variant> = {
  requested: "olive",
  accepted: "dark",
  in_progress: "sage",
  completed: "neutral",
  rejected: "danger",
  cancelled: "danger",
  expired: "neutral",
};

const serviceVariant: Record<ServiceStatus, Variant> = {
  published: "sage",
  in_review: "olive",
  changes_requested: "danger",
  rejected: "neutral",
};

const reportVariant: Record<ReportStatus, Variant> = {
  pending: "danger",
  investigating: "olive",
  resolved: "sage",
  dismissed: "neutral",
};

const verificationVariant: Record<VerificationStatus, Variant> = {
  pending: "olive",
  verified: "sage",
  rejected: "danger",
  changes_requested: "danger",
};

type StatusChipProps =
  | { kind: "request"; status: RequestStatus }
  | { kind: "service"; status: ServiceStatus }
  | { kind: "report"; status: ReportStatus }
  | { kind: "verification"; status: VerificationStatus };

/** Chip de estado con el color que usa el diseño para cada caso. */
export default function StatusChip(props: StatusChipProps) {
  const [label, variant] =
    props.kind === "request"
      ? [requestStatusLabel[props.status], requestVariant[props.status]]
      : props.kind === "service"
        ? [serviceStatusLabel[props.status], serviceVariant[props.status]]
        : props.kind === "report"
          ? [reportStatusLabel[props.status], reportVariant[props.status]]
          : [verificationStatusLabel[props.status], verificationVariant[props.status]];

  return <span className={`chip chip--${variant}`}>{label}</span>;
}

/** Punto de color para listas de estados (estado de publicación). */
export const serviceDot: Record<ServiceStatus, string> = {
  published: "status-dot",
  in_review: "status-dot status-dot--olive",
  changes_requested: "status-dot status-dot--danger",
  rejected: "status-dot status-dot--neutral",
};
