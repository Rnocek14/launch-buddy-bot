// Competitor comparison data — powers /vs/:competitor pages.
// Extracted into its own module so the browserless prerender script
// (scripts/prerender.ts) can import the same data the page renders.

export interface CompetitorData {
  slug: string;
  name: string;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  pros: string[];
  cons: string[];
  whyFf: string[];
  bestFor: string;
}

export const COMPETITORS: Record<string, CompetitorData> = {
  deleteme: {
    slug: "deleteme",
    name: "DeleteMe",
    tagline: "The original people-search removal service",
    monthlyPrice: "$10.75/mo (annual)",
    annualPrice: "$129/yr",
    pros: [
      "Established brand (since 2010)",
      "Manual human reviewers",
      "Removes from ~30 broker sites",
    ],
    cons: [
      "Doesn't scan your inbox for forgotten accounts",
      "No breach monitoring built in",
      "Only covers data brokers — misses 90% of your footprint",
      "Manual reports take time to generate",
    ],
    whyFf: [
      "Scans your Gmail/Outlook inbox to find every account tied to your email",
      "Includes HaveIBeenPwned breach check + monthly rescans",
      "Covers data brokers AND mailing lists AND old accounts",
      "$79/yr vs DeleteMe's $129 — and broader coverage",
    ],
    bestFor:
      "DeleteMe is best if you only care about US people-search sites. Footprint Finder is best if you want to clean up your entire digital footprint — accounts, breaches, and brokers.",
  },
  incogni: {
    slug: "incogni",
    name: "Incogni",
    tagline: "Surfshark's data-broker removal service",
    monthlyPrice: "$15.49/mo",
    annualPrice: "$95.40/yr",
    pros: [
      "Backed by Surfshark (trusted VPN brand)",
      "Removes from 180+ broker sites",
      "Automated, hands-off",
    ],
    cons: [
      "No inbox scan — can't find your forgotten accounts",
      "No breach alerts",
      "Doesn't help you delete old subscriptions or services",
      "Limited transparency on what was actually removed",
    ],
    whyFf: [
      "Inbox scan reveals where you actually have accounts (Incogni can't see this)",
      "Breach monitoring + per-scan alerts when new exposures appear",
      "Cheaper at $79/yr with broader coverage (brokers + accounts + breaches)",
      "Bring-your-own-data — we don't share your info with third parties",
    ],
    bestFor:
      "Incogni is great if you only want broker removal on autopilot. Footprint Finder is the right choice if you want to see and clean up your full digital exposure, not just broker listings.",
  },
  optery: {
    slug: "optery",
    name: "Optery",
    tagline: "Data-broker removal with a free exposure report",
    monthlyPrice: "$3.99–$24.99/mo",
    annualPrice: "$39–$249/yr",
    pros: [
      "Free exposure report shows where you appear",
      "Multiple tier options",
      "Strong broker coverage at higher tiers",
    ],
    cons: [
      "Cheapest tier only covers ~25 brokers",
      "Doesn't scan your inbox",
      "No built-in breach monitoring",
      "Pricing gets expensive fast for full coverage",
    ],
    whyFf: [
      "Single $79/yr plan = full coverage, no upsells",
      "Inbox-driven discovery finds what Optery can't see",
      "Unified view of accounts + brokers + breaches in one dashboard",
      "Per-scan email alerts the moment something new shows up",
    ],
    bestFor:
      "Optery's free report is useful for a quick check. For ongoing protection across brokers AND your accounts AND breaches, Footprint Finder is more complete and cheaper than Optery's mid-tier plans.",
  },
  kanary: {
    slug: "kanary",
    name: "Kanary",
    tagline: "Reputation-focused removal service",
    monthlyPrice: "$14.99/mo",
    annualPrice: "$179.88/yr",
    pros: [
      "Removes from ~75 broker sites",
      "Includes reputation/Google search scanning",
      "Court-record removal at higher tiers",
    ],
    cons: [
      "Expensive vs alternatives ($179/yr base)",
      "No email inbox scan",
      "No breach database integration",
      "Reputation features overlap with what's free in Google",
    ],
    whyFf: [
      "Less than half the price ($79 vs $179)",
      "Inbox scan finds the accounts Kanary doesn't know exist",
      "Breach monitoring through HaveIBeenPwned partnership",
      "Real-time alerts when new exposures appear",
    ],
    bestFor:
      "Kanary is built for reputation cleanup. Footprint Finder is built for digital footprint cleanup — finding and removing the accounts and listings you've forgotten about.",
  },
  mine: {
    slug: "mine",
    name: "Mine",
    tagline: "Free inbox-based privacy discovery (Israeli startup)",
    monthlyPrice: "Free / $4.99/mo Pro",
    annualPrice: "$59.88/yr Pro",
    pros: [
      "Free tier scans your inbox",
      "Pretty UI",
      "GDPR-focused",
    ],
    cons: [
      "Doesn't actually remove broker listings",
      "Sends generic GDPR requests with low response rates",
      "No breach monitoring",
      "Free tier is limited; Pro upsells aggressively",
    ],
    whyFf: [
      "Real broker removal (not just emails to companies)",
      "HaveIBeenPwned-powered breach checks",
      "Higher response rates with US/EU-specific templates",
      "Single price, no upsells — $79/yr covers everything",
    ],
    bestFor:
      "Mine is fine for a one-time GDPR cleanup. Footprint Finder gives you broker removal + breach alerts + monthly rescans — a complete privacy ops layer rather than a one-shot tool.",
  },
};
