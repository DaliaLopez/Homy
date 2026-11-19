import type { Metadata } from "next";
import { getMyRequests } from "@/lib/data";
import { NewReportPage } from "@/lib/report-pages";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Reportar un problema" };

export default async function MyNewReportPage({ searchParams }: PageProps<"/my/reports/new">) {
  await requireRole("user");
  const [{ solicitud }, requests] = await Promise.all([searchParams, getMyRequests()]);
  return <NewReportPage requests={requests} role="user" solicitud={solicitud} />;
}
