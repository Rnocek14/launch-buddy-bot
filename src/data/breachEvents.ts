// Breach-reaction landing pages. Each entry powers /breach/:slug
// Add a new entry the same day a breach hits the news, then link it from
// the founder reaction video. No code changes required — data only.
//
// Accuracy rule (compliance): only list breaches that are publicly reported.
// Keep "whatLeaked" to data classes that were actually confirmed exposed.

export type BreachEvent = {
  slug: string;
  company: string;
  date: string; // e.g. "April 2024" — human-readable, shown in copy
  isoDate: string; // YYYY-MM-DD for schema datePublished
  affected: string; // human-readable, e.g. "2.9 billion records"
  summary: string; // one-paragraph plain-English explanation
  whatLeaked: string[]; // confirmed data classes
  whatToDo: string[]; // concrete user actions
  source?: { label: string; url: string }; // reputable public report
};

export const BREACH_EVENTS: BreachEvent[] = [
  {
    slug: "national-public-data",
    company: "National Public Data",
    date: "August 2024",
    isoDate: "2024-08-01",
    affected: "billions of records",
    summary:
      "A background-check data broker known as National Public Data was reported to have leaked a massive file containing names, addresses, and Social Security numbers compiled from public and non-public sources — most affected people never signed up for the service.",
    whatLeaked: [
      "Full names",
      "Current and past home addresses",
      "Social Security numbers (in many records)",
      "Phone numbers",
    ],
    whatToDo: [
      "Check whether your email and details appear in known breaches.",
      "Freeze your credit at all three bureaus (Equifax, Experian, TransUnion) — it's free.",
      "Watch for targeted phishing that references your real address.",
      "Opt out of the data brokers that resell this kind of profile.",
    ],
    source: {
      label: "Reported widely in August 2024",
      url: "https://en.wikipedia.org/wiki/National_Public_Data_breach",
    },
  },
];

export function getBreachEvent(slug: string) {
  return BREACH_EVENTS.find((b) => b.slug === slug.toLowerCase());
}
