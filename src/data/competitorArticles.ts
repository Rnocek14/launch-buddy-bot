/**
 * Long-form editorial body for each /vs/:competitor page.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * competitors.ts holds *facts* (price, coverage, capability booleans).
 * This file holds *prose* — the 1,000+ words of unique writing that gives a
 * comparison page a reason to rank. Splitting them keeps the facts table
 * small enough to audit at a glance while the writing grows.
 *
 * SEARCH INTENT
 * -------------
 * These pages target "<name> alternative(s)", "<name> vs <competitor>" and
 * "is <name> worth it" — queries a stranger actually types. They do NOT
 * target "footprint finder vs <name>", which has no volume for a new brand.
 * Because the title promises alternatives, the page must genuinely deliver a
 * ranked list of alternatives, not a single-vendor pitch. The alternatives
 * list is generated from COMPETITORS so it stays complete and honest.
 *
 * EDITORIAL RULES
 * ---------------
 * 1. Never state a specific fact about a competitor that isn't in
 *    competitors.ts or publicly obvious. No invented removal rates, headcounts,
 *    funding, or incident details.
 * 2. Every page must include a section on what the competitor does BETTER.
 *    A comparison page that never concedes a point reads as an ad, and both
 *    readers and Google's helpful-content systems discount it.
 * 3. Disclose that Footprint Finder is our product. Disclosure is cheap and
 *    the absence of it is what makes these pages look like spam.
 * 4. Prices live in competitors.ts only. Never hardcode a number here.
 */

export interface CompetitorArticle {
  /** One-sentence take shown when this service appears in another page's list. */
  shortTake: string;
  /** Compressed "best for" used in ranking tables. Keep under ~60 chars. */
  bestForShort: string;
  /** Honest reasons people go looking for an alternative. Drives the H2. */
  whySeekAlternatives: string[];
  /** Unique long-form body. 3–5 sections, 2–4 paragraphs each. */
  sections: Array<{ heading: string; body: string[] }>;
  /** Practical things to handle when moving off this service. */
  switchNotes: string[];
  /** Questions aimed at People Also Ask. Rendered visibly AND as FAQPage schema. */
  faqs: Array<{ question: string; answer: string }>;
  /** Closing recommendation. Should name a scenario where the competitor wins. */
  verdict: string;
}

/**
 * Shared category context, rendered once per page in a compact block.
 * Kept deliberately short: it repeats across pages, so the bulk of every
 * page's word count has to come from the per-competitor sections above.
 */
export const CATEGORY_CONTEXT = {
  heading: "How data-removal services actually work",
  body: [
    "Every service in this category does roughly the same thing under the hood. You give them your name, address history and date of birth. They search people-search sites for records matching you, then submit each site's opt-out form or send a legally-backed deletion request on your behalf. Some automate the whole loop; some have staff file requests by hand.",
    "Two things follow from that. First, you have to hand over personal data to get personal data removed — there is no way around it, so how a vendor stores and retains that data matters more than its marketing. Second, removal is not permanent. Brokers rebuild their databases from public records, marketing lists and each other, so a profile you deleted often reappears within a few months. Any service worth paying for re-checks continuously; a one-time sweep is close to worthless.",
    "It is also worth knowing that opt-outs are free. Every broker on these lists has a removal process you can complete yourself for nothing — we publish step-by-step instructions for 45+ of them. What you are buying from any of these services is labour and persistence, not access. If you have a few hours and a spreadsheet, doing it manually is a legitimate option.",
    "One regulatory note worth tracking: California's Delete Act directs the state to run a single deletion portal that forwards a request to every registered data broker at once. If you are a California resident, check the current status before committing to a multi-year plan — the economics of this category change if a one-click statewide deletion works as intended.",
  ],
};

/** Criteria used to rank alternatives. Stated openly for E-E-A-T. */
export const RANKING_CRITERIA = {
  heading: "How we compare these services",
  body: [
    "Broker counts are the headline number every vendor advertises and the least useful one. Counts are self-reported, defined differently by each company, and padded with obscure sites nobody searches. A service covering the 30 brokers that actually surface in Google results beats one covering 300 that don't.",
    "So we weigh four things instead: what the service can see (broker listings only, or your accounts and breaches too), whether it keeps working after the first sweep, what it costs at the tier that actually includes the feature you want, and whether you can see your exposure before paying.",
    "Footprint Finder is our product, so treat our placement with the scepticism it deserves — we've tried to be specific about the cases where a competitor is the better buy, and every page here names at least one. The capability tables are built from the same data file, so the same standard is applied to us as to everyone else.",
  ],
};

