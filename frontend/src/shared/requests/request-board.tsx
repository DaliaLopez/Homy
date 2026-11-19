import Link from "next/link";
import { requestTabs, type RequestStatus, type ServiceRequest } from "@/types/request";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import RequestCard from "./request-card";
import StatusActions from "./status-actions";

type Props = {
  requests: ServiceRequest[];
  /** Ruta base del detalle, por ejemplo "/my/requests" o "/worker/requests". */
  base: string;
  viewer: "client" | "worker";
  estado?: string | string[];
};

const matches = (item: ServiceRequest, key: string) =>
  key === "all" || item.status === key || (key === "cancelled" && ["cancelled", "rejected", "expired"].includes(item.status));

/** Lista de solicitudes con filtros por estado. El trabajador acepta o rechaza desde aquí. */
export default function RequestBoard({ requests, base, viewer, estado }: Props) {
  const filter = (typeof estado === "string" && requestTabs.some((tab) => tab.key === estado) ? estado : "all") as "all" | RequestStatus;
  const visible = requests.filter((item) => matches(item, filter));

  return (
    <div className="stack stack--lg">
      <nav aria-label="Filtrar por estado" className="tabs">
        {requestTabs.map((item) => (
          <Link
            aria-current={filter === item.key ? "page" : undefined}
            className={`tab${filter === item.key ? " is-active" : ""}`}
            href={item.key === "all" ? base : `${base}?estado=${item.key}`}
            key={item.key}
          >
            {item.label}
            <span className="tab__count">{requests.filter((request) => matches(request, item.key)).length}</span>
          </Link>
        ))}
      </nav>

      {visible.length ? (
        <div className="grid grid--2">
          {visible.map((request) => (
            <RequestCard
              actions={
                viewer === "worker" && request.status === "requested" ? (
                  <StatusActions compact id={request.id} name={request.client?.name ?? "el cliente"} status="requested" />
                ) : (
                  <Link className="btn btn--outline btn--block btn--sm" href={`${base}/${request.id}`}>
                    Ver detalle <Icon name="chevronRight" size={16} />
                  </Link>
                )
              }
              href={`${base}/${request.id}`}
              key={request.id}
              request={request}
              viewer={viewer}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          action={
            viewer === "client" ? (
              <Link className="btn btn--primary" href="/workers">
                Buscar servicios
              </Link>
            ) : undefined
          }
          icon="file"
          title="No hay solicitudes"
        >
          Cuando haya solicitudes en este estado aparecerán aquí.
        </EmptyState>
      )}
    </div>
  );
}
