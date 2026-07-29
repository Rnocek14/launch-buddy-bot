/**
 * Competitor-vs-competitor comparison pages — /vs/:a-vs-:b
 *
 * WHY THESE EXIST
 * ---------------
 * "DeleteMe vs Incogni" is searched far more than any query containing our
 * own brand name. Pages that answer a competitor-vs-competitor question are
 * how an unknown brand enters the consideration set: someone arrives wanting
 * a neutral answer, gets one, and meets us as a third option at the end.
 *
 * That only works if the page is genuinely neutral. These pages must give a
 * real recommendation between A and B — including recommendations that don't
 * end with "so use us". A page that steers every comparison back to our
 * product is worthless for this purpose and will be treated as such by both
 * readers and search engines.
 *
 * SLUG CANONICALISATION
 * ---------------------
 * "deleteme-vs-incogni" and "incogni-vs-deleteme" are the same page. Only the
 * canonical order below is rendered; the reverse resolves to it so we never
 * ship two URLs with identical content. See resolveHeadToHead().
 */

import { COMPETITORS, type CompetitorData } from "./competitors";

export interface HeadToHead {
  /** Canonical slug, always "<a>-vs-<b>". */
  slug: string;
  a: string;
  b: string;
  /** One line naming the real trade-off. Rendered as the page's standfirst. */
  angle: string;
  /**
   * SERP snippet. Kept separate from `angle` and under 160 characters —
   * Google truncates past roughly that, and a description cut mid-clause
   * costs clicks.
   */
  metaDescription: string;
  /** Unique prose. 2–3 sections. */
  sections: Array<{ heading: string; body: string[] }>;
  /** Who should pick A. */
  pickA: string;
  /** Who should pick B. */
  pickB: string;
  faqs: Array<{ question: string; answer: string }>;
}

