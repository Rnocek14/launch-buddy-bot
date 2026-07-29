/**
 * State-by-state privacy rights — powers /privacy-rights/:state
 *
 * WHY THIS EXISTS
 * ---------------
 * "How do I delete my personal information in <state>" is asked in all fifty
 * states, and the honest answer is genuinely different depending on where you
 * live: one state has a free government tool that binds every registered
 * broker, nineteen give you a statutory right you exercise company by company,
 * and thirty have no comprehensive law at all. National removal services have
 * no reason to explain that distinction — they sell one plan everywhere.
 *
 * AVOIDING THIN DUPLICATES
 * ------------------------
 * Fifty near-identical pages would deserve to be ignored. These differ on real
 * data: which law applies, when it took effect, what it actually grants,
 * whether the state runs a broker registry, and whether there is a centralised
 * deletion route. Pages are grouped into tiers (see stateTier) that produce
 * materially different advice, and the shared "works everywhere" material is
 * kept deliberately short.
 *
 * ACCURACY
 * --------
 * Law names and effective dates were checked against published trackers in
 * July 2026 (see LAW_DATA_VERIFIED_ON). Nothing here is legal advice, and the
 * pages say so. Do not add a claim about a state's law that isn't in this
 * table — if it isn't verified, leave it out.
 */

export interface StateInfo {
  /** URL slug, e.g. "california". */
  slug: string;
  /** Full name, e.g. "California". */
  name: string;
  /** Two-letter postal code. */
  code: string;
  /** Comprehensive consumer privacy law, if the state has one in effect. */
  law?: {
    /** Full name of the statute. */
    name: string;
    /** Common abbreviation, e.g. "CCPA/CPRA". */
    abbrev: string;
    /** Month and year the law took effect. */
    effective: string;
    /** Anything materially unusual about this state's law. */
    note?: string;
  };
  /** State maintains a public data broker registry consumers can search. */
  brokerRegistry?: boolean;
  /** State runs a centralised, one-request deletion platform. California only. */
  centralizedDeletion?: boolean;
}

/** When the law names and effective dates below were last checked. */
export const LAW_DATA_VERIFIED_ON = "2026-07-29";

/**
 * The twenty states with comprehensive consumer privacy laws in effect, plus
 * the four that run data broker registries. Everything else is listed without
 * a law, which is itself the useful fact for residents of those states.
 */
