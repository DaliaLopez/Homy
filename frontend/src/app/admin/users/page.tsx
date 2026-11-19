import type { Metadata } from "next";
import UsersTable from "@/app/admin/_components/users-table";
import PageHeader from "@/shared/ui/page-header";
import { getUsers } from "@/lib/data";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Usuarios" };

export default async function AdminUsersPage() {
  const admin = await requireRole("admin");
  const users = await getUsers();
  return (
    <div className="stack stack--lg">
      <PageHeader description="Clientes, profesionales y administradores registrados en Homy." eyebrow="Usuarios" title="Usuarios" />
      <UsersTable selfId={admin.id} users={users} />
    </div>
  );
}
