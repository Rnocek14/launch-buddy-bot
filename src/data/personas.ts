/**
 * Removal guidance by situation — powers /for/:slug
 *
 * WHY THIS EXISTS
 * ---------------
 * Every removal service sells one plan to everybody. But the right advice for
 * a domestic violence survivor, a police officer, a nurse and someone doing
 * general hygiene are not variations on a theme — they are different answers.
 * A survivor needs a state address confidentiality programme, not a $79
 * subscription. An officer in a state with a Daniel's Law-style statute has a
 * takedown right with statutory penalties behind it that no service can match.
 *
 * These pages exist because the correct recommendation for several of these
 * groups is "don't buy anything, do this instead", and no vendor is going to
 * publish that.
 *
 * SAFETY RULE
 * -----------
 * Two of these audiences — survivors and public officials — may be in real
 * danger. Their pages lead with the strongest legal protection available and
 * only mention paid options afterwards, if at all. Never reorder that for
 * conversion reasons. Where an action could make someone less safe if done in
 * the wrong order, say so explicitly.
 *
 * Nothing here is legal advice, and the pages say so.
 */

export interface PersonaGuide {
  slug: string;
  /** Who this is for, in their own words. */
  audience: string;
  title: string;
  /** Under 160 characters. */
  description: string;
  h1: string;
  intro: string;
  /** Why this group is exposed differently from everyone else. */
  whyExposed: string[];
  /**
   * The single most important thing, called out above everything else.
   * For at-risk groups this is a legal protection, not our product.
   */
  leadWith?: { heading: string; body: string };
  steps: Array<{ title: string; body: string }>;
  /** What this group specifically should not do. Often the most useful part. */
  pitfalls: string[];
  faqs: Array<{ question: string; answer: string }>;
  relatedDataTypes: string[];
  relatedGuides: string[];
}

