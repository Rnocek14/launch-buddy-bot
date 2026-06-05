/**
 * Remediation model — normalizes every scan data type (brokers, accounts,
 * breaches, public mentions) into a single ranked "Needs Attention" list.
 *
 * Pure functions only. No network, no React. Reuses existing status helpers.
 */

import type { BrokerResultState } from "@/lib/brokerResultState";
import { brokerResultPriority } from "@/lib/brokerResultState";
import type { ActivityStatus } from "@/lib/serviceSignals";

export type RemediationKind = "broker" | "account" | "breach" | "mention";

/** Severity tiers drive both ranking and the dot color. */
export type RemediationSeverity = "exposed" | "possible" | "breach" | "review" | "info";

export type RemediationState =
  | "action_needed" // user must act
  | "in_progress" // removal started / awaiting confirmation
  | "done"; // resolved (opted out / deletion sent / kept)

/** A single unified row in the Needs Attention list. */
export interface RemediationItem {
  id: string;
  kind: RemediationKind;
  title: string;
  /** One plain-language line: what is exposed / why it matters. */
  detail: string;
  severity: RemediationSeverity;
  state: RemediationState;
  /** Lower = more urgent. Computed by rank(). */
  rank: number;
  /** Original source object so the row's action slot can call the right handler. */
  payload: any;
}

// ---------------------------------------------------------------------------
// Source-shaped inputs (mirror what the dashboard already loads)
// ---------------------------------------------------------------------------

export interface BrokerSource {
  id: string;
  broker_name: string;
  opt_out_url: string | null;
  broker_website: string;
  state: BrokerResultState;
  extracted_data: {
    addresses?: string[];
    phone_numbers?: string[];
    relatives?: string[];
  } | null;
  opt_out_started_at: string | null;
  opted_out_at: string | null;
}

export interface AccountSource {
  id: string;
  name: string;
  logo_url?: string;
  homepage_url?: string;
  domain: string;
  category?: string;
  discovered_at: string;
  contact_status?: "verified" | "ai_discovered" | "needs_discovery";
  privacy_action?: "keep" | "delete" | "do_not_sell" | null;
  deletion_requested_at?: string;
  activity_status?: ActivityStatus;
  cleanup_priority?: number;
}

export interface BreachSource {
  total: number;
  critical: number;
  high: number;
  last_scan: string | null;
}

export interface MentionSource {
  domain: string;
  email_from: string;
  occurrence_count: number;
}

// ---------------------------------------------------------------------------
// Severity → base rank (lower is more urgent)
// ---------------------------------------------------------------------------

const SEVERITY_BASE: Record<RemediationSeverity, number> = {
  exposed: 0,
  possible: 100,
  breach: 200,
  review: 300,
  info: 400,
};

/** Plain-language label + dot color token for a severity. */
export const SEVERITY_META: Record<
  RemediationSeverity,
  { label: string; dot: string }
> = {
  exposed: { label: "Exposed", dot: "bg-destructive" },
  possible: { label: "Possible match", dot: "bg-amber-500" },
  breach: { label: "In a breach", dot: "bg-destructive" },
  review: { label: "Worth reviewing", dot: "bg-amber-500" },
  info: { label: "Possible account", dot: "bg-muted-foreground" },
};

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function brokerDataSummary(b: BrokerSource): string {
  const parts: string[] = [];
  if (b.extracted_data?.addresses?.length) parts.push("home address");
  if (b.extracted_data?.phone_numbers?.length) parts.push("phone number");
  if (b.extracted_data?.relatives?.length) parts.push("relatives");
  if (parts.length === 0) return "Your personal info is listed on this site";
  if (parts.length === 1) return `Showing your ${parts[0]}`;
  const last = parts.pop();
  return `Showing your ${parts.join(", ")} and ${last}`;
}

