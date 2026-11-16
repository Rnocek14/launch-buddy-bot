export type RemovalStatus = "found" | "request_sent" | "needs_customer" | "waiting" | "removed" | "failed";

export const REMOVAL_STATUS_LABEL: Record<RemovalStatus, string> = {
  found: "Found — in our removal queue",
  request_sent: "Request sent",
  needs_customer: "Needs your action",
  waiting: "Waiting on broker",
  removed: "Removed",
  failed: "Couldn't remove",
};

export function summarizeRemovals(rows: { status: RemovalStatus }[]) {
  const s = { sent: 0, removed: 0, waiting: 0, needsYou: 0 };
  for (const r of rows) {
    if (r.status === "removed") s.removed++;
    else if (r.status === "needs_customer") s.needsYou++;
    else if (r.status === "request_sent" || r.status === "waiting") { s.sent++; s.waiting++; }
    else if (r.status === "found") s.waiting++;
  }
  return s;
}
