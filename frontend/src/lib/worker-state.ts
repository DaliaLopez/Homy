import "server-only";
import { getMyVerifications, getMyWorker } from "./data";

export type WorkerStage = "unverified" | "review" | "changes" | "verified";

/** En qué punto de la verificación está el trabajador. */
export async function getWorkerState() {
  const [worker, verifications] = await Promise.all([getMyWorker(), getMyVerifications()]);
  const initial = verifications.find((item) => item.type === "initial");
  let stage: WorkerStage = "unverified";
  if (worker?.verificationStatus === "verified") stage = "verified";
  else if (initial?.status === "pending") stage = "review";
  else if (initial?.status === "changes_requested") stage = "changes";
  return { worker, verifications, initial, stage };
}