export function brokerToItem(b: BrokerSource): RemediationItem | null {
  // Only surface actionable / in-progress brokers in the active list.
  if (b.state === "clear" || b.state === "error") return null;

  let state: RemediationState = "action_needed";
  if (b.state === "opted_out") state = "done";
  else if (b.state === "removal_started") state = "in_progress";

  const severity: RemediationSeverity =
    b.state === "possible" ? "possible" : "exposed";

  return {
    id: `broker-${b.id}`,
    kind: "broker",
    title: b.broker_name,
    detail:
      state === "done"
        ? "Removal requested — info should drop off soon"
        : state === "in_progress"
        ? "Removal in progress — confirm when it's gone"
        : brokerDataSummary(b),
    severity,
    state,
    rank: SEVERITY_BASE[severity] + brokerResultPriority(b.state),
    payload: b,
  };
}

function accountAgeYears(discoveredAt: string): number {
  return (
    (Date.now() - new Date(discoveredAt).getTime()) /
    (1000 * 60 * 60 * 24 * 365)
  );
}

/** Accounts only enter the list if they look risky / worth cleaning up. */
export function accountToItem(a: AccountSource): RemediationItem | null {
  // Already deleted → goes to the Done group.
  if (a.deletion_requested_at || a.privacy_action === "delete") {
    return {
      id: `account-${a.id}`,
      kind: "account",
      title: a.name,
      detail: "Deletion request sent",
      severity: "review",
      state: "done",
      rank: SEVERITY_BASE.review,
      payload: a,
    };
  }
  // Explicitly kept → not in the active list.
  if (a.privacy_action === "keep" || a.privacy_action === "do_not_sell") return null;

  const years = accountAgeYears(a.discovered_at);
  const sensitive = ["Finance", "Banking", "Healthcare", "Government"].includes(
    a.category || ""
  );
  const isDormant = a.activity_status === "dormant";
  const isPaid = a.activity_status === "active_paid";
  const isOld = years >= 3;

  // Decide whether this account deserves attention.
  const worth = isPaid || isDormant || isOld || sensitive;
  if (!worth) return null;

  let detail: string;
  let severity: RemediationSeverity = "review";
  let bump = 0;
  if (isPaid) {
    detail = "Active paid subscription — cancel or remove your data";
    bump = 0;
  } else if (sensitive) {
    detail = "Sensitive account that may store financial or personal data";
    bump = 5;
  } else if (isOld) {
    detail = `Found over ${Math.floor(years)} years ago — old accounts hold stale data`;
    bump = 10;
  } else {
    detail = "Looks unused — worth removing to shrink your footprint";
    bump = 20;
  }

  const needsContact = a.contact_status === "needs_discovery";
  return {
    id: `account-${a.id}`,
    kind: "account",
    title: a.name,
    detail: needsContact ? `${detail}` : detail,
    severity,
    state: "action_needed",
    rank: SEVERITY_BASE[severity] + bump,
    payload: a,
  };
}

export function breachToItem(b: BreachSource): RemediationItem | null {
  if (!b.last_scan || b.total <= 0) return null;
  const serious = b.critical + b.high;
  return {
    id: "breach-summary",
    kind: "breach",
    title:
      b.total === 1 ? "Your email was in a data breach" : `Your email was in ${b.total} data breaches`,
    detail:
      serious > 0
        ? `${serious} are high severity — change those passwords`
        : "Review the affected sites and update passwords",
    severity: "breach",
    state: "action_needed",
    rank: SEVERITY_BASE.breach,
    payload: b,
  };
}

// ---------------------------------------------------------------------------
// Account grouping — one calm "Accounts found" card instead of N rows
// ---------------------------------------------------------------------------

export interface ReviewAccount {
  account: AccountSource;
  item: RemediationItem;
}

export interface AccountGroup {
  /** Every active (not-deleted) account discovered in email. */
  total: number;
  /** Risk-ranked accounts that deserve a look. */
  needsReview: ReviewAccount[];
  /** The rest — look okay, kept accessible but not noisy. */
  other: AccountSource[];
  /** Accounts already sent for deletion. */
  done: number;
  /** Overall risk level for the card badge. */
  level: "review" | "okay";
}

/**
 * Splits discovered accounts into a "needs review" set (using the same
 * risk rules as accountToItem) and an "other" set, so the dashboard can
 * show a single grouped card rather than flooding the list.
 */
