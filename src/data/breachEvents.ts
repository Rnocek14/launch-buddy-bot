// Breach-reaction landing pages. Each entry powers /breach/:slug
// Add a new entry the same day a breach hits the news, then link it from
// the founder reaction video. No code changes required — data only.
//
// ACCURACY RULES (compliance — do not relax these)
// ------------------------------------------------
// 1. Only list breaches that were publicly reported and are settled fact.
//    No rumoured, alleged or unconfirmed incidents.
// 2. Keep `whatLeaked` to data classes that were actually confirmed exposed.
//    Where a figure is a claim by the attacker rather than a confirmation by
//    the company, say so in the text.
// 3. Never state or imply that a settlement claim window is still open. Claim
//    deadlines pass, this file does not get re-read every month, and telling
//    someone they can still file when they cannot is worse than saying
//    nothing. `settlement` is written in the past tense, as history.
//
// WHY THESE PAGES EXIST AT ALL
// ----------------------------
// The news cycle covers a breach for about four days and then stops, but the
// searches never stop — people find a five-year-old breach notification in a
// drawer, or get a fraud alert and start working backwards. Every article
// they find is a news story dated to the week it happened, written for
// readers who did not yet know. `stillMatters` is the field that makes these
// pages worth existing: it answers the question a news story cannot, which
// is what this means for you now, years later.

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
  /** How the breach actually happened. Two short paragraphs at most. */
  whatHappened?: string[];
  /** Why it still matters now — the reason this page beats a news article. */
  stillMatters?: string;
  /** Historical note on any settlement. Past tense only. See rule 3 above. */
  settlement?: string;
  faqs?: Array<{ question: string; answer: string }>;
  /** Severity of the exposed data, used for sorting and for the index page. */
  severity?: "identity" | "credentials" | "contact";
};

