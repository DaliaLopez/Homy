import type { Metadata } from "next";
import { getReceivedRequests } from "@/lib/data";
import { NewReportPage } from "@/lib/report-pages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Reportar un problema" };

export default async function WorkerNewReportPage({ searchParams }: PageProps<"/worker/reports/new">) {
  await requireRole("worker");
  const [{ solicitud }, requests] = await Promise.all([searchParams, getReceivedRequests()]);
  return <NewReportPage requests={requests} role="worker" solicitud={solicitud} />;
}