export const HEAD_TO_HEADS: HeadToHead[] = [
  {
    slug: "deleteme-vs-incogni",
    metaDescription:
      "DeleteMe files removals by hand across a smaller broker list; Incogni automates a much larger one for less. Here's which one to pick.",
    a: "deleteme",
    b: "incogni",
    angle:
      "Human-filed removals across a smaller broker list, versus automated removals across a much larger one for less money.",
    sections: [
      {
        heading: "The real difference: people versus scripts",
        body: [
          "This comparison gets framed as a price fight, but the substantive difference is how the removal requests get filed. DeleteMe has staff submitting them. Incogni automates the process end to end.",
          "That matters because opt-out forms are hostile by design. Brokers add CAPTCHAs, require email confirmation loops, redesign pages and bury the form behind three redirects. A script handles the happy path and fails silently when the page changes — and a failed request often still reports as submitted. A person hitting the same wall finds the other route.",
          "The counter-argument is volume. Incogni's automation covers several times more brokers than DeleteMe reaches, and a request that gets filed imperfectly against 400+ sites may leave you less exposed than a request filed perfectly against 100. Neither position is obviously right; it depends on whether the brokers listing you are in DeleteMe's narrower, better-covered set.",
        ],
      },
      {
        heading: "Price and what you actually get for it",
        body: [
          "Incogni is the cheaper of the two and covers substantially more sites, which makes the headline comparison look one-sided. Read past the headline and it's closer: you're comparing breadth against filing quality and reporting.",
          "DeleteMe's reports tell you what was found and what happened to it. Incogni's dashboard tells you requests were sent and gives you statuses. If you want to understand your exposure rather than watch a counter, DeleteMe's output is more legible — and for some people that legibility is what makes the subscription feel worth renewing.",
        ],
      },
      {
        heading: "What neither of them does",
        body: [
          "Both services look exclusively at public people-search databases. Neither has any visibility into the accounts you've created over the years — the retailer with your card on file, the app from a since-abandoned hobby, the service you signed up for once and forgot.",
          "That gap matters because it's a loop. Dormant accounts get breached, your details circulate, brokers ingest the new data, and the listings either service removed six months ago come back from a fresh source. Removing listings without closing the accounts that feed them is maintenance, not a fix.",
          "Neither service checks breach databases either, so if your email appears in a dump, you'll hear about it from somewhere else or not at all.",
        ],
      },
    ],
    pickA: "You want humans filing your removals and reports you can actually read, and you're willing to pay a premium for a narrower list. Particularly defensible if you're dealing with an active safety concern rather than general hygiene.",
    pickB: "You want the widest broker coverage on autopilot at the lower price, and you're comfortable trusting automation to keep grinding without you checking on it.",
    faqs: [
      {
        question: "Is Incogni better than DeleteMe?",
        answer:
          "Incogni covers more brokers for less money. DeleteMe files requests by hand and reports more clearly. Incogni is the better default for most people on cost and coverage; DeleteMe is the better choice if you specifically distrust automated removal or need the clearer paper trail.",
      },
      {
        question: "Which is cheaper, DeleteMe or Incogni?",
        answer:
          "Incogni, and by a meaningful margin — while also covering several times more broker sites. If price per broker covered is your metric, it isn't close.",
      },
      {
        question: "Can I use DeleteMe and Incogni together?",
        answer:
          "You can, and the overlap is large enough that it's usually a waste. If you want to double up on anything, pairing one broker service with something that covers a different category — your inbox accounts, or breach monitoring — adds more than running two broker services in parallel.",
      },
      {
        question: "Do DeleteMe and Incogni remove you from Google?",
        answer:
          "Only indirectly. Removing the broker listing usually causes the search result to drop out when Google re-crawls, which takes weeks. Google's own 'Results about you' tool is a separate free route for results exposing your contact details, and it's worth running alongside either service.",
      },
    ],
  },
  {
    slug: "deleteme-vs-optery",
    metaDescription:
      "DeleteMe's flat price and human filing vs Optery's free exposure report and tiered coverage. Which one actually fits your situation.",
    a: "deleteme",
    b: "optery",
    angle:
      "A flat premium price with human filing, versus tiered pricing with a free exposure report and photographic proof of removals.",
    sections: [
      {
        heading: "Optery shows you the evidence first",
        body: [
          "The clearest practical difference is that Optery lets you see your exposure before paying anything. Its free report surfaces your actual listings — the profile, the address, the relatives — with screenshots. DeleteMe asks you to commit first.",
          "That difference persists into the paid product. Optery documents removals with before-and-after evidence; DeleteMe reports what its team did. Both are more transparent than the category norm, but Optery's is the higher standard of proof, and if you're the kind of person who wants to verify rather than trust, it's the more satisfying product.",
        ],
      },
      {
        heading: "The tier trap",
        body: [
          "The catch with Optery is that its entry price and its real coverage live on different plans. The cheapest tier covers a fraction of what the top tier does, so comparing Optery's entry price against DeleteMe's single flat price isn't a like-for-like comparison.",
          "Do the comparison against whichever Optery tier actually covers the brokers listing you — which the free report will tell you. Depending on where you appear, that can land either side of DeleteMe's price.",
          "DeleteMe's flat pricing is genuinely simpler. There's one number, it covers what it covers, and there's no upgrade path to reason about. Some people will pay a premium for that alone.",
        ],
      },
    ],
    pickA: "You want one price, no tier decisions, and people rather than scripts filing your removals.",
    pickB: "You want to see your exposure before spending anything, you value photographic proof that a listing was removed, and you're happy to work out which tier you need.",
    faqs: [
      {
        question: "Is Optery better than DeleteMe?",
        answer:
          "Optery gives you a free exposure report and evidence-backed removals, and can cover more brokers at its upper tiers. DeleteMe is simpler to buy and files requests by hand. Optery is the better pick if transparency and coverage matter most; DeleteMe if you want one price and human review.",
      },
      {
        question: "Is Optery's free report worth running?",
        answer:
          "Yes, regardless of which service you eventually buy. It's the fastest way to see which brokers actually list you, and that inventory is the baseline you need to judge whether anything you pay for is working.",
      },
      {
        question: "Which Optery tier compares to DeleteMe?",
        answer:
          "Not the entry one. Run the free report to see which brokers list you, then price the tier that covers those specific sites. That's the comparison that matters, and it can land either above or below DeleteMe's flat price.",
      },
    ],
  },
  {
    slug: "incogni-vs-optery",
    metaDescription:
      "Incogni's single automated plan vs Optery's free report and tiered coverage. Less thinking or more proof — which matters more to you?",
    a: "incogni",
    b: "optery",
    angle:
      "One flat automated plan versus a free exposure report with tiered coverage and documented removals.",
    sections: [
      {
        heading: "Simplicity versus proof",
        body: [
          "These two are close on the fundamentals — both automate broad broker removal and both re-check regularly. The choice comes down to how you like to buy and how much you want to see.",
          "Incogni is one plan. You pay, it runs, you don't think about it again. Optery is a free report plus a tier decision, in exchange for genuinely showing you what's out there and documenting what it removed.",
          "If you find privacy tooling stressful and want it handled, Incogni's model is less cognitive load. If you find it stressful because you can't tell whether anything is actually happening, Optery's evidence is the antidote.",
        ],
      },
      {
        heading: "Coverage is closer than the marketing suggests",
        body: [
          "Both companies advertise large broker lists, and both numbers deserve the same scepticism. Coverage counts are self-reported, defined differently by each vendor, and inflated by obscure sites that never surface in a search for your name.",
          "The comparison that actually matters is whether the specific sites listing you are covered. Optery's free report answers that directly. With Incogni you're taking it on trust — which is fine, but it's worth noticing that one of these services will tell you before you pay and the other won't.",
        ],
      },
    ],
    pickA: "You want one price, no decisions, and no ongoing involvement.",
    pickB: "You want to see your listings before paying, and proof that they went.",
    faqs: [
      {
        question: "Is Incogni or Optery better?",
        answer:
          "Incogni is simpler — one plan, fully automated, no tier maths. Optery is more transparent — free exposure report, documented removals, coverage that scales with the tier you pick. Both do the core job competently; pick on whether you want less thinking or more proof.",
      },
      {
        question: "Which is cheaper, Incogni or Optery?",
        answer:
          "It depends entirely on the Optery tier. Optery's entry plan undercuts Incogni but covers considerably less; the tiers that match Incogni's coverage cost more. Compare against the tier that covers the brokers actually listing you.",
      },
      {
        question: "Can I use Optery's free tier with Incogni?",
        answer:
          "Yes, and it's a sensible combination. Optery's free report gives you an independent view of which brokers still list you, which is a useful check on whether Incogni's automation is landing.",
      },
    ],
  },
  {
    slug: "incogni-vs-onerep",
    metaDescription:
      "Incogni and OneRep are close on coverage and price. The dashboard, the corporate backing and one trust question decide it.",
    a: "incogni",
    b: "onerep",
    angle:
      "Two of the widest automated broker lists in the category. Close on mechanics; the deciding factor is usually trust.",
    sections: [
      {
        heading: "Mechanically, these are very similar products",
        body: [
          "Both run broad automated removal across large broker lists with regular re-scans, at comparable prices. If you drew up a feature table you'd struggle to separate them, and either would do the job.",
          "OneRep's dashboard is the more legible of the two — clearer progress tracking, easier to see which requests are in flight. Incogni leans harder on legally-grounded requests rather than voluntary opt-out forms, which gives brokers a statutory clock rather than a suggestion.",
        ],
      },
      {
        heading: "The deciding factor is usually the trust question",
        body: [
          "In 2024, reporting raised questions about the OneRep founder's prior involvement in building people-search sites — the same kind of business the service removes you from. OneRep has responded publicly.",
          "We're not going to adjudicate that, and we'd rather point you at the primary sources than characterise them: look up the KrebsOnSecurity coverage and OneRep's response. But since both services require your name, address history and date of birth, and since they're otherwise so evenly matched, this is realistically the thing that decides it for most people.",
          "Incogni's Surfshark ownership is the counterweight — an established company with a reputation at stake. Whether that reassures you is a personal judgement.",
        ],
      },
    ],
    pickA: "You want the corporate backing of an established parent company and legally-framed requests.",
    pickB: "You want the clearest progress dashboard in the category, and you've read the 2024 reporting and are comfortable with it.",
    faqs: [
      {
        question: "Is OneRep or Incogni better?",
        answer:
          "They're close on coverage, automation and price. OneRep has the better dashboard; Incogni has stronger corporate backing through Surfshark. For most people the decision comes down to how they weigh the 2024 reporting about OneRep's founder — worth reading the primary sources rather than any summary.",
      },
      {
        question: "Is OneRep trustworthy?",
        answer:
          "There's specific 2024 reporting about the founder's prior involvement with people-search businesses, and a public response from the company. Read both and decide. It's a fair question to ask of any service you hand your address history and date of birth to — including ours.",
      },
      {
        question: "Do Incogni and OneRep cover the same brokers?",
        answer:
          "There's heavy overlap, and both advertise large lists. As with every vendor, the counts are self-reported and not directly comparable. What matters is whether the sites that surface when someone searches your name are covered by whichever you pick.",
      },
    ],
  },
  {
    slug: "deleteme-vs-onerep",
    metaDescription:
      "DeleteMe's manual filing and long track record vs OneRep's wider automated coverage and clearer dashboard. How to choose between them.",
    a: "deleteme",
    b: "onerep",
    angle:
      "Established manual filing across a narrow list, versus broad automation with a clearer dashboard and an open trust question.",
    sections: [
      {
        heading: "Coverage versus filing quality",
        body: [
          "OneRep covers several times more broker sites than DeleteMe and costs less. DeleteMe pays people to file the requests and has been doing it since 2010.",
          "Which wins depends on your view of automated opt-outs. If you think a script submitting 200 forms beats a human submitting 30, OneRep is the obvious buy. If you've watched an automated service report removals that clearly hadn't happened, DeleteMe's manual approach is what you're paying the premium for.",
        ],
      },
      {
        heading: "Track record cuts both ways",
        body: [
          "DeleteMe's fifteen years in the category is a genuine asset — long-standing broker relationships, an established process, and no notable trust controversies.",
          "OneRep's history includes 2024 reporting about its founder's prior involvement with people-search sites, along with a public response from the company. Read the primary sources — the KrebsOnSecurity coverage and OneRep's reply — before deciding. Between two otherwise capable services, this is the kind of thing that reasonably tips a decision.",
        ],
      },
    ],
    pickA: "You want the longest track record and human review, and coverage breadth matters less to you than confidence that requests actually landed.",
    pickB: "You want substantially more coverage for less money and a better dashboard, and you're comfortable with the ownership history after reading it.",
    faqs: [
      {
        question: "Is OneRep better than DeleteMe?",
        answer:
          "OneRep covers more brokers for less and has a clearer dashboard. DeleteMe files by hand and has a longer, quieter track record. On raw value OneRep wins; on trust and filing quality DeleteMe does.",
      },
      {
        question: "Which removes data faster, DeleteMe or OneRep?",
        answer:
          "First-pass timelines are set by the brokers, not the service — typically 7–30 days for a verified opt-out. The difference that matters is what happens on month four, when listings start reappearing and re-scan cadence decides how long you stay exposed.",
      },
    ],
  },
  {
    slug: "incogni-vs-aura",
    metaDescription:
      "Incogni removes you from data brokers; Aura bundles thinner removal with identity insurance and credit monitoring. Which one to buy.",
    a: "incogni",
    b: "aura",
    angle:
      "A focused removal tool versus an identity-protection bundle where removal is one feature among many.",
    sections: [
      {
        heading: "These aren't really the same product",
        body: [
          "Incogni removes you from data brokers. That's the whole product, and it does it well. Aura is an identity-theft suite — insurance, credit monitoring across three bureaus, antivirus, a VPN, a password manager — with broker removal bundled in as one component.",
          "If you compare them on removal alone, Incogni wins clearly: more thorough, cheaper, and it's the entire focus of the business rather than a checkbox on a feature list.",
          "But that comparison misses why people buy Aura. Removal reduces the odds of something going wrong. Insurance and restoration support handle the aftermath when it does. Those are different products solving different halves of the problem, and if you've already been through identity theft once, the second half stops being theoretical.",
        ],
      },
      {
        heading: "Doing the bundle maths honestly",
        body: [
          "The bundle is worth it if you'd otherwise buy the components. Credit monitoring, antivirus, a VPN and a password manager bought separately add up, and Aura's price starts to look reasonable against that basket.",
          "It's poor value if you wouldn't. Most operating systems now ship competent antivirus, there are credible free password managers, and a VPN is optional for most threat models. Strip those out and you're paying bundle prices for thinner removal than a specialist provides.",
          "Also check whether you're looking at an introductory rate. Aura's renewal price is typically higher than the first-year price, which changes the maths in year two.",
        ],
      },
    ],
    pickA: "Removal is what you actually want, and you'd rather have it done thoroughly and cheaply than bundled.",
    pickB: "You want identity-theft insurance and credit monitoring under one bill, and you'd otherwise be paying for several of the bundled components anyway.",
    faqs: [
      {
        question: "Is Aura or Incogni better for data removal?",
        answer:
          "Incogni, clearly. It covers more brokers and removal is its entire business rather than one feature inside a suite. Aura's advantage is everything else in the bundle — insurance, credit monitoring, antivirus — which Incogni doesn't attempt.",
      },
      {
        question: "Does Aura include data broker removal?",
        answer:
          "Yes, as part of its broader identity-protection product. Coverage is thinner than a dedicated remover's, because for Aura it's one feature among a dozen rather than the whole company.",
      },
      {
        question: "Can I use Incogni and Aura together?",
        answer:
          "You can, and unlike stacking two broker services it isn't obviously wasteful — you'd be pairing thorough removal with insurance and credit monitoring, which cover genuinely different ground. Whether it's worth two subscriptions is a budget question rather than an overlap one.",
      },
    ],
  },
  {
    slug: "incogni-vs-easyoptouts",
    metaDescription:
      "EasyOptOuts costs a fraction of Incogni for similar coverage. What the price difference actually buys, and when it's worth paying.",
    a: "incogni",
    b: "easyoptouts",
    angle:
      "A polished automated service versus a bare-bones one at a fraction of the price, doing broadly the same job.",
    sections: [
      {
        heading: "What the price difference actually buys",
        body: [
          "EasyOptOuts costs a fraction of Incogni and covers a broker list in the same broad territory. That's an uncomfortable comparison for the premium end of this category, and it's worth taking seriously rather than explaining away.",
          "What Incogni's price buys is cadence and product. More frequent re-scans mean less time listed between sweeps — and since re-listing is the central problem here, that's a real difference rather than a cosmetic one. You also get a dashboard, statuses and support, where EasyOptOuts sends you an email.",
          "What it doesn't buy is fundamentally better removal. Both submit opt-outs to the same brokers through the same mechanisms.",
        ],
      },
      {
        heading: "Which one is right depends on your threat model",
        body: [
          "If nobody is actively looking for you — no harassment, no stalking, no public-facing role — the gap between these two is mostly comfort. EasyOptOuts handles the tedious part at a price that doesn't need justifying, and the slower re-scan cadence is an acceptable trade.",
          "If someone is actively looking for you, cadence matters. A longer gap between sweeps is a longer window where a re-listed profile sits there findable. That's when Incogni's price becomes defensible.",
          "Be honest with yourself about which situation you're in. Most people buying privacy tools are in the first one and paying for the second.",
        ],
      },
    ],
    pickA: "You want faster re-scans, a real dashboard and support — and you're in a situation where the time between sweeps actually matters.",
    pickB: "You want the job done at the lowest credible price and don't need software wrapped around it.",
    faqs: [
      {
        question: "Is EasyOptOuts as good as Incogni?",
        answer:
          "For the core removal job it's closer than the price gap suggests — similar broad coverage, same fundamental mechanism. Incogni re-scans more often and gives you a dashboard and support. Whether that's worth several times the price depends on whether the gap between sweeps matters in your situation.",
      },
      {
        question: "Why is EasyOptOuts so cheap?",
        answer:
          "It ships almost no product around the removals. No dashboard, no detailed reporting, no support tier — you get an email summary. The savings come from what's absent around the service, not from the service itself.",
      },
      {
        question: "Which should I pick if I'm on a budget?",
        answer:
          "EasyOptOuts, comfortably. And if the budget is zero, every broker opt-out is free to do yourself — we publish step-by-step guides for 45+ of them. Roughly ten minutes a site, repeated a few times a year.",
      },
    ],
  },
  {
    slug: "deleteme-vs-privacybee",
    metaDescription:
      "DeleteMe focuses on people-search removal; Privacy Bee contacts ordinary companies too, at the highest price here. Which to pick.",
    a: "deleteme",
    b: "privacybee",
    angle:
      "Focused people-search removal by hand, versus the widest corporate-data outreach in the category at the highest price.",
    sections: [
      {
        heading: "Two different definitions of the job",
        body: [
          "DeleteMe defines the problem as people-search listings and solves it thoroughly with human filing. Privacy Bee defines it as corporate data-holding generally and contacts ordinary companies — retailers, marketers, processors — alongside the broker sites.",
          "Privacy Bee's definition is closer to what most people mean when they say they want their data deleted. It's also considerably more expensive, and a share of that outreach is speculative: requests sent to companies that may hold nothing of yours, because there's no way to know which ones do without looking somewhere Privacy Bee doesn't look.",
        ],
      },
      {
        heading: "Both are premium; neither sees your accounts",
        body: [
          "These are the two most expensive options in the category, and they share the same structural blind spot. Neither reads your inbox, which is the only definitive record of which companies actually hold your data.",
          "That's a particularly sharp limitation for Privacy Bee, whose entire proposition is reaching ordinary companies. It works from a generic list of companies rather than your list. Your order confirmations and password resets are the ground truth, and they go unread.",
        ],
      },
    ],
    pickA: "People-search listings are the specific problem, and you want them handled by people rather than scripts.",
    pickB: "You want the widest possible net across ordinary companies as well as brokers, and the budget is a secondary concern.",
    faqs: [
      {
        question: "Is Privacy Bee worth the extra over DeleteMe?",
        answer:
          "Only if you want the broader corporate outreach. For people-search removal specifically, DeleteMe does that job well and both are expensive relative to the automated alternatives. If it's just broker listings you care about, neither is the value pick.",
      },
      {
        question: "Which covers more sites, DeleteMe or Privacy Bee?",
        answer:
          "Privacy Bee, substantially — and it also contacts ordinary companies outside the people-search category entirely. DeleteMe covers a narrower list but files each request by hand.",
      },
    ],
  },
  {
    slug: "optery-vs-onerep",
    metaDescription:
      "Optery's free report and documented removals vs OneRep's flat pricing and broad automation, plus the trust question to read up on.",
    a: "optery",
    b: "onerep",
    angle:
      "Free exposure report and documented removals against tiers, versus flat-priced broad automation with an open trust question.",
    sections: [
      {
        heading: "Both are strong on transparency, differently",
        body: [
          "Optery's transparency is evidential — it shows you the listings before you pay and documents removals afterwards. OneRep's is operational — the dashboard makes it easy to see what's in flight and what came back.",
          "For most people Optery's version is the more reassuring, because it answers 'is this real?' rather than 'is this running?'. Optery's free report is worth running whichever service you end up buying, purely as an independent check.",
        ],
      },
      {
        heading: "Pricing structure is the practical difference",
        body: [
          "OneRep is one plan. Optery is several, and the entry tier covers considerably less than the top one. That means Optery can be cheaper or more expensive than OneRep depending on where you actually appear — which you'll only know after running the free report.",
          "Set against that, there's the 2024 reporting on OneRep's founder and prior involvement with people-search sites, and OneRep's public response. Worth reading the primary sources before deciding, since these two are otherwise closely matched.",
        ],
      },
    ],
    pickA: "You want to see your exposure before paying and get evidence that removals happened.",
    pickB: "You want one flat price with broad coverage and no tier decision, having read the ownership reporting.",
    faqs: [
      {
        question: "Is Optery or OneRep better?",
        answer:
          "Optery gives you a free exposure report and documented removals; OneRep gives you flat pricing and a strong dashboard. Optery is the better pick if you want proof; OneRep if you want simplicity. The 2024 reporting on OneRep's founder is worth reading before deciding.",
      },
      {
        question: "Which is cheaper, Optery or OneRep?",
        answer:
          "It depends on the Optery tier you need. Optery's entry plan undercuts OneRep but covers less; the comparable tiers cost more. Run Optery's free report to see which brokers list you, then compare properly.",
      },
    ],
  },
  {
    slug: "deleteme-vs-aura",
    metaDescription:
      "DeleteMe removes your data; Aura insures you after something goes wrong. Prevention vs recovery, and which one you need first.",
    a: "deleteme",
    b: "aura",
    angle:
      "A dedicated removal service versus an identity suite that bundles thinner removal with insurance and credit monitoring.",
    sections: [
      {
        heading: "Prevention versus recovery",
        body: [
          "DeleteMe reduces the chance of something happening by getting your details out of the databases attackers and scammers use. Aura is largely built around what happens afterwards — insurance, restoration support, credit monitoring that tells you when someone opens an account in your name.",
          "Framed that way they're complements rather than substitutes. The problem is that both are priced as complete solutions, so most people buy one and assume it covers the other.",
        ],
      },
      {
        heading: "If you can only buy one",
        body: [
          "Buy on which failure you find more plausible. If you're getting scam calls that know your address, being harassed, or working in a public-facing role, the exposure is live and removal is the priority — DeleteMe.",
          "If you've already had your identity stolen, or you're managing credit risk across a household, recovery capability is worth more than marginal removal coverage — Aura.",
          "Check Aura's renewal rate before committing, too. The introductory price is typically lower than what you'll pay in year two.",
        ],
      },
    ],
    pickA: "Public exposure is the live problem and you want it dealt with thoroughly.",
    pickB: "You want insurance, restoration support and credit monitoring, and you accept thinner removal as part of the bundle.",
    faqs: [
      {
        question: "Does Aura replace DeleteMe?",
        answer:
          "Not really. Aura includes broker removal, but it's one feature in a large suite and less thorough than a dedicated service. If removal is the reason you're buying, a specialist does it better.",
      },
      {
        question: "Is identity theft insurance better than data removal?",
        answer:
          "They solve different halves of the problem — insurance is recovery, removal is prevention. Neither substitutes for the other. If you're choosing, pick based on whether your exposure is currently live or your risk is mainly financial.",
      },
    ],
  },
];