export const BREACH_EVENTS: BreachEvent[] = [
  {
    slug: "national-public-data",
    company: "National Public Data",
    date: "August 2024",
    isoDate: "2024-08-01",
    affected: "billions of records",
    severity: "identity",
    summary:
      "A background-check data broker known as National Public Data was reported to have leaked a massive file containing names, addresses, and Social Security numbers compiled from public and non-public sources — most affected people never signed up for the service.",
    whatHappened: [
      "National Public Data was a data broker that scraped and purchased personal records in bulk and resold them to background-check services. In April 2024 a hacking group offered a database attributed to the company for sale, and by August a large file had been posted publicly and was being widely mirrored.",
      "The company was not a service anybody signed up for. It assembled profiles on people who had never heard of it, which is why the breach reached people with no relationship to any of the brands involved. The parent company filed for bankruptcy protection later that year.",
    ],
    whatLeaked: [
      "Full names",
      "Current and past home addresses",
      "Social Security numbers (in many records)",
      "Phone numbers",
    ],
    stillMatters:
      "This one is different from a password breach in a way that matters: you can change a password, and you cannot change your Social Security number or the address history attached to your name. The file has been copied thousands of times and is not going to be recalled. What that means practically is that a credit freeze is not an overreaction here — it is the only control that still works once identity data is public, because it blocks new accounts being opened in your name regardless of who holds the number.",
    whatToDo: [
      "Check whether your email and details appear in known breaches.",
      "Freeze your credit at all three bureaus (Equifax, Experian, TransUnion) — it's free and it is the single most effective step available to you.",
      "Watch for targeted phishing that references your real address or a genuine past address, which is the tell that the sender bought a record rather than guessed.",
      "Opt out of the data brokers that resell this kind of profile — the same records are still being sold by companies that are still trading.",
    ],
    faqs: [
      {
        question: "How do I know if I was in the National Public Data breach?",
        answer:
          "Because the company collected data on people who never used it, there is no account to check. Breach-lookup tools that index the file by email address are the usual route, but the file's records were keyed to names and addresses rather than emails, so an email search can come back clean even when your record is in there. Assume exposure if you have a US credit history, and act accordingly.",
      },
      {
        question: "Should I pay for identity theft protection because of this?",
        answer:
          "A credit freeze does more than most paid monitoring and costs nothing. Monitoring tells you after someone opens an account; a freeze stops the account being opened. Consider paid monitoring as an addition once the free step is done, not as a substitute for it.",
      },
      {
        question: "Can I get my data removed from data brokers like this one?",
        answer:
          "From the ones still operating, usually yes — most US people-search brokers accept opt-out requests, and in some states they are legally obliged to honour them. It is a recurring job rather than a one-off, because brokers rebuild their databases from public records and from each other.",
      },
    ],
    source: {
      label: "Reported widely in August 2024",
      url: "https://en.wikipedia.org/wiki/National_Public_Data_breach",
    },
  },
  {
    slug: "equifax",
    company: "Equifax",
    date: "September 2017",
    isoDate: "2017-09-07",
    affected: "about 147 million people",
    severity: "identity",
    summary:
      "Equifax, one of the three US credit bureaus, disclosed that attackers had accessed the personal records of roughly 147 million Americans — including Social Security numbers, birth dates and addresses. Nobody in that group had chosen to be an Equifax customer; the bureau held their files because it holds nearly everyone's.",
    whatHappened: [
      "Attackers exploited a known vulnerability in a web application framework that Equifax had not patched, despite a fix being publicly available for months. They kept access for roughly eleven weeks before the intrusion was detected.",
      "The disclosure and the response that followed became a case study in what not to do — a separate signup site for checking exposure, early confusion over whether checking waived your legal rights, and executives selling stock before the public announcement. Congressional hearings and a multi-agency investigation followed.",
    ],
    whatLeaked: [
      "Names, Social Security numbers, birth dates and addresses",
      "Driver's licence numbers for a subset of people",
      "Around 209,000 credit card numbers",
      "Dispute documents containing personal identifying information for around 182,000 people",
    ],
    stillMatters:
      "Equifax is the reason a credit freeze is free in every US state. Before 2017 bureaus charged a fee to lock your own file; the backlash produced federal law making freezes and thaws free nationwide. The exposed data itself has not aged out — Social Security numbers do not expire, so a 2017 record is as useful to a fraudster now as it was then. If you have never frozen your credit, this is the breach that made doing so both free and necessary.",
    settlement:
      "Equifax agreed to a settlement with the FTC, the CFPB and 50 states and territories in 2019, covering up to $425 million for consumer relief plus civil penalties. The claims window for that settlement closed years ago; it is noted here as history, not as an available remedy.",
    whatToDo: [
      "Freeze your credit at Equifax, Experian and TransUnion. It is free by law, largely because of this breach.",
      "Request your free annual credit reports and read them for accounts you do not recognise.",
      "Add a fraud alert if a freeze is impractical for you — it is weaker but better than nothing.",
      "Treat any call claiming to be from a credit bureau as suspect. Bureaus do not cold-call you about your file.",
    ],
    faqs: [
      {
        question: "Am I still at risk from the Equifax breach?",
        answer:
          "The specific data exposed — name, Social Security number, date of birth, address — does not change over time, so yes, in the sense that the information is still valid and still circulating. What has changed is that the defence is now free: a credit freeze at all three bureaus blocks new credit being opened in your name, and it is the control that matches this kind of exposure.",
      },
      {
        question: "Does freezing my credit hurt my credit score?",
        answer:
          "No. A freeze restricts who can pull your file; it is not recorded as a negative event and has no effect on your score. You can lift it temporarily when you apply for credit, usually within minutes online.",
      },
      {
        question: "Can I still claim money from the Equifax settlement?",
        answer:
          "No. The claims deadline for the 2019 settlement has long passed. Any website or caller offering to file an Equifax claim for you now is running a scam, and it is a common one precisely because the breach is so well known.",
      },
    ],
    source: {
      label: "FTC — Equifax data breach settlement",
      url: "https://www.ftc.gov/enforcement/refunds/equifax-data-breach-settlement",
    },
  },
  {
    slug: "yahoo",
    company: "Yahoo",
    date: "Disclosed 2016–2017",
    isoDate: "2017-10-03",
    affected: "all 3 billion accounts",
    severity: "credentials",
    summary:
      "Yahoo disclosed two enormous breaches in 2016, then revised the larger one in 2017 to confirm that every single Yahoo account in existence at the time — three billion of them — had been affected. It remains the largest breach of a single company on record.",
    whatHappened: [
      "The 2013 incident, disclosed in December 2016 and revised upward in October 2017, covered all three billion accounts. A separate 2014 intrusion attributed to state-sponsored actors affected around 500 million accounts and led to US indictments.",
      "The breaches surfaced during Verizon's acquisition of Yahoo and knocked roughly $350 million off the purchase price. Passwords were hashed, but a portion used MD5, an algorithm already considered inadequate at the time.",
    ],
    whatLeaked: [
      "Names, email addresses and telephone numbers",
      "Dates of birth",
      "Hashed passwords, some using the weak MD5 algorithm",
      "Security questions and answers, some unencrypted",
    ],
    stillMatters:
      "The security questions are the part that has aged worst. Your mother's maiden name and the street you grew up on are the same answers you probably still use on other accounts today, and unlike a password, most people have never changed them. If you had a Yahoo account — including one attached to Flickr, Tumblr or a BT, Sky or Rogers email address — the answers you gave then are the answers a stranger can try now.",
    whatToDo: [
      "Change any password you reused from your Yahoo account, particularly on email and banking.",
      "Change your security question answers anywhere you still use them, and treat the answers as passwords rather than facts — a made-up answer you store in a password manager is stronger than a true one.",
      "Turn on two-factor authentication on your primary email account first, because email is the reset route into everything else.",
      "Check whether the old Yahoo address is still listed as a recovery address on newer accounts.",
    ],
    faqs: [
      {
        question: "I closed my Yahoo account years ago — am I affected?",
        answer:
          "Probably, yes. The breach covered accounts as they existed in 2013, so closing the account afterwards does not remove your record from the stolen data. The practical risk is not the dead account itself but the credentials and security answers you reused elsewhere.",
      },
      {
        question: "Why do security questions matter more than the password?",
        answer:
          "Because almost nobody changes them. A password you last used in 2013 has probably been rotated somewhere along the way; the name of your first pet has not, and it is still the account-recovery route on plenty of services.",
      },
      {
        question: "Was my Flickr or Tumblr account included?",
        answer:
          "Yahoo owned both at various points and accounts tied to Yahoo authentication were within scope. Tumblr also had its own separate 2013 breach of around 65 million accounts, disclosed in 2016.",
      },
    ],
    source: {
      label: "Yahoo/Verizon disclosure, October 2017",
      url: "https://en.wikipedia.org/wiki/Yahoo!_data_breaches",
    },
  },
  {
    slug: "marriott",
    company: "Marriott / Starwood",
    date: "November 2018",
    isoDate: "2018-11-30",
    affected: "up to 383 million guest records",
    severity: "identity",
    summary:
      "Marriott disclosed that attackers had been inside the Starwood guest reservation database since 2014 — two years before Marriott acquired Starwood. Up to 383 million guest records were involved, including millions of passport numbers.",
    whatHappened: [
      "The intrusion began in 2014, before the acquisition, and persisted undetected until September 2018. Marriott inherited the compromised system along with the company and did not migrate off it before the breach was found.",
      "Around 5.25 million unencrypted passport numbers and roughly 20.3 million encrypted ones were involved, along with about 8.6 million encrypted payment cards. The UK Information Commissioner's Office fined Marriott £18.4 million.",
    ],
    whatLeaked: [
      "Names, mailing addresses, phone numbers and email addresses",
      "Passport numbers — around 5.25 million of them unencrypted",
      "Arrival and departure dates, reservation dates and communication preferences",
      "Encrypted payment card numbers, with some risk that the decryption components were also taken",
    ],
    stillMatters:
      "Passport numbers are the unusual part. Unlike a card number, a passport number is not reissued because of a breach — you keep it until the document expires, which can be a decade. And unlike almost any other breached field, travel history is a behavioural record: where you were, when, and for how long. That is a different category of exposure from a leaked email address, and it is the reason this breach still turns up in stalking and harassment cases.",
    settlement:
      "The UK ICO fined Marriott £18.4 million in 2020, reduced from an initial notice of £99 million. US regulatory action and consumer litigation followed separately.",
    whatToDo: [
      "If your passport number was exposed and the document is still valid, be alert to it being used in identity verification you did not initiate.",
      "Review old Starwood-brand loyalty accounts — Sheraton, Westin, W, Le Méridien, St. Regis and others were all in scope.",
      "Change reused passwords on any loyalty account, which are frequently targeted for points theft.",
      "Watch for travel-themed phishing that quotes a real past stay, which is the signature of data from this breach.",
    ],
    faqs: [
      {
        question: "Which hotel brands were affected?",
        answer:
          "The Starwood side of the business: Sheraton, Westin, W Hotels, St. Regis, Le Méridien, Four Points, Aloft, Element, Tribute Portfolio and Design Hotels. Marriott-branded properties used a separate reservation system that was not part of this breach.",
      },
      {
        question: "Should I get a new passport?",
        answer:
          "Marriott offered to reimburse replacement costs for affected guests at the time. Replacing a passport purely because the number leaked is rarely necessary on its own, but it is worth considering if you have seen other signs of identity misuse.",
      },
      {
        question: "How can a breach go undetected for four years?",
        answer:
          "The attackers had persistent access to a reservation database that was not being actively monitored for that kind of activity. It is the standard pattern in large breaches — detection times measured in months or years are common, not exceptional.",
      },
    ],
    source: {
      label: "UK ICO penalty notice, 2020",
      url: "https://en.wikipedia.org/wiki/Marriott_International#Data_breach",
    },
  },
  {
    slug: "t-mobile",
    company: "T-Mobile",
    date: "August 2021",
    isoDate: "2021-08-16",
    affected: "about 76.6 million people",
    severity: "identity",
    summary:
      "T-Mobile confirmed that attackers had taken records covering roughly 76.6 million current, former and prospective customers, including Social Security numbers and driver's licence details for tens of millions of them.",
    whatHappened: [
      "An attacker publicly claimed the data and described gaining access through an exposed network entry point, then moving through internal systems. T-Mobile confirmed the scale over a series of updates through August 2021.",
      "The prospective-customer records are the detail people miss: applying for service and being declined, or simply running a credit check, was enough to put a full identity record in the affected set. Being a customer was never required.",
    ],
    whatLeaked: [
      "Names, dates of birth, Social Security numbers and driver's licence or ID information for tens of millions of people",
      "Phone numbers and account PINs for a subset of customers",
      "IMEI and IMSI device identifiers for some accounts",
    ],
    stillMatters:
      "Account PINs matter more than they sound. A mobile account PIN is the control standing between an attacker and a SIM swap — moving your number to their device, at which point every SMS two-factor code goes to them instead of you. If you have not changed your T-Mobile PIN since 2021 and you still use SMS codes for banking, that is the concrete, current risk from this breach rather than a theoretical one.",
    settlement:
      "T-Mobile agreed to a $350 million consumer settlement in 2022 plus a commitment to $150 million in security spending. That claims window has closed.",
    whatToDo: [
      "Change your carrier account PIN and set a port-out or transfer lock on the line.",
      "Move two-factor authentication off SMS wherever the service offers an authenticator app, particularly for banking and email.",
      "Freeze your credit if your Social Security number was in scope.",
      "Check whether you were ever a prospective customer — a declined application counted.",
    ],
    faqs: [
      {
        question: "What is a SIM swap and why does this breach make it likelier?",
        answer:
          "A SIM swap is when someone convinces your carrier to move your phone number onto a SIM they control. Your calls and texts then go to them, including password-reset codes. Carrier PINs and personal details are exactly what an attacker needs to pass that verification, and this breach exposed both.",
      },
      {
        question: "I left T-Mobile years ago. Am I affected?",
        answer:
          "Former customers were explicitly in scope, as were people who applied and never became customers. The records were retained regardless of whether the relationship continued.",
      },
      {
        question: "Was Sprint included?",
        answer:
          "T-Mobile had completed its merger with Sprint by 2021, and former Sprint and Boost-brand records were within the affected systems for some customers. T-Mobile's notifications covered the combined customer base.",
      },
    ],
    source: {
      label: "T-Mobile breach disclosure, August 2021",
      url: "https://en.wikipedia.org/wiki/T-Mobile_US#Data_breaches",
    },
  },
  {
    slug: "capital-one",
    company: "Capital One",
    date: "July 2019",
    isoDate: "2019-07-29",
    affected: "about 106 million people",
    severity: "identity",
    summary:
      "Capital One disclosed that a single attacker had accessed credit card application data for roughly 100 million people in the US and 6 million in Canada, going back to 2005. The perpetrator was arrested within days.",
    whatHappened: [
      "A former cloud services employee exploited a misconfigured web application firewall to reach data stored in cloud storage. The intrusion was reported to Capital One by an outside researcher who had spotted the stolen data posted online.",
      "The attacker was identified and arrested quickly, and was later convicted. The unusually fast resolution is why this breach produced less onward fraud than its size suggests — the data does not appear to have been broadly resold.",
    ],
    whatLeaked: [
      "Names, addresses, postcodes, phone numbers, email addresses and dates of birth from credit card applications",
      "Self-reported income",
      "Around 140,000 Social Security numbers and about 80,000 linked bank account numbers",
      "Around 1 million Canadian Social Insurance Numbers",
    ],
    stillMatters:
      "This is the breach worth understanding rather than panicking about, and the distinction is useful. Because the attacker was caught fast and the data does not appear to have circulated widely, the practical risk to any individual is lower than the headline number implies. What it did establish is that applying for a product you were never approved for still puts your file in the company's systems for years — the records went back to 2005, covering applications from people who never became customers.",
    settlement:
      "Capital One settled consumer claims for $190 million in 2021 and paid an $80 million regulatory penalty. Both claims processes have closed.",
    whatToDo: [
      "Check whether you ever applied for a Capital One card, including applications that were declined.",
      "Freeze your credit if you were among the smaller group whose Social Security number was exposed.",
      "Watch for pre-approved credit offers you did not request, which can indicate application data being reused.",
      "Review linked bank accounts if you ever connected one during an application.",
    ],
    faqs: [
      {
        question: "I was declined for a Capital One card. Am I affected?",
        answer:
          "Possibly. The breach covered credit card application data from 2005 onward, and applications include declined ones. Being declined does not mean the application data was discarded.",
      },
      {
        question: "Was my card number stolen?",
        answer:
          "Capital One stated that no credit card account numbers or log-in credentials were compromised, and that over 99% of Social Security numbers were not affected. The bulk of the exposure was application information rather than account credentials.",
      },
      {
        question: "Does a cloud breach mean cloud storage is unsafe?",
        answer:
          "The underlying cause was a misconfiguration on the customer side rather than a flaw in the cloud platform itself. That distinction matters because it is the most common shape of cloud data exposure: the storage did what it was told, and it was told the wrong thing.",
      },
    ],
    source: {
      label: "Capital One breach disclosure, July 2019",
      url: "https://en.wikipedia.org/wiki/Capital_One#2019_data_breach",
    },
  },
  {
    slug: "facebook",
    company: "Facebook",
    date: "April 2021",
    isoDate: "2021-04-03",
    affected: "533 million users",
    severity: "contact",
    summary:
      "A dataset covering 533 million Facebook users across 106 countries was posted for free on a hacking forum in April 2021. Facebook said the data had been scraped in 2019 through a contact-import feature it had since changed, rather than taken in a fresh intrusion.",
    whatHappened: [
      "Attackers abused a contact-import tool that let anyone check whether a phone number was linked to an account, running it at scale to match hundreds of millions of numbers to profiles. Facebook fixed the feature in 2019.",
      "The company's position was that this was scraping of data users had made available rather than a breach of its systems. That distinction matters legally and matters very little to the person whose phone number is now in a free download.",
    ],
    whatLeaked: [
      "Phone numbers linked to Facebook accounts",
      "Facebook IDs, full names and gender",
      "Location and hometown as listed on the profile",
      "Relationship status and employer where filled in",
      "Email addresses for a subset of accounts",
    ],
    stillMatters:
      "A phone number tied to a verified real name is the raw material for almost every kind of targeted scam — the number is what makes a text believable, and the name is what makes it personal. Because this was scraped rather than hacked, there was no password reset, no notification and no remediation: most affected people were never told, and the file has been freely downloadable ever since. If you get texts addressing you by your real first name, this is a plausible origin.",
    whatToDo: [
      "Remove your phone number from your Facebook profile if it is not required for login, and check who can look you up by it under Settings → Privacy.",
      "Treat unexpected texts that use your real name as suspect regardless of what they claim to be about.",
      "Turn off the setting that allows people to find you by phone number if you do not need it.",
      "If your number now attracts constant spam, remember it is also published by people-search brokers — opting out of those reduces the ongoing supply.",
    ],
    faqs: [
      {
        question: "Was this a hack or not?",
        answer:
          "Facebook's position was that it was scraping of a feature working as designed rather than unauthorised access to its systems. The data ended up in the same place either way. For most purposes the distinction only affects who is legally responsible, not what you should do about it.",
      },
      {
        question: "Why was I never notified?",
        answer:
          "Breach notification laws generally apply to unauthorised access to systems. Because the company classified this as scraping of publicly available profile data, individual notification was not treated as required in most jurisdictions.",
      },
      {
        question: "Should I change my phone number?",
        answer:
          "Rarely worth it. A number is enormously disruptive to change and it is published by dozens of data brokers besides this file, so a new number tends to be back in circulation within a year or two. Reducing the sources and filtering aggressively is usually the better trade.",
      },
    ],
    source: {
      label: "Reported April 2021",
      url: "https://en.wikipedia.org/wiki/2021_Facebook_data_breach",
    },
  },
  {
    slug: "linkedin",
    company: "LinkedIn",
    date: "June 2021",
    isoDate: "2021-06-29",
    affected: "around 700 million profiles",
    severity: "contact",
    summary:
      "Data from roughly 700 million LinkedIn profiles — around 90% of the platform's user base at the time — was offered for sale in 2021. LinkedIn stated that it was scraped public profile data combined with data from other sources, not a breach of its systems.",
    whatHappened: [
      "A seller posted a sample of 700 million records and offered the full set for sale. LinkedIn's investigation concluded the data was aggregated from public profiles and other websites rather than exfiltrated from private systems.",
      "A separate 2012 LinkedIn breach was a genuine intrusion: 6.5 million password hashes were posted at the time, and in 2016 the true scale was revealed to be around 117 million accounts.",
    ],
    whatLeaked: [
      "Full names, email addresses and phone numbers",
      "Physical addresses and geolocation records",
      "Job titles, employers and other professional details",
      "Inferred salary information in some records",
      "LinkedIn usernames and profile URLs",
    ],
    stillMatters:
      "Professional data is scam fuel of a specific and effective kind. Knowing your job title, your employer and your colleagues' names is what makes business email compromise work — the fake invoice from a real supplier, the message from your actual CFO's name asking for an urgent transfer. This dataset is why those attacks stopped looking generic. If you are in finance, payroll or executive support, you are the target population for it.",
    whatToDo: [
      "Review what your LinkedIn profile shows publicly, particularly your email address and phone number.",
      "Turn off public profile visibility for fields you do not need visible to non-connections.",
      "Change any password you reused from the 2012 LinkedIn breach — that one was a genuine credential leak.",
      "Verify payment or transfer requests by a channel other than email, especially when the request cites real names and real projects.",
    ],
    faqs: [
      {
        question: "Was this a real breach?",
        answer:
          "LinkedIn said no — that it was public profile data scraped and combined with other sources. The earlier 2012 incident was a genuine breach of credentials, and those two events are often confused with each other.",
      },
      {
        question: "How do I stop my LinkedIn profile being scraped?",
        answer:
          "You cannot prevent scraping of what is public, but you can reduce what is public. Settings → Visibility → Edit your public profile lets you hide individual sections from people who are not signed in, which is where scrapers work.",
      },
      {
        question: "Should I delete my LinkedIn account?",
        answer:
          "For most people the professional cost outweighs the privacy gain, and deleting does not retract data already scraped. Trimming the public version of the profile achieves most of the benefit without the cost.",
      },
    ],
    source: {
      label: "Reported June 2021",
      url: "https://en.wikipedia.org/wiki/LinkedIn#Data_breaches",
    },
  },
  {
    slug: "23andme",
    company: "23andMe",
    date: "October 2023",
    isoDate: "2023-10-06",
    affected: "about 6.9 million profiles",
    severity: "identity",
    summary:
      "Attackers used credentials stolen from other breaches to log into 23andMe accounts, then used the DNA Relatives feature to pull profile data on millions of people whose own accounts were never compromised.",
    whatHappened: [
      "The initial access was credential stuffing — reusing passwords leaked elsewhere against 23andMe logins. Around 14,000 accounts were accessed directly.",
      "Those 14,000 accounts were the doorway. Through the opt-in DNA Relatives feature, each compromised account could see profile information for its genetic matches, which multiplied the exposure to roughly 6.9 million people. Some of the data offered for sale was specifically grouped by ancestry, which drew particular concern given the targeting that implies.",
    ],
    whatLeaked: [
      "Display names, sex and birth year",
      "Ancestry composition and predicted relationships to other users",
      "Percentage of DNA shared with matches",
      "Self-reported location in some profiles",
      "Family tree information where users had entered it",
    ],
    stillMatters:
      "This breach is the clearest illustration of a problem unique to genetic data: your privacy decisions are not only yours. Roughly 6.9 million people were exposed because of password choices made by 14,000 other people they were related to and had often never met. You cannot change your DNA, you cannot revoke a relative's participation, and a genetic relationship disclosed once stays disclosed. If you have never used the service and a cousin has, some information about you is still in that dataset.",
    whatToDo: [
      "Turn off DNA Relatives if you use a genetic testing service and do not need the matching feature.",
      "Use a unique password and two-factor authentication on any genetic testing account — credential stuffing only works on reused passwords.",
      "Consider whether you want your data retained at all; most services offer both account deletion and a separate request to destroy the physical sample.",
      "Understand that deletion does not retract what was already shared with matches or with research partners you consented to.",
    ],
    faqs: [
      {
        question: "I never had an account. How could my data be exposed?",
        answer:
          "Through a relative's account. The DNA Relatives feature shows matched users information about each other, so a compromised account exposes data about the people it matched with. Genetic privacy is shared by design.",
      },
      {
        question: "Can I delete my genetic data?",
        answer:
          "Most services offer account deletion and, separately, destruction of the stored physical sample — they are two different requests and doing one does not do the other. Data already shared with research partners under prior consent generally cannot be recalled.",
      },
      {
        question: "Was actual DNA sequence data stolen?",
        answer:
          "The exposed information was profile and relationship data — names, ancestry composition, shared-DNA percentages and family tree entries — rather than raw genome files. That is meaningfully less severe than it could have been, and still enough to map families.",
      },
    ],
    source: {
      label: "Reported October 2023",
      url: "https://en.wikipedia.org/wiki/23andMe_data_leak",
    },
  },
  {
    slug: "moveit",
    company: "MOVEit",
    date: "May–June 2023",
    isoDate: "2023-06-05",
    affected: "tens of millions of people",
    severity: "identity",
    summary:
      "A vulnerability in MOVEit Transfer, file-transfer software from Progress Software used by governments, universities, payroll providers and insurers, was exploited at scale by a ransomware group. Thousands of organisations were breached, and the people exposed were their customers, employees and pensioners.",
    whatHappened: [
      "The Cl0p group exploited a zero-day vulnerability in MOVEit Transfer to steal files from any organisation running an internet-facing instance. Because MOVEit sits between organisations, one exploited server frequently exposed data belonging to many downstream clients.",
      "The victim list ran to thousands of organisations across sectors, and notifications continued arriving for well over a year as organisations worked out whose data their vendors had been holding.",
    ],
    whatLeaked: [
      "Names, addresses, dates of birth and Social Security numbers, depending on the organisation",
      "Payroll and pension records",
      "Health and insurance information in some cases",
      "Driver's licence numbers in some cases",
    ],
    stillMatters:
      "MOVEit is the breach that explains why you get notification letters from companies you have never heard of. Your data was not taken from an organisation you chose — it was taken from a vendor of a vendor of an organisation you chose. That supply-chain shape is now the dominant pattern in large breaches, and it means the number of companies holding your file is far larger than the number you have a relationship with. This is a structural fact about the modern data economy, not a one-off.",
    whatToDo: [
      "Read the breach notification letters you receive rather than binning them — they name the specific data classes involved, which determines the right response.",
      "Freeze your credit if Social Security numbers were involved for you, which they were for many MOVEit-affected populations.",
      "Take up free credit monitoring where it is offered, but do not treat it as a substitute for a freeze.",
      "Expect further notifications — downstream discovery in supply-chain breaches runs for years.",
    ],
    faqs: [
      {
        question: "I got a letter from a company I have never used. Is it a scam?",
        answer:
          "Not necessarily, and MOVEit is the reason. Payroll processors, benefits administrators, universities and government agencies all used it, so a legitimate notification can come from an organisation you have no direct relationship with. Verify by going to the organisation's own website directly rather than by following a link in the letter.",
      },
      {
        question: "How many people were affected in total?",
        answer:
          "There is no single authoritative figure because the victim count accumulated over years as organisations completed their own investigations. Estimates run into the tens of millions of individuals across thousands of organisations.",
      },
      {
        question: "Can I find out which of my data was in it?",
        answer:
          "Only through the notifications themselves. Each affected organisation determines what it held about you, which is why the letters vary so much in what they describe.",
      },
    ],
    source: {
      label: "CISA advisory on MOVEit Transfer",
      url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-158a",
    },
  },
  {
    slug: "change-healthcare",
    company: "Change Healthcare",
    date: "February 2024",
    isoDate: "2024-02-21",
    affected: "about 190 million people",
    severity: "identity",
    summary:
      "A ransomware attack on Change Healthcare, a UnitedHealth subsidiary that processes a large share of US medical claims, disrupted prescriptions and payments nationwide. UnitedHealth later confirmed that around 190 million people had data exposed, making it the largest healthcare breach in US history.",
    whatHappened: [
      "Attackers gained access through a remote access portal that did not have multi-factor authentication enabled, then deployed ransomware that took claims processing offline for weeks. Pharmacies could not verify coverage and providers went unpaid.",
      "The affected-person count was revised upward over more than a year as the investigation continued, ending at roughly 190 million — close to half the US population.",
    ],
    whatLeaked: [
      "Names, addresses, dates of birth and phone numbers",
      "Health insurance member IDs and policy details",
      "Medical record numbers, diagnoses, medications and test results",
      "Social Security numbers and driver's licence numbers for many people",
      "Billing and payment information",
    ],
    stillMatters:
      "Medical data does not get reissued and it is not something you can freeze. A diagnosis is permanent, and unlike a card number there is no equivalent of cancelling it. The specific downstream harm is medical identity theft — someone using your insurance details for treatment, which corrupts your own medical record with their history. That is both harder to detect than financial fraud and harder to unwind, because the fix involves amending clinical records rather than reversing a charge.",
    whatToDo: [
      "Request and read your Explanation of Benefits statements from your insurer, looking for treatment you did not receive.",
      "Ask your insurer for a copy of your claims history if anything looks unfamiliar.",
      "Freeze your credit, since Social Security numbers were involved for a large share of those affected.",
      "Take up the free credit monitoring offered, and treat medical-billing calls about debts you do not recognise as a possible sign of medical identity theft rather than an error.",
    ],
    faqs: [
      {
        question: "I have never heard of Change Healthcare. Why is my data there?",
        answer:
          "It is a claims clearinghouse — it sits between your doctor, your pharmacy and your insurer, processing the billing. Patients have no direct relationship with it and no ability to opt out of it, which is precisely why the reach was so large.",
      },
      {
        question: "What is medical identity theft?",
        answer:
          "Someone using your insurance details to obtain treatment or prescriptions. Beyond the financial cost, their clinical information can end up merged into your medical record, which can affect your future care. Reviewing your Explanation of Benefits statements is the main way to catch it.",
      },
      {
        question: "Can I freeze my medical records like credit?",
        answer:
          "No — there is no medical equivalent of a credit freeze. The available controls are monitoring your Explanation of Benefits statements, requesting your claims history and, where offered, an accounting of disclosures from your providers.",
      },
    ],
    source: {
      label: "US HHS Office for Civil Rights breach portal",
      url: "https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html",
    },
  },
  {
    slug: "att",
    company: "AT&T",
    date: "2024",
    isoDate: "2024-07-12",
    affected: "nearly all wireless customers",
    severity: "identity",
    summary:
      "AT&T disclosed two separate incidents in 2024: a March leak of around 73 million account records including Social Security numbers, and a July disclosure that call and text metadata for nearly all its wireless customers had been taken from a third-party cloud platform.",
    whatHappened: [
      "In March 2024 a dataset of roughly 73 million current and former account records surfaced publicly. AT&T initially disputed its origin, then confirmed it and reset affected passcodes.",
      "In July 2024 the company disclosed a separate incident: attackers had taken records of calls and texts for nearly all wireless customers covering roughly May to October 2022, from a third-party cloud data platform. The content of the calls and messages was not included — the records were of who contacted whom, and how often.",
    ],
    whatLeaked: [
      "Phone numbers of everyone a customer called or texted during the affected period",
      "Counts and durations of those interactions",
      "Cell site identifiers for a subset of records, which indicate approximate location",
      "Separately, in the March incident: names, addresses, dates of birth, Social Security numbers and account passcodes",
    ],
    stillMatters:
      "The July incident is the more unusual of the two, because metadata is often dismissed as harmless and is not. A list of who you called, how often, and roughly from where reconstructs your life with uncomfortable precision — your doctor, your lawyer, your partner, the recruiter you spoke to for twenty minutes on a Tuesday. It also exposes people who were never AT&T customers at all: if you called an AT&T number, your number is in someone's record. For anyone whose contacts are sensitive — journalists, clinicians, people in the middle of a legal matter — that is a materially different kind of exposure from a leaked email address.",
    whatToDo: [
      "Change your AT&T account passcode and enable any available port-out protection on the line.",
      "Freeze your credit if you were in the March incident, which included Social Security numbers.",
      "Use encrypted messaging for conversations where the fact of the contact is itself sensitive — that is what metadata exposes.",
      "Be alert to callers who reference someone you genuinely know, which is what contact-graph data enables.",
    ],
    faqs: [
      {
        question: "Were my actual calls and messages recorded?",
        answer:
          "No. The July incident involved metadata — the numbers involved, interaction counts and durations — not the content of calls or the text of messages.",
      },
      {
        question: "I am not an AT&T customer. Can I still be affected?",
        answer:
          "Yes, for the July incident. If an AT&T customer called or texted your number, your number appears in their records regardless of your own carrier.",
      },
      {
        question: "Why does metadata matter if the content is safe?",
        answer:
          "Because the pattern is often the sensitive part. Repeated calls to an oncology practice, a divorce lawyer or a crisis line reveal the substance without any content being needed. Location data derived from cell site identifiers compounds it.",
      },
    ],
    source: {
      label: "AT&T customer notice, July 2024",
      url: "https://www.att.com/support/article/my-account/000102410",
    },
  },
  {
    slug: "ticketmaster",
    company: "Ticketmaster",
    date: "May 2024",
    isoDate: "2024-05-31",
    affected: "claimed 560 million customers",
    severity: "contact",
    summary:
      "Ticketmaster's parent company Live Nation confirmed unauthorised activity in a third-party cloud database in May 2024. The attackers claimed 560 million customer records were involved — a figure claimed by the sellers rather than confirmed by the company.",
    whatHappened: [
      "The incident was part of a wider campaign against customers of a cloud data platform, in which accounts without multi-factor authentication were accessed using credentials stolen by earlier malware infections. Several large companies were hit in the same wave.",
      "The 560 million figure comes from the group offering the data for sale and should be read as a claim rather than a confirmed count. Live Nation confirmed the incident without endorsing the number.",
    ],
    whatLeaked: [
      "Names, email addresses, phone numbers and addresses",
      "Order history and event attendance",
      "Partial payment card details — reportedly last four digits and expiry dates",
      "Hashed credentials in some records",
    ],
    stillMatters:
      "Order history is the underrated field here. Knowing which concerts you bought tickets for, when, and for how many people is what makes a refund scam land — a message referencing the actual event you actually attended does not read as spam. Ticketing is also one of the most heavily impersonated sectors online, so this data flowed straight into an existing fraud ecosystem rather than sitting unused.",
    whatToDo: [
      "Change your Ticketmaster password and anywhere you reused it.",
      "Treat any message about a refund, a transfer or a problem with a past order as suspect until verified through the app or the site directly.",
      "Never accept ticket transfers or refunds arranged over email or text — go to the official app.",
      "Watch card statements for small unfamiliar charges, which are often tests before a larger one.",
    ],
    faqs: [
      {
        question: "Was my full credit card number exposed?",
        answer:
          "Reports indicate partial card data — last four digits and expiry — rather than full numbers. That is not enough to make a purchase directly, but it is enough to make a scam call convincing when someone reads your own card's last four digits back to you.",
      },
      {
        question: "Is the 560 million figure accurate?",
        answer:
          "It is the figure the sellers claimed. Live Nation confirmed the incident but has not endorsed that count, and attacker-claimed numbers are routinely inflated. Treat it as an upper bound rather than a fact.",
      },
      {
        question: "Should I delete my Ticketmaster account?",
        answer:
          "Deleting will not retract data already taken, and you generally need an account to access tickets you have bought. Changing the password, removing stored payment methods you do not need and staying sceptical of ticket-related messages achieves more.",
      },
    ],
    source: {
      label: "Live Nation SEC filing, May 2024",
      url: "https://www.sec.gov/",
    },
  },
  {
    slug: "anthem",
    company: "Anthem",
    date: "February 2015",
    isoDate: "2015-02-04",
    affected: "about 78.8 million people",
    severity: "identity",
    summary:
      "Health insurer Anthem disclosed that attackers had accessed a database containing records for roughly 78.8 million current and former members and employees, including Social Security numbers. It was the largest US health-sector breach until Change Healthcare surpassed it.",
    whatHappened: [
      "The intrusion began with a phishing email that gave attackers a foothold, after which they moved through internal systems and reached a data warehouse holding member records. It went undetected for weeks.",
      "The exposed database did not contain medical claims or diagnosis data, which limited the damage relative to a full clinical breach — the exposure was identity information rather than health information.",
    ],
    whatLeaked: [
      "Names, dates of birth and Social Security numbers",
      "Member ID numbers",
      "Addresses, phone numbers and email addresses",
      "Employment information including income data for some members",
    ],
    stillMatters:
      "Anthem is worth revisiting for one reason: it was a decade ago, and the Social Security numbers exposed are still current. That is the whole argument for a permanent credit freeze rather than a two-year monitoring subscription. Breach responses are typically scoped to the news cycle — one or two years of free monitoring — while the exposure itself is permanent. A freeze does not expire.",
    settlement:
      "Anthem agreed to a $115 million class action settlement in 2017 and a $16 million HIPAA settlement with US federal regulators in 2018, the largest such penalty at the time. Both claims processes have closed.",
    whatToDo: [
      "Freeze your credit if you have not already — this exposure has not expired and neither has your Social Security number.",
      "Check whether you were a member of any Blue Cross Blue Shield plan operated by Anthem in the affected period, including under other brand names.",
      "Read your Explanation of Benefits statements for treatment you did not receive.",
      "Do not rely on monitoring that ended years ago as ongoing protection.",
    ],
    faqs: [
      {
        question: "Which brands were affected?",
        answer:
          "Anthem operated Blue Cross Blue Shield plans in several states under a range of brand names, and members of those plans were in scope even if they never saw the Anthem name on their card. Anthem's notifications listed the affected brands.",
      },
      {
        question: "Were my medical records exposed?",
        answer:
          "Anthem stated that the affected database did not contain claims, diagnosis or treatment information. The exposure was identity and membership data rather than clinical records.",
      },
      {
        question: "The free monitoring ended years ago. What now?",
        answer:
          "A credit freeze at all three bureaus, which is free by federal law and does not expire. It is stronger than monitoring and it is the appropriate response to an exposure that is itself permanent.",
      },
    ],
    source: {
      label: "US HHS enforcement action, 2018",
      url: "https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/agreements/anthem/index.html",
    },
  },
  {
    slug: "adobe",
    company: "Adobe",
    date: "October 2013",
    isoDate: "2013-10-03",
    affected: "153 million accounts",
    severity: "credentials",
    summary:
      "Adobe disclosed a breach affecting 153 million accounts. The password handling was the notable part: passwords were encrypted rather than properly hashed, and stored alongside user-supplied password hints, which made large portions of the set recoverable.",
    whatHappened: [
      "Attackers took account records and a quantity of source code. Adobe initially reported around 3 million affected accounts before the true figure of 153 million emerged.",
      "The passwords were encrypted with a block cipher in a mode that produced identical output for identical passwords, and the plaintext password hints were stored beside them. Anyone with the file could group users by shared password and read the hints until the password became obvious — a failure that is still taught as a worked example of how not to store credentials.",
    ],
    whatLeaked: [
      "Email addresses and usernames",
      "Encrypted passwords, recoverable in bulk because of how they were stored",
      "Plaintext password hints",
      "Encrypted payment card numbers and expiry dates for some customers",
    ],
    stillMatters:
      "The Adobe list has been circulating for over a decade and is a standard component of credential-stuffing dictionaries — the automated attacks that try known email-and-password pairs against every other service. If you had an Adobe account in 2013 and the password you used then is still in service anywhere, that account is being tried on a regular basis by software, not by a person who has to care about you specifically.",
    whatToDo: [
      "Change any password you used in 2013 that is still in use anywhere today.",
      "Stop using password hints entirely — they are a stored plaintext clue to your password.",
      "Use a password manager so that a breach at one service cannot reach another.",
      "Enable two-factor authentication on email first, since email controls password resets everywhere else.",
    ],
    faqs: [
      {
        question: "Why is a 2013 breach still relevant?",
        answer:
          "Because password reuse is durable. Credential-stuffing tools work through old lists continuously, and an email-and-password pair from 2013 still works anywhere the person never changed it. Old breaches do not decay.",
      },
      {
        question: "What is credential stuffing?",
        answer:
          "Automated attempts to log in to many services using email-and-password pairs from previous breaches. It succeeds only because of reuse, which is why a unique password per service is the single highest-value habit in personal security.",
      },
      {
        question: "What was wrong with how Adobe stored the passwords?",
        answer:
          "They were encrypted rather than hashed, using a mode that produced the same output for the same input, and stored next to plaintext hints. That combination let anyone with the file cluster accounts sharing a password and use the hints to work out what it was.",
      },
    ],
    source: {
      label: "Reported October 2013",
      url: "https://en.wikipedia.org/wiki/Adobe_Inc.#Data_breach",
    },
  },
  {
    slug: "uber",
    company: "Uber",
    date: "Disclosed November 2017",
    isoDate: "2017-11-21",
    affected: "57 million riders and drivers",
    severity: "identity",
    summary:
      "Uber disclosed in late 2017 that a breach in 2016 had exposed data on 57 million riders and drivers — and that the company had paid the attackers $100,000 to delete the data and stayed silent about it for a year.",
    whatHappened: [
      "Attackers obtained credentials from a private code repository and used them to reach data stored in cloud services. Around 57 million rider and driver records were taken, including roughly 600,000 US driver's licence numbers belonging to drivers.",
      "Rather than notify regulators or the people affected, the company paid the attackers through its bug bounty programme and required a non-disclosure agreement. The concealment led to a $148 million settlement with all 50 US states and a criminal conviction for the executive responsible for the cover-up.",
    ],
    whatLeaked: [
      "Names, email addresses and mobile phone numbers of riders",
      "Around 600,000 US driver's licence numbers belonging to drivers",
      "Driver trip and account information",
    ],
    stillMatters:
      "Uber matters less for the size of the breach than for what the concealment established. The company's obligation to tell you was enforced only after the fact, and the year of silence is time affected drivers spent not knowing their licence numbers were exposed. It is a useful corrective to the assumption that no notification means no breach — and a reminder that the interval between an intrusion and the letter in your postbox is a choice someone makes.",
    settlement:
      "Uber paid $148 million in 2018 to settle with all 50 US states and the District of Columbia over the concealment. The company's former chief security officer was convicted in 2022 of obstruction and failing to report a felony.",
    whatToDo: [
      "Change your Uber password and anywhere you reused it.",
      "Drivers whose licence numbers were exposed should be alert to identity verification they did not initiate.",
      "Review saved payment methods on ride-hailing and delivery accounts and remove ones you do not need.",
      "Treat texts about ride problems or refunds as suspect — the phone numbers exposed feed exactly that scam.",
    ],
    faqs: [
      {
        question: "Was my payment card exposed?",
        answer:
          "Uber stated that trip location history, card numbers, bank account numbers and dates of birth were not taken. The exposure was contact information for riders and licence numbers for a subset of drivers.",
      },
      {
        question: "Is it legal to pay attackers to keep quiet?",
        answer:
          "Concealing a breach from regulators and affected people is not, which is what the $148 million settlement and the subsequent criminal conviction addressed. Breach notification obligations exist in every US state.",
      },
      {
        question: "How would I know if I was affected?",
        answer:
          "Uber notified affected drivers when it disclosed in 2017. Riders in the affected set were generally not individually notified, so a lack of a letter is not evidence you were outside it.",
      },
    ],
    source: {
      label: "Reported November 2017",
      url: "https://en.wikipedia.org/wiki/Uber#2016_data_breach_and_cover-up",
    },
  },
  {
    slug: "myfitnesspal",
    company: "MyFitnessPal",
    date: "March 2018",
    isoDate: "2018-03-25",
    affected: "about 150 million accounts",
    severity: "credentials",
    summary:
      "Under Armour disclosed that around 150 million MyFitnessPal accounts had been affected by a breach in February 2018, exposing usernames, email addresses and hashed passwords.",
    whatHappened: [
      "An unauthorised party acquired account data in February 2018 and the company became aware in March, notifying users within days — a comparatively fast disclosure by the standards of breaches this size.",
      "Password protection was uneven: a majority used the strong bcrypt algorithm, but a portion used SHA-1, which is far weaker and leaves those passwords more readily recoverable. The data appeared for sale the following year.",
    ],
    whatLeaked: [
      "Usernames and email addresses",
      "Hashed passwords — mostly bcrypt, some SHA-1",
    ],
    stillMatters:
      "No payment or identity data was involved, so the residual risk is almost entirely about password reuse — which is exactly why this one is worth checking rather than dismissing. A fitness app feels low-stakes, and that is precisely the category where people reuse a password they also use somewhere that matters. The email-and-password pair is the asset here, not the calorie log.",
    whatToDo: [
      "Change your MyFitnessPal password and, more importantly, anywhere you reused it.",
      "Check whether the email you used there is your primary email — if so, prioritise two-factor authentication on it.",
      "Delete the account if you no longer use the app, so there is nothing to breach next time.",
      "Review connected apps that had access to the account.",
    ],
    faqs: [
      {
        question: "Was my payment information exposed?",
        answer:
          "No. Under Armour stated that payment card data was processed separately and was not affected, and that Social Security numbers and driver's licence numbers were not collected by the service.",
      },
      {
        question: "Does a hashed password mean I am safe?",
        answer:
          "It depends on the algorithm. Bcrypt is slow by design and holds up well; SHA-1 is fast and much easier to crack at scale. Both were used here, and you cannot tell which applied to your account, so change the password.",
      },
      {
        question: "Was my health and fitness data exposed?",
        answer:
          "The disclosure covered usernames, email addresses and hashed passwords. Logged food, weight and exercise data was not described as part of the affected set.",
      },
    ],
    source: {
      label: "Under Armour notice, March 2018",
      url: "https://en.wikipedia.org/wiki/MyFitnessPal",
    },
  },
];

