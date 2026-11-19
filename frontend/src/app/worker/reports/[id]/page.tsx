import { ReportDetailPage } from "@/lib/report-pages";
import { requireRole } from "@/lib/session";

export default async function WorkerReportDetailPage({ params, searchParams }: PageProps<"/worker/reports/[id]">) {
  await requireRole("worker");
  const [{ id }, { nuevo }] = await Promise.all([params, searchParams]);
  return <ReportDetailPage id={id} nuevo={nuevo} role="worker" />;
}
