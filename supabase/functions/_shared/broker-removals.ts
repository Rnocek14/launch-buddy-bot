// Pure decision logic for automated broker removals (no I/O, unit-tested).
export type RemovalStatus = "found" | "request_sent" | "needs_customer" | "waiting" | "removed" | "failed";
export type RemovalMethod = "email" | "form" | "auto_form";

export interface BrokerInfo {
  privacy_email: string | null;
  removal_method: string | null; // 'email' | 'form' | 'both'
  form_automation_enabled: boolean | null;
  contact_verified_at: string | null;
}
export interface ExistingRequest {
  status: RemovalStatus;
  method: RemovalMethod;
  sent_at: string | null;
  follow_up_at: string | null;
  attempts: number;
}

export const FOLLOW_UP_DAYS = 30;
export const MAX_EMAIL_ATTEMPTS = 3;
const ACTIVE_TIERS = new Set(["complete"]);

export function isEligible(tier: string | null | undefined, hasActiveAuthorization: boolean): boolean {
  return !!tier && ACTIVE_TIERS.has(tier) && hasActiveAuthorization;
}

/** Choose the method for a new listing. Email only when the broker's address was checked by hand. */
export function chooseMethod(b: BrokerInfo, hasAutoAdapter: boolean): RemovalMethod {
  const emailOk = !!b.privacy_email && !!b.contact_verified_at &&
    (b.removal_method === "email" || b.removal_method === "both");
  if (emailOk) return "email";
  if (b.form_automation_enabled && hasAutoAdapter) return "auto_form";
  return "form";
}

export type NextAction = "skip" | "send_email" | "queue_form" | "auto_form" | "follow_up";

export function nextAction(
  method: RemovalMethod,
  existing: ExistingRequest | null,
  now: Date,
): NextAction {
  if (!existing) {
    return method === "email" ? "send_email" : method === "auto_form" ? "auto_form" : "queue_form";
  }
  if (existing.status === "removed" || existing.status === "failed" || existing.status === "needs_customer") return "skip";
  if (existing.method === "email" && (existing.status === "request_sent" || existing.status === "waiting")) {
    if (existing.attempts >= MAX_EMAIL_ATTEMPTS) return "skip";
    if (existing.follow_up_at && new Date(existing.follow_up_at) <= now) return "follow_up";
  }
  return "skip";
}

export function followUpDate(from: Date): string {
  return new Date(from.getTime() + FOLLOW_UP_DAYS * 86400000).toISOString();
}

/**
 * A request becomes "removed" only when a successful scan AFTER the request
 * no longer finds the listing. Errors, unknowns or possible matches never count.
 */
export function statusAfterRescan(
  existing: ExistingRequest,
  scan: { status_v2: string | null; scanned_at: string | null } | null,
): RemovalStatus {
  if (existing.status !== "request_sent" && existing.status !== "waiting") return existing.status;
  if (!scan || !scan.scanned_at || !existing.sent_at) return existing.status;
  if (new Date(scan.scanned_at) <= new Date(existing.sent_at)) return existing.status;
  if (scan.status_v2 === "not_found") return "removed";
  return "waiting";
}

export function buildRemovalEmail(p: {
  brokerName: string; fullName: string; email: string; listingUrl: string | null;
  city?: string | null; state?: string | null; authorizedAt: string; followUp: boolean;
}): { subject: string; text: string } {
  const subject = `${p.followUp ? "Follow-up: " : ""}Request to delete personal information – ${p.fullName}`;
  const location = [p.city, p.state].filter(Boolean).join(", ");
  const text = [
    `To the ${p.brokerName} privacy team,`,
    "",
    `I am writing as the authorized agent of ${p.fullName}, who signed a written authorization on ${p.authorizedAt.slice(0, 10)}. On their behalf, I request that you delete all personal information you hold about them and stop selling or sharing it, under the California Consumer Privacy Act (Cal. Civ. Code § 1798.105 and § 1798.120) and any other applicable state privacy law.`,
    "",
    `Name: ${p.fullName}`,
    location ? `Location: ${location}` : "",
    `Contact email: ${p.email}`,
    p.listingUrl ? `Listing: ${p.listingUrl}` : "",
    "",
    p.followUp ? "This is a follow-up to an earlier request that has not yet been completed. " : "",
    "Please confirm once the deletion is complete. If you need to verify the request, reply to this email.",
    "",
    "Footprint Finder, authorized agent",
  ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
  return { subject, text };
}