export function getBreachEvent(slug: string) {
  return BREACH_EVENTS.find((b) => b.slug === slug.toLowerCase());
}

/** Newest first — the index page and the "other breaches" lists both use this. */
export const BREACHES_BY_DATE = [...BREACH_EVENTS].sort((a, b) =>
  b.isoDate.localeCompare(a.isoDate),
);

export const SEVERITY_LABEL: Record<
  NonNullable<BreachEvent["severity"]>,
  string
> = {
  identity: "Identity data — SSNs, ID numbers, dates of birth",
  credentials: "Credentials — passwords and security answers",
  contact: "Contact and profile data — names, numbers, addresses",
};

/**
 * Advice that applies regardless of which breach brought someone here.
 * Kept in one place so the index page and any new event page stay consistent,
 * and ordered deliberately: the free, permanent control comes first, and the
 * thing we sell comes last.
 */
export const UNIVERSAL_BREACH_STEPS: Array<{ title: string; body: string }> = [
  {
    title: "Freeze your credit at all three bureaus",
    body: "Free by federal law at Equifax, Experian and TransUnion, and it does not expire. A freeze stops new accounts being opened in your name, which is the specific harm that identity data enables. It is stronger than the monitoring most breach responses offer, and it costs nothing.",
  },
  {
    title: "Change reused passwords, starting with email",
    body: "Your email account is the reset route into everything else, so it goes first. Then anywhere you used the same password as the breached service. A password manager makes this a one-time job rather than a recurring one.",
  },
  {
    title: "Move two-factor authentication off SMS where you can",
    body: "SMS codes are vulnerable to SIM swapping, and carrier breaches have exposed exactly the details needed to pull one off. An authenticator app or a hardware key is a meaningful upgrade for banking and email specifically.",
  },
  {
    title: "Read the notification letter properly",
    body: "It names the exact data classes involved, and that determines the right response. A leaked password needs a password change; a leaked Social Security number needs a freeze. Treating every breach the same way means over-reacting to some and under-reacting to the ones that matter.",
  },
  {
    title: "Reduce the number of places holding your data",
    body: "Every account you no longer use is a future breach notification. Closing dormant accounts and opting out of data brokers shrinks the surface, which is the only step here that reduces your exposure to breaches that have not happened yet.",
  },
];
