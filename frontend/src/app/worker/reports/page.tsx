import type { Metadata } from "next";
import { ReportsListPage } from "@/lib/report-pages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Mis reportes" };

export default async function WorkerReportsPage({ searchParams }: PageProps<"/worker/reports">) {
  await requireRole("worker");
  const { tab } = await searchParams;
  return <ReportsListPage role="worker" tab={tab} />;
}
