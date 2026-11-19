import type { Metadata } from "next";
import { ReportsListPage } from "@/lib/report-pages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Mis reportes" };

export default async function MyReportsPage({ searchParams }: PageProps<"/my/reports">) {
  await requireRole("user");
  const { tab } = await searchParams;
  return <ReportsListPage role="user" tab={tab} />;
}
