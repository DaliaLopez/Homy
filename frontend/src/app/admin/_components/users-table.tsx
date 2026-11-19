"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { deleteUser } from "@/app/admin/_actions/admin";
import { formatShortDate } from "@/lib/format";
import { roleLabel, type AppUser, type Role } from "@/types/user";
import Avatar from "@/shared/ui/avatar";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Modal from "@/shared/ui/modal";
import Notice from "@/shared/ui/notice";
import SubmitButton from "@/shared/ui/submit-button";
import SuspendUser from "./suspend-user";

function DeleteUser({ user, onClose }: { user: AppUser; onClose: () => void }) {
  const [state, action] = useActionState(deleteUser, undefined);
  return (
    <Modal labelledBy="delete-user-title" onClose={onClose} open>
      {state?.ok ? (
        <div className="stack">
          <h2 id="delete-user-title">Eliminaste a {user.name}</h2>
          <button className="btn btn--primary btn--block" onClick={onClose} type="button">
            Listo
          </button>
        </div>
      ) : (
        <form action={action} className="stack">
          <input name="id" type="hidden" value={user.id} />
          <h2 id="delete-user-title">¿Eliminar a {user.name}?</h2>
          <p className="lead">Se borrará su cuenta y su historial. Esta acción no se puede deshacer.</p>
          {state?.error && <Notice tone="danger">{state.error}</Notice>}
          <div className="btn-row">
            <button className="btn btn--outline" onClick={onClose} type="button">
              Cancelar
            </button>
            <SubmitButton className="btn btn--danger" pendingLabel="Eliminando…">
              Eliminar
            </SubmitButton>
          </div>
        </form>
      )}
    </Modal>
  );
}

const plural: Record<Role, string> = { user: "Clientes", worker: "Profesionales", admin: "Administradores" };

/** Usuarios: búsqueda, filtro por rol, suspender/reactivar y eliminar. En móvil la tabla pasa a tarjetas. */
export default function UsersTable({ users, selfId }: { users: AppUser[]; selfId: string }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [deleting, setDeleting] = useState<AppUser | null>(null);
  const text = query.trim().toLocaleLowerCase("es");
  const visible = users.filter((user) => (role === "all" || user.role === role) && (!text || `${user.name} ${user.email}`.toLocaleLowerCase("es").includes(text)));

  return (
    <div className="stack stack--lg">
      <div className="form-grid form-grid--2">
        <label className="input-wrap">
          <span className="sr-only">Buscar usuario</span>
          <input className="input" onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o correo" type="search" value={query} />
          <span aria-hidden="true" className="input-wrap__action">
            <Icon name="search" size={18} />
          </span>
        </label>
        <div aria-label="Filtrar por rol" className="tabs" role="tablist">
          {(["all", "user", "worker", "admin"] as const).map((value) => (
            <button aria-selected={role === value} className={`tab${role === value ? " is-active" : ""}`} key={value} onClick={() => setRole(value)} role="tab" type="button">
              {value === "all" ? "Todos" : plural[value]}
            </button>
          ))}
        </div>
      </div>

      {visible.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col">Rol</th>
                <th scope="col">Ubicación</th>
                <th scope="col">Registro</th>
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => (
                <tr key={user.id}>
                  <td className="table__main">
                    <Link className="row" href={`/admin/users/${user.id}`}>
                      <Avatar name={user.name} round size="sm" src={user.avatarUrl} />
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ display: "block" }}>{user.name}</strong>
                        <span className="text-xs muted">{user.email}</span>
                      </div>
                    </Link>
                  </td>
                  <td data-label="Rol">
                    <span className={`chip ${user.role === "worker" ? "chip--olive" : user.role === "admin" ? "chip--dark" : "chip--sage"}`}>{roleLabel[user.role]}</span>
                  </td>
                  <td data-label="Ubicación">{user.location ?? "—"}</td>
                  <td data-label="Registro">{formatShortDate(user.createdAt)}</td>
                  <td data-label="Estado">
                    <span className={`chip ${user.status === "suspended" ? "chip--danger" : "chip--sage"}`}>{user.status === "suspended" ? "Suspendido" : "Activo"}</span>
                  </td>
                  <td className="table__actions">
                    {user.role !== "admin" && user.id !== selfId && (
                      <>
                        <SuspendUser id={user.id} name={user.name} small suspended={user.status === "suspended"} />
                        <button aria-label={`Eliminar a ${user.name}`} className="btn btn--outline btn--sm" onClick={() => setDeleting(user)} type="button">
                          <Icon name="trash" size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="users" title="No encontramos usuarios" />
      )}

      {deleting && <DeleteUser onClose={() => setDeleting(null)} user={deleting} />}
    </div>
  );
}
