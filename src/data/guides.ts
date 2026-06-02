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
    slug: "remove-personal-information-from-internet",
    category: "Removal",
    title:
      "How to Remove Your Personal Information From the Internet (2026 Guide)",
    description:
      "A free, step-by-step guide to removing your personal information from the internet — data brokers, Google, breaches and old accounts. Plus a 60-second scan to find where you're exposed.",
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
          "Use our per-broker guides at /remove-from for exact steps on each site.",
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
    ],
  },
  {
    slug: "remove-phone-number-from-internet",
    category: "Removal",
    title: "How to Remove Your Phone Number From the Internet (Free Guide)",
    description:
      "Stop spam calls and protect your privacy. A free step-by-step guide to removing your phone number from data brokers, Google and people-search sites — plus a scan to find where it's listed.",
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
          "See per-site steps in our /remove-from guides.",
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
    ],
  },
  {
    slug: "remove-yourself-from-google",
    category: "Google Removal",
    title: "How to Remove Your Personal Information From Google (Free, 2026)",
    description:
      "Remove your personal information from Google search results for free using the 'Results about you' tool — plus how to delete the underlying data-broker listings so it doesn't come back.",
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
          "Submit an opt-out on that broker using our /remove-from guides.",
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
    ],
  },
  {
    slug: "who-has-my-personal-information",
    category: "Discovery",
    title: "Who Has My Personal Information? Find Out in 60 Seconds",
    description:
      "Find out who has your personal information — which data brokers, breaches and companies hold your name, address, phone and email. Run a free 60-second scan to see your exposure.",
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
          "Opt out of each data broker using our /remove-from guides.",
          "Use Google's 'Results about you' tool to clear it from search results.",
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
    ],
  },
  {
    slug: "how-do-data-brokers-get-my-information",
    category: "Discovery",
    title: "How Do Data Brokers Get My Information? (Explained)",
    description:
      "Data brokers collect your information from public records, online activity, purchases and other brokers. Here's exactly how they build a profile on you — and how to opt out.",
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
          "Submit opt-outs using our /remove-from guides and re-check quarterly.",
        ],
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
    ],
  },
  {
    slug: "how-many-companies-have-my-information",
    category: "Discovery",
    title: "How Many Companies Have My Personal Information?",
    description:
      "The average person's data is held by hundreds of companies — data brokers, apps, retailers and breached databases. Find out how many have yours with a free scan.",
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
          "Use our /remove-from guides for step-by-step opt-outs.",
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
    ],
  },
  {
    slug: "how-to-stop-identity-theft",
    category: "Education",
    title: "How to Stop Identity Theft Before It Happens",
    description:
      "Identity theft starts with exposed personal data. Learn how to prevent identity theft by removing your information from data brokers and locking down your accounts.",
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
          "Opt out using our /remove-from guides.",
        ],
      },
      {
        heading: "3. Monitor so it doesn't return",
        body: "Brokers re-list numbers and Google re-indexes them. Re-check quarterly or let Footprint Finder monitor monthly.",
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
          "Opt out using our /remove-from guides.",
        ],
      },
      {
        heading: "3. Clear cached results and monitor",
        body: "Use 'Remove outdated content' once the source is gone, then re-check quarterly or let Footprint Finder monitor monthly.",
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
          "Opt out of each broker using our /remove-from guides.",
          "Use Google's 'Results about you' tool for results exposing contact info.",
        ],
      },
      {
        heading: "3. Monitor your name long-term",
        body: "Brokers re-list you and Google re-indexes new profiles. Re-search quarterly or let Footprint Finder track it monthly.",
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
    ],
  },
];

export const getGuide = (slug: string) =>
  GUIDES.find((g) => g.slug === slug);
