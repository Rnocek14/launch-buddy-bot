/**
 * Broker-specific SEO enrichment for the Week 3 "test group" pages.
 *
 * These four brokers already receive impressions in Search Console (positions
 * ~30–70). Adding genuinely useful, broker-specific depth — removal difficulty,
 * timelines, data held, common problems, and next steps — is designed to move
 * them toward page 1–2 without touching the other 100+ broker pages.
 *
 * Keyed by the `slug` in the `data_brokers` table.
 */

export type RemovalDifficultyLevel = "Easy" | "Medium" | "Hard" | "Very Hard";

export interface RemovalTimelineStep {
  label: string;
  detail: string;
}

export interface CommonProblem {
  question: string;
  answer: string;
}

export interface BrokerEnrichment {
  /** Plain-language difficulty score shown on the page. */
  difficulty: RemovalDifficultyLevel;
  /** Short qualifier, e.g. "5–10 min" or "requires ID upload". */
  difficultyNote: string;
  /** Ordered timeline a user should expect after submitting a request. */
  timeline: RemovalTimelineStep[];
  /** Broker-specific data points this site typically publishes. */
  dataHeld: string[];
  /** Long-tail "why is this happening" questions users actually search. */
  commonProblems: CommonProblem[];
  /** How long until the broker typically re-lists removed records, e.g. "3–6 months". */
  relistWindow?: string;
  /** Broker-specific gotcha that trips people up or limits free/agent removal. */
  gotcha?: string;
  /** ISO date the opt-out steps were last hand-verified (E-E-A-T freshness signal). */
  lastVerified?: string;
}

export const brokerEnrichment: Record<string, BrokerEnrichment> = {
  truepeoplesearch: {
    difficulty: "Easy",
    difficultyNote: "5–10 min · no account or ID required",
    timeline: [
      { label: "Request submitted", detail: "Find your listing and submit the removal form." },
      { label: "Email confirmation", detail: "Click the verification link TruePeopleSearch emails you." },
      { label: "Listing removed", detail: "Your record typically disappears within 24–72 hours." },
      { label: "Recheck after 30 days", detail: "TruePeopleSearch frequently re-lists from fresh public records." },
    ],
    dataHeld: [
      "Full name and known aliases",
      "Current and previous home addresses",
      "Phone numbers (mobile and landline)",
      "Relatives and known associates",
      "Approximate age and date of birth range",
    ],
    commonProblems: [
      {
        question: "Why isn't my TruePeopleSearch record showing up when I search?",
        answer:
          "TruePeopleSearch indexes the same person under multiple address histories. Search by your name plus an old address or middle initial — a second profile often exists that the first removal missed.",
      },
      {
        question: "Why did my TruePeopleSearch listing come back after I removed it?",
        answer:
          "TruePeopleSearch refreshes from public records every 30–90 days, so a removed listing commonly reappears. You need to re-submit the opt-out each time it returns, or use ongoing monitoring.",
      },
      {
        question: "Why am I seeing multiple TruePeopleSearch profiles for myself?",
        answer:
          "Each unique address or phone number can generate a separate profile. Remove every variation individually — leaving one live means your data is still public.",
      },
    ],
    relistWindow: "3–6 months",
    gotcha:
      "Exposes an unusually broad record including marital, court, and property records, so partial removals leave a lot behind.",
    lastVerified: "2026-06-18",
  },

  mylife: {
    difficulty: "Hard",
    difficultyNote: "10–20 min · phone verification often required",
    timeline: [
      { label: "Request submitted", detail: "Call MyLife or submit the opt-out request for your profile." },
      { label: "Identity verified", detail: "MyLife often requires phone verification before processing." },
      { label: "Profile suppressed", detail: "Removal can take 7–10 business days to take effect." },
      { label: "Recheck after 30 days", detail: "Confirm your reputation profile and contact data are gone." },
    ],
    dataHeld: [
      "Reputation score and public 'reputation profile'",
      "Contact information (address, phone, email)",
      "Public records and background summary",
      "Relatives and associates",
      "Age, photos, and social profile links",
    ],
    commonProblems: [
      {
        question: "Why is my MyLife reputation profile still visible after opting out?",
        answer:
          "MyLife separates the reputation score from the underlying data record. You often have to request removal of both — a suppressed score can still leave your contact data and public records live.",
      },
      {
        question: "Why did my MyLife listing come back?",
        answer:
          "MyLife rebuilds profiles from public records and aggregated sources. Profiles routinely reappear within 30–90 days, which is why a one-time removal rarely stays permanent.",
      },
      {
        question: "Why does MyLife require a phone call to remove my data?",
        answer:
          "MyLife frequently routes opt-outs through phone verification to slow down removals. Keep a record of your request date and confirmation reference in case you need to escalate.",
      },
    ],
  },

  smartbackgroundchecks: {
    difficulty: "Medium",
    difficultyNote: "10–15 min · email confirmation required",
    timeline: [
      { label: "Request submitted", detail: "Locate your record and submit the opt-out form." },
      { label: "Email confirmation", detail: "Confirm via the verification link they send." },
      { label: "Listing removed", detail: "Records are typically suppressed within 24–48 hours." },
      { label: "Recheck after 30 days", detail: "SmartBackgroundChecks shares data with affiliate sites that may re-list." },
    ],
    dataHeld: [
      "Full name and aliases",
      "Address history",
      "Phone numbers and email addresses",
      "Relatives and associates",
      "Public records and background details",
    ],
    commonProblems: [
      {
        question: "Why isn't my SmartBackgroundChecks record showing up?",
        answer:
          "Their search can hide a profile behind a slightly different name spelling or an older address. Try alternate spellings and prior cities to surface every record tied to you.",
      },
      {
        question: "Why did my SmartBackgroundChecks listing come back?",
        answer:
          "SmartBackgroundChecks pulls from shared data pools used by affiliate people-search sites, so removed records often reappear within 30–90 days as those sources refresh.",
      },
      {
        question: "Why am I seeing multiple SmartBackgroundChecks profiles?",
        answer:
          "Different address and phone combinations generate separate records. Each one must be opted out individually to fully remove your exposure.",
      },
    ],
  },

  idtrue: {
    difficulty: "Medium",
    difficultyNote: "10–15 min · email confirmation required",
    timeline: [
      { label: "Request submitted", detail: "Search for your profile and submit the removal request." },
      { label: "Email confirmation", detail: "Verify the request through the link IDTrue emails you." },
      { label: "Listing removed", detail: "Profiles are usually removed within 24–72 hours." },
      { label: "Recheck after 30 days", detail: "IDTrue re-pulls public records, so listings can return." },
    ],
    dataHeld: [
      "Full name and aliases",
      "Current and historical addresses",
      "Phone numbers",
      "Relatives and associates",
      "Age and approximate date of birth",
    ],
    commonProblems: [
      {
        question: "Why isn't my IDTrue record showing up?",
        answer:
          "IDTrue can list you under multiple address histories. Search with an older address or middle name to find duplicate profiles a single removal can miss.",
      },
      {
        question: "Why did my IDTrue listing come back after removal?",
        answer:
          "IDTrue refreshes its database from public records on a 30–90 day cycle, so removed profiles frequently reappear unless you monitor and re-submit.",
      },
      {
        question: "Why am I seeing more than one IDTrue profile?",
        answer:
          "Each address or phone variation can create a separate listing. Remove every version to ensure your data isn't still public under another record.",
      },
    ],
  },
};