export const STATES: StateInfo[] = [
  { slug: "alabama", name: "Alabama", code: "AL" },
  { slug: "alaska", name: "Alaska", code: "AK" },
  { slug: "arizona", name: "Arizona", code: "AZ" },
  { slug: "arkansas", name: "Arkansas", code: "AR" },
  {
    slug: "california", name: "California", code: "CA",
    law: {
      name: "California Consumer Privacy Act, as amended by the California Privacy Rights Act",
      abbrev: "CCPA/CPRA",
      effective: "January 2020 (CPRA amendments January 2023)",
      note: "The broadest consumer privacy law in the country, and the only one paired with a state-run deletion platform.",
    },
    brokerRegistry: true,
    centralizedDeletion: true,
  },
  {
    slug: "colorado", name: "Colorado", code: "CO",
    law: { name: "Colorado Privacy Act", abbrev: "CPA", effective: "July 2023", note: "Requires businesses to honour a universal opt-out signal such as Global Privacy Control." },
  },
  {
    slug: "connecticut", name: "Connecticut", code: "CT",
    law: { name: "Connecticut Data Privacy Act", abbrev: "CTDPA", effective: "July 2023" },
  },
  {
    slug: "delaware", name: "Delaware", code: "DE",
    law: { name: "Delaware Personal Data Privacy Act", abbrev: "DPDPA", effective: "January 2025" },
  },
  { slug: "district-of-columbia", name: "District of Columbia", code: "DC" },
  {
    slug: "florida", name: "Florida", code: "FL",
    law: {
      name: "Florida Digital Bill of Rights", abbrev: "FDBR", effective: "July 2024",
      note: "Applies only to very large companies, so it covers far fewer businesses than most state privacy laws.",
    },
  },
  { slug: "georgia", name: "Georgia", code: "GA" },
  { slug: "hawaii", name: "Hawaii", code: "HI" },
  { slug: "idaho", name: "Idaho", code: "ID" },
  { slug: "illinois", name: "Illinois", code: "IL" },
  {
    slug: "indiana", name: "Indiana", code: "IN",
    law: { name: "Indiana Consumer Data Protection Act", abbrev: "Indiana CDPA", effective: "January 2026" },
  },
  {
    slug: "iowa", name: "Iowa", code: "IA",
    law: { name: "Iowa Consumer Data Protection Act", abbrev: "Iowa CDPA", effective: "January 2025" },
  },
  { slug: "kansas", name: "Kansas", code: "KS" },
  {
    slug: "kentucky", name: "Kentucky", code: "KY",
    law: { name: "Kentucky Consumer Data Protection Act", abbrev: "KCDPA", effective: "January 2026" },
  },
  { slug: "louisiana", name: "Louisiana", code: "LA" },
  { slug: "maine", name: "Maine", code: "ME" },
  {
    slug: "maryland", name: "Maryland", code: "MD",
    law: {
      name: "Maryland Online Data Privacy Act", abbrev: "MODPA", effective: "October 2025",
      note: "One of the strictest in the country — it limits how much data a business may collect in the first place, not just what you can ask them to delete.",
    },
  },
  { slug: "massachusetts", name: "Massachusetts", code: "MA" },
  { slug: "michigan", name: "Michigan", code: "MI" },
  {
    slug: "minnesota", name: "Minnesota", code: "MN",
    law: {
      name: "Minnesota Consumer Data Privacy Act", abbrev: "Minnesota CDPA", effective: "July 2025",
      note: "Includes an unusual right to question the result of a profiling decision made about you.",
    },
  },
  { slug: "mississippi", name: "Mississippi", code: "MS" },
  { slug: "missouri", name: "Missouri", code: "MO" },
  {
    slug: "montana", name: "Montana", code: "MT",
    law: { name: "Montana Consumer Data Privacy Act", abbrev: "Montana CDPA", effective: "October 2024" },
  },
  {
    slug: "nebraska", name: "Nebraska", code: "NE",
    law: { name: "Nebraska Data Privacy Act", abbrev: "NDPA", effective: "January 2025" },
  },
  { slug: "nevada", name: "Nevada", code: "NV" },
  {
    slug: "new-hampshire", name: "New Hampshire", code: "NH",
    law: { name: "New Hampshire Data Privacy Act", abbrev: "NHDPA", effective: "January 2025" },
  },
  {
    slug: "new-jersey", name: "New Jersey", code: "NJ",
    law: { name: "New Jersey Data Privacy Act", abbrev: "NJDPA", effective: "January 2025" },
  },
  { slug: "new-mexico", name: "New Mexico", code: "NM" },
  { slug: "new-york", name: "New York", code: "NY" },
  { slug: "north-carolina", name: "North Carolina", code: "NC" },
  { slug: "north-dakota", name: "North Dakota", code: "ND" },
  { slug: "ohio", name: "Ohio", code: "OH" },
  { slug: "oklahoma", name: "Oklahoma", code: "OK" },
  {
    slug: "oregon", name: "Oregon", code: "OR",
    law: {
      name: "Oregon Consumer Privacy Act", abbrev: "OCPA", effective: "July 2024",
      note: "Uniquely lets you ask a business for the specific list of third parties it has disclosed your data to, rather than just the categories.",
    },
    brokerRegistry: true,
  },
  { slug: "pennsylvania", name: "Pennsylvania", code: "PA" },
  {
    slug: "rhode-island", name: "Rhode Island", code: "RI",
    law: { name: "Rhode Island Data Transparency and Privacy Protection Act", abbrev: "RIDTPPA", effective: "January 2026" },
  },
  { slug: "south-carolina", name: "South Carolina", code: "SC" },
  { slug: "south-dakota", name: "South Dakota", code: "SD" },
  {
    slug: "tennessee", name: "Tennessee", code: "TN",
    law: { name: "Tennessee Information Protection Act", abbrev: "TIPA", effective: "July 2025" },
  },
  {
    slug: "texas", name: "Texas", code: "TX",
    law: {
      name: "Texas Data Privacy and Security Act", abbrev: "TDPSA", effective: "July 2024",
      note: "Enforcement here has been unusually active compared with most states.",
    },
    brokerRegistry: true,
  },
  {
    slug: "utah", name: "Utah", code: "UT",
    law: {
      name: "Utah Consumer Privacy Act", abbrev: "UCPA", effective: "December 2023",
      note: "Generally considered the most business-friendly of the state privacy laws, with narrower consumer rights than most.",
    },
  },
  {
    slug: "vermont", name: "Vermont", code: "VT",
    brokerRegistry: true,
  },
  {
    slug: "virginia", name: "Virginia", code: "VA",
    law: { name: "Virginia Consumer Data Protection Act", abbrev: "VCDPA", effective: "January 2023", note: "The first comprehensive state privacy law to follow California's." },
  },
  { slug: "washington", name: "Washington", code: "WA" },
  { slug: "west-virginia", name: "West Virginia", code: "WV" },
  { slug: "wisconsin", name: "Wisconsin", code: "WI" },
  { slug: "wyoming", name: "Wyoming", code: "WY" },
];

