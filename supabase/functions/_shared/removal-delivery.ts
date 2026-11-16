export const WORKER_BATCH_SIZE = 5;
export const RETRY_LIMIT = 5;
export const IDEMPOTENCY_SAFE_MS = 23 * 60 * 60 * 1000;

export function retryDecision(failures: number, status: number | null, startedAt: string, now: Date, retryAfter: string | null = null) {
  if (now.getTime() - new Date(startedAt).getTime() >= IDEMPOTENCY_SAFE_MS || failures >= RETRY_LIMIT ||
    (status !== null && status !== 429 && status !== 408 && status < 500)) return { status: "failed", availableAt: now.toISOString() };
  const seconds = Number(retryAfter);
  const dateDelay = retryAfter ? Date.parse(retryAfter) - now.getTime() : 0;
  const providerDelay = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : Math.max(0, dateDelay || 0);
  const delay = Math.max(60_000 * 2 ** Math.max(0, failures - 1), providerDelay);
  if (now.getTime() + delay - new Date(startedAt).getTime() >= IDEMPOTENCY_SAFE_MS) return { status: "failed", availableAt: now.toISOString() };
  return { status: "pending", availableAt: new Date(now.getTime() + delay).toISOString() };
}

export function deliveryAllowed(tier: string | null, subscriptionStatus: string | null, authorized: boolean, requestStatus: string, attempt: number, previousAttempts: number) {
  return tier === "complete" && ["active", "trialing"].includes(subscriptionStatus ?? "") && authorized &&
    ["found", "request_sent", "waiting"].includes(requestStatus) && attempt === previousAttempts + 1 && attempt <= 3;
}

export type RemovalReportCounts = { removed: number; sent: number; waiting: number };
export function removalReportCounts(rows: { status: string; removed_at: string | null; sent_at: string | null }[], since: string): RemovalReportCounts {
  const counts = { removed: 0, sent: 0, waiting: 0 };
  for (const row of rows) {
    if (row.status === "removed" && row.removed_at && row.removed_at >= since) counts.removed++;
    if (row.sent_at && row.sent_at >= since) counts.sent++;
    if (["request_sent", "waiting"].includes(row.status)) counts.waiting++;
  }
  return counts;
}