export const PERSONA_GUIDES: PersonaGuide[] = [
  {
    slug: "domestic-violence-survivors",
    audience: "survivors of domestic violence and stalking",
    title: "Data Removal for Domestic Violence Survivors: Safety First",
    description: "If someone is looking for you, removal order matters. Address confidentiality programmes, what to do first, and what can make things worse.",
    h1: "Removing your information when someone is looking for you",
    intro: "Most privacy advice assumes you are tidying up. This page assumes someone is actively trying to find you, which changes the order of operations and makes some standard advice actively unsafe. If you are in immediate danger, contact the National Domestic Violence Hotline at 1-800-799-7233 or text START to 88788 — they have advocates who do this work daily and can help you plan.",
    whyExposed: [
      "People-search sites publish current and previous addresses together, so a listing does not just show where you are — it shows the trail from where you were",
      "Relatives are listed alongside you, and family is the most common route someone uses to locate a person who has moved",
      "Voter registration, property records and court filings are public in most states and update faster than you can opt out",
      "A change-of-address filing enters commercial databases, so moving can itself generate a new record",
    ],
    leadWith: {
      heading: "Start with your state's Address Confidentiality Programme",
      body: "Most states run a programme — often called Safe at Home — that gives survivors a legal substitute address to use for public records, voter registration and mail forwarding. It stops the exposure at source rather than chasing copies, which is categorically stronger than any opt-out or paid service. Eligibility rules vary and most states require documentation of abuse or a stated fear for your safety; your state attorney general or secretary of state administers it, and a domestic violence advocate can usually help you apply. Do this before anything else.",
    },
    steps: [
      { title: "Talk to an advocate before you start changing things", body: "Removal activity can be visible. Opt-out confirmations go to an email address, address changes generate mail, and a sudden disappearance from search results can itself signal to someone that you are taking steps. An advocate can help you sequence this safely, and the hotline can connect you with one at no cost." },
      { title: "Apply for address confidentiality", body: "This is the highest-leverage action available to you and it is free. It gives you a substitute address for public records going forward, which means new records stop feeding the databases. It does not retroactively remove what is already published, which is why the next steps still matter." },
      { title: "Request expedited removal on safety grounds", body: "Most major people-search sites have a faster path for people at risk of harm, separate from their standard opt-out form. Say plainly that you are a survivor with a safety concern. Some will act within days rather than weeks, and some will suppress rather than merely delist." },
      { title: "Get your relatives to opt out too", body: "Your listing may be gone while your mother's still names you as a relative at a shared former address. Family listings are the standard route to locating someone, and each person has to submit their own request. This is often the step that actually closes the gap." },
      { title: "Check voter registration and property records", body: "Many states publish voter rolls including addresses. Confidentiality exemptions exist for survivors in most states — ask your county elections office. Property records are harder, but your address confidentiality programme may cover future filings." },
      { title: "Deal with the accounts, not just the listings", body: "Shared accounts, family phone plans and location sharing are how a lot of people are actually found, and none of it shows up in a broker search. Check what devices and accounts someone else may still have access to. This matters more than any listing." },
    ],
    pitfalls: [
      "Do not use a removal service that requires more personal data than you are comfortable handing over — you are giving a company your address history and date of birth, which is the exact data you are trying to control.",
      "Do not file a standard USPS change of address if you are hiding a new address; it enters commercial databases. Ask about the mail forwarding your confidentiality programme provides instead.",
      "Do not assume removal is permanent. Listings return within months, and a returned listing you have stopped checking is more dangerous than one you know about.",
      "Do not do this alone if you can avoid it. Advocates do this every day and know the state-specific routes that are not written down anywhere.",
    ],
    faqs: [
      { question: "What is an Address Confidentiality Programme?", answer: "A state-run programme, often called Safe at Home, that gives survivors a legal substitute address to use on public records, voter registration and driver's licences, with mail forwarded to your real address. Because it stops new records exposing you at source, it is stronger than any opt-out. Most states run one; eligibility and evidence requirements vary, and your state attorney general or secretary of state administers it." },
      { question: "Can I get removed from people-search sites faster if I'm in danger?", answer: "Usually yes. Most major sites have a safety or expedited process separate from the standard opt-out, and will act faster when you state that you are a survivor with a safety concern. It is worth saying so explicitly rather than using the generic form." },
      { question: "Should I pay for a data removal service?", answer: "Only after you have applied for address confidentiality, which is free and does more. A paid service can help with the ongoing re-listing problem, but weigh it against the fact that you have to hand the company your address history and date of birth to use it. For many survivors an advocate plus the free programme is the better path." },
      { question: "Will removing my listing tell my abuser I'm doing something?", answer: "It can. Disappearing from search results is noticeable to someone monitoring you, and opt-out confirmations arrive by email. This is a real consideration and a big reason to plan the sequence with an advocate rather than acting quickly on your own." },
    ],
    relatedDataTypes: ["old-addresses", "relatives-and-family", "voter-registration", "property-records"],
    relatedGuides: ["what-is-doxxing", "remove-address-from-internet"],
  },
  {
    slug: "law-enforcement-and-judges",
    audience: "police officers, judges, prosecutors and their families",
    title: "Daniel's Law: Removing Officer and Judge Home Addresses",
    description: "Police, judges and prosecutors in some states have a statutory takedown right with penalties per violation. How it works and how to use it.",
    h1: "Home address removal for law enforcement, judges and prosecutors",
    intro: "If you are a serving or retired officer, judge or prosecutor, you may have something almost nobody else has: a statutory right to demand your home address and phone number be taken down, with financial penalties attached when a company ignores you. That is a materially stronger position than a voluntary opt-out, and it is worth understanding before you pay anyone.",
    whyExposed: [
      "Public-sector employment records, pension filings and salary databases are public in many jurisdictions",
      "Court filings name prosecutors and judges by name, and are indexed",
      "People-search sites do not distinguish your role from anyone else's — you appear alongside your home address and relatives like everybody else",
      "Union directories, academy rosters and press coverage create additional indexed sources",
    ],
    leadWith: {
      heading: "Check whether your state has a Daniel's Law-style statute",
      body: "New Jersey's Daniel's Law — passed after the murder of a federal judge's son at her home in 2020 — bars the disclosure of home addresses and phone numbers of current and retired officers, judges, prosecutors and their families, and requires removal within ten days of a takedown request. It has survived constitutional challenge in federal court, and the penalties are per violation, which is why hundreds of data brokers have faced litigation under it. Several states and the federal government have since passed similar protections. If your state has one, a takedown notice citing it is far more effective than any opt-out form. Your department's legal counsel or union will know whether it applies to you.",
    },
    steps: [
      { title: "Find out what statute covers you", body: "Coverage varies: some statutes cover active officers only, some include retired personnel, some extend to immediate family, and some cover judges and prosecutors but not police. Your union, association or department counsel is the fastest route to a definitive answer — this is exactly the kind of question they field regularly." },
      { title: "Send takedown notices citing the statute", body: "Where a statute applies, your notice is a legal demand rather than a request, and typically carries a deadline the recipient must meet. Keep dated copies of everything you send and everything you receive. That record is what makes enforcement possible later." },
      { title: "Cover your family members too", body: "Where the statute extends to household or immediate family, include them. Where it does not, they still need standard opt-outs — and a relative's listing that names you at a shared address undoes much of your own removal." },
      { title: "Do the standard opt-outs for anything not covered", body: "Statutes cover specific data — usually home address and phone. Everything else on a people-search listing, and every broker outside the statute's reach, still needs a normal opt-out. Our free guides cover the ones that matter most." },
      { title: "Check property and voter records", body: "Some states offer confidentiality provisions for public officials in property and voter records specifically. These are separate from the takedown statute and often less well known." },
      { title: "Set up ongoing monitoring", body: "Listings return. Where you have a statutory right, a returned listing is a fresh violation rather than just an annoyance — which means monitoring has value beyond peace of mind." },
    ],
    pitfalls: [
      "Do not assume a national removal service knows about your state's statute — most send the same generic opt-out for everyone, which forfeits the leverage you actually have.",
      "Do not skip the paper trail. Statutory schemes generally depend on proving a request was made and ignored, and an undocumented phone call proves nothing.",
      "Do not overlook family members: household listings frequently re-expose an address that was successfully removed from your own record.",
      "Do not treat a takedown as permanent — re-listing happens, and each recurrence may need a fresh notice.",
    ],
    faqs: [
      { question: "What is Daniel's Law?", answer: "A New Jersey statute barring disclosure of home addresses and phone numbers of current and retired law enforcement officers, judges, prosecutors and their families, requiring removal within ten days of a takedown request. It was passed after the 2020 murder of Daniel Anderl at the home of his mother, a federal judge. A federal court rejected constitutional challenges to it in 2024, and it carries penalties per violation — which is why large numbers of data brokers have faced suits under it." },
      { question: "Does my state have a law like this?", answer: "Several states and the federal government have adopted similar protections since 2020, but coverage differs on who qualifies, whether retired personnel and family are included, and what the removal deadline is. Your union, association or department legal counsel is the reliable source — this is a question they handle routinely." },
      { question: "Is a takedown notice better than a paid removal service?", answer: "Where a statute applies, yes — considerably. An opt-out is a request a company may honour at its discretion; a statutory takedown is a legal obligation with a deadline and a penalty. A service may still help with the brokers outside the statute and with ongoing monitoring, but leading with the statute is what gives you leverage." },
      { question: "Does this cover my spouse and children?", answer: "It depends on the statute. Some extend explicitly to immediate family or household members, others do not. Where family is not covered they need standard opt-outs — and it matters, because a relative's listing showing a shared address can undo your own removal entirely." },
    ],
    relatedDataTypes: ["property-records", "voter-registration", "relatives-and-family", "old-addresses"],
    relatedGuides: ["what-is-doxxing", "remove-address-from-internet"],
  },
  {
    slug: "healthcare-workers",
    audience: "nurses, doctors and other healthcare workers",
    title: "Data Removal for Nurses and Healthcare Workers",
    description: "Licensing boards publish your address, and patients can find you. What's public because of your licence and what you can actually remove.",
    h1: "Removing your personal information as a healthcare worker",
    intro: "Healthcare workers have an exposure problem most people never face: a professional licence that is, by design, publicly searchable — often including an address. Add a job where strangers learn your full name during the worst day of their life, and the ordinary advice about opting out of people-search sites only addresses part of the risk.",
    whyExposed: [
      "State licensing boards publish verification databases so the public can check credentials, and some include a registered address",
      "Hospital and practice directories publish names and often photographs",
      "Malpractice and disciplinary records are public in many states",
      "Review sites create indexed pages under your name that you did not create and cannot delete",
      "Name badges and charts mean patients routinely leave an encounter knowing your full name",
    ],
    steps: [
      { title: "Change your address of record with the licensing board", body: "Many boards accept a business or practice address rather than your home for the public-facing record, and plenty of licensees never realise it is optional. This is often the single highest-impact change available, because the board record is authoritative and gets scraped." },
      { title: "Ask your employer what is published", body: "Directory listings, staff pages and press releases are usually removable or reducible on request. Employers generally comply when you raise a safety concern, and larger organisations often have a policy for it already." },
      { title: "Opt out of the people-search sites", body: "These are what surface your home address next to your name. Free opt-outs, and our guides cover the ones that matter most." },
      { title: "Handle review sites separately", body: "Physician and provider review profiles are usually created without your involvement. Most platforms allow you to claim a profile and restrict some details, and correcting an inaccurate one is generally easier than removing it." },
      { title: "Separate professional and personal identity online", body: "Use a work address and a professional email for anything licence- or practice-related, and keep personal accounts under tighter privacy settings. The goal is that a patient searching your name finds your professional presence rather than your street." },
    ],
    pitfalls: [
      "Do not assume your licence record is fixed — many boards let you substitute a practice address, and most people never ask.",
      "Do not try to remove legitimate disciplinary records; they are public by design and attempting to hide them tends to draw attention.",
      "Do not rely on removal alone if a specific patient has become a problem — that is a workplace safety and possibly a police matter, and your employer has obligations.",
    ],
    faqs: [
      { question: "Can I remove my address from my nursing or medical licence record?", answer: "Often you can substitute a practice or business address for the public record. Boards need a reliable address for you, but many do not require it to be your home, and the option is frequently not advertised. Ask your board directly what its public record shows and what it will accept." },
      { question: "How do patients find my home address?", answer: "Usually not from anything you published. They search your full name — learned from a badge or a chart — and find a people-search listing that pairs it with your address and relatives. That is why the broker opt-outs matter even when your professional footprint is careful." },
      { question: "Can I get my profile removed from doctor review sites?", answer: "Rarely removed entirely, since the platforms treat provider profiles as public-interest listings. You can usually claim the profile, correct inaccuracies and limit some detail. Removal of specific defamatory content is a separate process with a higher bar." },
    ],
    relatedDataTypes: ["old-addresses", "property-records", "relatives-and-family"],
    relatedGuides: ["remove-address-from-internet", "remove-name-from-google"],
  },
  {
    slug: "teachers",
    audience: "teachers and school staff",
    title: "Data Removal for Teachers: Keeping Your Address Private",
    description: "Public employee records, school directories and angry parents. What's published about teachers and how to reduce it.",
    h1: "Removing your personal information as a teacher",
    intro: "Teaching combines two things that are awkward together: public-sector employment, which makes a lot of your record public, and a job where hundreds of families know your name. Most teachers discover the problem when a parent turns up somewhere they should not, and by then the information has been available for years.",
    whyExposed: [
      "Public employee salary and roster databases are published by many districts and states, and often mirrored by news organisations",
      "School directories and staff pages publish names, photographs and sometimes contact details",
      "Certification and licensing lookups are public in most states",
      "Yearbooks, newsletters and sports coverage create indexed pages under your name going back years",
    ],
    steps: [
      { title: "Audit what your district publishes", body: "Staff pages, directories and board minutes are the usual sources. Districts will normally reduce a listing on request, especially where you raise a safety concern — and if there is no policy, asking often creates one." },
      { title: "Check the public salary databases", body: "Many states publish public employee compensation, and news outlets mirror it into searchable tools. The salary itself is generally not removable, but some publishers will suppress an address or middle name on request." },
      { title: "Opt out of the people-search sites", body: "This is what actually pairs your name with a home address. Free, and our guides cover the highest-impact ones." },
      { title: "Lock down personal social accounts", body: "Students and parents look. Set personal accounts to private, remove location tags from anything showing your home, and keep a clear separation from any professional account you maintain." },
      { title: "Ask your union what protections exist", body: "Some states extend address confidentiality to school employees, and unions frequently know about protections that are not well publicised. It is a two-minute question with a potentially large answer." },
    ],
    pitfalls: [
      "Do not post classroom photos that show identifiable exterior details of your home, which is a common accidental disclosure.",
      "Do not assume a district staff page is permanent — most will trim it on request and simply have never been asked.",
      "Do not handle a parent who has escalated to your home address as a privacy problem alone; that is a safety matter for your administration and possibly the police.",
    ],
    faqs: [
      { question: "Is my teaching salary public?", answer: "In most states, yes — public employee compensation is a public record and is frequently published in searchable databases by news organisations. The salary figure itself is generally not removable, though some publishers will suppress additional identifying details if you ask." },
      { question: "Can parents find my home address?", answer: "Easily, if you have not opted out of people-search sites. They know your full name from school, and a single search pairs it with your address, your age and your relatives. Opting out is the step that breaks that chain." },
      { question: "Do teachers get address confidentiality protection?", answer: "In some states, yes — protections originally written for survivors or public officials have been extended to school employees in certain jurisdictions. Your union is the fastest route to a reliable answer for your state." },
    ],
    relatedDataTypes: ["old-addresses", "property-records", "relatives-and-family"],
    relatedGuides: ["remove-address-from-internet", "what-is-doxxing"],
  },
  {
    slug: "journalists",
    audience: "journalists and writers",
    title: "Data Removal for Journalists: Reducing Doxxing Risk",
    description: "Bylines make you findable and coordinated harassment follows. What to remove, what to keep public, and where to get help fast.",
    h1: "Removing your personal information as a journalist",
    intro: "A byline is a permanent, indexed, deliberately public association between your real name and your work. That is the job, and you cannot opt out of it. What you can do is break the link between that name and your home address, your family and your movements — which is what coordinated harassment actually needs in order to escalate from unpleasant to dangerous.",
    whyExposed: [
      "Bylines, author pages and conference bios are public by design and heavily indexed",
      "Domain registrations for personal sites can expose a home address unless privacy protection is enabled",
      "Press credentials, professional directories and awards listings add further indexed sources",
      "Coverage of contentious subjects attracts people who deliberately compile personal details",
    ],
    steps: [
      { title: "Take the free institutional help first", body: "The Freedom of the Press Foundation and similar organisations publish digital security guidance for journalists and sometimes provide direct support, at no cost. If you work for an outlet, ask what it provides — many have security teams and will pay for removal services, which is a better use of the budget than your own." },
      { title: "Opt out of the people-search sites", body: "This is the step that separates your byline from your street address. It is free, and our guides cover the highest-impact sites." },
      { title: "Check your domain registrations", body: "WHOIS records for a personal site can carry a home address and phone number. Enable registrar privacy protection on every domain you own — this is a five-minute fix that people forget for years." },
      { title: "Separate what is public by necessity from what is not", body: "Your byline and professional contact route should be public. Your home address, family members and daily routine should not be. Being deliberate about that boundary is more sustainable than trying to disappear." },
      { title: "Prepare before you need it", body: "Harassment campaigns move faster than opt-outs. Know now which sites list you, which take days versus weeks to act, and who at your outlet to call. Doing this while nothing is happening is far easier than doing it during." },
    ],
    pitfalls: [
      "Do not remove your professional presence — an unfindable journalist is a less credible one, and the goal is separating home from byline rather than disappearing.",
      "Do not overlook domain WHOIS records; they are one of the most common accidental home-address disclosures among people who run their own sites.",
      "Do not pay personally before asking your employer — many outlets cover removal services and security support as a matter of policy.",
    ],
    faqs: [
      { question: "How do I stop people finding my home address from my byline?", answer: "The byline itself is not the problem — the link between your name and a people-search listing is. Opt out of the major sites, enable WHOIS privacy on any domains you own, and check whether public records like voter registration are exposing your address. The byline can stay exactly as it is." },
      { question: "Should my employer pay for this?", answer: "Ask. Many outlets treat digital security as an occupational safety issue and cover removal services or provide a security team. It is a normal request, and the budget exists at more organisations than journalists assume." },
      { question: "What do I do if I'm being doxxed right now?", answer: "Contact your outlet's security team immediately if you have one, and the Freedom of the Press Foundation or a similar organisation if you do not. Document everything before it disappears. Opt-outs matter but they work on a timescale of days to weeks, which is slower than an active campaign — the immediate priority is support and documentation." },
    ],
    relatedDataTypes: ["old-addresses", "relatives-and-family", "property-records"],
    relatedGuides: ["what-is-doxxing", "remove-address-from-internet"],
  },
  {
    slug: "seniors",
    audience: "older adults and their families",
    title: "Data Removal for Seniors: Cutting Off Scam Calls",
    description: "Brokers publish an older adult's age, address, phone and relatives — exactly what scam callers use. How to cut the supply off.",
    h1: "Removing an older adult's information from data brokers",
    intro: "Scam calls targeting older adults are not random. The caller frequently knows a name, an approximate age, a street and the first name of a grandchild — and that combination is what makes the call believable. All of it comes from the same place: people-search listings assembled from public records. Removing the listings does not stop every call, but it removes the detail that makes them work.",
    whyExposed: [
      "Decades of address history, property records and voter registration create an unusually complete public record",
      "Landline numbers remain in directory data long after mobile numbers stopped being listed",
      "Obituaries of relatives name survivors, which is how brokers build the family graph scammers use",
      "Older marketing lists sold repeatedly between brokers keep circulating",
    ],
    steps: [
      { title: "Do the opt-outs on their behalf, sitting with them", body: "Most opt-outs need an email address and a confirmation click, which is the step where people give up. Doing it together also means they see what is published, which does more for their scepticism about unknown callers than any amount of warning." },
      { title: "Prioritise the sites that show relatives", body: "The relatives list is what powers grandparent scams. Sites publishing family connections alongside a phone number are the highest priority, ahead of ones showing an address alone." },
      { title: "Register on the Do Not Call list, then treat it as insufficient", body: "It is free and worth doing, but it stops legitimate telemarketers rather than fraudsters, who are already breaking the law. Removing the underlying data is what reduces targeting." },
      { title: "Set up call screening on the phone itself", body: "Most carriers and modern handsets offer free spam filtering and unknown-caller screening. For a landline, a call-blocking device is inexpensive. This is the immediate relief while removals process." },
      { title: "Agree a family verification word", body: "Pick a phrase only the family knows, to be asked for whenever a caller claims an emergency. This defeats the grandparent scam directly, including the increasingly common versions using cloned voices, and it costs nothing." },
    ],
    pitfalls: [
      "Do not let them give personal details to a caller offering to remove their data — that is itself a common scam, and legitimate removals are never initiated by phone.",
      "Do not assume Do Not Call registration is protection; fraudsters ignore it entirely.",
      "Do not remove their listing and consider it finished — listings return within months, and the calls return with them.",
      "Do not forget the obituary pathway: a relative's death notice regenerates the family graph almost immediately.",
    ],
    faqs: [
      { question: "Why do scammers know my parent's name and address?", answer: "Because it is published. People-search sites compile name, age, address, phone number and relatives from public records and sell access for a few dollars. A caller who opens with your parent's street and their grandchild's name is reading from a listing, not from inside knowledge." },
      { question: "Does the Do Not Call registry stop scam calls?", answer: "No. It stops legitimate telemarketers, who follow the rules. Fraudsters ignore it, and some scrape it. Register anyway — it reduces overall volume — but do not treat it as protection against the calls that matter." },
      { question: "Can I opt out on my parent's behalf?", answer: "Practically, usually yes if you are doing it with them and have access to their email for confirmations. Formally, most brokers require the person themselves to submit. Sitting down together is the approach that both works and helps them recognise the next scam call." },
    ],
    relatedDataTypes: ["relatives-and-family", "old-addresses", "voter-registration"],
    relatedGuides: ["how-to-stop-spam-calls", "who-has-my-phone-number"],
  },
  {
    slug: "job-seekers",
    audience: "job seekers facing background checks",
    title: "Background Check Errors: Your FCRA Rights as a Job Seeker",
    description: "Background checks routinely contain errors and mismatched records. Your legal right to dispute them, and how to fix a report before it costs you.",
    h1: "Fixing what a background check says about you",
    intro: "If you have been turned down after a background check, the report may simply be wrong. Mismatched records are common — especially with a common name — and so are dismissed charges reported without their outcome. Federal law gives you the right to see the report and to force an investigation, and that right is worth considerably more to you than any removal service.",
    whyExposed: [
      "Background-check firms buy court records in bulk and match them to people by name and date of birth, which misfires with common names",
      "Dismissed and expunged cases are sometimes reported without the disposition attached",
      "People-search listings feed the same underlying data, errors included",
      "Old addresses and employment records propagate between databases without correction",
    ],
    leadWith: {
      heading: "You have a legal right to the report and to a correction",
      body: "Under the Fair Credit Reporting Act, an employer must give you a copy of the report and notice before taking adverse action based on it, and you can dispute anything inaccurate. The screening company then has to investigate and correct or remove what it cannot verify. This applies whatever state you live in, and it is free. Most people never exercise it because they never realise the report was the reason.",
    },
    steps: [
      { title: "Ask for the report", body: "If a decision went against you after a screening, request the copy the employer is required to provide. You cannot dispute what you have not read, and the specific error is often obvious once you see it." },
      { title: "Look for the errors that actually occur", body: "Records belonging to someone with a similar name; a dismissed case shown without its dismissal; a single charge listed multiple times; sealed or expunged matters that should not appear; addresses you have never lived at." },
      { title: "Dispute in writing with the screening company", body: "Put it in writing, attach documentation of the correct facts, and keep copies. The company must investigate and respond within the statutory window. Written disputes create the record that matters if you need to escalate." },
      { title: "Get court documentation for anything disputed", body: "A certified disposition showing dismissal or expungement usually settles a dispute immediately. The clerk of the court that handled the case can provide it, generally for a small fee." },
      { title: "Clean up the people-search listings too", body: "Employers search names informally as well as running formal checks, and a people-search listing showing an arrest flag can do damage that never appears in any report. Free opt-outs, and worth doing while you are job hunting." },
    ],
    pitfalls: [
      "Do not assume a rejection was about the report unless you check — but do check, because employers are required to tell you and often the notice is easy to miss.",
      "Do not dispute by phone alone; without a written record you have nothing to escalate with.",
      "Do not pay a service to remove a court record while a free dispute would fix an error in how it is reported — those are different problems with different solutions.",
    ],
    faqs: [
      { question: "Can I dispute a background check?", answer: "Yes. The Fair Credit Reporting Act gives you the right to dispute inaccurate information with the screening company, which must investigate and correct or delete anything it cannot verify. It is free, applies nationwide, and is the most effective route when the problem is an error rather than an accurate record." },
      { question: "Why does my background check show someone else's record?", answer: "Because matching is done on name and date of birth, which is not unique. Common names collide constantly, and a report can attach an unrelated person's record to you. This is one of the most frequent and most fixable errors — dispute it with documentation showing the record is not yours." },
      { question: "Do employers see expunged records?", answer: "They should not, and a properly expunged record generally will not appear in a compliant report. In practice it sometimes does, because screening companies buy bulk data and do not always refresh it after an expungement. If it appears, dispute it with the court documentation — that usually resolves it quickly." },
    ],
    relatedDataTypes: ["court-records", "mugshot", "old-addresses"],
    relatedGuides: ["remove-public-records-online", "remove-name-from-google"],
  },
  {
    slug: "content-creators",
    audience: "streamers, creators and public-facing professionals",
    title: "Data Removal for Streamers and Content Creators",
    description: "Being findable is the job; being locatable isn't. How creators separate a public identity from a home address before it's needed.",
    h1: "Removing your personal information as a creator",
    intro: "Building an audience means being publicly known, and a small fraction of any audience will try to find out where you live. Swatting and doxxing campaigns depend on one link: your real name connected to a home address in a public database. Break that link and most of what follows becomes much harder, whatever your follower count.",
    whyExposed: [
      "Business registrations, trademark filings and domain records commonly carry a real name and home address",
      "Old accounts under a real name predate the persona and are frequently still findable",
      "Streams and videos leak location detail — visible mail, exterior views through windows, background sounds, metadata",
      "Merchandise and payment processors require real identity details that sometimes surface publicly",
    ],
    steps: [
      { title: "Separate the legal identity from the public one now", body: "Register domains with privacy protection, use a registered agent or business address for any company filing, and keep a PO box or mailbox service for anything fan-facing. Doing this before you need it is far easier than unwinding it afterwards." },
      { title: "Opt out of the people-search sites", body: "This is the link that matters — real name to home address. Free, and our guides cover the highest-impact sites. Do it before you grow rather than after something happens." },
      { title: "Audit what old accounts reveal", body: "Accounts created under your real name years before the persona are a common route, and so are old forum posts, school pages and tagged photos. Search your real name the way someone hostile would and see what connects." },
      { title: "Check your streams for location leaks", body: "Visible mail, package labels, reflections, exterior views and identifiable local sounds have all been used. Reviewing your own recent output specifically for this is worth an hour." },
      { title: "Know what to do if it starts", body: "Have your platform's escalation route saved, and consider notifying your local police non-emergency line in advance that you are a swatting risk — some departments maintain a register for exactly this and it can change how a call is handled." },
    ],
    pitfalls: [
      "Do not register a business or domain with your home address; it is public in most jurisdictions and one of the most common exposure routes for creators.",
      "Do not assume a stage name protects you — the connection to a real name is usually one old account away.",
      "Do not wait until you are large enough to be targeted; opt-outs take weeks and are far easier to do while nothing is happening.",
    ],
    faqs: [
      { question: "How do people find a streamer's home address?", answer: "Usually by connecting the persona to a real name — through an old account, a business filing, a domain registration or a leaked document — then searching that real name on a people-search site, which supplies the address. The people-search step is the one you can remove." },
      { question: "Does an LLC protect my address?", answer: "Only if it is not registered at your home address. Business filings are public in most states, so an LLC using your home address publishes it. A registered agent service or business address is what actually helps." },
      { question: "What should I do if I'm being doxxed?", answer: "Report to the platform immediately and document everything before it disappears. Contact your local police non-emergency line about swatting risk — some departments keep a register that changes how they respond to a call at your address. Then work through removals, understanding that they operate on a slower timescale than an active campaign." },
    ],
    relatedDataTypes: ["old-addresses", "property-records", "relatives-and-family"],
    relatedGuides: ["what-is-doxxing", "remove-address-from-internet"],
  },
];

export const getPersonaGuide = (slug: string): PersonaGuide | undefined =>
  PERSONA_GUIDES.find((g) => g.slug === slug.toLowerCase());