/** Canonical lookup: "a-vs-b". */
const BY_SLUG = new Map(HEAD_TO_HEADS.map((h) => [h.slug, h]));
/** Reverse lookup: "b-vs-a" resolves to the canonical entry. */
const BY_REVERSE = new Map<string, HeadToHead>(
  HEAD_TO_HEADS.map((h) => [`${h.b}-vs-${h.a}`, h]),
);

export interface ResolvedHeadToHead {
  data: HeadToHead;
  a: CompetitorData;
  b: CompetitorData;
  /** True when the requested slug was the reverse order and should redirect. */
  isReversed: boolean;
}

/**
 * Resolve a `/vs/:competitor` slug that looks like a pair.
 * Returns the canonical entry for either ordering; `isReversed` tells the
 * caller to redirect rather than render, so only one URL ever serves the page.
 */
export function resolveHeadToHead(slug: string): ResolvedHeadToHead | undefined {
  const key = slug.toLowerCase();
  const direct = BY_SLUG.get(key);
  const reversed = direct ? undefined : BY_REVERSE.get(key);
  const data = direct ?? reversed;
  if (!data) return undefined;
  const a = COMPETITORS[data.a];
  const b = COMPETITORS[data.b];
  if (!a || !b) return undefined;
  return { data, a, b, isReversed: Boolean(reversed) };
}

/** Pairs that mention a given competitor, for internal linking. */
export const headToHeadsFor = (competitorSlug: string): HeadToHead[] =>
  HEAD_TO_HEADS.filter((h) => h.a === competitorSlug || h.b === competitorSlug);

export const isHeadToHeadSlug = (slug: string): boolean =>
  slug.toLowerCase().includes("-vs-");
