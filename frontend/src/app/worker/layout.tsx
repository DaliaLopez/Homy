import AppShell from "@/shared/layout/app-shell";
import { getProfile, requireRole } from "@/lib/session";

/** Área del trabajador: solo el rol "worker". */
export default async function WorkerLayout({ children }: LayoutProps<"/worker">) {
  await requireRole("worker");
  return (
    <AppShell role="worker" user={await getProfile()}>
      {children}
    </AppShell>
  );
}
