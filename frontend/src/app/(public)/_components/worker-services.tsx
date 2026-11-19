"use client";

import Link from "next/link";
import { useState } from "react";
import { durationLabel, formatCOP } from "@/lib/format";
import type { PublicService } from "@/types/worker";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";

/** Servicios del perfil público con filtro por categoría en la esquina superior derecha. */
export default function WorkerServices({
  services,
  workerId,
  name,
  canHire = true,
}: {
  services: PublicService[];
  workerId: string;
  name: string;
  /** false: el cliente es de otra ciudad (los servicios no abren la solicitud). */ canHire?: boolean;
}) {
  const [category, setCategory] = useState("");
  const categories = [...new Map(services.map((service) => [service.category.id, service.category.name])).entries()];
  const visible = category ? services.filter((service) => service.category.id === category) : services;

  return (
    <section className="profile-box section worker-services">
      <div className="section-head">
        <h2>Servicios</h2>
        {services.length > 0 && (
          <>
            <label className="sr-only" htmlFor="services-category">
              Filtrar servicios por categoría
            </label>
            <select
              className="select select--sm worker-services__filter"
              id="services-category"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">Todas las categorías</option>
              {categories.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </>
        )}
      </div>
      {visible.length ? (
        <div className="grid grid--2">
          {visible.map((service) => (
            <ServiceCard canHire={canHire} href={`/my/requests/new?profesional=${workerId}&servicio=${service.id}`} key={service.id}>
              <div className="row row--between" style={{ alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontSize: "var(--fs-lg)" }}>{service.name}</h3>
                  <p className="text-sm muted" style={{ marginTop: 4 }}>
                    {service.description}
                  </p>
                </div>
                <strong className="price" style={{ fontSize: 20 }}>
                  {formatCOP(service.price)}
                </strong>
              </div>
              <span className="meta__item text-sm muted">
                <Icon name="clock" size={16} />
                {durationLabel(service.durationMinutes)} · {service.category.name}
              </span>
            </ServiceCard>
          ))}
        </div>
      ) : (
        <EmptyState icon="briefcase" title={`${name} aún no tiene servicios publicados`} />
      )}
    </section>
  );
}

/** Con permiso para contratar la tarjeta abre la solicitud; si no, solo se muestra. */
function ServiceCard({ canHire, href, children }: { canHire: boolean; href: string; children: React.ReactNode }) {
  return canHire ? (
    <Link className="card" href={href}>
      {children}
    </Link>
  ) : (
    <div className="card">{children}</div>
  );
}
