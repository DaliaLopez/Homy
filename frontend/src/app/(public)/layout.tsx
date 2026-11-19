import AppShell from "@/shared/layout/app-shell";
import { allowGuestOrClient, getProfile } from "@/lib/session";

/** Inicio y catálogo: abiertos a visitantes y clientes. Trabajadores y admins van a su área. */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const session = await allowGuestOrClient();
  const user = session ? await getProfile() : null;
  return (
    <AppShell role="user" user={user}>
      {children}
    </AppShell>
  );
}
