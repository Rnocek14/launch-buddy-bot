// High-volume SEO "pillar" guides. Each entry powers /guides/:slug
// Targets the broad "remove my info from the internet" keyword cluster
// and funnels readers into the free scan.

export type GuideSection = {
  heading: string;
  body: string;
  bullets?: string[];
};

export type GuideFAQ = {
  question: string;
  answer: string;
};

export type GuideCategory =
  | "Discovery"
  | "Education"
  | "Google Removal"
  | "Removal";

export type Guide = {
  slug: string;
  /** Funnel stage / topic silo this guide belongs to. */
  category: GuideCategory;
  /** SEO <title> — lead with the primary keyword. */
  title: string;
  /** Meta description, < 160 chars. */
  description: string;
  /** On-page H1. */
  h1: string;
  /** Lead paragraph under the H1. */
  intro: string;
  /** Primary keyword phrase, used for context. */
  primaryKeyword: string;
  readTime: string;
  sections: GuideSection[];
  faqs: GuideFAQ[];
};

export const GUIDES: Guide[] = [
  {
    slug: "california-drop-delete-act",
    category: "Removal",
    title: "California DROP: Delete Your Data From 500+ Brokers Free",
    description: "California's DROP deletes your data from every registered broker with one free request. How it works, what it misses, and who still needs more.",
    h1: "California DROP: one free request to delete your data from every registered broker",
    primaryKeyword: "California DROP Delete Act",
    readTime: "8 min",
    intro: "California residents can now delete their personal information from every registered data broker in the state with a single free request. The tool is called DROP — the Delete Request and Opt-Out Platform — it is run by the California Privacy Protection Agency, and from 1 August 2026 brokers are legally required to act on the requests sitting in it. If you live in California, this is the most valuable thing you can do for your privacy this year, and it costs nothing.",
    sections: [
      {
        heading: "What DROP is, in plain terms",
        body: "DROP came out of the Delete Act (SB 362), passed in California in 2023. Before it, deleting yourself from data brokers meant finding each company, locating its opt-out form, and submitting a request one at a time — several hundred times, then again a few months later. DROP replaces that with one verified request that every registered broker is obliged to check and honour. You submit once through the state; the brokers come to you.",
        bullets: [
          "Run by the California Privacy Protection Agency, not a private company",
          "Free — there is no paid tier and no upsell",
          "Covers every data broker registered with the state, which is several hundred businesses",
          "Registered brokers must check DROP at least every 45 days and finalise each request within 90 days",
        ],
      },
      {
        heading: "The dates that matter",
        body: "DROP opened to consumers on 1 January 2026, but there was a deliberate gap between consumers being able to file and brokers being required to act. That gap closes on 1 August 2026. Requests submitted before then have been queuing; from that date brokers face penalties reported at $200 per request per day for failing to process them. If you filed in January, this is the month it starts to bite. If you have not filed at all, filing now means you are in the queue for the first mandatory processing cycle.",
        bullets: [
          "1 January 2026 — DROP opens, consumers can submit requests",
          "1 August 2026 — registered data brokers must begin processing them",
          "Every 45 days — how often brokers must check DROP for new requests thereafter",
          "90 days — the window a broker has to finalise a request once retrieved",
        ],
      },
      {
        heading: "How to use it",
        body: "Go to the California Privacy Protection Agency's site at privacy.ca.gov and follow the DROP link. You will need to verify that you are a California resident, which is the step that makes the request legally binding on brokers — an unverified request is just an email. Set aside ten minutes. There is no cost, no account with a private company, and nothing to cancel later.",
        bullets: [
          "Start at privacy.ca.gov — the official state site, not a lookalike",
          "You must be a California resident, and you will be asked to verify it",
          "The request covers brokers registered with the state; you do not pick them individually",
          "Keep your confirmation — it is your proof of the filing date if a broker ignores you",
        ],
      },
      {
        heading: "What DROP does not cover",
        body: "This is the part most write-ups skip, and it is the part that decides whether you still need to do anything else. DROP is powerful within its boundaries and does nothing outside them. Those boundaries are real, and knowing them is the difference between thinking you are done and actually being done.",
        bullets: [
          "Only California residents can use it — there is no equivalent in any other state",
          "Only brokers registered with California are bound; a business that never registered is not reached by your request",
          "It does not touch the accounts you have created — the retailer holding your card, the app from an abandoned hobby, the service you signed up for once in 2019",
          "It does not address data breaches; if your details are already in a leaked dump, deletion from brokers does not retrieve them",
          "It does not remove search results directly — those usually drop out after the underlying listing goes, which takes weeks",
          "It is a deletion request, not a permanent block on re-collection; brokers rebuild from public records over time",
        ],
      },
      {
        heading: "Should you still pay for a removal service?",
        body: "If you live in California and your only concern is people-search listings, file with DROP first and see what it achieves before you spend anything. It is free, it is binding, and it covers more brokers than most paid plans. Anyone telling you otherwise is selling something — including us, so weigh this accordingly. There are still cases where a paid service earns its keep, and there are cases where it does not.",
        bullets: [
          "Paying still makes sense if you are outside California, since no other state offers this",
          "It makes sense if you need speed — DROP works on 45 and 90 day cycles, which is slow when someone is actively looking for you",
          "It makes sense if you want the accounts and breaches side handled, which DROP does not touch at all",
          "It makes less sense if you are a Californian who wants broker listings gone and can wait a cycle or two",
        ],
      },
      {
        heading: "What to do if you are not in California",
        body: "California is genuinely alone here. Texas, Oregon and Vermont all require data brokers to register with the state, which gives you a public list of who to contact, but none of them built a centralised deletion tool — you still file with each broker individually. Connecticut, Montana and others give you deletion rights you must exercise one company at a time. So the work is the same as it always was, and the question is only whether you do it yourself or pay someone.",
        bullets: [
          "Check whether your state has a broker registry — it tells you who holds your data",
          "Every broker opt-out is free by law; our guides cover the ones that matter most",
          "Budget around ten minutes per site, and repeat every few months as listings return",
          "Watch for your state adopting something DROP-like — California laws in this area tend to get copied",
        ],
      },
    ],
    faqs: [
      {
        question: "Is California DROP free?",
        answer: "Yes, entirely. DROP is run by the California Privacy Protection Agency, a state body. There is no paid tier, no subscription and no upsell. If you land on a page charging you to submit a DROP request, you are in the wrong place — go to privacy.ca.gov directly.",
      },
      {
        question: "When do data brokers have to honour DROP requests?",
        answer: "From 1 August 2026. Consumers have been able to file since 1 January 2026, but brokers were not obliged to act until August. After that date they must check DROP at least every 45 days and finalise each request within 90 days of retrieving it, with penalties reported at $200 per request per day for non-compliance.",
      },
      {
        question: "Does DROP delete my online accounts too?",
        answer: "No. DROP reaches data brokers — companies that compile and sell profiles built from public records and purchased data. It does not touch accounts you created yourself. The shopping site with your card on file, the old fitness app, the streaming trial you forgot: all of those still hold your data after a DROP request completes, and each has to be closed separately.",
      },
      {
        question: "Can I use DROP if I don't live in California?",
        answer: "No. DROP is limited to California residents and you have to verify residency to file. No other state has built an equivalent — Texas, Oregon and Vermont maintain broker registries but require you to contact each company individually, and other states with deletion rights work the same way.",
      },
      {
        question: "Do I still need a data removal service if I use DROP?",
        answer: "If you are a Californian who only cares about people-search listings, file with DROP first and judge the results before paying anyone. It is free and binds more brokers than most paid plans. A paid service still adds something if you are outside California, if you need faster cycles than 45 and 90 days, or if you want the accounts and breach side covered — which DROP does not do at all.",
      },
      {
        question: "How many data brokers does DROP cover?",
        answer: "It covers brokers registered with the California Privacy Protection Agency, which has been reported at roughly 500 to 600 businesses. The registry is public, and the agency publishes the current list along with each broker's contact details for exercising your rights directly.",
      },
      {
        question: "Will my data stay deleted after a DROP request?",
        answer: "Not permanently. Brokers rebuild their databases from public records, marketing data and each other, so profiles reappear over time. DROP is a deletion obligation, not a standing block on future collection. Treat it as maintenance you repeat rather than a one-time fix — which is true of every removal method, paid or free.",
      },
    ],
  },
  {
    slug: "remove-personal-information-from-internet",
    category: "Removal",
    title:
      "How to Remove Your Personal Information From the Internet",
    description:
      "A free, step-by-step guide to removing your personal information from the internet — data brokers, Google, breaches and old accounts.",
    h1: "How to Remove Your Personal Information From the Internet",
    primaryKeyword: "how to remove personal information from internet",
    readTime: "8 min read",
    intro:
      "Your name, address, phone number and relatives are scattered across hundreds of data-broker sites, search results, breach dumps and forgotten accounts. This guide walks through exactly how to remove your personal information from the internet — for free — and how to find every place you're exposed in about a minute.",
    sections: [
      {
        heading: "1. Find out where your information is exposed",
        body: "You can't delete what you can't see. Most people are listed on 50+ data brokers and have dozens of forgotten accounts tied to their email. Start by mapping your exposure before you start deleting.",
        bullets: [
          "Run a free Footprint Finder scan to find every account and broker listing tied to your email.",
          "Search Google for your full name in quotes plus your city, then your phone number and email.",
          "Note every people-search site (Whitepages, Spokeo, BeenVerified, Radaris, MyLife) that shows your profile.",
        ],
      },
      {
        heading: "2. Opt out of data brokers",
        body: "Data brokers are the biggest source of exposed personal information. Each one is legally required to remove you on request, but you have to opt out of each site individually — and they re-list you every 30–90 days.",
        bullets: [
          "Submit an opt-out request on each broker's removal page.",
          "Keep a list — there are 100+ brokers and you'll need to recheck quarterly.",
          "Use our per-broker opt-out guides for exact steps on each site.",
        ],
      },
      {
        heading: "3. Remove your info from Google search results",
        body: "Even after a broker removes your listing, the old page can linger in Google. Google offers a 'Results about you' tool to request removal of pages that expose your contact info.",
        bullets: [
          "Use Google's 'Results about you' tool to request removal of pages showing your phone, address or email.",
          "Request removal of outdated cached results once the source page is gone.",
        ],
      },
      {
        heading: "4. Delete old accounts you no longer use",
        body: "Every dormant account is a future breach. Close the accounts you've forgotten about — each one stores personal data and login credentials that can leak.",
        bullets: [
          "Delete unused shopping, social and newsletter accounts.",
          "Follow our step-by-step deletion guides at /delete for popular services.",
        ],
      },
      {
        heading: "5. Keep monitoring — removal is not one-and-done",
        body: "Data brokers refresh their databases constantly, so your information reappears within a few months unless you keep checking. Ongoing monitoring is the only way to stay removed.",
        bullets: [
          "Re-scan and re-submit opt-outs every quarter.",
          "Footprint Finder re-checks automatically every month so you don't have to.",
        ],
      },
      {
        heading: "What genuinely will not come off",
        body: "Being honest about the ceiling makes the rest of the effort worthwhile rather than frustrating. Court records, property deeds and most voter registrations are public by statute. Legitimate news coverage stays, because publishers do not remove journalism on request. Content on sites you do not control comes down only if the owner agrees. Anything already copied, screenshotted or archived is beyond recall. The realistic goal is removing the assembled, easily-searchable layer — not achieving erasure.",
      },
      {
        heading: "Ordering the work so it is finishable",
        body: "Most people abandon this because they start everywhere at once. A sequence that actually completes: data brokers first, since they carry the highest-value information and the most search visibility; then dormant accounts, which are future breaches waiting to happen; then Google removal requests for anything still surfacing contact details; then ongoing monitoring, because brokers relist.",
      },
    ],
    faqs: [
      {
        question: "Can I remove my personal information from the internet for free?",
        answer:
          "Yes. Data brokers are legally required to honor opt-out requests at no cost, and Google's 'Results about you' tool is free. The catch is time — doing it manually across 100+ brokers takes hours and must be repeated every quarter. Footprint Finder automates it.",
      },
      {
        question: "How long does it take to remove my information from the internet?",
        answer:
          "Individual broker removals are usually processed within 7–30 days. Doing every major site manually takes a full afternoon, and because brokers re-list you every 30–90 days, it's an ongoing process rather than a one-time task.",
      },
      {
        question: "Why does my information keep coming back online?",
        answer:
          "Data brokers continuously pull from public records, voter rolls and third-party sources, so your listing reappears 30–90 days after removal unless you actively monitor and re-submit opt-out requests.",
      },
      {
        question: "How long does removing my information take?",
        answer:
          "Individual broker opt-outs are typically processed within days to a few weeks. Doing every major broker manually is a few hours of work spread over a month, mostly spent waiting. The part that never finishes is maintenance, since listings reappear as brokers rebuild from public records.",
      },
      {
        question: "Is it worth paying a service to do this?",
        answer:
          "It depends on what your time is worth, and honesty requires saying that everything these services do you can do yourself for free. What you buy is the repetition — the recurring re-checks after brokers relist. If you are willing to spend a few hours a quarter, doing it manually gets the same result.",
      },
      {
        question: "Where should I start if I only have an hour?",
        answer:
          "The largest people-search sites, because they carry the most complete profiles and rank highest for your name. Removing five or six of the biggest achieves more visible change than working through a long tail of smaller ones.",
      },
    ],
  },
  {
    slug: "remove-phone-number-from-internet",
    category: "Removal",
    title: "How to Remove Your Phone Number From the Internet (Free Guide)",
    description:
      "Stop spam calls for good. A free step-by-step guide to removing your phone number from data brokers, Google and people-search sites.",
    h1: "How to Remove Your Phone Number From the Internet",
    primaryKeyword: "how to remove my phone number from the internet",
    readTime: "6 min read",
    intro:
      "If you're getting spam calls and texts, your phone number is almost certainly published on data-broker and people-search sites. Here's how to remove your phone number from the internet for free, and how to find every site that's listing it.",
    sections: [
      {
        heading: "1. Find every site listing your number",
        body: "People-search sites and data brokers are where most exposed phone numbers live. Map them before you start.",
        bullets: [
          "Run a free scan to find broker listings and accounts tied to your number and email.",
          "Search your phone number in Google with quotes to see which sites display it.",
        ],
      },
      {
        heading: "2. Opt out of people-search and data-broker sites",
        body: "Sites like Whitepages, Spokeo, BeenVerified and Radaris publish phone numbers alongside your name and address. Opt out of each one.",
        bullets: [
          "Submit a removal request on each broker's opt-out page.",
          "See per-site steps in our data-broker opt-out guides.",
        ],
      },
      {
        heading: "3. Remove your number from Google",
        body: "Use Google's 'Results about you' tool to request removal of any page that still shows your phone number.",
      },
      {
        heading: "4. Lock it down going forward",
        body: "Reduce future exposure so your number doesn't get re-listed.",
        bullets: [
          "Avoid entering your real number in online forms and giveaways.",
          "Use a secondary or virtual number for sign-ups.",
          "Re-check broker sites quarterly — or let Footprint Finder monitor monthly.",
        ],
      },
      {
        heading: "Removing it in a sensible order",
        body: "Some of these matter far more than others, so start where the exposure is largest.",
        bullets: [
          "Reverse-lookup and people-search sites, which publish the number attached to your name and address.",
          "Your own past postings: marketplace ads, business listings, old resumes, event pages.",
          "Public profiles where the number is set to visible without you realising.",
          "Google's Results about you tool for any remaining results exposing the number.",
        ],
      },
      {
        heading: "Why removal alone will not hold",
        body: "The channels that put your number online keep running: forms get filled in, lists get resold, breaches keep happening. Expect listings to reappear, and treat rechecking every few months as normal maintenance. This is not a reason to skip it — a number removed now is a number not sold to whoever buys next month.",
      },
      {
        heading: "The habit that actually fixes it",
        body: "A secondary or virtual number for anything transactional is the only step here that stops the problem regenerating. Give it to shops, deliveries, appointments and online forms; keep your real number for people who need to reach you. It is cheap, it takes an afternoon to set up, and it is worth more than any amount of removal work.",
      },
    ],
    faqs: [
      {
        question: "How do I stop spam calls by removing my number online?",
        answer:
          "Most spam callers buy numbers from data brokers. Opting out of the major people-search sites and removing your number from Google search results cuts off their supply. Re-check quarterly, because brokers re-list numbers as their data refreshes.",
      },
      {
        question: "Is it free to remove my phone number from the internet?",
        answer:
          "Yes. Every data broker must remove your number on request at no cost, and Google's removal tool is free. Footprint Finder automates the process if you'd rather not do each site by hand.",
      },
      {
        question: "Will removing my number stop the spam calls I already get?",
        answer:
          "No. Numbers already sold are in circulation and no removal request reaches those copies. What removal changes is the future supply — specifically, it stops your number being freshly paired with your name and address, which is what makes a scam call convincing rather than generic.",
      },
      {
        question: "Is a virtual number safe to use for banking?",
        answer:
          "Use your real number for banking and anything security-critical, and keep the virtual one for commerce. Some institutions reject virtual numbers, and more importantly you do not want account-recovery messages routed through a service you might stop paying for.",
      },
      {
        question: "How do I find where my number appears?",
        answer:
          "Search the number in quotes, and try a few formats — with dashes, with spaces, and with parentheses — because sites index it inconsistently. That surfaces both broker listings and your own forgotten postings.",
      },
    ],
  },
  {
    slug: "remove-yourself-from-google",
    category: "Google Removal",
    title: "How to Remove Your Personal Information From Google (Free, 2026)",
    description:
      "Remove your personal information from Google search results for free — plus how to delete the underlying broker listings so it stays gone.",
    h1: "How to Remove Your Personal Information From Google",
    primaryKeyword: "how to remove personal information from google for free",
    readTime: "6 min read",
    intro:
      "When you search your own name and see your address or phone number, those results usually come from data-broker pages that Google has indexed. Here's how to remove your information from Google search results for free — and how to delete the source so it doesn't reappear.",
    sections: [
      {
        heading: "1. Use Google's 'Results about you' tool",
        body: "Google provides a free tool to request removal of search results that expose your personal contact information.",
        bullets: [
          "Open Google's 'Results about you' tool and sign in.",
          "Submit the URLs showing your phone number, home address or email.",
          "Track each request's status inside the tool.",
        ],
      },
      {
        heading: "2. Delete the source page (the broker listing)",
        body: "Removing a result from Google doesn't delete the underlying page. Opt out of the data broker so the page itself goes away — otherwise Google can re-index it.",
        bullets: [
          "Identify which broker hosts the page (Whitepages, Spokeo, Radaris, etc.).",
          "Submit an opt-out on that broker using our free opt-out guides.",
        ],
      },
      {
        heading: "3. Request removal of outdated cached results",
        body: "Once the source page is gone, use Google's 'Remove outdated content' tool to clear the cached version faster.",
      },
      {
        heading: "4. Monitor so it doesn't return",
        body: "Brokers re-list you and Google re-indexes the new pages. Keep checking, or automate it.",
        bullets: [
          "Re-search your name quarterly.",
          "Footprint Finder finds new exposure automatically every month.",
        ],
      },
      {
        heading: "The distinction that decides what is possible",
        body: "Google is an index, not a source. It shows what other sites publish. That means there are two different jobs, and confusing them is why people spend weeks getting nowhere: removing the page at its source (permanent, and the result disappears once Google recrawls) versus removing the result from Google while the page stays up (faster, but the page remains reachable by anyone with the link).",
      },
      {
        heading: "Google's own removal tools, and their limits",
        body: "Google offers real tools here, and they are free. They are also narrower than most people assume.",
        bullets: [
          "Results about you: request removal of results exposing your phone number, home address or email. This is the broadest consumer tool and it is the right starting point.",
          "The outdated content tool: only works when the page has already changed or been deleted, and simply refreshes Google's cache.",
          "Removal for explicit or intimate imagery published without consent, which Google treats as a priority category.",
          "None of these delete the underlying page. If the source stays up, the information is still there for anyone who visits it directly.",
        ],
      },
      {
        heading: "What will not come off, and why",
        body: "Being honest about this saves a lot of wasted effort. Legitimate news coverage generally stays, because Google will not remove journalism at the subject's request. Court and property records are public by statute in most states. Content on sites you do not control comes down only if the owner agrees or a law compels them. The realistic goal is removing the broker profiles that make your details easy to assemble, not achieving a blank search page.",
      },
    ],
    faqs: [
      {
        question: "Can I remove my personal information from Google for free?",
        answer:
          "Yes. Google's 'Results about you' and 'Remove outdated content' tools are free. To keep results from reappearing, you also need to delete the underlying data-broker listing the result points to.",
      },
      {
        question: "Why does my information come back in Google after I remove it?",
        answer:
          "Google removes the search result, not the source page. If the data-broker page still exists, Google can re-index it. Opting out of the broker itself is the permanent fix.",
      },
      {
        question: "How long does it take for results to disappear?",
        answer:
          "Google's own removal requests are typically decided within days. Removals that depend on the source page changing take longer, because Google has to recrawl the page before the result updates — usually days to a few weeks, occasionally longer for pages that are rarely crawled.",
      },
      {
        question: "Does removing a result delete the page?",
        answer:
          "No, and this is the most common misunderstanding. Suppressing a Google result hides it from that search engine while leaving the page live, indexed elsewhere, and reachable by direct link. Removing at the source is the only permanent fix, which is why broker opt-outs matter more than removal requests.",
      },
      {
        question: "Will the results come back?",
        answer:
          "They can. Data brokers rebuild profiles from public records, and a new profile at a new URL is a new result that your previous removal request does not cover. Re-checking every few months is realistic maintenance rather than pessimism.",
      },
    ],
  },
  {
    slug: "who-has-my-personal-information",
    category: "Discovery",
    title: "Who Has My Personal Information? Find Out in 60 Seconds",
    description:
      "Find out which data brokers, breaches and companies hold your name, address, phone and email. Run a free 60-second scan to see your exposure.",
    h1: "Who Has My Personal Information?",
    primaryKeyword: "who has my personal information",
    readTime: "5 min read",
    intro:
      "Hundreds of companies, data brokers and breached databases hold pieces of your personal information — and most people have no idea which ones. Here's how to find out exactly who has your data, and what you can do about it.",
    sections: [
      {
        heading: "Data brokers and people-search sites",
        body: "These companies collect your name, address, phone, age and relatives from public records, then sell or publish it. Whitepages, Spokeo, BeenVerified, Radaris and MyLife are among the biggest — and there are 100+ in total.",
      },
      {
        heading: "Companies you've shared data with",
        body: "Every store, app and service you've signed up for holds your email and often more. Forgotten accounts are a major source of exposure and breach risk.",
      },
      {
        heading: "Data breaches",
        body: "If a company you used was breached, your email, password and other details may be circulating in breach dumps. Many people are in dozens of breaches without knowing.",
      },
      {
        heading: "How to see your full exposure",
        body: "The fastest way to find out who has your information is to scan your inbox — it reveals every account, broker listing and breach tied to your email.",
        bullets: [
          "Run a free Footprint Finder scan with just your email.",
          "Review the list of brokers, accounts and breaches that hold your data.",
          "Start removing yourself from the highest-risk sources first.",
        ],
      },
      {
        heading: "Start with the inbox, not your memory",
        body: "People consistently underestimate their own account count by an order of magnitude, so recall is the wrong tool. Your inbox is an accurate historical record: search it for welcome, verify your email, your receipt and your order, and the distinct senders form a list of nearly every account you have created. Most people find services they had genuinely forgotten existed.",
      },
      {
        heading: "The companies that will not appear in your inbox",
        body: "Data brokers never emailed you, because you were never their customer. They assembled a file from public records without your involvement and have no reason to make contact. Finding those means searching your own name on the major people-search sites, or running a check that does it for you. This is the category most people are entirely unaware of until they look.",
      },
      {
        heading: "What to do with the list once you have it",
        body: "A list is not progress on its own, and trying to act on all of it at once is how people give up. Sort by what actually carries risk: anything holding a payment method or an identity document first, then dormant accounts you will never use again, then marketing lists that are merely noise. Delete the first two categories, unsubscribe from the third.",
      },
    ],
    faqs: [
      {
        question: "How can I find out who has my personal information?",
        answer:
          "Scan your email to reveal every account, data-broker listing and breach tied to it, and search your name and phone number in Google. Footprint Finder does this automatically in about 60 seconds.",
      },
      {
        question: "What can I do once I know who has my data?",
        answer:
          "Opt out of data brokers, delete forgotten accounts, and remove exposed results from Google. Footprint Finder can submit the removal requests for you and re-check monthly.",
      },
      {
        question: "Is there one place that shows everyone who has my data?",
        answer:
          "No, and any product claiming otherwise is overstating what is possible. There is no central registry of every company holding your information. What is achievable is covering the two large, findable groups: accounts you created, which your inbox records, and data brokers, which you can search or scan for.",
      },
      {
        question: "How do I find accounts I have forgotten?",
        answer:
          "Search your email for signup and receipt language rather than trying to remember. Checking which accounts your Google, Apple or Facebook login is connected to also surfaces a set most people have lost track of entirely.",
      },
      {
        question: "Should I delete everything I find?",
        answer:
          "Delete what you will not use again, particularly anything storing a card or an identity document. Keep what you actively use and secure it properly instead. Deleting an account you still need only creates a new one later, which achieves nothing.",
      },
    ],
  },

  // ===================== DISCOVERY STAGE =====================
  {
    slug: "why-is-my-address-online",
    category: "Discovery",
    title: "Why Is My Address Online? (And How to Get It Removed)",
    description:
      "Your home address is online because data brokers buy it from public records and sell it. Here's why your address is public and how to remove it for free.",
    h1: "Why Is My Address Online?",
    primaryKeyword: "why is my address online",
    readTime: "5 min read",
    intro:
      "If you search your name and see your home address staring back at you, it's not a hack — it's a business. Data brokers compile your address from public records and publish it for anyone to find. Here's exactly why your address is online and how to take it down.",
    sections: [
      {
        heading: "Where your address comes from",
        body: "Your address is pulled from sources that are technically public, then aggregated and sold by data brokers.",
        bullets: [
          "Property and voter records, court filings and change-of-address data.",
          "Loyalty programs, warranties and online forms that resell your data.",
          "Data brokers like Whitepages, Spokeo and BeenVerified that bundle it into a profile.",
        ],
      },
      {
        heading: "Why it's a real risk",
        body: "A published home address fuels spam mail, stalking, doxxing and identity theft. For most people it's the single most sensitive piece of exposed data.",
      },
      {
        heading: "How to remove your address",
        body: "You can get your address taken down for free, but it has to be done broker by broker.",
        bullets: [
          "Run a free scan to find every site listing your address.",
          "Opt out of each data broker using our free per-site guides.",
          "Use Google's 'Results about you' tool to clear it from search results.",
        ],
      },
      {
        heading: "It is public by law, and that surprises people",
        body: "The usual assumption is that a published address means something went wrong. Usually nothing did. Property deeds, tax assessments and in many states voter registration are public records by statute, open to anyone who asks. Brokers simply collect them in bulk and republish them in a more convenient form. That is why removal works at the listing level and almost never at the record level.",
      },
      {
        heading: "Why old addresses persist",
        body: "Brokers keep everything they ingest, so addresses from a decade ago sit alongside your current one. This is not sloppiness — address history is one of the more valuable fields they sell, because it is used for identity verification. A published history helps someone answer the security questions a bank or utility would ask, and it links you to former housemates and to relatives who lived there.",
      },
      {
        heading: "What actually reduces it",
        body: "Ordered by what changes, since the strongest options are also the narrowest.",
        bullets: [
          "Opt out of people-search sites, which removes the convenient assembled version.",
          "Use Google's Results about you tool for search results exposing a home address.",
          "If you qualify, a state address-confidentiality programme substitutes a legal address at the record level.",
          "Going forward, consider whether a property purchase needs to be recorded in your personal name.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is it legal for my address to be online?",
        answer:
          "Yes — most of the source data (property and voter records) is public, and data brokers are allowed to compile and publish it. But you have the right to opt out of each broker and request removal at no cost.",
      },
      {
        question: "How do I get my address off the internet?",
        answer:
          "Opt out of the data brokers listing it, then use Google's removal tools for any leftover search results. Because brokers re-list addresses every few months, you'll need to re-check quarterly or use monitoring.",
      },
      {
        question: "Can I make my address private?",
        answer:
          "Not in the underlying public records, in most cases. What you can remove is the broker layer that makes it easy to find, which is the difference between your address being technically public and being one search away. Address-confidentiality programmes are the exception and are generally limited to survivors of domestic violence, stalking and sexual assault, with some states also covering law enforcement and judges.",
      },
      {
        question: "Why does a site list my address with my relatives?",
        answer:
          "Because brokers reconstruct households from shared addresses in public records, then cross-reference marriage and birth records. It is inference rather than a leak, which is also why the relationships are sometimes wrong — and why a correction request rarely helps.",
      },
      {
        question: "Is a published address actually dangerous?",
        answer:
          "It is the field with physical consequences, so it deserves priority over most others. For most people the realistic risks are targeted scams and unwanted contact. For anyone dealing with harassment or an abusive ex-partner it is the central safety issue, and broker opt-outs alone are not sufficient protection.",
      },
    ],
  },
  {
    slug: "who-has-my-phone-number",
    category: "Discovery",
    title: "Who Has My Phone Number? How to Find Out and Take It Back",
    description:
      "Spam callers, data brokers and people-search sites all have your phone number. Find out who has it and how to remove your number from the internet for free.",
    h1: "Who Has My Phone Number?",
    primaryKeyword: "who has my phone number",
    readTime: "5 min read",
    intro:
      "If you're drowning in spam calls and texts, your number has been bought and sold many times over. Here's who has your phone number, how they got it, and how to cut off the supply.",
    sections: [
      {
        heading: "Who's holding your number",
        body: "Your phone number circulates through several types of companies.",
        bullets: [
          "Data brokers and people-search sites that publish it next to your name and address.",
          "Marketing and lead-generation companies that buy and resell contact lists.",
          "Every app, store and form you've ever given it to.",
        ],
      },
      {
        heading: "How they got it",
        body: "Numbers leak from online forms, loyalty programs, data breaches and public records, then get aggregated by brokers and sold to advertisers and scammers.",
      },
      {
        heading: "How to take your number back",
        body: "Find every site listing it, then remove it.",
        bullets: [
          "Run a free scan to map your exposure.",
          "Opt out of people-search sites and remove the number from Google.",
          "Use a secondary number for sign-ups going forward.",
        ],
      },
      {
        heading: "The four routes a number travels",
        body: "Understanding how it spread tells you which removals are worth doing.",
        bullets: [
          "Forms you filled in: deliveries, appointments, loyalty schemes, warranty registrations.",
          "Commercial lists resold onward from those forms, often many times.",
          "Breaches, which attach your number to a name and frequently an address.",
          "Public and carrier directory data, which reverse-lookup sites index directly.",
        ],
      },
      {
        heading: "Why a number attached to a name is worth more",
        body: "A bare number is a robocall target. A number tied to your name, approximate age, address and relatives is something else — it is what lets a caller open with details that make them sound legitimate. That enrichment is the product people-search sites sell, and it is the specific thing removing your listing takes away.",
      },
      {
        heading: "Practical steps that reduce it",
        body: "Ordered by effect rather than ease, since the easy ones are also the weakest.",
        bullets: [
          "Opt out of reverse-lookup and people-search sites, which removes the enriched listing.",
          "Register with the Do Not Call list — free, but it only binds legitimate telemarketers.",
          "Use a secondary or virtual number for deliveries, loyalty schemes and online forms.",
          "Enable your carrier's spam filtering, which blocks known bad numbers rather than reducing exposure.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I find out who has my phone number?",
        answer:
          "Search your number in Google with quotes to see public listings, and scan your email to find accounts tied to it. Footprint Finder surfaces broker listings and accounts connected to your number automatically.",
      },
      {
        question: "Why do so many spam callers have my number?",
        answer:
          "Spam callers buy bulk number lists from data brokers and lead-gen companies. Removing your number from the major people-search sites cuts off their main source.",
      },
      {
        question: "How did a company I never contacted get my number?",
        answer:
          "Almost always by purchase. A form you filled in years ago carried terms permitting sharing with partners, and the resulting list has been resold repeatedly since. Breach data and people-search listings feed the same pool, which is why the source is usually impossible to trace to a single origin.",
      },
      {
        question: "Does the Do Not Call registry work?",
        answer:
          "Partly. It is free and legitimate telemarketers do respect it, but it has no effect on the scam and fraud calls that make up most of the problem, since those operators are already breaking the law. Worth doing, not worth relying on.",
      },
      {
        question: "Is a second number worth the hassle?",
        answer:
          "For most people, yes — and it is the single most effective preventative step here. Give the secondary number to shops, deliveries and online forms, and keep your real number for people who actually need to reach you. It stops the problem growing rather than cleaning up what already exists.",
      },
    ],
  },
  {
    slug: "how-do-data-brokers-get-my-information",
    category: "Discovery",
    title: "How Do Data Brokers Get My Information? (Explained)",
    description:
      "Data brokers collect from public records, online activity, purchases and each other. Exactly how they build a profile on you — and how to opt out.",
    h1: "How Do Data Brokers Get My Information?",
    primaryKeyword: "how do data brokers get my information",
    readTime: "6 min read",
    intro:
      "Data brokers seem to know everything about you — your address, relatives, phone number, even your buying habits. They build that profile from dozens of sources, most of which you never knowingly agreed to. Here's how it works.",
    sections: [
      {
        heading: "Public records",
        body: "The foundation of every broker profile: property deeds, voter registrations, court records, marriage and bankruptcy filings, and business licenses.",
      },
      {
        heading: "Online activity and purchases",
        body: "Cookies, app trackers, loyalty programs and online forms feed brokers your browsing, location and shopping behavior, which they tie back to your identity.",
      },
      {
        heading: "Other brokers and breaches",
        body: "Brokers buy and trade data with each other, and they scoop up information leaked in data breaches — which is why one wrong listing spreads everywhere.",
      },
      {
        heading: "How to opt out",
        body: "You can break the chain by removing yourself from the brokers that publish your profile.",
        bullets: [
          "Run a free scan to find which brokers list you.",
          "Submit opt-outs using our free per-site guides and re-check quarterly.",
        ],
      },
      {
        heading: "Public records, the largest single source",
        body: "Most of what a people-search site shows about you originates in records that are public by law, gathered in bulk rather than one at a time.",
        bullets: [
          "Property deeds and tax assessments, which tie your name to an address and a purchase price.",
          "Voter registration, which in many states includes your address and date of birth.",
          "Court records, including cases that were dismissed or where you were not the defendant.",
          "Marriage, divorce and birth records, which is how brokers reconstruct family relationships.",
          "Business filings and professional licences.",
        ],
      },
      {
        heading: "Commercial data you agreed to without noticing",
        body: "The second stream comes from ordinary transactions. Loyalty programmes, warranty cards, rebate forms, magazine subscriptions and charity donations all commonly include terms permitting the company to share your details with partners. None of that is hidden, exactly — it is in a privacy policy nobody reads, which is functionally the same thing.",
      },
      {
        heading: "Brokers buying from brokers",
        body: "The third stream is the reason opting out feels like bailing water. Brokers license data from each other continuously, so a record you removed from one site can be reintroduced from a competitor months later. It also means the number of companies holding a copy of your file is far larger than the number you could ever enumerate, let alone contact.",
      },
    ],
    faqs: [
      {
        question: "Is it legal for data brokers to collect my information?",
        answer:
          "In most of the U.S., yes. There's no federal law banning the practice, though states like California (CCPA) give you the right to opt out and request deletion.",
      },
      {
        question: "Can I stop data brokers from collecting my information?",
        answer:
          "You can't stop collection entirely, but you can opt out of each broker so they remove your published profile. Because they re-collect from public records, this needs to be repeated periodically.",
      },
      {
        question: "Did I ever give a data broker permission?",
        answer:
          "Almost certainly not directly. You have no relationship with them, which is what makes the model uncomfortable. Where permission exists at all it was given to some other company whose privacy policy allowed sharing with unnamed partners, and that company sold or licensed it onward.",
      },
      {
        question: "Can I stop public records from being collected?",
        answer:
          "Usually not, since they are public by statute. What you can do is remove the assembled profiles that brokers build from them, which is the layer that actually makes your information easy to find. Some states offer address-confidentiality programmes for survivors of domestic violence, stalking and sexual assault, and several protect law-enforcement and judicial personnel specifically.",
      },
      {
        question: "Why does a broker have my old addresses?",
        answer:
          "Because property, voter and utility records are historical, and brokers keep everything they ingest. Address history is one of the most valuable fields they sell, since it is used for identity verification — which is precisely why having it published is a problem.",
      },
    ],
  },
  {
    slug: "how-many-companies-have-my-information",
    category: "Discovery",
    title: "How Many Companies Have My Personal Information?",
    description:
      "The average person's data sits with hundreds of companies — brokers, apps, retailers and breached databases. Find out how many have yours.",
    h1: "How Many Companies Have My Personal Information?",
    primaryKeyword: "how many companies have my information",
    readTime: "5 min read",
    intro:
      "Most people would guess a few dozen companies have their data. The real number is in the hundreds — and most of them you've never heard of. Here's how to find out exactly how many hold your information.",
    sections: [
      {
        heading: "The realistic count",
        body: "Between data brokers (100+), the apps and stores you've signed up for, and companies that have suffered breaches, the typical person's data sits with several hundred organizations.",
      },
      {
        heading: "The ones you never chose",
        body: "Data brokers and lead-generation firms acquire your data without any direct relationship, which is why your information shows up on sites you've never visited.",
      },
      {
        heading: "How to see your own number",
        body: "Scanning your email is the fastest way to count the companies tied to you.",
        bullets: [
          "Run a free Footprint Finder scan to reveal accounts, brokers and breaches.",
          "Review the full list and start removing the highest-risk ones.",
        ],
      },
      {
        heading: "Three tiers, and only one is visible to you",
        body: "It helps to separate them, because each responds to a different action.",
        bullets: [
          "Companies you chose: accounts you opened. You can log in, export your data and delete.",
          "Companies you were passed to: their partners, processors and advertising networks. You often cannot name these, and deletion has to go through the company you dealt with.",
          "Companies that never asked: data brokers, who assembled a file from public records. No account, no notification, and opt-out is the only lever.",
        ],
      },
      {
        heading: "Why the number keeps growing on its own",
        body: "Even if you never signed up for another service, the count would rise. Companies get acquired and your data moves with them. Vendors change processors. A breach at one company puts your details into circulation, where brokers ingest them and resell. This is the mechanism behind receiving a breach notification from an organisation you have never heard of — MOVEit in 2023 produced letters to millions of people from payroll providers and universities they had no relationship with.",
      },
      {
        heading: "Counting yours, rather than guessing",
        body: "Estimates are entertaining but not actionable. Your own inbox is the accurate source: signup confirmations, receipts and marketing mail trace back to nearly every account you have created. Searching it for welcome, verify and receipt gives a real list in a few minutes, and it is almost always several times larger than people expect.",
      },
    ],
    faqs: [
      {
        question: "How can I find out how many companies have my data?",
        answer:
          "Scan your email to reveal every account, broker listing and breach connected to it. Footprint Finder does this in about 60 seconds and gives you a count plus a removal plan.",
      },
      {
        question: "Can I reduce how many companies have my information?",
        answer:
          "Yes — delete unused accounts, opt out of data brokers, and limit where you share your real contact details. Footprint Finder automates the removals and monitors for new exposure.",
      },
      {
        question: "How do I find out which companies have my data?",
        answer:
          "Work from your inbox rather than your memory. Signup confirmations, order receipts and marketing emails form a record of nearly every account you have ever created. For the companies you never dealt with — data brokers — search your own name on the major people-search sites, or run a scan that checks them for you.",
      },
      {
        question: "Can I make all of them delete my data at once?",
        answer:
          "Only in California, and only for registered data brokers. The state's DROP platform takes one request and applies it across every broker on its register, with brokers legally required to process requests from 1 August 2026. Everywhere else it is one request at a time, and no single service can cover every company that holds something about you.",
      },
      {
        question: "Does it matter if a company has my data if I trust them?",
        answer:
          "Trust is not really the variable — durability is. Companies get breached, acquired, or go bankrupt and sell their assets, and your data outlives your relationship with them. A dormant account at a company you trust is still a future breach notification, which is why closing what you no longer use does more than auditing who deserves your confidence.",
      },
    ],
  },

  // ===================== EDUCATION STAGE =====================
  {
    slug: "what-is-a-data-broker",
    category: "Education",
    title: "What Is a Data Broker? (And Why They Have Your Info)",
    description:
      "A data broker is a company that collects and sells your personal information. Learn what data brokers are, how they profit from your data, and how to opt out.",
    h1: "What Is a Data Broker?",
    primaryKeyword: "what is a data broker",
    readTime: "5 min read",
    intro:
      "A data broker is a company whose entire business is collecting your personal information and selling it — usually without your knowledge. They're the reason your name, address and phone number show up on people-search sites. Here's how they work and how to push back.",
    sections: [
      {
        heading: "What data brokers do",
        body: "They gather your information from public records, online activity and other companies, package it into a profile, and sell access to advertisers, recruiters, landlords and anyone willing to pay.",
      },
      {
        heading: "The two main types",
        body: "People-search sites (Whitepages, Spokeo, BeenVerified) publish profiles anyone can look up, while marketing brokers sell data behind the scenes to advertisers and lead-gen firms.",
      },
      {
        heading: "How to opt out",
        body: "Every broker is required to honor removal requests, but you have to do each one.",
        bullets: [
          "Run a free scan to find which brokers list you.",
          "Use our free data-broker guides for step-by-step opt-outs.",
        ],
      },
      {
        heading: "Where they actually get it",
        body: "Almost none of it is hacked or stolen. The supply chain is mundane and mostly legal, which is exactly why it is so hard to switch off.",
        bullets: [
          "Public records: property deeds, voter files, court filings, marriage and divorce records, business registrations, professional licences.",
          "Commercial data: loyalty cards, warranty registrations, magazine subscriptions, product rebates, online purchases.",
          "Other brokers: they buy from each other constantly, which is why removing yourself from one does nothing about the rest.",
          "Your own accounts: privacy policies that permit sharing with unnamed partners.",
        ],
      },
      {
        heading: "Why you have never heard of most of them",
        body: "You have no customer relationship with a data broker, so there is no account page, no login, and no reason for them to ever contact you. That is not an oversight in the model — it is the model. The first time most people learn a broker holds a file on them is when they search their own name, or when a breach makes the news. National Public Data, which leaked billions of records in 2024, was a company almost none of the affected people had heard of.",
      },
      {
        heading: "What the law actually gives you",
        body: "Rights vary sharply by where you live, and the gap between states is the single biggest factor in what you can force a broker to do.",
        bullets: [
          "California has a broker registry and DROP, a single request that reaches every registered broker in the state.",
          "Vermont, Texas and Oregon maintain broker registries, which at least tell you who is trading.",
          "Around twenty states have comprehensive privacy laws with deletion rights behind them.",
          "In states with no law, brokers usually still honour opt-outs — as policy, not obligation, which means no penalty when they do not.",
        ],
      },
    ],
    faqs: [
      {
        question: "Are data brokers legal?",
        answer:
          "Yes. Data brokering is legal in most of the U.S., though state laws like California's CCPA give residents the right to opt out and demand deletion.",
      },
      {
        question: "How do I get data brokers to remove my information?",
        answer:
          "Submit an opt-out request on each broker's removal page. Footprint Finder can find every broker listing you and handle the removals for you.",
      },
      {
        question: "How do data brokers make money?",
        answer:
          "By selling access rather than selling you a product. People-search sites charge consumers for background reports and subscriptions. Marketing brokers license segments to advertisers, and risk brokers sell to insurers, landlords and employers for screening. The same underlying record can be sold many times over to different buyers, which is why the incentive to keep rebuilding your profile never goes away.",
      },
      {
        question: "Is my information on data brokers because of a breach?",
        answer:
          "Usually not. Most broker data is assembled legally from public records, commercial sources and other brokers. Breaches add to the pool, but the bulk of what a people-search site publishes about you was never secret in the first place — it was scattered across dozens of records, and the broker's product is putting it back together in one place.",
      },
      {
        question: "If I opt out, does my data stay gone?",
        answer:
          "No, and this is the part most guides skip. Brokers rebuild from the same public sources they used the first time, so listings typically reappear within a few months to a year. Opting out is maintenance rather than a one-off fix. That is annoying but it is not a reason to skip it: a listing removed now is a listing not available to whoever searches for you next week.",
      },
    ],
  },
  {
    slug: "what-is-doxxing",
    category: "Education",
    title: "What Is Doxxing? How It Works and How to Protect Yourself",
    description:
      "Doxxing is the malicious publishing of someone's private information online. Learn how doxxing works, the role of data brokers, and how to protect yourself.",
    h1: "What Is Doxxing?",
    primaryKeyword: "what is doxxing",
    readTime: "6 min read",
    intro:
      "Doxxing is when someone publishes your private information — home address, phone number, workplace — online to harass or intimidate you. Most doxxing relies on data that's already exposed through data brokers. Here's how it works and how to make yourself a harder target.",
    sections: [
      {
        heading: "How doxxing works",
        body: "Attackers rarely 'hack' anything. They piece together your identity from data-broker profiles, social media, public records and breach dumps, then publish it.",
      },
      {
        heading: "Why data brokers make it easy",
        body: "People-search sites hand attackers your address, relatives and phone number in one click — which is why reducing your broker exposure is the most effective defense.",
      },
      {
        heading: "How to protect yourself",
        body: "Shrink your public footprint before you become a target.",
        bullets: [
          "Run a free scan to see what's already exposed.",
          "Opt out of data brokers and remove your info from Google.",
          "Lock down social media privacy settings and avoid posting your location.",
        ],
      },
      {
        heading: "Where doxxers actually get the information",
        body: "The common assumption is hacking. In practice most doxxing is assembly, not intrusion — the pieces are already public, and the work is joining them together.",
        bullets: [
          "People-search sites, which sell a full profile including address history and relatives for a few dollars.",
          "Property and voter records, which are public by law in most states.",
          "Old social media posts, especially photos with location data or recognisable backgrounds.",
          "Breach data, which links an email address to a password, phone number or physical address.",
          "Friends and family whose own privacy settings expose you by association.",
        ],
      },
      {
        heading: "What to do in the first hour",
        body: "If it is happening right now, order matters. Documentation first, because content disappears and platforms will ask for evidence you no longer have.",
        bullets: [
          "Screenshot everything, including URLs, timestamps and usernames, before reporting it. Reporting often makes the post vanish.",
          "Report to the platform under its harassment or private-information policy — most explicitly prohibit posting home addresses and phone numbers.",
          "Lock down accounts: enable two-factor authentication on email first, since email is the reset route into everything else.",
          "Tell someone. Doxxing frequently escalates to swatting, and a friend or colleague who knows what is happening is a practical safety measure.",
        ],
      },
      {
        heading: "Reducing the raw material",
        body: "You cannot un-publish what has already spread, but you can shrink what is available for the next attempt. Removing broker listings is the highest-value step because it takes the assembled profile — the thing that makes doxxing quick — off the shelf. Property and voter records are harder, and in some states impossible, unless you qualify for a confidentiality programme.",
      },
    ],
    faqs: [
      {
        question: "Is doxxing illegal?",
        answer:
          "Publishing publicly available information isn't always illegal by itself, but doxxing combined with threats, harassment or stalking is a crime in many jurisdictions. Reducing your exposure lowers the risk regardless.",
      },
      {
        question: "How do I protect myself from being doxxed?",
        answer:
          "Remove your information from data brokers and Google, tighten social-media privacy, and avoid reusing identifiable usernames. Footprint Finder finds and removes the broker listings doxxers rely on.",
      },
      {
        question: "Is doxxing illegal?",
        answer:
          "There is no single federal doxxing statute in the US. Depending on what was posted and what followed, it can fall under stalking, harassment, threat or witness-intimidation laws, and several states have passed statutes covering specific groups such as law enforcement and judges. Publishing information that is already public is often not itself a crime, which is a large part of why the practice persists.",
      },
      {
        question: "Should I respond to the person who doxxed me?",
        answer:
          "Generally no. Engagement is frequently the goal, and a response confirms the information reached you and that it landed. Document, report through the platform, and if there is any threat of physical harm, contact law enforcement with your documentation rather than arguing in public.",
      },
      {
        question: "Can I get my address removed from people-search sites?",
        answer:
          "Yes, and it is free on every major one. Each site has its own opt-out process and each must be done separately, which is tedious but effective. Expect to repeat it periodically, since brokers rebuild their databases from public records.",
      },
    ],
  },
  {
    slug: "how-to-stop-spam-calls",
    category: "Education",
    title: "How to Stop Spam Calls (Permanently) — Free Guide",
    description:
      "Spam calls come from data brokers selling your number. Learn how to stop spam calls for good by removing your phone number from the brokers that fuel them.",
    h1: "How to Stop Spam Calls",
    primaryKeyword: "how to stop spam calls",
    readTime: "6 min read",
    intro:
      "Blocking spam calls one by one never ends because the callers keep buying your number. The only permanent fix is to cut off where they get it — data brokers. Here's how to actually stop spam calls.",
    sections: [
      {
        heading: "Why you get spam calls",
        body: "Robocallers and telemarketers buy bulk lists of numbers from data brokers and lead-generation companies. Your number is on those lists because it's published on people-search sites.",
      },
      {
        heading: "The quick wins",
        body: "Start with the basics while you tackle the root cause.",
        bullets: [
          "Register on the National Do Not Call Registry.",
          "Enable your carrier's spam-blocking and your phone's silence-unknown-callers setting.",
          "Never press a button or call back unknown numbers.",
        ],
      },
      {
        heading: "The permanent fix: remove your number",
        body: "Take your number off the brokers that supply spam callers.",
        bullets: [
          "Run a free scan to find sites listing your number.",
          "Opt out of people-search sites and remove it from Google.",
          "Re-check quarterly — or let Footprint Finder monitor monthly.",
        ],
      },
      {
        heading: "Three kinds of call, three different answers",
        body: "Lumping them together is why generic advice disappoints.",
        bullets: [
          "Legitimate telemarketers: the Do Not Call registry genuinely binds these.",
          "Robocallers: illegal already, so registries mean nothing. Carrier filtering and call blocking are the practical tools.",
          "Targeted scams: the dangerous category, because the caller knows your name, your address and sometimes your bank. These are enabled by data brokers.",
        ],
      },
      {
        heading: "Never confirm anything to an inbound caller",
        body: "This single habit defeats most phone fraud. A caller who already knows your name and address sounds legitimate, and that is precisely the effect the data purchase was meant to buy. Hang up and call the organisation back on a number you looked up yourself — never one the caller gave you, and never by pressing a key they suggest. Real banks and real government agencies are entirely comfortable with you doing this.",
      },
      {
        heading: "Protecting an older relative",
        body: "Scam calls disproportionately target older people, and the reason is not gullibility — it is that brokers sell age-band data, so this targeting is deliberate. Practical measures: enable carrier-level spam filtering on their line, remove their number from people-search listings, and agree in advance that anything financial gets discussed with you before any action is taken. That last one is the most effective, because it removes the urgency scams depend on.",
      },
    ],
    faqs: [
      {
        question: "Why do I keep getting spam calls even after blocking them?",
        answer:
          "Blocking stops one number, but callers rotate through thousands. As long as your number is for sale on data brokers, new spammers will keep getting it. Removing your number from those sources is the lasting fix.",
      },
      {
        question: "Does removing my number from data brokers really reduce spam calls?",
        answer:
          "Yes. Cutting off the broker supply reduces how often your number lands on new call lists. It won't stop every call overnight, but it steadily shrinks the volume over a few months.",
      },
      {
        question: "Why do scam callers know my name and address?",
        answer:
          "Because they bought it. People-search sites sell packages containing name, phone, address, age range and relatives for a few dollars, which is what turns a cold call into a convincing one. Removing your listing removes the enrichment that makes the script work.",
      },
      {
        question: "Does blocking numbers help?",
        answer:
          "Only marginally, because most spam calls use spoofed caller ID and a different number each time. Blocking is worth doing for repeat offenders but it is not a strategy. Carrier-level filtering catches far more, and reducing your exposure at the source is what changes the volume over time.",
      },
      {
        question: "Should I answer and ask to be removed?",
        answer:
          "No. Answering confirms the number reaches a real person who picks up, which increases its value and typically increases the calls. Do not press any key, including one offered to opt out. Let unknown numbers go to voicemail.",
      },
    ],
  },
  {
    slug: "how-to-stop-identity-theft",
    category: "Education",
    title: "How to Stop Identity Theft Before It Happens",
    description:
      "Identity theft starts with exposed personal data. How to prevent it by removing your info from data brokers and locking down your accounts.",
    h1: "How to Stop Identity Theft",
    primaryKeyword: "how to stop identity theft",
    readTime: "7 min read",
    intro:
      "Identity theft almost always starts with information that's already exposed — your name, address, date of birth and Social Security number pieced together from brokers and breaches. Here's how to cut off the raw material thieves need.",
    sections: [
      {
        heading: "Reduce your exposed data",
        body: "The less of your personal information is floating around, the harder you are to impersonate.",
        bullets: [
          "Run a free scan to find brokers and breaches exposing your data.",
          "Opt out of data brokers and delete unused accounts.",
        ],
      },
      {
        heading: "Lock down your credit and accounts",
        body: "Make it physically hard to open accounts in your name.",
        bullets: [
          "Freeze your credit with all three bureaus (free).",
          "Turn on two-factor authentication everywhere.",
          "Use a password manager and unique passwords.",
        ],
      },
      {
        heading: "Monitor for new exposure",
        body: "Identity risk changes constantly as new breaches happen and brokers re-list you.",
        bullets: [
          "Watch for breach notifications tied to your email.",
          "Footprint Finder re-scans monthly and flags new exposure.",
        ],
      },
      {
        heading: "A credit freeze is the step that matters most",
        body: "If you do one thing, do this. A freeze at Equifax, Experian and TransUnion blocks new credit being opened in your name, is free by federal law, does not affect your credit score, and can be lifted online in minutes when you actually need credit. It is stronger than the monitoring most breach responses offer, because monitoring tells you after an account was opened while a freeze prevents it. The reason it is free at all is the 2017 Equifax breach.",
      },
      {
        heading: "Freezing versus monitoring",
        body: "These get treated as alternatives and they are not equivalent. Monitoring is detection: it alerts you once something has happened, and it is what most paid identity-protection products sell. A freeze is prevention. Paid monitoring is a reasonable addition once the free preventative step is done, and a poor substitute for it.",
      },
      {
        heading: "The signals worth watching",
        body: "Identity theft is usually visible before the damage is large, if you know what to look at.",
        bullets: [
          "Mail about accounts or cards you never applied for.",
          "A missing bill or statement, which can indicate a change-of-address request in your name.",
          "Small unfamiliar charges, often tested before a larger one.",
          "Medical Explanation of Benefits statements listing treatment you did not receive.",
          "Being told a tax return has already been filed under your Social Security number.",
        ],
      },
    ],
    faqs: [
      {
        question: "What's the best way to prevent identity theft?",
        answer:
          "Freeze your credit, enable two-factor authentication, and minimize your exposed personal data by opting out of data brokers and deleting old accounts. Reducing exposure removes the raw material thieves rely on.",
      },
      {
        question: "How does removing my info from data brokers help?",
        answer:
          "Brokers expose the exact details — address, birth date, relatives — that thieves use to answer security questions and open accounts. Removing those listings makes you a harder target.",
      },
      {
        question: "Does freezing my credit hurt my credit score?",
        answer:
          "No. A freeze restricts who can pull your file and is not recorded as a negative event of any kind. It has no effect on your score, and you can lift it temporarily online, usually within minutes, when you apply for credit.",
      },
      {
        question: "Is paid identity theft protection worth it?",
        answer:
          "Only after the free steps. A credit freeze and reading your own credit reports do more than most paid monitoring, and cost nothing. Paid services add convenience, insurance and restoration help, which have real value — but buying monitoring while leaving your credit unfrozen is paying to be told about a problem you could have prevented.",
      },
      {
        question: "What do I do first if it has already happened?",
        answer:
          "Report it at IdentityTheft.gov, which generates a recovery plan and an official affidavit. Then freeze your credit, contact the institutions where fraudulent accounts were opened, and file a police report if you are asked for one. Keep a written record of every call, including names and dates.",
      },
    ],
  },

  // ===================== GOOGLE REMOVAL (ACTION STAGE) =====================
  {
    slug: "remove-phone-number-from-google",
    category: "Google Removal",
    title: "How to Remove Your Phone Number From Google (Free)",
    description:
      "Remove your phone number from Google search results for free with the 'Results about you' tool — plus how to delete the broker listing so it doesn't return.",
    h1: "How to Remove Your Phone Number From Google",
    primaryKeyword: "remove phone number from google",
    readTime: "5 min read",
    intro:
      "When your phone number shows up in Google, it's usually coming from a data-broker page Google has indexed. Here's how to remove your number from Google search for free — and how to delete the source so it doesn't reappear.",
    sections: [
      {
        heading: "1. Use Google's 'Results about you' tool",
        body: "Google offers a free tool to request removal of search results exposing your contact info.",
        bullets: [
          "Open 'Results about you' and sign in.",
          "Submit the URLs showing your phone number.",
          "Track each request inside the tool.",
        ],
      },
      {
        heading: "2. Delete the source broker listing",
        body: "Removing a result doesn't delete the underlying page. Opt out of the broker hosting it, or Google can re-index it.",
        bullets: [
          "Identify the broker (Whitepages, Spokeo, Radaris, etc.).",
          "Opt out using our free data-broker opt-out guides.",
        ],
      },
      {
        heading: "3. Monitor so it doesn't return",
        body: "Brokers re-list numbers and Google re-indexes them. Re-check quarterly or let Footprint Finder monitor monthly.",
      },
      {
        heading: "How your number ends up indexed",
        body: "Phone numbers reach people-search sites through carrier directory data, commercial lists sold on from forms you filled in, breach data, and your own past postings — a marketplace ad, a business listing, an old resume uploaded to a job site. Reverse-lookup sites then create a page for the number itself, which is why searching the number returns your name.",
      },
      {
        heading: "The spam connection",
        body: "A published number is a targeted number. Once it is attached to a name, an age range and an address, it stops being a cold call and becomes a personalised one — which is what makes scam calls to older people so effective. Removing the listing does not stop calls already in circulation, but it cuts off the supply of fresh, enriched records to whoever buys next.",
      },
      {
        heading: "Whether changing your number helps",
        body: "Rarely worth it, and worth saying plainly. A new number is enormously disruptive and tends to be back in broker databases within a year, because the same collection channels apply to it. The exception is a safety situation, where a clean number combined with careful discipline about where it is given out is a genuine protective measure rather than a convenience question.",
      },
    ],
    faqs: [
      {
        question: "Can I remove my phone number from Google for free?",
        answer:
          "Yes. Google's 'Results about you' tool is free. To keep the number from reappearing, you also need to opt out of the data broker the result points to.",
      },
      {
        question: "Why does my phone number come back on Google?",
        answer:
          "Google removes the search result, not the source page. If the broker listing still exists, Google can re-index it — so opting out of the broker is the permanent fix.",
      },
      {
        question: "Why does searching my phone number show my name?",
        answer:
          "Reverse-lookup sites build a page per number and link it to whatever identity data they hold. They are indexed like any other page, so the number becomes a searchable key to your name, address and relatives. Opting out removes the page, which removes the result once Google recrawls.",
      },
      {
        question: "Will removing my number stop spam calls?",
        answer:
          "It reduces future supply rather than stopping current calls. Numbers already sold are already in circulation and no removal reaches them. What opting out does is stop your number being freshly enriched with a name and address, which is the difference between a generic robocall and a convincing personalised one.",
      },
      {
        question: "Should I put my number on the Do Not Call registry?",
        answer:
          "It is free and worth doing, but it binds legitimate telemarketers and not the scammers who account for most unwanted calls. Treat it as one small layer rather than a solution, and pair it with removing the listings that make your number valuable in the first place.",
      },
    ],
  },
  {
    slug: "remove-address-from-google",
    category: "Google Removal",
    title: "How to Remove Your Home Address From Google (Free)",
    description:
      "Remove your home address from Google search results for free, then delete the data-broker listing behind it so it doesn't come back. Step-by-step guide.",
    h1: "How to Remove Your Home Address From Google",
    primaryKeyword: "remove address from google",
    readTime: "5 min read",
    intro:
      "Seeing your home address in Google results is unsettling — and it almost always traces back to a data-broker page. Here's how to remove your address from Google for free and stop it from returning.",
    sections: [
      {
        heading: "1. Request removal with 'Results about you'",
        body: "Google's free tool lets you request removal of results that expose your home address.",
        bullets: [
          "Open 'Results about you' and sign in.",
          "Submit the URLs displaying your address.",
        ],
      },
      {
        heading: "2. Opt out of the broker behind the page",
        body: "The result points to a broker listing. Remove the listing itself so Google can't re-index it.",
        bullets: [
          "Identify the broker hosting the page.",
          "Opt out using our free data-broker opt-out guides.",
        ],
      },
      {
        heading: "3. Clear cached results and monitor",
        body: "Use 'Remove outdated content' once the source is gone, then re-check quarterly or let Footprint Finder monitor monthly.",
      },
      {
        heading: "Where a published address actually originates",
        body: "Your address is rarely leaked. It is compiled, from records that are public by design.",
        bullets: [
          "Property deeds and tax assessments, which are public in nearly every county.",
          "Voter registration, which includes an address in many states.",
          "Utility and change-of-address data resold commercially.",
          "Old listings you created yourself: marketplace ads, event registrations, business filings.",
        ],
      },
      {
        heading: "Why address exposure is the one worth prioritising",
        body: "Among the fields brokers publish, address is the one with physical consequences. It is what turns online harassment into something that arrives at your door, and it is a standard identity-verification question, which means publishing it weakens the checks protecting your accounts. If you only have time to remove one category of information, this is it.",
      },
      {
        heading: "When removal is not enough",
        body: "For most people, broker opt-outs plus Google's Results about you tool is the right level of effort. If you are being stalked or harassed, it is not sufficient on its own — the underlying property and voter records stay public. Many states run address-confidentiality programmes that provide a substitute legal address for survivors of domestic violence, stalking and sexual assault, and those work at the record level rather than the listing level.",
      },
    ],
    faqs: [
      {
        question: "How do I get my address removed from Google?",
        answer:
          "Use Google's 'Results about you' tool to remove the search result, then opt out of the data broker hosting the page so it doesn't get re-indexed. Both steps are free.",
      },
      {
        question: "Why is my address still on Google after removal?",
        answer:
          "Google removed the result, not the source page. If the broker listing remains live, Google can re-index it — opting out of the broker is the lasting fix.",
      },
      {
        question: "Can I remove my address from public property records?",
        answer:
          "Generally no. Deeds and tax assessments are public by statute, and the usual routes to shielding them are narrow: qualifying for a state address-confidentiality programme, or holding property through a trust or legal entity going forward. Neither retroactively hides a purchase already recorded in your name.",
      },
      {
        question: "My old address still shows up. Does that matter?",
        answer:
          "Yes, more than people expect. Address history is a standard identity-verification field, so a published former address helps someone answer the questions a bank or utility would ask. It also maps your movements over time, and it links you to former housemates and relatives who lived there.",
      },
      {
        question: "Will Google remove my home address if I ask?",
        answer:
          "Often yes. Home address is explicitly within scope of Google's Results about you tool, which is one of the more reliable consumer removal routes it offers. It suppresses the search result rather than deleting the page, so pair it with an opt-out at the source.",
      },
    ],
  },
  {
    slug: "remove-images-from-google",
    category: "Google Removal",
    title: "How to Remove Images of Yourself From Google (Free)",
    description:
      "Remove personal images from Google search results for free. Learn how to use Google's removal tools and contact the source site to take photos down for good.",
    h1: "How to Remove Images of Yourself From Google",
    primaryKeyword: "remove images from google",
    readTime: "5 min read",
    intro:
      "Whether it's an old photo, an image you didn't consent to, or a picture tied to your name, you can get images removed from Google. Here's how to do it for free — and how to remove the source so they stay gone.",
    sections: [
      {
        heading: "1. Use Google's image removal tools",
        body: "Google can remove certain images from search, especially personal or explicit content and images of minors.",
        bullets: [
          "Use 'Results about you' for images exposing personal info.",
          "Use Google's dedicated removal request for explicit or non-consensual images.",
        ],
      },
      {
        heading: "2. Contact the website hosting the image",
        body: "Google indexes images from other sites. To remove an image permanently, ask the source site to take it down.",
        bullets: [
          "Find the page hosting the image and contact the site owner.",
          "Once the source removes it, request 'Remove outdated content' in Google.",
        ],
      },
      {
        heading: "3. Reduce future exposure",
        body: "Limit where identifiable photos appear, and monitor your name so new images don't slip through.",
      },
      {
        heading: "Establishing who controls the page",
        body: "Everything about image removal follows from this. If the image is on a site you control, deleting it and requesting a recrawl is quick and permanent. If someone else controls it, you need either their cooperation, a legal basis, or one of Google's specific removal policies — and which of those applies determines how long it takes and whether it works at all.",
      },
      {
        heading: "Categories Google treats as a priority",
        body: "Some image removals are far more likely to succeed than others, and knowing which category you are in saves considerable time.",
        bullets: [
          "Intimate or explicit imagery published without consent is a priority removal category and does not require the page owner's cooperation.",
          "Images of minors are treated with particular urgency.",
          "Images exposing personal contact details or identifying documents fall under the Results about you policy.",
          "Ordinary unflattering photos, published lawfully by someone else, usually do not qualify for removal at all.",
        ],
      },
      {
        heading: "Finding where an image appears",
        body: "Reverse image search is how you find copies rather than guessing. Upload the image to Google Images or another reverse-search tool and it will show pages carrying the same or a visually similar file. This matters because images are copied far more readily than text, and removing the original while five mirrors remain achieves very little.",
      },
    ],
    faqs: [
      {
        question: "Can I remove images of myself from Google for free?",
        answer:
          "Yes. Google's removal tools are free, and they prioritize personal, explicit or non-consensual images. To remove an image permanently you also need the source site to take it down.",
      },
      {
        question: "Why do removed images reappear in Google?",
        answer:
          "If the image still exists on the source website, Google can re-index it. Getting the host site to delete the file is the permanent solution.",
      },
      {
        question: "How do I remove a photo someone else posted?",
        answer:
          "Start with the platform's own reporting flow, since most prohibit posting private information and non-consensual intimate imagery, then approach the site owner directly. Google removal is a separate request and only suppresses the search result. If the image is intimate imagery shared without your consent, use that specific reporting route — it is treated as a priority and does not depend on the poster's cooperation.",
      },
      {
        question: "Does removing an image from Google delete it?",
        answer:
          "No. It stops the image appearing in Google's results while the file stays live on the hosting site, visible to anyone with the link and indexable by other search engines. Removal at the source is the only permanent outcome.",
      },
      {
        question: "Why does an image reappear after removal?",
        answer:
          "Usually because it was copied before you removed it. Once a file is mirrored across other sites, each copy is a separate page needing its own removal. A reverse image search shows you the full set, which is why it is worth doing before you start rather than after.",
      },
    ],
  },
  {
    slug: "remove-name-from-google",
    category: "Google Removal",
    title: "How to Remove Your Name From Google Search Results (Free)",
    description:
      "Remove your name from Google search results for free by deleting the data-broker and people-search listings behind them. Step-by-step guide for 2026.",
    h1: "How to Remove Your Name From Google Search Results",
    primaryKeyword: "remove name from google",
    readTime: "6 min read",
    intro:
      "When you Google your name and see profiles full of your personal details, those listings come from data brokers and people-search sites. Here's how to remove your name from Google search results for free and keep it off.",
    sections: [
      {
        heading: "1. Identify what's ranking for your name",
        body: "Search your name in quotes and note every people-search and broker result that shows your profile.",
        bullets: [
          "Run a free scan to find broker listings tied to you.",
          "List each site that ranks for your name.",
        ],
      },
      {
        heading: "2. Opt out of the underlying listings",
        body: "Most name results come from broker profiles. Remove the profiles and the results lose their source.",
        bullets: [
          "Opt out of each broker using our free per-site guides.",
          "Use Google's 'Results about you' tool for results exposing contact info.",
        ],
      },
      {
        heading: "3. Monitor your name long-term",
        body: "Brokers re-list you and Google re-indexes new profiles. Re-search quarterly or let Footprint Finder track it monthly.",
      },
      {
        heading: "Why your name ranks in the first place",
        body: "People-search sites are built to rank for names. They generate a page per person, structure it for search engines, and interlink it with pages for your relatives and previous addresses. Your name is not ranking by accident — it is ranking because an entire industry optimised for exactly that query. This is also why the results feel bottomless: one broker can produce several ranking pages about you.",
      },
      {
        heading: "Handling a common name versus a rare one",
        body: "These are genuinely different problems and the advice diverges. With a common name, other people's results dilute yours, so the practical goal is removing the specific profiles tied to your address and relatives rather than the name itself. With a rare name, everything about you consolidates onto one query and removal matters far more — one lingering profile can dominate the whole first page.",
      },
      {
        heading: "What to do about results you cannot remove",
        body: "Some results will not come down: news coverage, professional listings, court records, an employer's staff page. When removal is not available, the workable approach is displacement — publishing profiles you do control, such as a LinkedIn page or personal site, which tend to rank well for a name and push other results down. It is slower than removal and it is not deletion, but it changes what someone sees first.",
      },
    ],
    faqs: [
      {
        question: "How do I remove my name from Google search results?",
        answer:
          "Most name-based results come from data-broker profiles. Opt out of those brokers and use Google's 'Results about you' tool for any results exposing your contact details. Both are free.",
      },
      {
        question: "Can I fully erase my name from Google?",
        answer:
          "You can remove personal listings and broker profiles, but legitimate news, official records and content you don't control may remain. Removing broker profiles eliminates the most sensitive exposure.",
      },
      {
        question: "Why do new profiles keep appearing under my name?",
        answer:
          "Because brokers rebuild continuously from public records and license data from each other. A profile you removed at one site can be reintroduced from a competitor's dataset, and it will appear at a new URL that your earlier opt-out does not cover. Quarterly re-checks are the realistic cadence.",
      },
      {
        question: "Can I remove my name from Google entirely?",
        answer:
          "No, and any service promising that is overselling. You can remove broker profiles and request suppression of results exposing contact details. Legitimate news, official records and content on sites you do not control will remain. Removing the broker layer still eliminates the most sensitive material, which is usually address history and relatives.",
      },
      {
        question: "Does Google's Results about you tool remove my name?",
        answer:
          "It removes results that expose personal contact information — phone number, home address, email address. It is not a general name-removal tool, so a profile that lists your name and city without contact details often falls outside it. That is the gap broker opt-outs fill.",
      },
    ],
  },

  // ===================== PRIORITY 2: PERSONAL INFO REMOVAL =====================
  {
    slug: "remove-address-from-internet",
    category: "Removal",
    title: "How to Remove Your Address From the Internet (Free 2026 Guide)",
    description:
      "Data brokers and people-search sites publish your home address. How to remove it from the internet for free, step by step.",
    h1: "How to Remove Your Address From the Internet",
    primaryKeyword: "remove address from internet",
    readTime: "7 min read",
    intro:
      "Your home address is one of the most sensitive things you can have exposed online — it fuels spam mail, stalking and identity theft. Data brokers pull it from public records and publish it for anyone to find. Here's exactly how to remove your address from the internet for free.",
    sections: [
      {
        heading: "1. Find every site publishing your address",
        body: "You can't remove what you haven't found. Most people are listed on dozens of people-search sites that show their full address next to their name and relatives.",
        bullets: [
          "Run a free Footprint Finder scan to map your exposure in about a minute.",
          "Search your name in quotes plus your city in Google to see which broker pages rank.",
          "List every site (Whitepages, Spokeo, Radaris, BeenVerified) showing your address.",
        ],
      },
      {
        heading: "2. Opt out of each data broker",
        body: "Every people-search site has a removal process, and they're legally required to honor it. You have to do each one individually.",
        bullets: [
          "Submit a removal request on each broker's opt-out page.",
          "Follow our exact per-site opt-out steps for each broker.",
          "Keep a checklist — brokers re-list your address every 30–90 days.",
        ],
      },
      {
        heading: "3. Clear your address from Google",
        body: "Use Google's 'Results about you' tool to request removal of any page that still displays your home address.",
      },
      {
        heading: "4. Reduce future exposure",
        body: "Stop your address from getting re-listed by limiting where you share it.",
        bullets: [
          "Use a PO box or work address for online forms and deliveries.",
          "Opt out of marketing and data-sharing wherever offered.",
          "Re-check quarterly, or let Footprint Finder monitor monthly.",
        ],
      },
      {
        heading: "Two layers, and only one of them moves",
        body: "Your address exists as public records — deeds, tax rolls, voter files — and as broker listings built from them. The records are fixed by statute in most states. The listings are removable. Nearly all practical progress happens in the second layer, and understanding that prevents a lot of wasted effort chasing county offices.",
      },
      {
        heading: "Do not forget the copies you made yourself",
        body: "People focus on brokers and overlook their own trail. Old marketplace listings, event registrations, business filings, club memberships, fundraising pages and resumes uploaded to job sites all commonly carry a home address, are indexed, and are within your control to delete. Search your address in quotes to find them.",
      },
      {
        heading: "When the stakes are physical",
        body: "If you are dealing with an abusive ex-partner, a stalker or sustained harassment, broker opt-outs are necessary but not sufficient, and it would be wrong to imply otherwise. Most states run address-confidentiality programmes providing a substitute legal address for survivors, which operate at the record level where opt-outs cannot reach.",
      },
    ],
    faqs: [
      {
        question: "Can I remove my home address from the internet for free?",
        answer:
          "Yes. Data brokers must remove your address on request at no cost, and Google's 'Results about you' tool is free. The work is doing it across every broker and repeating it quarterly — Footprint Finder automates this.",
      },
      {
        question: "Why does my address keep showing up online?",
        answer:
          "Data brokers continuously pull from property records, voter rolls and change-of-address data, so your address reappears 30–90 days after removal unless you keep re-submitting opt-outs.",
      },
      {
        question: "Can I remove my address from property records?",
        answer:
          "Generally no, since deeds and assessments are public by statute. The available routes are narrow: an address-confidentiality programme if you qualify, or holding future property through a trust or entity. Neither retroactively conceals a purchase already recorded in your name.",
      },
      {
        question: "Why do sites show addresses I lived at years ago?",
        answer:
          "Brokers retain everything they collect, and address history sells well because it is used for identity verification. That is exactly why a published history is a problem — it helps someone answer the questions a bank would ask.",
      },
      {
        question: "How often do I need to redo this?",
        answer:
          "Every three to six months is a realistic cadence for the major brokers. New listings appear as public records update and as brokers license data from each other, and a fresh listing at a new URL is not covered by your previous request.",
      },
    ],
  },
  {
    slug: "remove-email-address-from-internet",
    category: "Removal",
    title: "How to Remove Your Email Address From the Internet (Free Guide)",
    description:
      "Your email is exposed in breaches, broker listings and forgotten accounts. How to remove it from the internet and cut down the spam.",
    h1: "How to Remove Your Email Address From the Internet",
    primaryKeyword: "remove email address from internet",
    readTime: "6 min read",
    intro:
      "Your email address is the key that ties your entire digital footprint together — and it's exposed in data breaches, broker listings and dozens of accounts you've forgotten about. Here's how to find where your email is exposed and clean it up.",
    sections: [
      {
        heading: "1. Find where your email is exposed",
        body: "Your email is the single best starting point because almost everything is tied to it. Scan it to reveal the full picture.",
        bullets: [
          "Run a free Footprint Finder scan to find every account and breach linked to your email.",
          "Check breach databases to see which leaks include your address.",
          "Search your email in quotes on Google to find pages that publish it.",
        ],
      },
      {
        heading: "2. Delete or detach forgotten accounts",
        body: "Every dormant account stores your email and is a future breach. Close the ones you no longer use.",
        bullets: [
          "Delete unused shopping, social and newsletter accounts.",
          "Use our step-by-step guides at /delete for popular services.",
        ],
      },
      {
        heading: "3. Remove your email from data brokers",
        body: "Some people-search sites publish email addresses alongside your name. Opt out of each one that lists yours.",
        bullets: [
          "Submit opt-out requests using our free per-site guides.",
        ],
      },
      {
        heading: "4. Lock down future exposure",
        body: "Reduce how often your email leaks going forward.",
        bullets: [
          "Use email aliases or a masked address for sign-ups.",
          "Unsubscribe from lists you don't need.",
          "Monitor for new breaches automatically with Footprint Finder.",
        ],
      },
      {
        heading: "Scraped, breached, or sold — the fix differs",
        body: "Work out which applies before spending effort. Scraped addresses were published somewhere you or someone else posted them, and can often be edited or removed at that source. Breached addresses are in datasets that will never be recalled, so removal is not an option and securing the account is the only response. Sold addresses came from a company whose terms allowed sharing, and unsubscribing reaches only the senders who respect it.",
      },
      {
        heading: "Removing what is genuinely removable",
        body: "The recoverable cases are worth doing and they are finite.",
        bullets: [
          "Your own posts: forum signatures, marketplace listings, personal sites, public profiles.",
          "Business and organisation pages listing you as a contact.",
          "GitHub commits and public repositories, which expose addresses more often than people realise.",
          "People-search profiles that include an email field.",
        ],
      },
      {
        heading: "Making the address matter less",
        body: "Since you cannot recall what has leaked, the durable move is reducing what a leaked address is worth. A unique password everywhere means a breach at one service cannot reach another. Two-factor authentication on the mailbox itself matters most, because email is the reset route into everything. Aliases for new signups keep the problem from growing.",
      },
    ],
    faqs: [
      {
        question: "How do I stop spam to my email address?",
        answer:
          "Most spam comes from your address leaking through breaches, broker listings and resold marketing lists. Closing forgotten accounts, opting out of brokers and using aliases for new sign-ups cuts off the supply.",
      },
      {
        question: "Can I completely remove my email from the internet?",
        answer:
          "You can dramatically reduce exposure by deleting old accounts, opting out of brokers and removing public listings, but an email you actively use will always exist somewhere. The goal is minimizing where it's exposed and monitoring for new leaks.",
      },
      {
        question: "Can I remove my email from a breach database?",
        answer:
          "No. Breach data has been copied thousands of times and no authority can recall it. What you can do is make the leaked pair useless: change any password associated with it, and never reuse that password anywhere else.",
      },
      {
        question: "Does unsubscribing make spam worse?",
        answer:
          "Not for legitimate senders — unsubscribe links from real companies work and are legally required. For outright scam mail, clicking anything confirms the address is live and monitored, so mark it as spam instead. The rule of thumb: unsubscribe from companies you recognise, report the rest.",
      },
      {
        question: "Should I use a different address for signups?",
        answer:
          "Yes, and it is one of the higher-value habits available. An alias per service means a leak identifies who leaked it and can be disabled without changing your real address. It does nothing about addresses already circulating, so treat it as prevention rather than cleanup.",
      },
    ],
  },
  {
    slug: "remove-public-records-online",
    category: "Removal",
    title: "How to Remove Public Records From the Internet (2026 Guide)",
    description:
      "Public records expose your address, phone and relatives through data brokers. How to remove public records online for free, step by step.",
    h1: "How to Remove Public Records From the Internet",
    primaryKeyword: "remove public records online",
    readTime: "7 min read",
    intro:
      "Public records — property deeds, voter registrations, court filings — are the raw material data brokers use to build the profiles that expose your address, phone number and relatives online. You usually can't erase the underlying record, but you can remove it from the sites that republish it. Here's how.",
    sections: [
      {
        heading: "Public record vs. broker listing — know the difference",
        body: "The original public record (held by a county or government office) is rarely removable. What you can remove is the data-broker page that scrapes and republishes that record to the open web — and that's what actually shows up when someone searches you.",
      },
      {
        heading: "1. Find which sites republish your records",
        body: "Map every people-search site that's built a profile from your public records.",
        bullets: [
          "Run a free scan to find broker listings tied to your information.",
          "Search your name and city in Google to surface the broker pages.",
        ],
      },
      {
        heading: "2. Opt out of each broker",
        body: "Submit removal requests to every site republishing your records. They're legally required to comply.",
        bullets: [
          "Use our exact per-site opt-out instructions for each broker.",
          "Re-check quarterly — brokers re-scrape records and re-list you.",
        ],
      },
      {
        heading: "3. Request limited suppression at the source",
        body: "Some jurisdictions let specific groups (judges, law enforcement, abuse survivors) suppress certain public records. Check your county clerk and state programs if you qualify.",
      },
      {
        heading: "The distinction that governs everything here",
        body: "A public record and a published listing are different objects. The record sits with a county or state agency and is open by statute. The listing is a broker's republished copy, optimised to rank in search. Removing the listing is usually achievable; sealing the record almost never is, and requires a court. Knowing which you are attacking prevents months of frustration.",
      },
      {
        heading: "Where sealing is actually possible",
        body: "There are real exceptions, and they are worth checking against your own situation.",
        bullets: [
          "Expungement or sealing of criminal records, which many states allow after a waiting period, and several now do automatically.",
          "Juvenile records, which are frequently sealed by default.",
          "Cases dismissed or ending in acquittal, which are often eligible immediately.",
          "Address-confidentiality programmes for survivors of domestic violence, stalking and sexual assault.",
        ],
      },
      {
        heading: "Mugshots, which are their own problem",
        body: "Mugshot-publishing sites built a business on charging people to remove images of arrests that frequently never led to conviction. Many states have since passed laws requiring free removal on request, particularly where charges were dropped, and several have banned the removal-fee model outright. Never pay one of these sites before checking your state's law — payment often produces a copy on a sister site rather than a removal.",
      },
    ],
    faqs: [
      {
        question: "Can you remove public records from the internet?",
        answer:
          "You generally can't erase the original government record, but you can remove the data-broker pages that republish it — and those are what appear in search results. Opting out of each broker takes your information off the open web.",
      },
      {
        question: "Are public records the reason my info is on people-search sites?",
        answer:
          "Yes. People-search sites build their profiles largely from public records like property, voter and court data, then combine it with other sources. Removing the broker listings is the practical way to control your exposure.",
      },
      {
        question: "Can I get court records removed from Google?",
        answer:
          "Rarely from the court's own site, since those are public by statute. Broker republications of the same case are removable through each broker's opt-out. If the underlying record has been expunged or sealed, you have a much stronger basis to demand removal everywhere, and sites that refuse may be breaking state law.",
      },
      {
        question: "Do I have to pay to remove a mugshot?",
        answer:
          "Often not. Many states now require free removal on request, especially where charges were dismissed, and some have banned removal fees entirely. Check your state's law before paying anything — paying tends to fund the business model rather than solve the problem.",
      },
      {
        question: "Does expungement remove records from the internet?",
        answer:
          "It removes them from official sources, but copies already scraped by brokers do not vanish automatically. You generally need to notify each site with the expungement order. Sites that refuse to comply after being shown one may be violating state law, which gives you real leverage.",
      },
    ],
  },

  // ===================== PRIORITY 3: DIGITAL FOOTPRINT EDUCATION =====================
  {
    slug: "what-is-a-digital-footprint",
    category: "Education",
    title: "What Is a Digital Footprint? (And How to Shrink Yours)",
    description:
      "Your digital footprint is every trace you leave online — accounts, breaches, broker listings, search results. What it is and how to shrink it.",
    h1: "What Is a Digital Footprint?",
    primaryKeyword: "what is a digital footprint",
    readTime: "6 min read",
    intro:
      "Your digital footprint is the trail of personal data you leave behind every time you sign up for a service, get caught in a breach, or get listed by a data broker. Most people's footprint is far larger than they realize — and shrinking it starts with seeing it.",
    sections: [
      {
        heading: "Active vs. passive digital footprint",
        body: "Your footprint comes in two forms. Active is what you deliberately share — posts, sign-ups, profiles. Passive is what's collected about you without action — tracking, public records, data sold by brokers. The passive footprint is usually the bigger privacy risk.",
      },
      {
        heading: "What makes up your digital footprint",
        body: "A typical footprint spans far more than social media.",
        bullets: [
          "Accounts tied to your email — dozens of forgotten shopping, app and newsletter sign-ups.",
          "Data-broker and people-search listings showing your address, phone and relatives.",
          "Data breaches that leaked your email, passwords and personal details.",
          "Search results that surface all of the above to anyone who looks.",
        ],
      },
      {
        heading: "Why your digital footprint matters",
        body: "A large footprint means more spam, more phishing targets, easier doxxing and a higher risk of identity theft. Reducing it directly lowers your exposure.",
      },
      {
        heading: "How to see and shrink your footprint",
        body: "You can't shrink what you can't see — start by mapping it.",
        bullets: [
          "Run a free Footprint Finder scan to reveal every account, broker listing and breach tied to your email.",
          "Delete forgotten accounts and opt out of data brokers.",
          "Remove exposed results from Google, then monitor monthly so it stays small.",
        ],
      },
      {
        heading: "The part almost nobody counts",
        body: "Ask someone how many online accounts they have and the usual answer is somewhere between ten and thirty. The real number is typically well over a hundred. The gap is made of things that never felt like signing up: a one-off checkout that created an account, a store that emailed a receipt, an app abandoned after a week, a service that was later acquired by a company you have never dealt with. Every one of those still holds whatever you gave it.",
      },
      {
        heading: "Why dormant accounts are the risky ones",
        body: "An account you use is an account you would notice being breached. A dormant one is the opposite: nobody is watching it, the password is probably one you stopped using years ago, and the company has less reason to invest in securing data that generates no revenue. When it does leak, the credentials still work anywhere you reused them, and the personal details feed straight back into the broker ecosystem.",
      },
      {
        heading: "Shrinking it, in order of effect",
        body: "Not all of these are equally worth your time, so they are listed by what they actually change rather than by how easy they are.",
        bullets: [
          "Close accounts you no longer use — the only step that reduces exposure to breaches that have not happened yet.",
          "Opt out of data brokers, which removes the assembled public profile rather than the underlying records.",
          "Request your data from the big platforms, which shows you the scale before you decide what to cut.",
          "Use unique passwords, so one dormant account's breach cannot reach a live one.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is an example of a digital footprint?",
        answer:
          "An old account you forgot about, a data-broker page listing your home address, your email appearing in a breach dump, and your name surfacing in Google search results are all parts of your digital footprint.",
      },
      {
        question: "How do I reduce my digital footprint?",
        answer:
          "Map it with a scan, delete unused accounts, opt out of data brokers, remove exposed search results, and use aliases for new sign-ups. Ongoing monitoring keeps it from growing back.",
      },
      {
        question: "How many online accounts does the average person have?",
        answer:
          "Far more than they can name from memory. Estimates vary by methodology, but every study lands well above the number people guess. The practical test is better than any statistic: search your inbox for the words welcome, verify and receipt, and count the distinct senders. That list is your footprint, and it is usually the first time people see the real size of it.",
      },
      {
        question: "Does deleting an account remove my data?",
        answer:
          "Partly. Deletion usually removes your profile and your visible activity, but companies routinely retain transaction and billing records for tax and legal reasons, keep data already shared with partners, and hold backups for a period. Deleting is still worth doing — it removes you from future breaches of that service — but treat total erasure as the exception rather than the expectation.",
      },
      {
        question: "Can I find accounts I have completely forgotten about?",
        answer:
          "Your inbox is the record. Signup confirmations, receipts and marketing mail form a trail back to nearly every account you ever created, which is why searching it is more reliable than trying to remember. That is exactly what our free scan automates.",
      },
    ],
  },

  // ===================== PRIORITY 4: DISCOVERY INTENT =====================
  {
    slug: "who-has-my-email-address",
    category: "Discovery",
    title: "Who Has My Email Address? Find Out in 60 Seconds",
    description:
      "Find out who has your email address — which accounts, data brokers and breaches it's tied to. Run a free 60-second scan to see everywhere your email is exposed.",
    h1: "Who Has My Email Address?",
    primaryKeyword: "who has my email address",
    readTime: "5 min read",
    intro:
      "Your email address is tied to dozens — often hundreds — of accounts, marketing lists and breached databases. Most people have no idea how far it's spread. Here's how to find out exactly who has your email and what to do about it.",
    sections: [
      {
        heading: "Companies and accounts you've signed up for",
        body: "Every shop, app, newsletter and service you've ever used holds your email. Forgotten accounts are the biggest hidden source of exposure — and each one is a future breach.",
      },
      {
        heading: "Data brokers and marketing lists",
        body: "Lead-generation and data-broker companies buy and resell contact lists, so your email circulates far beyond the sites you actually used.",
      },
      {
        heading: "Data breaches",
        body: "If a service you used was breached, your email — and often your password — may be in a breach dump being traded online. Many people are in dozens of breaches without knowing.",
      },
      {
        heading: "How to see who has your email",
        body: "Scanning your inbox reveals every account, broker listing and breach tied to your address in about a minute.",
        bullets: [
          "Run a free Footprint Finder scan with just your email.",
          "Review the accounts, breaches and brokers that hold it.",
          "Delete what you don't use and opt out of the rest.",
        ],
      },
      {
        heading: "Your email is the key to everything else",
        body: "It is worth being clear about why this matters more than it appears. Your email address is the reset route into every account you own, which means an attacker who controls it controls the rest, regardless of how strong those other passwords are. It is also the join key that lets brokers and advertisers link records about you across otherwise unconnected companies.",
      },
      {
        heading: "Working out where it has spread",
        body: "Three checks give you a realistic picture between them.",
        bullets: [
          "Breach lookup: which known breaches include your address, and what else leaked alongside it.",
          "Inbox archaeology: search for welcome, verify and receipt to find the accounts you created.",
          "Connected logins: check what your Google, Apple or Facebook sign-in is authorising.",
        ],
      },
      {
        heading: "Aliases, and when they are worth it",
        body: "Address aliases let you give a different address to each service, so a leak identifies who leaked it and can be switched off without changing your real address. Apple's Hide My Email and several mail providers offer this. It is genuinely effective going forward and does nothing about addresses already in circulation, so treat it as a change of habit rather than a cleanup tool.",
      },
    ],
    faqs: [
      {
        question: "How can I find out who has my email address?",
        answer:
          "Scan your inbox to reveal every account tied to your email, and check breach databases to see which leaks include it. Footprint Finder does both automatically in about 60 seconds.",
      },
      {
        question: "Is it bad if lots of companies have my email?",
        answer:
          "The more places your email exists, the more spam, phishing and breach risk you face. Reducing the number of accounts and lists that hold it directly lowers your exposure.",
      },
      {
        question: "Should I change my email address?",
        answer:
          "Rarely, because the cost is high and the benefit is smaller than it looks — the old address stays in every breach dataset regardless. Securing it properly is usually the better trade: a unique password, two-factor authentication that is not SMS, and aliases for anything new.",
      },
      {
        question: "What does it mean if my email is in a breach?",
        answer:
          "It depends entirely on what leaked with it. An address alone is low risk and mostly means more spam. An address with a password is serious, because credential-stuffing tools will try that pair everywhere. An address with identity data such as a Social Security number calls for a credit freeze.",
      },
      {
        question: "How do spammers get my address?",
        answer:
          "Breach dumps, list purchases from companies whose terms permitted sharing, scraping of addresses published on websites, and occasionally simple guessing at common name patterns on large providers. Unsubscribing helps with legitimate senders and does nothing for the rest.",
      },
    ],
  },
  {
    slug: "why-is-my-phone-number-online",
    category: "Discovery",
    title: "Why Is My Phone Number Online? (And How to Remove It)",
    description:
      "Data brokers buy your phone number and people-search sites publish it. Why your number is public, how they got it, and how to remove it free.",
    h1: "Why Is My Phone Number Online?",
    primaryKeyword: "why is my phone number online",
    readTime: "5 min read",
    intro:
      "If you're getting nonstop spam calls and texts, your phone number is almost certainly published on people-search and data-broker sites. It's not a hack — it's a business. Here's why your number is online and how to take it back.",
    sections: [
      {
        heading: "Why your number ended up online",
        body: "Your phone number is collected from sources you'd never expect, then aggregated and published.",
        bullets: [
          "Online forms, giveaways, loyalty programs and warranties that resell your data.",
          "Public records and change-of-address data scraped by brokers.",
          "Data breaches that leaked your contact details to the open market.",
        ],
      },
      {
        heading: "Who publishes it",
        body: "People-search sites like Whitepages, Spokeo and BeenVerified display your number next to your name and address, while marketing companies resell it to advertisers and scammers.",
      },
      {
        heading: "How to remove your phone number",
        body: "You can get it taken down for free, but it has to be done site by site.",
        bullets: [
          "Run a free scan to find every site listing your number.",
          "Opt out of each data broker using our free per-site guides.",
          "Use Google's 'Results about you' tool for leftover search results.",
        ],
      },
      {
        heading: "The listing is a product, not an accident",
        body: "Reverse-lookup sites do not publish your number because of an error. They build a page per number deliberately, because number-to-identity lookup is something people pay for — debt collectors, recruiters, and anyone trying to identify a caller. Your listing exists because it has a buyer.",
      },
      {
        heading: "How it got there",
        body: "Several channels, most of them unremarkable.",
        bullets: [
          "Forms: deliveries, appointments, warranties, competitions, loyalty schemes.",
          "Carrier and directory data, historically published and still resold.",
          "Breaches that paired your number with your name.",
          "Your own past postings — marketplace listings, business filings, old resumes.",
        ],
      },
      {
        heading: "Preventing it recurring",
        body: "Removal is worth doing and it will not hold indefinitely, because the same channels keep operating. The change that actually sticks is giving a secondary or virtual number to anything transactional and reserving your real number for people who need to reach you. It costs little and it stops the problem regenerating.",
      },
    ],
    faqs: [
      {
        question: "Why is my phone number showing up when I search my name?",
        answer:
          "Data brokers compile your number from forms, public records and breaches, then people-search sites publish it next to your name. Those pages get indexed by Google, so they appear when you search yourself.",
      },
      {
        question: "How do I get my phone number off the internet?",
        answer:
          "Opt out of the people-search sites listing it and remove it from Google. Because brokers re-list numbers every few months, re-check quarterly or use monitoring to stay removed.",
      },
      {
        question: "Can I get my number removed permanently?",
        answer:
          "You can remove any given listing, and it will not stay gone forever. Brokers rebuild from the same sources, so expect to recheck periodically. Treating it as maintenance rather than a one-time fix is the accurate expectation.",
      },
      {
        question: "Does an unlisted number help?",
        answer:
          "Less than it used to. Unlisted status applies to traditional directory publication, and people-search sites assemble numbers from commercial and breach sources that have nothing to do with the phone book. Plenty of unlisted numbers appear on reverse-lookup sites.",
      },
      {
        question: "Why do I get calls for someone else?",
        answer:
          "Recycled numbers. Carriers reassign disconnected numbers, and broker records lag behind by years, so the previous holder's identity can stay attached to your number in commercial databases long after it became yours.",
      },
    ],
  },
  {
    slug: "how-did-whitepages-get-my-information",
    category: "Discovery",
    title: "How Did Whitepages Get My Information? (And How to Remove It)",
    description:
      "Whitepages got your data from public records, marketing lists and other brokers. How it built your profile — and how to remove yourself free.",
    h1: "How Did Whitepages Get My Information?",
    primaryKeyword: "how did whitepages get my information",
    readTime: "5 min read",
    intro:
      "Finding your name, address, phone number and relatives on Whitepages is unsettling — but you never gave them your data directly. Here's exactly where Whitepages gets your information and how to remove your listing for free.",
    sections: [
      {
        heading: "Where Whitepages gets your data",
        body: "Whitepages doesn't collect data from you — it aggregates it from sources that are technically public or commercially available.",
        bullets: [
          "Public records: property deeds, voter rolls, court filings and licenses.",
          "Marketing and consumer data bought from other brokers and list sellers.",
          "Phone directory and carrier data tied to your number.",
          "Other people-search sites it cross-references to fill in the gaps.",
        ],
      },
      {
        heading: "Why your profile is so detailed",
        body: "By merging these sources, Whitepages builds a single profile linking your name to your address history, phone numbers, age and relatives — far more than any single record contains.",
      },
      {
        heading: "How to remove yourself from Whitepages",
        body: "Whitepages offers a free opt-out, and you can remove the rest of your exposure too.",
        bullets: [
          "Follow our exact step-by-step Whitepages opt-out guide.",
          "Run a free scan to find the other brokers holding the same data.",
          "Re-check quarterly — Whitepages can re-list you as records refresh.",
        ],
      },
      {
        heading: "No leak, no account, no notification",
        body: "The unsettling part of the answer is how ordinary it is. Whitepages and its competitors compile from public records — property deeds, voter files, court filings, marriage records — and license commercial data from other brokers. You never had an account, nothing was breached, and there was no obligation to tell you. That is the standard operating model of the entire people-search category, not a Whitepages peculiarity.",
      },
      {
        heading: "Why relatives and old addresses appear",
        body: "Brokers infer households by matching shared addresses across records over time, then cross-reference marriage and birth records to label relationships. It is statistical inference rather than a leak, which is why the relationships are sometimes wrong — an old housemate listed as a relative is a common artefact — and why correcting them is usually less effective than removing the profile outright.",
      },
      {
        heading: "One opt-out is not the job",
        body: "Removing yourself from Whitepages removes you from Whitepages. Dozens of other sites hold overlapping data licensed from overlapping sources, and several operate multiple brands from the same database, so a single opt-out can leave near-identical profiles live under different names. Working through the major operators is what produces a visible change when you search yourself.",
      },
    ],
    faqs: [
      {
        question: "Is it legal for Whitepages to have my information?",
        answer:
          "Yes — most of the source data is public or commercially available, so Whitepages is allowed to compile and publish it. But you have the right to opt out and request removal at no cost.",
      },
      {
        question: "How do I get my information off Whitepages?",
        answer:
          "Use the free Whitepages opt-out, which we walk through step by step. Because the same data lives on dozens of other brokers, scanning for your full exposure and opting out everywhere is the complete fix.",
      },
      {
        question: "Is it legal for Whitepages to publish my information?",
        answer:
          "In most of the US, yes. Publishing information compiled from public records is generally lawful, which is why the industry exists at scale. State privacy laws in California, Colorado, Texas, Virginia and a growing list of others give residents enforceable deletion rights, and California's DROP platform reaches every broker registered in the state with a single request.",
      },
      {
        question: "Will opting out remove me from other sites?",
        answer:
          "No. Each operator maintains its own database and each opt-out is separate. Some companies run several brands from one dataset, so check whether the site you just opted out of has sister sites carrying the same profile.",
      },
      {
        question: "How long until my profile comes back?",
        answer:
          "Commonly a few months to a year. Brokers rebuild from the same public records they used originally, so a removal is a point-in-time action rather than a permanent state. Rechecking a few times a year keeps it under control.",
      },
    ],
  },
];

export const getGuide = (slug: string) =>
  GUIDES.find((g) => g.slug === slug);

/**
 * Curated internal-linking web. Each guide points to the most topically
 * relevant guides so Google sees a tight topic cluster, not isolated pages.
 * Only valid guide slugs should appear here.
 */
export const RELATED_GUIDES: Record<string, string[]> = {
  "california-drop-delete-act": [
    "remove-personal-information-from-internet",
    "what-is-a-data-broker",
    "how-do-data-brokers-get-my-information",
    "remove-address-from-internet",
  ],
  // New priority pages
  "remove-address-from-internet": [
    "why-is-my-address-online",
    "remove-public-records-online",
    "remove-personal-information-from-internet",
    "how-did-whitepages-get-my-information",
  ],
  "remove-email-address-from-internet": [
    "who-has-my-email-address",
    "remove-personal-information-from-internet",
    "what-is-a-digital-footprint",
    "who-has-my-personal-information",
  ],
  "remove-public-records-online": [
    "remove-address-from-internet",
    "how-did-whitepages-get-my-information",
    "what-is-a-data-broker",
    "remove-personal-information-from-internet",
  ],
  "what-is-a-digital-footprint": [
    "who-has-my-personal-information",
    "remove-personal-information-from-internet",
    "what-is-a-data-broker",
    "who-has-my-email-address",
  ],
  "who-has-my-email-address": [
    "remove-email-address-from-internet",
    "who-has-my-personal-information",
    "what-is-a-digital-footprint",
    "how-many-companies-have-my-information",
  ],
  "why-is-my-phone-number-online": [
    "remove-phone-number-from-internet",
    "who-has-my-phone-number",
    "how-to-stop-spam-calls",
    "how-did-whitepages-get-my-information",
  ],
  "how-did-whitepages-get-my-information": [
    "how-do-data-brokers-get-my-information",
    "remove-address-from-internet",
    "remove-public-records-online",
    "what-is-a-data-broker",
  ],
  // Discovery
  "why-is-my-address-online": [
    "what-is-a-data-broker",
    "remove-address-from-google",
    "remove-personal-information-from-internet",
    "how-do-data-brokers-get-my-information",
  ],
  "who-has-my-phone-number": [
    "remove-phone-number-from-google",
    "remove-phone-number-from-internet",
    "how-to-stop-spam-calls",
    "what-is-a-data-broker",
  ],
  "how-do-data-brokers-get-my-information": [
    "what-is-a-data-broker",
    "why-is-my-address-online",
    "remove-personal-information-from-internet",
    "how-many-companies-have-my-information",
  ],
  "how-many-companies-have-my-information": [
    "who-has-my-personal-information",
    "what-is-a-data-broker",
    "how-do-data-brokers-get-my-information",
    "remove-personal-information-from-internet",
  ],
  "who-has-my-personal-information": [
    "how-many-companies-have-my-information",
    "what-is-a-data-broker",
    "remove-personal-information-from-internet",
    "remove-yourself-from-google",
  ],
  // Education
  "what-is-a-data-broker": [
    "how-do-data-brokers-get-my-information",
    "why-is-my-address-online",
    "remove-personal-information-from-internet",
    "what-is-doxxing",
  ],
  "what-is-doxxing": [
    "why-is-my-address-online",
    "remove-address-from-google",
    "how-to-stop-identity-theft",
    "what-is-a-data-broker",
  ],
  "how-to-stop-spam-calls": [
    "who-has-my-phone-number",
    "remove-phone-number-from-google",
    "remove-phone-number-from-internet",
    "what-is-a-data-broker",
  ],
  "how-to-stop-identity-theft": [
    "what-is-a-data-broker",
    "how-many-companies-have-my-information",
    "remove-personal-information-from-internet",
    "what-is-doxxing",
  ],
  // Google Removal
  "remove-phone-number-from-google": [
    "remove-phone-number-from-internet",
    "who-has-my-phone-number",
    "how-to-stop-spam-calls",
    "remove-yourself-from-google",
  ],
  "remove-address-from-google": [
    "why-is-my-address-online",
    "remove-personal-information-from-internet",
    "remove-name-from-google",
    "remove-yourself-from-google",
  ],
  "remove-images-from-google": [
    "remove-name-from-google",
    "remove-yourself-from-google",
    "what-is-doxxing",
    "remove-personal-information-from-internet",
  ],
  "remove-name-from-google": [
    "remove-yourself-from-google",
    "remove-address-from-google",
    "remove-images-from-google",
    "remove-personal-information-from-internet",
  ],
  // Original pillars
  "remove-personal-information-from-internet": [
    "who-has-my-personal-information",
    "what-is-a-data-broker",
    "remove-yourself-from-google",
    "remove-phone-number-from-internet",
  ],
  "remove-phone-number-from-internet": [
    "remove-phone-number-from-google",
    "who-has-my-phone-number",
    "how-to-stop-spam-calls",
    "remove-personal-information-from-internet",
  ],
  "remove-yourself-from-google": [
    "remove-name-from-google",
    "remove-address-from-google",
    "remove-personal-information-from-internet",
    "who-has-my-personal-information",
  ],
};

/**
 * Curated broker cross-links per guide → /remove-from/:slug pages.
 * Builds the cluster bridge from guides into bottom-funnel broker pages.
 */
export const RELATED_BROKERS: Record<string, string[]> = {
  "california-drop-delete-act": ["whitepages", "spokeo", "radaris"],
  "remove-address-from-internet": ["whitepages", "spokeo", "radaris"],
  "remove-email-address-from-internet": ["spokeo", "beenverified", "mylife"],
  "remove-public-records-online": ["whitepages", "radaris", "beenverified"],
  "what-is-a-digital-footprint": ["whitepages", "spokeo", "beenverified"],
  "who-has-my-email-address": ["spokeo", "beenverified", "mylife"],
  "why-is-my-phone-number-online": ["whitepages", "spokeo", "truthfinder"],
  "how-did-whitepages-get-my-information": ["whitepages", "spokeo", "radaris"],
  "why-is-my-address-online": ["whitepages", "spokeo", "radaris"],
  "who-has-my-phone-number": ["whitepages", "spokeo", "truthfinder"],
  "how-do-data-brokers-get-my-information": ["spokeo", "beenverified", "intelius"],
  "how-many-companies-have-my-information": ["whitepages", "beenverified", "mylife"],
  "who-has-my-personal-information": ["whitepages", "spokeo", "beenverified"],
  "what-is-a-data-broker": ["whitepages", "spokeo", "beenverified"],
  "what-is-doxxing": ["whitepages", "radaris", "peoplefinders"],
  "how-to-stop-spam-calls": ["whitepages", "spokeo", "truthfinder"],
  "how-to-stop-identity-theft": ["intelius", "beenverified", "mylife"],
  "remove-phone-number-from-google": ["whitepages", "spokeo", "truthfinder"],
  "remove-address-from-google": ["whitepages", "spokeo", "radaris"],
  "remove-images-from-google": ["mylife", "spokeo", "radaris"],
  "remove-name-from-google": ["whitepages", "spokeo", "beenverified"],
  "remove-personal-information-from-internet": ["whitepages", "spokeo", "beenverified"],
  "remove-phone-number-from-internet": ["whitepages", "spokeo", "truthfinder"],
  "remove-yourself-from-google": ["whitepages", "spokeo", "radaris"],
};

const BROKER_LABELS: Record<string, string> = {
  whitepages: "Whitepages",
  spokeo: "Spokeo",
  beenverified: "BeenVerified",
  radaris: "Radaris",
  mylife: "MyLife",
  truthfinder: "TruthFinder",
  intelius: "Intelius",
  peoplefinders: "PeopleFinders",
};

export const getRelatedGuides = (slug: string): Guide[] =>
  (RELATED_GUIDES[slug] ?? [])
    .map((s) => getGuide(s))
    .filter((g): g is Guide => Boolean(g));

export const getRelatedBrokers = (slug: string): { slug: string; name: string }[] =>
  (RELATED_BROKERS[slug] ?? []).map((s) => ({
    slug: s,
    name: BROKER_LABELS[s] ?? s,
  }));
