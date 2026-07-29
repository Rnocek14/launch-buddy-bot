/**
 * Data for /best-data-removal-services — the category's highest-volume
 * commercial query ("best data removal service", "best data broker removal").
 *
 * EDITORIAL POSITION
 * ------------------
 * A "best X" listicle that ranks the publisher's own product first is the
 * single most recognisable form of SEO spam, and both readers and search
 * quality systems treat it accordingly. So this page doesn't do that.
 *
 * Instead it awards categories, and Footprint Finder wins exactly one — the
 * one it actually wins (finding accounts in your inbox that broker-only tools
 * structurally cannot see). The overall pick goes to whichever service is
 * genuinely best at the job most people are here for, which is broker
 * removal, and that isn't us.
 *
 * Ownership is disclosed in the page body, not in a footnote. That's not
 * altruism: a page that concedes the obvious is believed on the rest, and
 * being the credible third option on someone else's query is worth more than
 * being the self-declared winner nobody trusts.
 */

export interface RankedService {
  /** Slug in COMPETITORS, or "footprintfinder" for our own entry. */
  slug: string;
  /** Award category — the H3 for this entry. */
  award: string;
  /** Why it wins that specific category. */
  why: string;
  /** The honest caveat. Every entry must have one, including ours. */
  caveat: string;
}

export const BEST_SERVICES_TITLE =
  "Best Data Removal Services in 2026: 10 Compared & Ranked";

export const BEST_SERVICES_DESCRIPTION =
  "We compared 10 data removal services on coverage, price, transparency and what they can actually see. Category-by-category picks, honest caveats, and where each one falls short.";

export const BEST_SERVICES_INTRO = [
  "Every service on this list does the same core job: it finds the people-search sites publishing your name, address, phone number and relatives, then submits removal requests on your behalf. The differences are in how many sites they cover, whether people or scripts file the requests, how often they re-check, and what they charge for the tier that actually includes what you want.",
  "Before you buy anything, two facts worth internalising. First, every one of these opt-outs is free to do yourself — we publish step-by-step instructions for 45+ brokers. What you're paying for is persistence, not access. Second, removal isn't permanent: brokers rebuild from public records and from each other, so listings reappear within months. A service that stops re-checking is worth roughly nothing, which is also what happens when you cancel.",
  "Disclosure up front: Footprint Finder is our product. We've given it one category on this list — the one where it does something the others structurally can't — and the overall pick goes to a competitor. You should still read this with the scepticism any vendor-published comparison deserves, and the capability tables on each comparison page are built from one shared data file so the same standard applies to us as to everyone else.",
];

export const BEST_SERVICES_RANKING: RankedService[] = [
  {
    slug: "incogni",
    award: "Best overall for most people",
    why: "Broad automated coverage, legally-framed requests rather than voluntary opt-out forms, sensible pricing, and an established parent company in Surfshark. For the job most people are actually here for — get me off people-search sites and keep me off — it's the strongest all-round execution.",
    caveat:
      "Broker removal only. No inbox scanning, no breach monitoring, thin reporting, and no free tier to check your exposure before you commit.",
  },
  {
    slug: "easyoptouts",
    award: "Best value",
    why: "Covers a broker list in the same broad territory as services charging many times more, and does the core job — find, submit, re-check — without ceremony. For anyone who has looked at this category's prices and thought they seemed steep, this is the honest answer to that instinct.",
    caveat:
      "Almost no product around the removals: an email summary rather than a dashboard, and less frequent re-scans than the premium options. That gap matters if someone is actively looking for you.",
  },
  {
    slug: "optery",
    award: "Best free tier",
    why: "The free exposure report is the single most useful free thing in this category. It shows you your real listings — profile, address, relatives, screenshots — before asking for money, and the paid product documents removals with before-and-after evidence rather than a counter.",
    caveat:
      "The tier structure is genuinely confusing, and the coverage most people picture when they sign up sits well above the entry plan. Price your comparison against the tier that covers you, not the cheapest one.",
  },
  {
    slug: "deleteme",
    award: "Best for human-filed removals",
    why: "Staff file the requests rather than scripts, which matters more than it sounds: opt-out forms break, add CAPTCHAs and get redesigned, and an automated request that fails often still reports as sent. Fifteen years in the category and the most legible reporting of the manual services.",
    caveat:
      "The narrowest coverage on this list at a premium price, and no free tier. You're paying for filing quality, not breadth — make sure that's the trade you want.",
  },
  {
    slug: "onerep",
    award: "Best removal dashboard",
    why: "Wide automated coverage paired with the clearest progress tracking in the category. You can see which sites listed you, what's in flight and what came back confirmed without digging through a report.",
    caveat:
      "2024 reporting raised questions about the founder's prior involvement with people-search businesses, and the company responded publicly. Read the primary sources before handing over your address history.",
  },
  {
    slug: "footprintfinder",
    award: "Best for finding forgotten accounts",
    why: "Every other service on this list looks outward at public databases. This one also reads your inbox — with read-only metadata access, sender and subject only, never message bodies — to find the accounts you've actually created: the retailer with your card on file, the app from an abandoned hobby, the service you used once in 2019. Those accounts are where breaches start, and breaches are what refill the broker databases everyone else is busy cleaning. Broker removal is on the Complete plan; breach monitoring and a genuinely usable free tier come with all of them.",
    caveat:
      "This is our product, so weigh it accordingly. Broker coverage is smaller than Incogni's or OneRep's, and broker removal sits on the Complete tier rather than the entry one. If people-search listings are your only concern, a dedicated broker service covers more sites.",
  },
  {
    slug: "privacybee",
    award: "Widest scope",
    why: "The only service here that goes meaningfully beyond people-search sites, contacting ordinary companies — retailers, marketers, processors — to suppress or delete your records, and doing so proactively rather than only in response to listings it finds.",
    caveat:
      "The most expensive option by a wide margin, and a share of the outreach is speculative: requests sent to companies that may hold nothing of yours, while the companies that definitely do sit unread in your inbox.",
  },
  {
    slug: "kanary",
    award: "Best for search results and court records",
    why: "Frames the problem as reputation rather than databases, watching what actually surfaces when someone searches your name. Court-record removal at higher tiers is a real differentiator that most competitors don't attempt at all.",
    caveat:
      "Near the top of the category on price for a mid-sized broker list, and some of the monitoring duplicates what a free Google Alert and Google's own 'Results about you' tool already do.",
  },
  {
    slug: "aura",
    award: "Best bundle",
    why: "Identity-theft insurance, restoration support and three-bureau credit monitoring alongside antivirus, a VPN and a password manager. Removal reduces the odds of something going wrong; this is the only option here that helps with the aftermath when it does.",
    caveat:
      "Removal is one feature inside a large suite and thinner than any dedicated service's. Check whether you're seeing an introductory rate — the renewal is typically higher.",
  },
  {
    slug: "mine",
    award: "Best free inbox cleanup",
    why: "Got to the right idea early: your inbox is the definitive record of which companies hold your data. Clean interface, a free tier that genuinely works, and a GDPR framing that suits European users well.",
    caveat:
      "It doesn't do data-broker removal at all, which is what most people come to this category for. Requests go to generic addresses rather than the privacy contacts obliged to act on them, which shows up in response rates.",
  },
];

