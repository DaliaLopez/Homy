export type Role = "user" | "worker" | "admin";

/** Lo que devuelve GET /auth/me. */
export type SessionUser = { id: string; email: string; role: Role; name: string };

export type AppUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  role: Role;
  status: "active" | "suspended";
  suspensionReason: string | null;
  suspendedAt: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

export const roleLabel: Record<Role, string> = {
  user: "Cliente",
  worker: "Trabajador",
  admin: "Administrador",
};
