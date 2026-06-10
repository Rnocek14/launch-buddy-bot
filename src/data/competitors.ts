// Competitor comparison data — powers /vs/:competitor pages.
// Extracted into its own module so the browserless prerender script
// (scripts/prerender.ts) can import the same data the page renders.

export interface CompetitorFeatures {
  /** Scans your email inbox to discover accounts tied to your address */
  inboxScan: boolean;
  /** Removes you from data broker / people-search sites */
  brokerRemoval: boolean;
  /** Built-in data-breach monitoring (e.g. HaveIBeenPwned) */
  breachMonitoring: boolean;
  /** Sends GDPR / CCPA legal data requests on your behalf */
  gdprCcpaRequests: boolean;
  /** Helps you delete old accounts & subscriptions, not just broker listings */
  accountDeletionHelp: boolean;
  /** Continuous re-scans and alerts when new exposures appear */
  ongoingMonitoring: boolean;
}

export interface CompetitorData {
  slug: string;
  name: string;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  /** Plain-English broker coverage claim, e.g. "180+ broker sites" */
  brokerCoverage: string;
  features: CompetitorFeatures;
  pros: string[];
  cons: string[];
  whyFf: string[];
  bestFor: string;
}

/** Footprint Finder's own capabilities — used for the side-by-side matrix. */
export const FOOTPRINT_FINDER_FEATURES: CompetitorFeatures = {
  inboxScan: true,
  brokerRemoval: true,
  breachMonitoring: true,
  gdprCcpaRequests: true,
  accountDeletionHelp: true,
  ongoingMonitoring: true,
};

export const FOOTPRINT_FINDER_BROKER_COVERAGE = "45+ broker sites";

