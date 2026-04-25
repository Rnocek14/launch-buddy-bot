/**
 * Personalized "iceberg" estimate for what's hidden beneath a free scan.
 *
 * Methodology (transparent on purpose — we want to defend these numbers):
 *  - Anchor to observed signal, not a fixed baseline. Estimates scale with
 *    what we actually saw (breaches, discovered accounts) so low-signal users
 *    get conservative numbers and high-signal users get justified larger ones.
 *  - Email domain age proxy: gmail.com / yahoo.com / hotmail.com → likely older inbox → +30%.
 *    Newer providers (proton, fastmail, icloud) → -15%.
 *  - Breach count signal: each public breach implies broader signup history (×8 accounts each).
 *  - Broker baseline: ~12 broker sites publish data on the average US adult (DeleteMe 2024).
 */

export interface IcebergEstimate {
  hiddenAccounts: number;
  hiddenAccountsRange: [number, number];
  brokerSites: number;
  brokerRange: [number, number];
  trackingDomains: number;
  reasoning: string;
}

const OLD_INBOX_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "aol.com",
  "msn.com",
  "live.com",
  "outlook.com",
]);

const NEWER_INBOX_DOMAINS = new Set([
  "protonmail.com",
  "proton.me",
  "fastmail.com",
  "icloud.com",
  "me.com",
  "duck.com",
  "tutanota.com",
]);

export function estimateIceberg(
  email: string,
  breachCount: number,
  discoveredAccounts: number = 0,
): IcebergEstimate {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  let multiplier = 1.0;

  if (OLD_INBOX_DOMAINS.has(domain)) {
    multiplier *= 1.3;
  } else if (NEWER_INBOX_DOMAINS.has(domain)) {
    multiplier *= 0.85;
  }

  const breachBoost = Math.min(breachCount * 0.12, 0.6);
  multiplier *= 1 + breachBoost;

  // Anchor to observed signal — not arbitrary baseline.
  // - Real findings get doubled (each surfaced account implies more we haven't seen)
  // - Each breach implies ~8 related accounts in that signup era
  // - Floor of 15 prevents zero-signal users from seeing nothing
  const baseAccounts = Math.max(
    discoveredAccounts * 2,
    breachCount * 8,
    15,
  );

  const hiddenAccounts = Math.round(baseAccounts * multiplier);
  const hiddenAccountsRange: [number, number] = [
    Math.round(hiddenAccounts * 0.7),
    Math.round(hiddenAccounts * 1.3),
  ];

  // Brokers: roughly fixed by jurisdiction; modestly bumped if breaches suggest broad presence
  const brokerSites = breachCount >= 3 ? 18 : 12;
  const brokerRange: [number, number] = [
    Math.max(6, brokerSites - 4),
    brokerSites + 6,
  ];

  // Tracking domains in inbox (newsletters, ad networks reaching the address)
  const trackingDomains = Math.round(hiddenAccounts * 0.45);

  return {
    hiddenAccounts,
    hiddenAccountsRange,
    brokerSites,
    brokerRange,
    trackingDomains,
    reasoning: "your email history, breach exposure, and typical account patterns",
  };
}
