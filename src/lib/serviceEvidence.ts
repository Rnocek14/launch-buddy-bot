/**
 * Plain-language evidence model for "Who Has My Data".
 *
 * Turns the metadata-only scan signals already stored per service
 * (intent_signals, activity_status, last_* timestamps, category) into
 * answers a normal person can read:
 *   1. Who has my data?        -> service name
 *   2. Why do they have it?    -> reason
 *   3. Should I care?          -> risk + whyItMatters
 *   4. What should I do?       -> recommendedAction
 *   5. Show me proof?          -> evidenceLines (on demand)
 *
 * Pure functions only. No network, no React. Reads every field
 * defensively so missing signals degrade gracefully.
 */

import type { ActivityStatus, ServiceSignals } from "@/lib/serviceSignals";

export type EvidenceRisk = "high" | "medium" | "low";

export interface EvidenceService {
  id: string;
  name: string;
  category?: string;
  domain?: string;
  homepage_url?: string;
  logo_url?: string;
  discovered_at: string;
  privacy_action?: "keep" | "delete" | "do_not_sell" | null;
  deletion_requested_at?: string | null;
  activity_status?: ActivityStatus;
  cleanup_priority?: number;
  confidence_score?: number;
  last_transaction_at?: string | null;
  last_security_at?: string | null;
  last_activity_at?: string | null;
  intent_signals?: ServiceSignals | null;
}

export interface ServiceEvidence {
  /** Plain-English: why does this company have your data? */
  reason: string;
  /** Plain-English: should you care? */
  whyItMatters: string;
  risk: EvidenceRisk;
  /** Short imperative for the primary recommendation. */
  recommendedAction: string;
  /** First time we saw evidence (discovered_at). */
  firstSeen: string;
  /** Most recent activity we saw, if any. */
  lastSeen: string | null;
  /** Proof lines, shown only when the user expands "Show evidence". */
  evidenceLines: string[];
  /** Confidence label for the evidence panel. */
  confidenceLabel: string;
  category: string;
  /** True once the user has acted (kept / deleted). */
  resolved: boolean;
}

const SENSITIVE = ["Finance", "Banking", "Healthcare", "Government"];

function yearOf(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return String(d.getFullYear());
}

function ageYears(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24 * 365);
}

/** Why does this company have your data? — one plain sentence. */
function deriveReason(s: EvidenceService): string {
  const sig = s.intent_signals || ({} as ServiceSignals);
  const transactions = sig.transaction_count || 0;
  const signups = sig.signup_count || 0;
  const security = sig.security_count || 0;
  const newsletters = sig.newsletter_count || 0;

  if (s.activity_status === "active_paid" || transactions > 0) {
    return "You made purchases and received receipts here.";
  }
  if (signups > 0) {
    return "You created an account here.";
  }
  if (security > 0) {
    return "You received login or password-reset alerts from this company.";
  }
  if (s.activity_status === "newsletter_only" || (newsletters > 0 && signups === 0)) {
    return "Newsletter only — they have your email address.";
  }
  return "We found account-related emails from this company.";
}

function deriveWhyItMatters(s: EvidenceService, risk: EvidenceRisk): string {
  const sensitive = SENSITIVE.includes(s.category || "");
  if (sensitive) {
    return "May store financial or personal records tied to your identity.";
  }
  if (s.activity_status === "active_paid") {
    return "Active paid subscription — likely holds your billing and payment details.";
  }
  if (risk === "high") {
    return "May still have your name, email, billing info, or old files.";
  }
  if (risk === "medium") {
    return "Holds your email and basic account details.";
  }
  return "Limited data — mostly your email address.";
}

function deriveRisk(s: EvidenceService): EvidenceRisk {
  const sensitive = SENSITIVE.includes(s.category || "");
  const priority = s.cleanup_priority ?? 0;
  if (sensitive || s.activity_status === "active_paid" || priority >= 70) {
    return "high";
  }
  if (s.activity_status === "dormant" || ageYears(s.discovered_at) >= 3 || priority >= 30) {
    return "medium";
  }
  if (s.activity_status === "newsletter_only") return "low";
  return "low";
}

function deriveAction(s: EvidenceService, risk: EvidenceRisk): string {
  if (s.deletion_requested_at || s.privacy_action === "delete") return "Deletion sent";
  if (s.privacy_action === "keep") return "Kept";
  if (s.activity_status === "active_paid") return "Review or cancel";
  if (s.activity_status === "newsletter_only") return "Keep or unsubscribe";
  if (risk === "high") return "Review or delete";
  if (risk === "medium") return "Review account";
  return "Keep or ignore";
}

function deriveEvidenceLines(s: EvidenceService): string[] {
  const sig = s.intent_signals || ({} as ServiceSignals);
  const lines: string[] = [];
  if ((sig.signup_count || 0) > 0) lines.push("Welcome / sign-up email detected");
  if ((sig.security_count || 0) > 0) lines.push("Login or password-reset alert detected");
  if ((sig.transaction_count || 0) > 0) {
    lines.push(`${sig.transaction_count} purchase or receipt email${sig.transaction_count === 1 ? "" : "s"} found`);
  }
  if ((sig.newsletter_count || 0) > 0) {
    lines.push(`${sig.newsletter_count} newsletter${sig.newsletter_count === 1 ? "" : "s"} received`);
  }
  if ((sig.total || 0) > 0) {
    lines.push(`${sig.total} account-related email${sig.total === 1 ? "" : "s"} in total`);
  }
  if (lines.length === 0) {
    lines.push("Account-related email activity detected");
  }
  return lines;
}

function confidenceLabel(score?: number): string {
  const c = score ?? 0;
  if (c >= 70) return "High";
  if (c >= 40) return "Medium";
  return "Low";
}

export function deriveServiceEvidence(s: EvidenceService): ServiceEvidence {
  const risk = deriveRisk(s);
  const resolved = !!(s.deletion_requested_at || s.privacy_action === "delete" || s.privacy_action === "keep");
  return {
    reason: deriveReason(s),
    whyItMatters: deriveWhyItMatters(s, risk),
    risk,
    recommendedAction: deriveAction(s, risk),
    firstSeen: s.discovered_at,
    lastSeen: s.last_activity_at || s.last_transaction_at || s.last_security_at || null,
    evidenceLines: deriveEvidenceLines(s),
    confidenceLabel: confidenceLabel(s.confidence_score),
    category: s.category || "Other",
    resolved,
  };
}

const RISK_ORDER: Record<EvidenceRisk, number> = { high: 0, medium: 1, low: 2 };

/** Sort highest-risk first, then most recently seen. */
export function compareByRisk(
  a: { evidence: ServiceEvidence },
  b: { evidence: ServiceEvidence }
): number {
  const r = RISK_ORDER[a.evidence.risk] - RISK_ORDER[b.evidence.risk];
  if (r !== 0) return r;
  const ay = yearOf(a.evidence.lastSeen) || yearOf(a.evidence.firstSeen) || "0";
  const by = yearOf(b.evidence.lastSeen) || yearOf(b.evidence.firstSeen) || "0";
  return by.localeCompare(ay);
}

export const RISK_META: Record<EvidenceRisk, { label: string; dot: string; text: string }> = {
  high: { label: "High risk", dot: "bg-destructive", text: "text-destructive" },
  medium: { label: "Medium", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  low: { label: "Low", dot: "bg-green-600", text: "text-green-600 dark:text-green-400" },
};

export function displayYear(iso?: string | null): string {
  return yearOf(iso) || "—";
}