export const COMPETITORS: Record<string, CompetitorData> = {
  deleteme: {
    slug: "deleteme",
    name: "DeleteMe",
    tagline: "The original people-search removal service",
    monthlyPrice: "$10.75/mo (annual)",
    annualPrice: "$129/yr",
    brokerCoverage: "~30 broker sites",
    features: {
      inboxScan: false,
      brokerRemoval: true,
      breachMonitoring: false,
      gdprCcpaRequests: false,
      accountDeletionHelp: false,
      ongoingMonitoring: true,
    },
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
    brokerCoverage: "180+ broker sites",
    features: {
      inboxScan: false,
      brokerRemoval: true,
      breachMonitoring: false,
      gdprCcpaRequests: true,
      accountDeletionHelp: false,
      ongoingMonitoring: true,
    },
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
    brokerCoverage: "25–320+ brokers (by tier)",
    features: {
      inboxScan: false,
      brokerRemoval: true,
      breachMonitoring: false,
      gdprCcpaRequests: false,
      accountDeletionHelp: false,
      ongoingMonitoring: true,
    },
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
    brokerCoverage: "~75 broker sites",
    features: {
      inboxScan: false,
      brokerRemoval: true,
      breachMonitoring: false,
      gdprCcpaRequests: false,
      accountDeletionHelp: false,
      ongoingMonitoring: true,
    },
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
  onerep: {
    slug: "onerep",
    name: "OneRep",
    tagline: "Automated data-broker removal across 200+ sites",
    monthlyPrice: "$14.95/mo",
    annualPrice: "$99.96/yr",
    brokerCoverage: "200+ broker sites",
    features: {
      inboxScan: false,
      brokerRemoval: true,
      breachMonitoring: false,
      gdprCcpaRequests: false,
      accountDeletionHelp: false,
      ongoingMonitoring: true,
    },
    pros: [
      "Scans and removes from 200+ broker sites",
      "Automated monthly re-scans",
      "Clean dashboard with removal progress",
    ],
    cons: [
      "No inbox scan — can't find forgotten accounts",
      "No data-breach monitoring",
      "Only covers data brokers, not your wider footprint",
      "Past ownership controversy raised trust questions",
    ],
    whyFf: [
      "Inbox scan reveals the accounts OneRep can't see",
      "HaveIBeenPwned breach monitoring + per-scan alerts",
      "Cheaper at $79/yr with broader coverage",
      "Bring-your-own-data — we don't resell your info",
    ],
    bestFor:
      "OneRep is solid for hands-off broker removal. Footprint Finder is the better fit if you want your accounts, breaches and broker listings cleaned up in one place.",
  },
  privacybee: {
    slug: "privacybee",
    name: "Privacy Bee",
    tagline: "Broad data-broker removal with proactive opt-outs",
    monthlyPrice: "~$16.58/mo (annual)",
    annualPrice: "$197/yr",
    brokerCoverage: "150+ broker sites",
    features: {
      inboxScan: false,
      brokerRemoval: true,
      breachMonitoring: false,
      gdprCcpaRequests: true,
      accountDeletionHelp: false,
      ongoingMonitoring: true,
    },
    pros: [
      "Large broker and company coverage (150+ sites)",
      "Proactive opt-outs before your data spreads",
      "Sends GDPR/CCPA-style requests to companies",
    ],
    cons: [
      "Expensive at ~$197/yr",
      "No email inbox scan to find forgotten accounts",
      "No built-in breach monitoring",
      "Doesn't help you delete old accounts or subscriptions",
    ],
    whyFf: [
      "Inbox scan finds every account tied to your email — Privacy Bee can't see this",
      "HaveIBeenPwned breach monitoring + per-scan alerts included",
      "Less than half the price at $79/yr",
      "Accounts, brokers and breaches unified in one dashboard",
    ],
    bestFor:
      "Privacy Bee is a fit if you want broad, proactive broker opt-outs and don't mind the price. Footprint Finder is better if you want to discover your inbox-based accounts and monitor breaches too — at a much lower cost.",
  },
  easyoptouts: {
    slug: "easyoptouts",
    name: "EasyOptOuts",
    tagline: "Low-cost, no-frills automated broker removal",
    monthlyPrice: "~$1.99/mo (annual)",
    annualPrice: "$19.99/yr",
    brokerCoverage: "145+ broker sites",
    features: {
      inboxScan: false,
      brokerRemoval: true,
      breachMonitoring: false,
      gdprCcpaRequests: false,
      accountDeletionHelp: false,
      ongoingMonitoring: true,
    },
    pros: [
      "Very cheap at $19.99/yr",
      "Covers 145+ broker sites automatically",
      "Re-scans every few months",
    ],
    cons: [
      "Bare-bones — no dashboard or detailed reporting",
      "No email inbox scan",
      "No breach monitoring",
      "Doesn't help with account deletion or legal requests",
    ],
    whyFf: [
      "Inbox scan finds accounts EasyOptOuts can't see",
      "Breach monitoring + alerts when new exposures appear",
      "Full dashboard with what was found and removed",
      "Account-deletion help, not just broker opt-outs",
    ],
    bestFor:
      "EasyOptOuts is the budget pick if you only want cheap, hands-off broker removal. Footprint Finder costs more but covers your inbox accounts, breaches and ongoing monitoring — a complete privacy layer rather than broker-only opt-outs.",
  },
  aura: {
    slug: "aura",
    name: "Aura",
    tagline: "All-in-one identity theft protection suite",
    monthlyPrice: "$12/mo (annual)",
    annualPrice: "$144/yr",
    brokerCoverage: "Limited broker removal (add-on)",
    features: {
      inboxScan: false,
      brokerRemoval: true,
      breachMonitoring: true,
      gdprCcpaRequests: false,
      accountDeletionHelp: false,
      ongoingMonitoring: true,
    },
    pros: [
      "Bundles identity theft insurance ($1M)",
      "Includes antivirus, VPN and password manager",
      "Credit monitoring across all three bureaus",
    ],
    cons: [
      "Data-broker removal is a minor add-on, not the focus",
      "Expensive vs dedicated removal tools",
      "No inbox scan to find forgotten accounts",
      "Lots of features you may never use",
    ],
    whyFf: [
      "Purpose-built for footprint discovery and removal, not a bundle",
      "Inbox scan finds every account tied to your email",
      "Far cheaper at $79/yr if removal is your goal",
      "Focused dashboard — no feature bloat",
    ],
    bestFor:
      "Aura is best if you want an all-in-one identity, credit and security bundle. Footprint Finder is best if your priority is actually finding and removing your exposed data.",
  },
  mine: {
    slug: "mine",
    name: "Mine",
    tagline: "Free inbox-based privacy discovery (Israeli startup)",
    monthlyPrice: "Free / $4.99/mo Pro",
    annualPrice: "$59.88/yr Pro",
    brokerCoverage: "No direct broker removal",
    features: {
      inboxScan: true,
      brokerRemoval: false,
      breachMonitoring: false,
      gdprCcpaRequests: true,
      accountDeletionHelp: true,
      ongoingMonitoring: false,
    },
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
