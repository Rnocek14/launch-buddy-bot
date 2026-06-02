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

export type Guide = {
  slug: string;
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
];

export const getGuide = (slug: string) =>
  GUIDES.find((g) => g.slug === slug);