export const BEST_SERVICES_HOW_TO_CHOOSE = {
  heading: "How to choose, in four questions",
  body: [
    "**Is anyone actually looking for you?** If you're dealing with harassment, stalking, a public-facing role or a live safety concern, buy on re-scan cadence and evidence — you need to know removals landed and to close the window when listings reappear. If it's general hygiene, you're mostly buying peace of mind and should buy on price.",
    "**Do you know where you're exposed?** If not, run Optery's free exposure report before spending anything. It's the fastest way to see which brokers list you, and that inventory tells you which service's coverage actually matters rather than which has the biggest number.",
    "**Is it public findability or corporate data-holding that worries you?** They're different problems. Public findability is people-search sites — any broker remover handles it. Corporate data-holding is the hundred-odd companies with your details on file, and only inbox-based tools can see which ones those are.",
    "**Will you keep it up yourself?** Every opt-out here is free. If you'll genuinely work through the list twice a year, do that and spend nothing. Services are worth paying for precisely when you know you won't.",
  ],
};

export const BEST_SERVICES_FAQS = [
  {
    question: "What is the best data removal service?",
    answer:
      "For most people, Incogni — broad automated coverage, legally-framed requests, reasonable pricing and established corporate backing. EasyOptOuts is the better buy if price is the deciding factor, DeleteMe if you want humans filing requests rather than scripts, and Optery if you want to see your exposure before paying. There's no single winner, because the services optimise for genuinely different things.",
  },
  {
    question: "Are data removal services worth it?",
    answer:
      "They're worth it if you won't do the opt-outs yourself. Every broker on these lists has a free removal process, and we publish instructions for 45+ of them — roughly ten minutes per site, repeated a few times a year as brokers re-list you. A subscription buys the repetition, not access. If you're organised and have the time, doing it manually gets you most of the benefit for nothing.",
  },
  {
    question: "Can I remove myself from data brokers for free?",
    answer:
      "Yes, entirely. Opt-outs are free by law, and no broker can charge you to be removed. The work is finding your listings, completing each form, confirming by email, and repeating the whole process every few months when the records come back. That's the labour these services are selling.",
  },
  {
    question: "How long does data removal take?",
    answer:
      "Most brokers process a verified opt-out within 7 to 30 days, and that timeline is set by the broker rather than by the service you use. Complete coverage across a large list usually takes a couple of months for the first pass. The number that matters afterwards is re-scan frequency, because listings start reappearing almost immediately.",
  },
  {
    question: "Do data brokers put your information back after removal?",
    answer:
      "Routinely. Brokers rebuild their databases from public records, marketing data and each other, so a removed profile commonly reappears within a few months from a different source. This is the single most important thing to understand about the category: it's ongoing maintenance, not a one-time fix, and cancelling any service eventually returns you to where you started.",
  },
  {
    question: "Which data removal service covers the most sites?",
    answer:
      "Incogni, OneRep and Privacy Bee advertise the largest lists, but treat every count sceptically — they're self-reported, defined differently by each vendor, and padded with obscure sites that never surface in a search for your name. Covering the 30 brokers that appear on page one for your name beats covering 300 that don't.",
  },
  {
    question: "Do these services remove you from Google?",
    answer:
      "Only indirectly. Removing the underlying broker listing usually causes the search result to disappear once Google re-crawls the page, which can take weeks. Google also runs a free 'Results about you' tool for requesting removal of results that expose your phone number, home address or email — worth running alongside any removal service, since it addresses visibility while the service addresses the record itself.",
  },
  {
    question: "What can't data removal services do?",
    answer:
      "None of the broker-focused services can see the accounts you've created over the years, because they never look at your inbox. That's a meaningful gap: dormant accounts get breached, your details circulate, brokers ingest the new data, and the listings you paid to remove come back from a fresh source. Cleaning the output without touching the input is a treadmill.",
  },
];
