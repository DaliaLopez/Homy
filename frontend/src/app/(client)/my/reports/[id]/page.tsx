import { ReportDetailPage } from "@/lib/report-pages";
import { requireRole } from "@/lib/session";

export default async function MyReportDetailPage({ params, searchParams }: PageProps<"/my/reports/[id]">) {
  await requireRole("user");
  const [{ id }, { nuevo }] = await Promise.all([params, searchParams]);
  return <ReportDetailPage id={id} nuevo={nuevo} role="user" />;
}