export function classifyAccounts(accounts: AccountSource[]): AccountGroup {
  const needsReview: ReviewAccount[] = [];
  const other: AccountSource[] = [];
  let done = 0;

  for (const a of accounts) {
    const item = accountToItem(a);
    if (item && item.state === "done") {
      done++;
      continue;
    }
    if (item && item.state === "action_needed") {
      needsReview.push({ account: a, item });
    } else {
      other.push(a);
    }
  }

  needsReview.sort(
    (x, y) => x.item.rank - y.item.rank || x.account.name.localeCompare(y.account.name)
  );
  other.sort((x, y) => x.name.localeCompare(y.name));

  return {
    total: needsReview.length + other.length,
    needsReview,
    other,
    done,
    level: needsReview.length > 0 ? "review" : "okay",
  };
}

export function mentionToItem(m: MentionSource): RemediationItem | null {
  return {
    id: `mention-${m.domain}`,
    kind: "mention",
    title: m.domain,
    detail: "We saw this in your inbox — is it an account of yours?",
    severity: "info",
    state: "action_needed",
    rank: SEVERITY_BASE.info,
    payload: m,
  };
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

export interface BuildInput {
  brokers?: BrokerSource[];
  accounts?: AccountSource[];
  breaches?: BreachSource | null;
  mentions?: MentionSource[];
}

export function buildRemediationItems(input: BuildInput): RemediationItem[] {
  const items: RemediationItem[] = [];
  (input.brokers || []).forEach((b) => {
    const it = brokerToItem(b);
    if (it) items.push(it);
  });
  (input.accounts || []).forEach((a) => {
    const it = accountToItem(a);
    if (it) items.push(it);
  });
  if (input.breaches) {
    const it = breachToItem(input.breaches);
    if (it) items.push(it);
  }
  // Cap mentions so the lowest-priority noise never floods the list.
  (input.mentions || []).slice(0, 5).forEach((m) => {
    const it = mentionToItem(m);
    if (it) items.push(it);
  });

  items.sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title));
  return items;
}

export function splitItems(items: RemediationItem[]) {
  const active = items.filter((i) => i.state !== "done");
  const inProgress = items.filter((i) => i.state === "in_progress");
  const done = items.filter((i) => i.state === "done");
  return { active, inProgress, done };
}

// ---------------------------------------------------------------------------
// Hero headline derivation (reflects the #1 actionable item)
// ---------------------------------------------------------------------------

export interface HeroHeadline {
  /** Short, emotionally clear sentence. */
  problem: string;
  /** CTA button label. */
  cta: string;
  /** Whether there is anything to act on. */
  hasWork: boolean;
}

export function deriveHeadline(
  items: RemediationItem[],
  checkedCount: number
): HeroHeadline {
  const active = items.filter((i) => i.state === "action_needed");

  if (active.length === 0) {
    return {
      problem: "You're in good shape — nothing needs your attention right now.",
      cta: "Review my footprint",
      hasWork: false,
    };
  }

  const brokers = active.filter((i) => i.kind === "broker");
  if (brokers.length > 0) {
    const n = brokers.length;
    return {
      problem:
        n === 1
          ? "1 people-search site is publishing your personal information."
          : `${n} people-search sites are publishing your personal information.`,
      cta: "Start removing these",
      hasWork: true,
    };
  }

  const breach = active.find((i) => i.kind === "breach");
  if (breach) {
    return { problem: breach.title + ".", cta: "Secure my accounts", hasWork: true };
  }

  const accounts = active.filter((i) => i.kind === "account");
  if (accounts.length > 0) {
    const n = accounts.length;
    return {
      problem:
        n === 1
          ? "1 account is worth cleaning up to shrink your footprint."
          : `${n} accounts are worth cleaning up to shrink your footprint.`,
      cta: "Start cleaning up",
      hasWork: true,
    };
  }

  return {
    problem: `${active.length} possible accounts are worth a quick look.`,
    cta: "Review these",
    hasWork: true,
  };
}