export type StateTier =
  /** Comprehensive law + broker registry + a state-run deletion platform. */
  | "centralized"
  /** Comprehensive law and a searchable broker registry. */
  | "law-and-registry"
  /** Comprehensive law, no registry. */
  | "law-only"
  /** Broker registry but no comprehensive privacy law. */
  | "registry-only"
  /** Neither. */
  | "none";

/** The tier decides what advice the page actually gives. */
export function stateTier(s: StateInfo): StateTier {
  if (s.centralizedDeletion) return "centralized";
  if (s.law && s.brokerRegistry) return "law-and-registry";
  if (s.law) return "law-only";
  if (s.brokerRegistry) return "registry-only";
  return "none";
}

export const getState = (slug: string): StateInfo | undefined =>
  STATES.find((s) => s.slug === slug.toLowerCase());

export const STATES_WITH_LAWS = STATES.filter((s) => s.law);
export const STATES_WITHOUT_LAWS = STATES.filter((s) => !s.law);
export const REGISTRY_STATES = STATES.filter((s) => s.brokerRegistry);

/**
 * The headline answer for a state, used in the page intro and meta
 * description. Deliberately blunt — a resident of a state with no law is
 * better served by being told so than by a page that pads around it.
 */
export function stateVerdict(s: StateInfo): string {
  switch (stateTier(s)) {
    case "centralized":
      return `${s.name} residents have the strongest data-deletion rights in the country. One free request through the state's DROP platform obliges every registered data broker to delete your information — no other state offers this.`;
    case "law-and-registry":
      return `${s.name} gives you a statutory right to have your data deleted, and it publishes a register of data brokers so you can see who to send requests to. You still have to contact each company yourself — there is no single-request tool outside California.`;
    case "law-only":
      return `${s.name} gives you a statutory right to have your data deleted, and businesses covered by the law must respond. The catch is that you exercise it company by company: there is no central list and no single request that reaches everyone.`;
    case "registry-only":
      return `${s.name} does not have a comprehensive consumer privacy law, but it does require data brokers to register with the state — which at least tells you who is holding and selling personal information. Deletion requests still go to each broker individually.`;
    default:
      return `${s.name} does not yet have a comprehensive consumer privacy law, so you have no statewide right to demand deletion. That sounds worse than it is: every major data broker offers a free opt-out to anyone who asks, regardless of where they live, and those opt-outs are what actually removes your listings.`;
  }
}

/** Rights the comprehensive laws grant, in the order most people care about. */
export const COMMON_RIGHTS = [
  "The right to delete — ask a business to erase the personal data it holds about you.",
  "The right to know — ask what data a business has collected and who it shared it with.",
  "The right to correct — fix inaccurate information, which matters when a broker has you at the wrong address.",
  "The right to opt out of sale — stop a business selling or sharing your data for targeted advertising.",
  "The right to portability — get a copy of your data in a usable format.",
];

/**
 * Action steps for a state, varying by tier. Shared by the React page and
 * scripts/prerender.ts so crawler-visible HTML matches the hydrated page.
 */
