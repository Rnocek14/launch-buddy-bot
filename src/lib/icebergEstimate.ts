/**
 * Personalized "iceberg" estimate for what's hidden beneath a free scan.
 *
 * Methodology (transparent on purpose — we want to defend these numbers):
 *  - Base: average US adult holds ~130-150 online accounts (Dashlane 2022, NordPass 2023).
 *    We use a conservative 90 as the baseline expected accounts tied to a primary email.
 *  - Email domain age proxy: gmail.com / yahoo.com / hotmail.com → likely older inbox → +30%.
 *    Newer providers (proton, fastmail, icloud) → -15%.
 *  - Breach count signal: each public breach implies the user signs up for things → +12% per breach (capped at +60%).
 *  - Broker baseline: ~12 broker sites publish data on the average US adult (DeleteMe 2024 transparency report).
 *    We don't personalize this beyond a fixed range.
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

export function estimateIceberg(email: string, breachCount: number): IcebergEstimate {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  let multiplier = 1.0;
  const reasons: string[] = [];

  if (OLD_INBOX_DOMAINS.has(domain)) {
    multiplier *= 1.3;
    reasons.push(`${domain} is typically a long-lived inbox`);
  } else if (NEWER_INBOX_DOMAINS.has(domain)) {
    multiplier *= 0.85;
    reasons.push(`${domain} users tend to be more privacy-aware`);
  } else if (domain) {
    reasons.push(`custom domain (${domain})`);
  }

  const breachBoost = Math.min(breachCount * 0.12, 0.6);
  multiplier *= 1 + breachBoost;
  if (breachCount > 0) {
    reasons.push(`${breachCount} known breach${breachCount === 1 ? "" : "es"} suggests active signup history`);
  }

  const baseAccounts = 90;
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
    reasoning: reasons.join(" · "),
  };
}