export const COMPETITOR_ARTICLES: Record<string, CompetitorArticle> = {
  // ---------------------------------------------------------------- DeleteMe
  deleteme: {
    shortTake:
      "The category's original, with human reviewers filing removals by hand. Premium price, narrow scope.",
    bestForShort: "People who want humans, not scripts, filing removals",
    whySeekAlternatives: [
      "It's a premium price for a single category of problem — people-search listings and nothing else.",
      "There's no free tier, so you commit before you've seen what's actually exposed about you.",
      "Broker coverage is smaller than several competitors that charge less.",
      "It can't see the accounts sitting in your inbox, which is where most people's real exposure lives.",
    ],
    sections: [
      {
        heading: "What DeleteMe genuinely does better",
        body: [
          "DeleteMe has been doing this since 2010, which in a category full of two-year-old startups counts for something. They've had a decade and a half to build working relationships with the major brokers and to learn which removal requests get honoured and which get quietly dropped.",
          "The bigger differentiator is that people file the requests. Most competitors run scripts against opt-out forms, which breaks the moment a broker redesigns a page or adds a CAPTCHA. A human hitting a wall will find another route; a script just fails and reports success anyway. If you've been burned by an automated service claiming removals that never happened, the manual approach is a rational thing to pay extra for.",
          "Their reporting is also the most legible in the category — you get a periodic document showing what was found and what was removed, rather than a dashboard number that only goes up.",
        ],
      },
      {
        heading: "Where DeleteMe leaves you exposed",
        body: [
          "DeleteMe's scope is people-search sites. That's a real problem worth solving — those listings are what feed doxxing, scam calls and address-based identity fraud. But it's one slice of your exposure.",
          "The slice it misses is the one you built yourself. The average person has well over a hundred online accounts, most of them forgotten: the shopping site you used once in 2019, the fitness app from a New Year's resolution, the streaming trial you never cancelled. Each one holds an email address, often a physical address, sometimes a stored card. Each is a breach waiting to leak your data into exactly the databases DeleteMe is trying to clean.",
          "DeleteMe cannot see any of it, because it never looks at your inbox. Clean up the brokers and leave 150 dormant accounts running, and the brokers refill from the next breach.",
        ],
      },
      {
        heading: "Is DeleteMe worth the price?",
        body: [
          "It depends entirely on what you're buying it for. If your threat model is people-search listings — you've been harassed, you work in a public-facing job, you're a domestic-violence survivor, you're getting scam calls that name your street — then DeleteMe is a defensible purchase and the manual filing is worth paying for.",
          "If your concern is general digital hygiene, the price buys a narrow service. At that budget you can get broker removal plus inbox account discovery plus breach monitoring, or you can get three to six times the broker coverage from a cheaper automated competitor. Paying a premium for the smallest coverage number in the category only makes sense if you specifically value the human review.",
        ],
      },
    ],
    switchNotes: [
      "DeleteMe bills annually. Check your renewal date before switching so you're not paying twice.",
      "Removals DeleteMe already completed don't reverse when you cancel — but nothing re-checks them either, so brokers will re-list you within a few months unless something else takes over.",
      "Ask them to delete the personal data they hold on you when you close the account. You gave them your address history and date of birth; there's no reason for them to keep it.",
      "Export or screenshot your last report before cancelling. It's a useful baseline for whatever you move to.",
    ],
    faqs: [
      {
        question: "What is the best DeleteMe alternative?",
        answer:
          "It depends what you're optimising for. For maximum broker coverage on autopilot, Incogni and OneRep both cover several times more sites for less money. For the lowest possible price, EasyOptOuts does automated removal for a fraction of DeleteMe's cost. For broker removal plus discovery of the forgotten accounts in your inbox, Footprint Finder (our product) covers both on its Complete plan. And if what you value is humans filing requests by hand, there isn't really a substitute — that's DeleteMe's actual differentiator.",
      },
      {
        question: "Is DeleteMe worth it?",
        answer:
          "If people-search listings are your specific problem and you want removals filed by people rather than scripts, yes. If you want broad digital-privacy coverage, you're paying a premium price for the narrowest scope in the category — most alternatives give you more for the same money or less.",
      },
      {
        question: "Can I do what DeleteMe does myself for free?",
        answer:
          "Yes. Every broker DeleteMe contacts has a free opt-out process you can complete yourself, and we publish step-by-step instructions for 45+ of them. Expect roughly ten minutes per site, plus a repeat pass every few months as brokers re-list you. What you're paying any service for is the persistence, not access.",
      },
      {
        question: "How long does DeleteMe take to remove your information?",
        answer:
          "Most brokers process a verified opt-out within 7–30 days, and that timeline is set by the broker rather than the service you use. The meaningful difference between services isn't first-pass speed, it's what happens on month four when the listings come back.",
      },
      {
        question: "Does DeleteMe remove you from Google?",
        answer:
          "Not directly. Removing the underlying broker listing usually causes the search result to drop out once Google re-crawls the page, which can take weeks. Google also has its own 'Results about you' removal tool for pages showing your address or phone number — that's a separate free process worth running alongside any removal service.",
      },
    ],
    verdict:
      "DeleteMe is the safe, established pick if people-search listings are your specific problem and you want human review rather than automation. If you want breadth — more brokers, or coverage of the accounts brokers don't know about — you can do better at the same price.",
  },

  // ----------------------------------------------------------------- Incogni
  incogni: {
    shortTake:
      "Surfshark-backed, heavily automated, one of the widest broker lists in the category.",
    bestForShort: "Hands-off broker removal at scale",
    whySeekAlternatives: [
      "It's broker removal only — no inbox scanning, no breach alerts, no account cleanup.",
      "There's no free tier, so you can't see your exposure before you buy.",
      "Reporting is thin: you get counts and statuses, not much detail on what was actually removed.",
      "Full automation means when a broker's form breaks, the request quietly fails.",
    ],
    sections: [
      {
        heading: "What Incogni genuinely does better",
        body: [
          "Incogni's broker list is one of the longest in the category and the automation behind it is the most hands-off. You enter your details once and the requests go out continuously without you touching anything. For a category where the failure mode is 'user gives up in month two', that matters more than it sounds.",
          "It also leans harder on legal mechanisms than most. Rather than only filling in voluntary opt-out forms, Incogni sends requests grounded in privacy law, which gives brokers a statutory clock to respond to instead of a suggestion they can ignore.",
          "Being owned by Surfshark is a genuine trust signal in a category with a lot of thinly-capitalised newcomers. There's an established company behind it with a reputation to lose.",
        ],
      },
      {
        heading: "Where Incogni leaves you exposed",
        body: [
          "Incogni does one job. It doesn't look at your inbox, so it has no idea which services hold your data. It doesn't check breach databases, so it can't tell you your address turned up in a dump last year. It won't help you close the dormant accounts that keep refilling the broker databases in the first place.",
          "The reporting gap is the other common complaint. You see requests sent and statuses returned, but comparatively little about what a broker actually held on you before it went. If you want to understand your exposure rather than just reduce a number, that's thin.",
          "And full automation cuts both ways. Scripts are relentless, which is good, but they're also brittle — a redesigned opt-out page or a new CAPTCHA can turn a request into a silent failure that still reads as 'submitted' on your dashboard.",
        ],
      },
      {
        heading: "Incogni vs the rest of the category",
        body: [
          "Among broker-only services, Incogni's main competition is OneRep on coverage and EasyOptOuts on price. All three automate the same fundamental process; the differences are list size, reporting quality and how much you pay for it.",
          "The more interesting comparison is against services that do something Incogni structurally can't. Incogni starts from your name and address and works outward into public databases. An inbox-based service starts from your email and works outward into the private accounts holding your data. Those find genuinely different things, which is why some people run one of each rather than choosing.",
          "If you only ever buy one, the question is which half of your exposure worries you more: what strangers can look up about you, or what companies are quietly sitting on.",
        ],
      },
    ],
    switchNotes: [
      "Incogni subscriptions renew automatically — cancel before the renewal date, not after.",
      "Request deletion of the personal data Incogni holds when you close the account.",
      "Any broker removed by Incogni will re-list you over the following months once nothing is re-checking. Have the replacement running before you cancel, not after.",
      "Save a copy of your final report so you know which brokers had you to begin with.",
    ],
    faqs: [
      {
        question: "What is the best Incogni alternative?",
        answer:
          "OneRep is the closest like-for-like — comparable automation and a similarly large broker list. EasyOptOuts is the budget option if you want the same automated removal for much less and don't need a dashboard. DeleteMe is the pick if you'd rather have humans filing requests. If you want broker removal plus the forgotten accounts in your inbox, Footprint Finder (our product) covers both on its Complete plan.",
      },
      {
        question: "Is Incogni worth it?",
        answer:
          "For hands-off broker removal, yes — it's one of the strongest options in that specific job and priced reasonably for the coverage. It's worth less if you expected broader privacy protection, because it doesn't touch your accounts, your breaches or anything outside people-search databases.",
      },
      {
        question: "Does Incogni actually remove your data?",
        answer:
          "It submits opt-out and legally-backed deletion requests, and brokers that honour them remove your listing. No service can guarantee removal from every broker, because some ignore requests, some re-list from fresh public records, and some are outside the reach of the law being cited. Judge any service by whether it keeps re-checking, not by its first-month numbers.",
      },
      {
        question: "Incogni vs DeleteMe — which is better?",
        answer:
          "Incogni covers substantially more brokers for less money and runs fully automated. DeleteMe covers fewer sites at a higher price but has people filing the requests and produces clearer reporting. Pick Incogni for breadth and cost, DeleteMe for human review and legibility.",
      },
      {
        question: "Can I remove myself from data brokers without Incogni?",
        answer:
          "Yes — every broker Incogni contacts has a free opt-out you can complete yourself, and we publish instructions for 45+ of them. Budget around ten minutes per site and a repeat pass every few months. Paying a service buys you the repetition.",
      },
    ],
    verdict:
      "Incogni is the strongest pick in the category if broker removal on autopilot is exactly what you want and you don't need it to see anything else. If you want visibility into your accounts and breaches too, it's solving half the problem.",
  },

  // ------------------------------------------------------------------ Optery
  optery: {
    shortTake:
      "Free exposure report plus tiered removal. Genuinely useful free tier, meaningful upsell path.",
    bestForShort: "Seeing your exposure before paying anything",
    whySeekAlternatives: [
      "The tier structure is confusing, and the cheapest paid plan covers a fraction of what the top one does.",
      "Getting genuinely broad coverage means paying near the top of the range.",
      "No inbox scanning, so forgotten accounts stay invisible.",
      "No built-in breach monitoring.",
    ],
    sections: [
      {
        heading: "What Optery genuinely does better",
        body: [
          "Optery's free exposure report is the single most useful free thing in this category. It shows you your actual listings — name, address, phone, relatives, the screenshots — before asking for money. Most people have never seen what a people-search profile of them looks like, and seeing it is what converts vague concern into action.",
          "That transparency continues into the paid product. Optery shows before-and-after evidence of removals rather than asking you to trust a counter, which is a meaningfully higher standard of proof than most competitors offer.",
          "The tiering, confusing as it is, does mean you can start cheap and scale up rather than paying top rate on day one.",
        ],
      },
      {
        heading: "Where Optery leaves you exposed",
        body: [
          "The tiers are the recurring complaint. The entry plan is priced attractively but covers a small slice of the broker list; the coverage people picture when they sign up sits several tiers up. Work out which tier includes the coverage you actually want before comparing Optery's headline price to anything else — the honest comparison is usually against the middle or upper tier, not the entry one.",
          "Beyond that, Optery has the same structural blind spot as every broker-only service. It looks outward at public databases and never inward at your own accounts. The forgotten logins holding your address and card details are invisible to it, and those are what leak into breaches and refill the broker databases Optery just cleaned.",
          "There's no breach monitoring either, so you'll want a separate way to find out when your email turns up in a dump.",
        ],
      },
      {
        heading: "How to use Optery's free tier well",
        body: [
          "Even if you buy something else, run Optery's free report first. It costs nothing and gives you a concrete inventory of which brokers currently list you — which is exactly the baseline you need to judge whether whatever you buy is working.",
          "A reasonable low-cost strategy is to use the free report for visibility, then work through the highest-impact listings manually using free opt-out guides, and spend your budget on the coverage a free report can't give you. That's not the outcome Optery is hoping for, but it's an honest read of what their free tier is worth.",
        ],
      },
    ],
    switchNotes: [
      "Check which Optery tier you're actually on before comparing prices — the entry and top plans are very different products.",
      "Download your exposure report and removal evidence before cancelling; it's the best baseline document in the category.",
      "Ask Optery to delete the personal data they hold once you close the account.",
      "Expect re-listing within a few months of cancelling unless something else takes over the re-checks.",
    ],
    faqs: [
      {
        question: "What is the best Optery alternative?",
        answer:
          "Incogni and OneRep are the closest comparisons if you want broad automated coverage on a single flat plan rather than tiers. EasyOptOuts is cheaper than any Optery paid tier. DeleteMe is the alternative if you want human-filed removals. Footprint Finder (our product) is the option if you want broker removal plus discovery of the accounts in your inbox.",
      },
      {
        question: "Is Optery's free tier actually free?",
        answer:
          "Yes — the exposure report costs nothing and shows you real listings. What it doesn't include is automated removal; on the free tier you work through the opt-out forms yourself. That's a fair trade and the report is worth running regardless of which service you eventually pay for.",
      },
      {
        question: "Which Optery plan do I actually need?",
        answer:
          "That depends on which brokers list you, which is exactly what the free report tells you. Run it first, see where you actually appear, then buy the tier that covers those specific sites rather than the tier with the best-looking headline number.",
      },
      {
        question: "Optery vs Incogni — which is better?",
        answer:
          "Optery gives you a free look at your exposure and shows removal evidence; Incogni gives you broad coverage on one flat plan without the tier maths. If transparency matters most, Optery. If you want to pay once and never think about it, Incogni.",
      },
      {
        question: "Does Optery remove you permanently?",
        answer:
          "No service does. Brokers rebuild from public records and from each other, so listings reappear over months. That's why continuous re-checking matters more than first-pass removal counts — and why cancelling any of these services eventually returns you to where you started.",
      },
    ],
    verdict:
      "Optery earns its place on the strength of the free report and its evidence-based removals. Run the free tier no matter what you buy. Just price the comparison against the tier that actually covers you, not the entry one.",
  },

  // ------------------------------------------------------------------ OneRep
  onerep: {
    shortTake:
      "Broad automated coverage with a clean progress dashboard. Past ownership questions are worth reading up on.",
    bestForShort: "Wide automated coverage with clear progress tracking",
    whySeekAlternatives: [
      "Reporting from 2024 about the founder's prior involvement with people-search sites left some users uneasy about the conflict of interest.",
      "Broker removal only — no inbox scanning, no breach monitoring.",
      "No free tier to check your exposure before buying.",
      "Fully automated, so failed requests can read as successes.",
    ],
    sections: [
      {
        heading: "What OneRep genuinely does better",
        body: [
          "OneRep covers one of the largest broker lists in the category and pairs it with the clearest progress dashboard. You can see which sites listed you, which requests are in flight and which came back confirmed, without digging through a PDF.",
          "The automation is solid and the re-scan cadence is frequent enough to catch the re-listing that follows every removal campaign. For a set-and-forget broker service, the mechanics are among the better-executed in the category.",
        ],
      },
      {
        heading: "The trust question you should look into",
        body: [
          "In 2024, reporting raised questions about the OneRep founder's prior involvement in building people-search sites — the same category of business the service removes you from. OneRep has responded publicly to that reporting.",
          "We're not in a position to adjudicate it, and we'd rather point you at the primary sources than characterise them. But you're about to hand a company your name, address history and date of birth, so it's worth half an hour of your own reading before you decide. Search for the KrebsOnSecurity coverage and OneRep's response, and make your own call.",
          "That's a genuine consideration rather than a competitive dig — the same standard applies to us. Anyone asking for that data should expect to be checked.",
        ],
      },
      {
        heading: "Where OneRep leaves you exposed",
        body: [
          "The structural limitation is the familiar one: OneRep looks at public people-search databases and nothing else. Your dormant accounts, your breach exposure and your mailing-list footprint are all outside its scope.",
          "That matters because those categories feed each other. A forgotten retail account gets breached, your address and phone circulate, brokers ingest the new data, and the listings OneRep removed six months ago come back from a fresh source. Cleaning the output without touching the input is a treadmill.",
        ],
      },
    ],
    switchNotes: [
      "Cancel before the renewal date — OneRep bills on a recurring cycle.",
      "Export your removal dashboard first; it's a useful record of which brokers held you.",
      "Request deletion of the personal data OneRep holds when you close the account.",
      "Brokers will re-list you over the following months, so overlap your new service with the old one by a few weeks.",
    ],
    faqs: [
      {
        question: "What is the best OneRep alternative?",
        answer:
          "Incogni is the closest match on coverage and automation. EasyOptOuts is significantly cheaper for a similar automated approach. DeleteMe is the pick if you want humans filing requests. Footprint Finder (our product) adds inbox account discovery and breach monitoring on top of broker removal.",
      },
      {
        question: "Is OneRep safe to use?",
        answer:
          "Any removal service requires you to hand over your name, address history and date of birth, so the question is worth asking of all of them. In OneRep's case there's specific 2024 reporting about the founder's prior involvement with people-search businesses, along with a public response from the company. Read both before deciding rather than taking anyone's summary — including ours.",
      },
      {
        question: "How many data brokers does OneRep cover?",
        answer:
          "OneRep advertises one of the larger lists in the category. Treat that number the way you'd treat any vendor's self-reported count: coverage definitions differ between companies and a long tail of obscure sites inflates totals. What matters is whether the brokers that actually show up when someone searches your name are on the list.",
      },
      {
        question: "OneRep vs Incogni — which is better?",
        answer:
          "They're close on the mechanics: both automate broad broker removal with regular re-scans. OneRep's dashboard is the more legible of the two; Incogni has the stronger corporate backing. If the 2024 reporting on OneRep's founder matters to you, that's the deciding factor.",
      },
      {
        question: "Do I need a data removal service at all?",
        answer:
          "Not necessarily. Every broker opt-out is free and we publish instructions for 45+ of them. If you're organised enough to work through the list twice a year, you can get most of the benefit for nothing. Services are worth paying for when you know you won't keep it up.",
      },
    ],
    verdict:
      "OneRep is a capable, wide-coverage automated remover with the best progress dashboard of the broker-only services. Do your own reading on the 2024 ownership reporting first — it's the kind of thing you want to have decided about deliberately.",
  },

  // ------------------------------------------------------------- Privacy Bee
  privacybee: {
    shortTake:
      "The broadest scope of the broker-only services — it contacts ordinary companies too, not just people-search sites.",
    bestForShort: "Proactive opt-outs beyond people-search sites",
    whySeekAlternatives: [
      "It's the most expensive option in the category by a wide margin.",
      "No inbox scanning, so it can't discover which companies actually hold your data.",
      "No built-in breach monitoring.",
      "The proactive-outreach model means a lot of requests go to companies that may not have your data at all.",
    ],
    sections: [
      {
        heading: "What Privacy Bee genuinely does better",
        body: [
          "Privacy Bee has the widest definition of the job in this category. Most competitors stop at people-search sites; Privacy Bee also contacts ordinary companies — retailers, marketers, data processors — asking them to delete or suppress your records. That's a materially larger surface area.",
          "It also works pre-emptively rather than only reactively, submitting suppression requests to companies before your data spreads rather than chasing it afterwards. Combined with legally-grounded requests rather than voluntary opt-out forms, it's the most aggressive posture on offer.",
          "If your concern is corporate data-holding generally rather than the specific problem of being findable on a people-search site, Privacy Bee is aimed closer at what you actually want than most of this list.",
        ],
      },
      {
        heading: "Where Privacy Bee leaves you exposed",
        body: [
          "The blind spot is the interesting one, because it's the mirror image of Privacy Bee's strength. Privacy Bee sends requests to a list of companies it thinks might hold your data. It has no way of knowing which companies actually do, because it never looks at the one place that record exists — your inbox.",
          "Your email history is the definitive list of every service you've signed up for. Order confirmations, password resets, marketing mail: each one is proof that a specific company has your data. A service that reads that list knows exactly where to send requests. A service that doesn't is working from a generic list and guessing.",
          "There's no breach monitoring either, so you'll still need a separate way to learn when your credentials surface in a dump.",
        ],
      },
      {
        heading: "Is the price justified?",
        body: [
          "Privacy Bee costs substantially more than anything else here, and whether that's justified depends on whether you want the extra scope. For people-search removal alone, you're paying a large premium over services that do that specific job just as well.",
          "The case for it is if you genuinely want the broader corporate-data outreach and are prepared to pay for the most aggressive posture available. The case against is that a chunk of that outreach is speculative — requests to companies that may hold nothing of yours — while the companies that definitely do hold your data sit unaddressed in your inbox.",
        ],
      },
    ],
    switchNotes: [
      "Privacy Bee bills annually at the top end of the category — check the renewal date carefully.",
      "Suppression requests already honoured generally persist, but nothing re-checks them after you leave.",
      "Request deletion of the profile data Privacy Bee holds on you when you close the account.",
      "If you're switching to something cheaper, run an exposure check first so you can see what you're giving up.",
    ],
    faqs: [
      {
        question: "What is the best Privacy Bee alternative?",
        answer:
          "For people-search removal alone at a fraction of the cost, Incogni, OneRep or EasyOptOuts all do that job well. DeleteMe is the alternative if you want human-filed requests. Footprint Finder (our product) is the closer match if what attracted you to Privacy Bee was the idea of reaching ordinary companies — we find them by scanning your inbox rather than working from a generic list.",
      },
      {
        question: "Why is Privacy Bee so expensive?",
        answer:
          "It attempts a bigger job. Alongside people-search removal it contacts ordinary companies asking them to suppress or delete your records, and it does so proactively rather than only in response to listings it finds. Whether that scope is worth the premium depends on whether corporate data-holding or public findability is the thing that actually worries you.",
      },
      {
        question: "Does Privacy Bee remove you from data brokers?",
        answer:
          "Yes, alongside its broader corporate outreach. If broker removal is all you want, though, you can get comparable people-search coverage for considerably less from several competitors.",
      },
      {
        question: "Privacy Bee vs Incogni — which is better?",
        answer:
          "Incogni is focused, automated and much cheaper for people-search removal specifically. Privacy Bee is broader, more aggressive and considerably more expensive. Pick Incogni if you want the specific job done efficiently; Privacy Bee if you want the widest possible net and the budget is secondary.",
      },
      {
        question: "Can I send data deletion requests myself?",
        answer:
          "Yes. Under CCPA/CPRA in California and comparable laws in a growing number of states, you can request deletion directly from any company holding your data, and they're obliged to respond. The hard part isn't sending the request — it's knowing which companies to send it to. That's the problem an inbox scan solves.",
      },
    ],
    verdict:
      "Privacy Bee is the most ambitious service in the category and priced accordingly. Worth it if you want corporate-wide suppression and the budget allows. Overkill — and overpriced — if people-search listings are the actual problem.",
  },

  // ------------------------------------------------------------ EasyOptOuts
  easyoptouts: {
    shortTake:
      "The budget pick, and genuinely good value. No dashboard, no frills, just automated removals.",
    bestForShort: "The cheapest credible automated removal",
    whySeekAlternatives: [
      "There's essentially no dashboard or detailed reporting — you get an email summary.",
      "No inbox scanning and no breach monitoring.",
      "No help with account deletion or legal data requests.",
      "Re-scans are less frequent than the premium services.",
    ],
    sections: [
      {
        heading: "What EasyOptOuts genuinely does better",
        body: [
          "EasyOptOuts is the best value in this category and it isn't especially close. It covers a broker list comparable to services charging five to ten times as much, and it does the core job — find listings, submit opt-outs, re-check periodically — without ceremony.",
          "The absence of a dashboard is a deliberate trade, not an oversight. You're paying for removals, not software. If you don't want to log into another product and stare at a progress bar, this is the service that respects that.",
          "For anyone who has looked at the prices in this category and concluded the whole thing is overpriced, EasyOptOuts is the honest answer to that instinct.",
        ],
      },
      {
        heading: "What you give up at that price",
        body: [
          "Visibility, mostly. You get an email telling you what was found and submitted rather than an interface showing evidence. If you want before-and-after screenshots proving a listing was removed, this isn't the service.",
          "Re-scan frequency is lower than the premium options. Given that re-listing is the central problem in this category, a longer gap between sweeps means more time spent listed. It's still vastly better than nothing, and arguably better value per dollar than any competitor, but it's the real trade being made.",
          "And like every broker-only service, it can't see your accounts, your breaches or your mailing-list footprint.",
        ],
      },
      {
        heading: "Who should actually buy this",
        body: [
          "If you're privacy-conscious but not under active threat — no harassment, no stalking, no public-facing role — EasyOptOuts is probably the rational purchase in this category. It handles the tedious part at a price low enough that it doesn't need to be justified.",
          "Where it stops being the right answer is when the stakes are high enough that you need proof and speed. If someone is actively looking for you, the faster re-scan cadence and evidence trail of a premium service are worth paying for. Everyone else is mostly buying reassurance, and reassurance is cheaper here.",
        ],
      },
    ],
    switchNotes: [
      "The subscription renews annually — check the date.",
      "Keep the email reports; they're your only record of what was found.",
      "Ask them to delete your details when you cancel.",
      "As always, expect re-listing once nothing is re-checking on your behalf.",
    ],
    faqs: [
      {
        question: "Is EasyOptOuts legitimate?",
        answer:
          "Yes. It does the same fundamental job as the expensive services — searches broker sites for your listings and submits opt-outs — with far less product wrapped around it. The low price reflects the absence of a dashboard, reporting and support tier, not the absence of removals.",
      },
      {
        question: "What is the best EasyOptOuts alternative?",
        answer:
          "If you want more frequent re-scans and real reporting, Incogni or OneRep are the step up. Optery's free tier is worth running alongside for visibility. DeleteMe if you want humans filing requests. Footprint Finder (our product) if you want inbox account discovery and breach monitoring as well as broker removal.",
      },
      {
        question: "Why is EasyOptOuts so much cheaper than DeleteMe?",
        answer:
          "Different cost structures. EasyOptOuts automates aggressively and ships almost no software around the removals; DeleteMe pays people to file requests by hand and produces detailed reports. You're choosing between labour costs and automation, not between removal and non-removal.",
      },
      {
        question: "Does EasyOptOuts cover enough brokers?",
        answer:
          "Its list is comparable to services charging several times more. As with every vendor here, treat the headline count sceptically and ask instead whether the sites that surface when someone searches your name are covered.",
      },
      {
        question: "Should I just do the opt-outs myself instead?",
        answer:
          "At this price point that's a genuinely close call — which is a compliment to EasyOptOuts. Doing it yourself is free and we publish guides for 45+ brokers, but it's roughly ten minutes per site and needs repeating a few times a year. If you know you won't repeat it, the subscription costs less than the time.",
      },
    ],
    verdict:
      "EasyOptOuts is the best value in the category and the right default for most people who aren't under specific threat. Step up to a premium service when you need faster re-scans and an evidence trail — not before.",
  },

  // -------------------------------------------------------------------- Aura
  aura: {
    shortTake:
      "An identity-theft suite with removal bundled in. Great bundle, secondary removal product.",
    bestForShort: "One bill for identity, credit and security",
    whySeekAlternatives: [
      "Data-broker removal is a bundled add-on, not the main product — coverage is thinner than dedicated tools.",
      "You're paying for antivirus, VPN and a password manager whether or not you use them.",
      "No inbox scanning to find forgotten accounts.",
      "The introductory price renews higher, which surprises people in year two.",
    ],
    sections: [
      {
        heading: "What Aura genuinely does better",
        body: [
          "Aura is the only service on this list that will reimburse you when things go wrong. The identity-theft insurance and the restoration support that comes with it are a genuinely different product from removal — removal reduces the odds, insurance handles the aftermath. If you've already had your identity stolen once, that distinction stops being academic.",
          "The credit monitoring across all three bureaus is also real value that no dedicated removal service offers, and for a household that would otherwise buy antivirus, a VPN, a password manager and credit monitoring separately, the bundle maths can work out genuinely favourably.",
          "Their family plans are among the better-structured in the category too, covering multiple adults under one subscription.",
        ],
      },
      {
        heading: "Where Aura leaves you exposed",
        body: [
          "The privacy piece is the smallest part of a large product. Aura's broker removal exists, works, and is meaningfully less thorough than what a dedicated service does — because for Aura it's one feature among a dozen, not the whole business.",
          "If you bought Aura specifically for data removal, you bought a bundle where removal is the side dish. That's a reasonable thing to discover and correct.",
          "There's also no inbox scanning, so the dormant accounts holding your data stay invisible. Aura will tell you when your credit file changes; it won't tell you that a shopping site from 2019 still has your card on file.",
        ],
      },
      {
        heading: "Specialist or bundle?",
        body: [
          "The honest framing is that this isn't really a like-for-like comparison. If you want identity-theft insurance, credit monitoring, antivirus and a VPN under one bill, no dedicated privacy tool competes and you should buy Aura.",
          "If you want your data removed thoroughly, a specialist will do it better for less, and you can cover the rest with free or cheap alternatives — most operating systems ship competent antivirus now, and there are credible free VPNs and password managers.",
          "The trap is paying bundle prices while assuming you're getting specialist-grade removal. Decide which product you're actually buying.",
        ],
      },
    ],
    switchNotes: [
      "Check whether you're on the introductory rate — the renewal price is usually higher.",
      "If you cancel, you lose the identity-theft insurance immediately. That may matter more than the removal coverage.",
      "Replace the individual bundle components deliberately rather than assuming you'll get round to it.",
      "Request deletion of the personal data Aura holds when you close the account.",
    ],
    faqs: [
      {
        question: "Is Aura good for data removal specifically?",
        answer:
          "It's adequate but not the strongest option. Removal is one feature inside a large identity-protection suite rather than the core product, and dedicated services cover more brokers and re-check more often. Buy Aura for the bundle; buy a specialist for removal.",
      },
      {
        question: "What is the best Aura alternative?",
        answer:
          "For removal alone, Incogni, OneRep, DeleteMe and EasyOptOuts all do that job more thoroughly. For removal plus discovery of the accounts in your inbox, Footprint Finder (our product) covers both. If it's the identity-theft insurance you want, that's the part with no real substitute on this list.",
      },
      {
        question: "Is identity theft insurance worth it?",
        answer:
          "It's genuinely useful if your identity has already been compromised or you're at elevated risk, mainly because the restoration support saves enormous amounts of time. It doesn't prevent anything, though — it's a recovery product, so pairing it with actual removal makes more sense than treating it as a substitute.",
      },
      {
        question: "Aura vs Incogni — which is better?",
        answer:
          "Different products. Incogni removes you from brokers and does nothing else, cheaply and well. Aura bundles thinner removal with insurance, credit monitoring, antivirus and a VPN. If removal is the goal, Incogni. If you want one subscription covering everything, Aura.",
      },
      {
        question: "Does Aura scan my email for accounts?",
        answer:
          "No. Aura monitors credit files, breach databases and public records, but it doesn't connect to your inbox, so the accounts you've forgotten about stay invisible to it.",
      },
    ],
    verdict:
      "Aura is a good bundle and a secondary removal tool. If you want insurance and credit monitoring under one bill, buy it. If you want your data actually gone, buy a specialist and spend the difference elsewhere.",
  },

  // ------------------------------------------------------------------ Kanary
  kanary: {
    shortTake:
      "Reputation-focused, covering search results and court records alongside broker listings.",
    bestForShort: "Search-result and reputation cleanup",
    whySeekAlternatives: [
      "It's priced near the top of the category for a mid-sized broker list.",
      "Some of the reputation monitoring overlaps with things you can do free in Google.",
      "No inbox scanning and no breach-database integration.",
      "Court-record removal, a genuine differentiator, sits at the higher tiers.",
    ],
    sections: [
      {
        heading: "What Kanary genuinely does better",
        body: [
          "Kanary thinks about the problem as reputation rather than databases, and that framing produces a different product. It watches what surfaces when someone searches your name — not just whether a broker holds a record, but whether it's visible.",
          "That matters because those are genuinely different problems. A listing buried on page nine of a site nobody visits is technically exposure and practically irrelevant. A result on page one of Google for your name is the thing that actually costs you a job offer or a date. Kanary optimises for the second.",
          "Court-record removal at the higher tiers is a real differentiator too. Court records are among the hardest categories to address and most competitors don't attempt them.",
        ],
      },
      {
        heading: "Where Kanary leaves you exposed",
        body: [
          "The price is the sticking point. Kanary sits near the top of the category with a mid-sized broker list, and if plain broker removal is what you want, several competitors do it more comprehensively for less.",
          "Some of the reputation monitoring is also work you can do yourself for nothing. Setting up a Google Alert for your own name takes two minutes, and Google's own 'Results about you' tool handles removal requests for pages exposing your contact details free of charge. Neither replaces the removal work, but both narrow the gap.",
          "There's no inbox scanning and no breach monitoring, so the account-level exposure stays invisible.",
        ],
      },
      {
        heading: "When reputation framing is the right framing",
        body: [
          "Kanary makes most sense if being findable is your specific problem: you're job-hunting with something unflattering in your results, you've been written about, you're a public-facing professional, or there's a court record you'd rather wasn't the first thing a search returns.",
          "It makes least sense if you're doing general privacy hygiene. For that, you're paying a reputation-management premium for a broker service, and the money goes further elsewhere.",
        ],
      },
    ],
    switchNotes: [
      "Confirm which tier you're on — court-record removal is a higher-tier feature and the main reason to be there.",
      "Save your search-result baseline before cancelling so you can tell if things regress.",
      "Set up a free Google Alert for your name as a cheap replacement for the monitoring piece.",
      "Request deletion of the personal data Kanary holds when you close the account.",
    ],
    faqs: [
      {
        question: "What is the best Kanary alternative?",
        answer:
          "For broker removal at lower cost, Incogni, OneRep and EasyOptOuts all cover more sites for less. DeleteMe is the alternative if human review matters. Footprint Finder (our product) covers brokers plus inbox account discovery. For pure reputation management, you're looking at a different category of service — that's not really what any of the removal tools do.",
      },
      {
        question: "Does Kanary remove court records?",
        answer:
          "It offers court-record removal at higher tiers, which most competitors don't attempt at all. Success varies enormously by jurisdiction — some records are genuinely permanent public documents — so treat it as an attempt at suppression rather than a guarantee of deletion.",
      },
      {
        question: "Is Kanary worth the price?",
        answer:
          "If your problem is what shows up when someone searches your name, the reputation framing justifies the premium. If your problem is general data-broker exposure, you're paying near the top of the category for a mid-sized broker list, and the money goes further elsewhere.",
      },
      {
        question: "Can I clean up my Google results myself?",
        answer:
          "Partly, and it's worth doing regardless. Google's 'Results about you' tool lets you request removal of results exposing your phone number, home address or email, free. That handles visibility but not the underlying listing — the broker still holds the record and it can resurface, so the two approaches complement each other.",
      },
      {
        question: "Kanary vs DeleteMe — which is better?",
        answer:
          "DeleteMe is the more established pure removal service with human-filed requests. Kanary casts a wider net around your public visibility, including search results and court records. Choose by which problem you actually have: database listings, or what people find when they look you up.",
      },
    ],
    verdict:
      "Kanary is the right tool if being findable is the problem — search results, court records, reputation. It's an expensive way to buy plain broker removal if that's all you need.",
  },

  // -------------------------------------------------------------------- Mine
  mine: {
    shortTake:
      "Inbox-based discovery with a free tier and a clean interface. Sends requests; doesn't remove broker listings.",
    bestForShort: "Free, one-off GDPR-style inbox cleanup",
    whySeekAlternatives: [
      "It doesn't do data-broker removal at all, which is what most people want from this category.",
      "Generic deletion requests get lower response rates than targeted ones.",
      "No breach monitoring.",
      "The free tier is limited and the upgrade prompts are persistent.",
    ],
    sections: [
      {
        heading: "What Mine genuinely does better",
        body: [
          "Mine got to the right idea before most of the category: your inbox is the definitive record of which companies hold your data. Order confirmations, password resets and marketing mail are each proof that a specific company has something of yours, and no amount of scanning public databases surfaces that.",
          "The execution is clean. The interface is the nicest in this comparison, the free tier genuinely works, and the GDPR framing is well-suited to European users, where the legal footing behind a deletion request is strongest.",
          "As a way to spend an afternoon getting a sense of your own footprint at zero cost, it's a good product and we'd rather say so than pretend otherwise.",
        ],
      },
      {
        heading: "The gap: sending requests isn't removal",
        body: [
          "Mine's model is to identify companies and send them deletion requests. The gap is what happens next. A request sent to a generic support address gets a materially different response rate than one sent to the specific privacy contact a company is obliged to monitor, and finding that contact is genuinely hard work — it's often buried several clicks deep in a legal page, or only in a privacy policy footer.",
          "The other gap is scope. Mine doesn't do data-broker removal. If your concern is that a stranger can look up your home address and phone number on a people-search site, Mine doesn't address it — that's a different mechanism entirely, and it's the mechanism most of this category exists to handle.",
        ],
      },
      {
        heading: "Mine vs the inbox-scanning approach generally",
        body: [
          "This is the most direct comparison on our list, because Footprint Finder starts from the same premise: read the inbox, find the accounts, act on them. We should be clear that we're describing our own product here.",
          "The differences are depth and scope. On depth, the work is in contact discovery — probing a company's sitemap, footer and legal pages to find the address that actually gets read, rather than defaulting to a generic inbox. On scope, our Complete plan adds broker removal and breach monitoring alongside the inbox work, so the public-database side is covered by the same subscription.",
          "If Mine's free tier does what you need and broker listings aren't your worry, Mine is a perfectly good place to stop, and it costs nothing. The case for paying is if you want the requests to land and the public-records side handled too.",
        ],
      },
    ],
    switchNotes: [
      "Mine's free tier is worth keeping around even if you move — it costs nothing.",
      "Deletion requests already sent stay sent; responses may keep arriving after you stop using it.",
      "Mine has changed its pricing more than once, so verify current rates before comparing.",
      "Request deletion of the data Mine holds if you close the account entirely.",
    ],
    faqs: [
      {
        question: "Does Mine remove you from data brokers?",
        answer:
          "No. Mine identifies companies from your inbox and sends them deletion requests. People-search sites and data brokers work through a different mechanism — they compile records from public sources rather than from a signup — and Mine doesn't address that side. If broker listings are your concern, you need a removal service.",
      },
      {
        question: "Is Mine free?",
        answer:
          "There's a genuinely functional free tier that scans your inbox and surfaces the services holding your data, with paid tiers above it. The free tier is worth running regardless of what else you use.",
      },
      {
        question: "What is the best Mine alternative?",
        answer:
          "Footprint Finder (our product) is the closest structural match — same inbox-scanning premise, with deeper privacy-contact discovery, plus broker removal and breach monitoring on the Complete plan. If you want broker removal specifically and don't care about inbox accounts, Incogni, OneRep or EasyOptOuts are the ones to look at.",
      },
      {
        question: "Do GDPR deletion requests actually work?",
        answer:
          "They do when they reach the right recipient. Companies subject to GDPR — and to CCPA/CPRA and its state equivalents in the US — are legally obliged to respond within a set window. The failure mode is almost never the law; it's the request landing in a generic support queue instead of with whoever handles privacy requests.",
      },
      {
        question: "Is it safe to give an app access to my email?",
        answer:
          "It depends entirely on the access requested. Read-only metadata access — sender, subject and date, never message bodies — is a much smaller grant than full mailbox read access, and any service asking for more than it needs deserves scrutiny. Check the specific OAuth scopes at the consent screen rather than trusting the marketing copy, and revoke access from your Google or Microsoft account settings the moment you stop using a service.",
      },
    ],
    verdict:
      "Mine had the right idea first and the free tier is genuinely worth using. It stops short of removal — no broker listings, and requests that don't always reach the right desk. Good starting point, incomplete finish.",
  },
};

export const getCompetitorArticle = (slug: string): CompetitorArticle | undefined =>
  COMPETITOR_ARTICLES[slug];