export function stateSteps(s: StateInfo): RemovalStep[] {
  const steps: RemovalStep[] = [];

  if (s.centralizedDeletion) {
    steps.push({
      title: "Use DROP first — it is free and it binds every registered broker",
      body: `California runs the only centralised deletion platform in the country. One verified request through the state obliges every registered data broker to delete your information, at no cost. Registered brokers have been required to act on those requests since 1 August 2026. Nothing any paid service offers ${s.name} residents beats starting here.`,
    });
  }

  if (s.law) {
    steps.push({
      title: `Exercise your right to delete under the ${s.law.abbrev}`,
      body: `${s.name}'s ${s.law.name} took effect in ${s.law.effective} and gives you a statutory right to have covered businesses delete the personal data they hold about you. A request made under the law is not a favour you are asking — the business has a legal obligation to respond within a set window. Say plainly that you are exercising your right to delete under the ${s.law.abbrev}.`,
    });
  } else {
    steps.push({
      title: "Use the broker opt-outs, which do not depend on your state",
      body: `${s.name} has no comprehensive privacy law, but this matters less than it sounds. Every major people-search site offers a free opt-out to anyone who asks, regardless of residency, because it is easier for them than fielding complaints. Those opt-outs are what actually removes your listings, and they are available to you today.`,
    });
  }

  if (s.brokerRegistry) {
    steps.push({
      title: "Check the state's data broker register",
      body: `${s.name} is one of only four states that requires data brokers to register. The register is public, and it tells you which companies have declared they trade in personal information — including contact details for exercising your rights. It is the closest thing to a definitive list of who to send requests to.`,
    });
  }

  steps.push(
    {
      title: "Opt out of the highest-impact brokers by hand",
      body: "A small number of people-search sites account for most of what appears when someone searches your name. Clearing those changes your search results far more than working alphabetically through a long list. Every one of these opt-outs is free, and we publish step-by-step instructions.",
    },
    {
      title: "Use Google's own removal tool",
      body: "Separately from anything your state offers, Google will consider removing search results that expose your phone number, home address or email. It does not delete the underlying page, but it removes the result that causes most of the practical harm. It is free and takes a few minutes.",
    },
    {
      title: "Close the accounts that keep refilling the databases",
      body: "Removal is not permanent, and the main reason is that dormant online accounts get breached and re-seed the broker databases you just cleared. Closing old accounts is the part almost nobody does, and it is the difference between cleaning up once and staying clean.",
    },
    {
      title: "Re-check every few months",
      body: "Brokers rebuild from public records and from each other, so listings reappear. Whatever route you take — state platform, statutory requests, manual opt-outs or a paid service — treat it as maintenance rather than a one-time fix.",
    },
  );

  return steps;
}

/** Per-state FAQs. Answers vary by tier so these are not boilerplate. */
export function stateFaqs(s: StateInfo): Array<{ question: string; answer: string }> {
  const tier = stateTier(s);
  const faqs: Array<{ question: string; answer: string }> = [];

  faqs.push({
    question: `Does ${s.name} have a data privacy law?`,
    answer: s.law
      ? `Yes. The ${s.law.name} (${s.law.abbrev}) took effect in ${s.law.effective}. It gives residents rights to access, delete, correct and port their personal data, and to opt out of its sale.${s.law.note ? " " + s.law.note : ""}`
      : `Not a comprehensive one. ${s.name} has not enacted a general consumer privacy law, so there is no statewide right to demand deletion from any business that holds your data. Sector-specific rules still apply — for health and financial data in particular — and every major data broker offers a free opt-out regardless of where you live.`,
  });

  faqs.push({
    question: `How do I remove my personal information from the internet in ${s.name}?`,
    answer: tier === "centralized"
      ? `Start with the state's free DROP platform, which reaches every registered broker in one request. Then handle what DROP does not cover: the online accounts you have created, breach exposure, and any broker that never registered. That combination is what actually clears your name from search results.`
      : s.law
        ? `Send deletion requests under the ${s.law.abbrev} to businesses holding your data, and opt out of the major people-search sites directly — those free opt-outs are what changes your search results fastest. Then close dormant online accounts, which are what refill broker databases after you clear them.`
        : `Use the free opt-outs every major people-search site offers — they are open to anyone regardless of state. Then use Google's removal tool for results exposing your contact details, and close the dormant accounts that keep re-seeding broker databases.`,
  });

  if (tier === "centralized") {
    faqs.push({
      question: "Is DROP better than paying for a removal service?",
      answer: `For a Californian who only wants people-search listings gone, yes — it is free, it is legally binding, and it reaches more brokers than most paid plans. A paid service still adds something if you need faster turnaround than DROP's 45 and 90 day cycles, or if you want your online accounts and breach exposure handled, which DROP does not touch at all.`,
    });
  } else {
    faqs.push({
      question: `Can ${s.name} residents use California's DROP platform?`,
      answer: `No. DROP verifies California residency and is limited to Californians. No other state has built an equivalent, and none has committed to one. Residents elsewhere still have to send requests broker by broker — which is free, just slower.`,
    });
  }

  if (s.brokerRegistry) {
    faqs.push({
      question: `Does ${s.name} require data brokers to register?`,
      answer: `Yes. ${s.name} is one of only four states — with California, Texas, Oregon and Vermont — that maintains a data broker register. Companies trading in personal information must declare themselves, and the register is public, so you can see who they are and how to contact them about your data.`,
    });
  }

  faqs.push({
    question: `Is it free to remove my data in ${s.name}?`,
    answer: `Yes. Every data broker opt-out is free — no broker may charge you to be removed, and none of the routes described here costs anything. What a paid service sells is the labour and the repetition, not access. If you are willing to work through the list yourself a couple of times a year, you can get most of the benefit for nothing.`,
  });

  return faqs;
}

/** Steps shape, mirrored from the data-type guides for template reuse. */
export interface RemovalStep {
  title: string;
  body: string;
}
