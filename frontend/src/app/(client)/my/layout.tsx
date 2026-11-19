import AppShell from "@/shared/layout/app-shell";
import { getProfile, requireRole } from "@/lib/session";

//Área privada del cliente: solo el rol "user". 
export default async function ClientLayout({ children }: LayoutProps<"/my">) {
  await requireRole("user");
  return (
    <AppShell role="user" user={await getProfile()}>
      {children}
    </AppShell>
  );
}
