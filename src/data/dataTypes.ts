/**
 * Removal guides by type of personal data — powers /remove/:slug
 *
 * WHY THIS EXISTS
 * ---------------
 * People don't search for "data removal". They search for the specific thing
 * that is frightening them: "how to get my address off the internet", "remove
 * my mugshot", "my phone number is on Google". Those are separate problems
 * with separate answers, and lumping them into one broad guide serves none of
 * them well.
 *
 * EDITORIAL RULE — THE HARD TRUTH FIELD
 * -------------------------------------
 * Several of these categories are surrounded by services that promise more
 * than they can deliver, mugshot and court-record removal worst of all. Every
 * entry carries a `hardTruth` that states plainly what cannot be removed and
 * why. That is the single most useful paragraph on each page, it is the thing
 * competitors won't write, and it must never be softened into a sales pitch.
 *
 * Nothing here is legal advice, and the pages say so.
 */

export interface RemovalStep {
  title: string;
  body: string;
}

export interface DataTypeGuide {
  slug: string;
  /** The data itself, e.g. "home address". Used throughout the copy. */
  dataType: string;
  title: string;
  /** Under 160 characters — SERP snippet. */
  description: string;
  h1: string;
  intro: string;
  /** How this specific data gets published in the first place. */
  sources: string[];
  /** Why exposure of this particular field is worth acting on. */
  risk: string;
  steps: RemovalStep[];
  /** What genuinely cannot be removed. Required. Never soften this. */
  hardTruth: string;
  faqs: Array<{ question: string; answer: string }>;
  /** Broker slugs most associated with this data type. */
  brokers: string[];
  /** Existing /guides slugs worth cross-linking. */
  relatedGuides: string[];
}

export const DATA_TYPE_GUIDES: DataTypeGuide[] = [
  {
    slug: "social-security-number",
    dataType: "Social Security number",
    title: "Is My SSN on the Dark Web? How to Check and What to Do",
    description: "Your Social Security number can't be changed on request, so removal isn't the goal — containment is. How to check exposure and lock it down.",
    h1: "Your Social Security number is exposed — what actually helps",
    intro: "Of everything in this category, an exposed Social Security number is the one where the usual advice fails. You cannot opt out of an SSN the way you opt out of a phone listing, and you almost certainly cannot get a new one. That makes this a containment problem rather than a removal problem, and the steps that help are different from the ones you'll read everywhere else.",
    sources: [
      "Breaches of companies that required your SSN — lenders, employers, insurers, healthcare providers, background-check firms",
      "The 2024 National Public Data breach, which exposed SSNs compiled from public and non-public sources for people who never used the service",
      "Tax and payroll processors, which hold SSNs for everyone they have ever paid",
      "Old paper records digitised without redaction, including some court filings",
    ],
    risk: "An SSN is the key that unlocks credit in your name. Paired with a name and date of birth — both trivially available on people-search sites — it is enough to open accounts, file a fraudulent tax return, or claim benefits. Unlike a password, you cannot rotate it.",
    steps: [
      { title: "Check whether it is already out there", body: "Search your email address on a breach-checking service to see which incidents you were caught in, then read what each breach actually exposed. Many leaked only emails and passwords; a few leaked SSNs. Knowing which applies to you decides how urgently to act." },
      { title: "Freeze your credit at all three bureaus", body: "This is the single most effective step and it is free. A freeze stops anyone — including you — opening new credit until you lift it. Do it at Equifax, Experian and TransUnion separately; freezing one does nothing for the other two. It does not affect your existing accounts or your credit score." },
      { title: "Get an IRS Identity Protection PIN", body: "The IRS issues a six-digit PIN that must accompany your tax return. Without it, a fraudulent return filed in your name is rejected. Tax-refund fraud is one of the most common uses of a stolen SSN and this closes it off." },
      { title: "Reduce the data that makes an SSN usable", body: "An SSN alone is less useful than an SSN plus your address, date of birth and mother's maiden name — all of which are sitting on people-search sites. Removing those listings raises the effort required to actually use the number against you." },
      { title: "Set up monitoring you will actually notice", body: "Credit monitoring tells you when an account is opened. Free options exist through the bureaus and many banks. The point is not prevention — the freeze does that — it is catching anything that slips through quickly." },
    ],
    hardTruth: "You cannot remove a Social Security number from the internet. Once it is in a breach dump it is copied, mirrored and traded indefinitely, and no service can retrieve it. Anyone selling you SSN removal is selling something that does not exist. The Social Security Administration will only issue a new number in narrow circumstances — typically ongoing harm from documented misuse — and a new number does not erase the old one's history. Treat the number as permanently compromised and make it useless instead: a credit freeze does more for you than any removal service can.",
    faqs: [
      { question: "Can I remove my Social Security number from the internet?", answer: "No. Unlike an address or phone listing, an SSN in a breach dump cannot be recalled — the data has already been copied across countless mirrors. What you can do is make it unusable: freeze your credit at all three bureaus, get an IRS Identity Protection PIN, and strip the supporting details (address, date of birth, relatives) that a fraudster needs alongside it." },
      { question: "Should I get a new Social Security number?", answer: "Almost certainly not, and it is rarely granted. The Social Security Administration issues new numbers only in limited situations, generally where you can document ongoing harm. Even then the old number stays linked to your records, so it does not give you a clean slate. A credit freeze is faster, free and more effective." },
      { question: "Is a credit freeze the same as a fraud alert?", answer: "No. A fraud alert asks lenders to take extra verification steps and expires after a set period. A freeze blocks new credit outright until you lift it, is free by federal law, and does not expire. If you can only do one thing, freeze." },
      { question: "Does a credit freeze hurt my credit score?", answer: "No. A freeze restricts access to your report; it does not change what is in it. Your score is unaffected, and your existing accounts keep working normally. You lift it temporarily when you genuinely need new credit." },
    ],
    brokers: ["lexisnexis", "acxiom", "intelius"],
    relatedGuides: ["how-to-stop-identity-theft", "what-is-a-data-broker"],
  },
  {
    slug: "mugshot",
    dataType: "mugshot",
    title: "How to Remove a Mugshot From the Internet (Honest Guide)",
    description: "Mugshot removal is full of services promising what they can't deliver. What actually works, what doesn't, and the laws that help in some states.",
    h1: "How to remove a mugshot from the internet",
    intro: "Mugshot removal attracts more predatory operators than any other corner of this category, because the people searching are desperate and the sites publishing know it. Some of what you'll be sold is impossible, some is illegal to charge for in certain states, and a few things genuinely work. Here is the honest version.",
    sources: [
      "County sheriff and police department booking logs, which are public records in most states",
      "Mugshot aggregator sites that scrape those logs automatically, often within hours of booking",
      "Local news outlets that publish arrest blotters",
      "People-search sites that ingest arrest data alongside address and phone records",
    ],
    risk: "A mugshot surfaces on your name in search results indefinitely, regardless of whether charges were dropped, dismissed or never filed. It is the single most damaging thing that can attach to a name in an employment or housing check, and it does not distinguish between conviction and arrest.",
    steps: [
      { title: "Check whether your state bans pay-to-remove", body: "A number of states have laws prohibiting sites from charging a fee to take down a mugshot, and several require removal on request when charges were dropped or the record was expunged. If your state has one, citing it in your removal request changes the conversation entirely — and the site is breaking the law by quoting you a price." },
      { title: "Pursue expungement or sealing if you're eligible", body: "This is the root fix. If the underlying record is expunged or sealed, you have a legal basis to demand removal that publishers generally comply with, and future scrapes will not find it. Eligibility varies enormously by state and offence; a local legal aid office or public defender can tell you where you stand, often free." },
      { title: "Request removal from the source first", body: "Removing an aggregator listing while the county still publishes the booking record achieves nothing — the next scrape puts it back. Start with the sheriff or court that published it, then work outward to the sites that copied it." },
      { title: "Send removal requests to each aggregator", body: "Most have a removal form, buried. Lead with the legal ground if you have one — expungement, dropped charges, or a state statute. Keep it factual and unemotional, and keep copies with dates; a paper trail matters if you later escalate." },
      { title: "Use Google's removal tools for what remains", body: "Google will de-index some pages that expose personal information, and its 'Results about you' tool covers contact details. De-indexing does not delete the page, but it removes it from the search results that actually cause the harm." },
      { title: "Push the result down where you cannot remove it", body: "If the page will not come down, the practical goal is that it isn't on page one for your name. Profiles you control — a professional profile, a personal site, published work — tend to outrank aggregators over time." },
    ],
    hardTruth: "Where an arrest record is genuinely public and has not been expunged, no service can compel its removal, and any company promising guaranteed takedown is misrepresenting what it can do. Paying a mugshot site to remove a photo is also a trap in a second way: many operate networks of sites, so paying one moves the problem rather than ending it, and in several states charging that fee is itself unlawful. The durable fixes are expungement, statutory removal rights where your state grants them, and de-indexing — not payment.",
    faqs: [
      { question: "Can I get my mugshot removed if charges were dropped?", answer: "Often yes, and this is the strongest position to be in. Several states require publishers to remove a mugshot on request when charges were dropped, dismissed or the record was expunged. Send the documentation showing the disposition with your request. Where no statute applies, many sites still comply when charges clearly did not result in a conviction." },
      { question: "Should I pay a mugshot removal service?", answer: "Be very careful. Some states make it illegal for a site to charge for removal, so a fee demand may itself be unlawful. Many mugshot sites also operate under multiple domains, so paying one leaves the same photo live elsewhere. Exhaust expungement, statutory rights and free removal requests before paying anyone." },
      { question: "Does expungement remove a mugshot automatically?", answer: "Not automatically. Expungement seals the underlying record, but copies already published on private sites do not vanish by themselves. What it gives you is a strong legal basis for removal requests, which publishers generally honour — you still have to send them." },
      { question: "How long do mugshots stay online?", answer: "Indefinitely unless something is done. Aggregators do not expire listings, and search engines keep indexing them for as long as they are live. Time alone does not solve this one." },
    ],
    brokers: ["mylife", "truthfinder", "instantcheckmate"],
    relatedGuides: ["remove-name-from-google", "remove-images-from-google", "what-is-doxxing"],
  },
  {
    slug: "date-of-birth",
    dataType: "date of birth",
    title: "How to Remove Your Date of Birth From the Internet",
    description: "Your date of birth is a permanent identity key sitting on people-search sites next to your name. Where it comes from and how to get it removed.",
    h1: "How to remove your date of birth from the internet",
    intro: "Date of birth is the quiet one. It rarely feels sensitive — people post it on social media every year — but it is one of the three or four fields that turn a name into a verifiable identity, and it is the field most commonly used to confirm you are you. Unlike a password it never changes, and unlike an address it never becomes out of date.",
    sources: [
      "Voter registration records, which are public in many states and often include full date of birth",
      "Court and property filings that list parties by name and date of birth",
      "Marketing databases built from purchases, warranty cards and loyalty programmes",
      "Social media, where birthday fields are frequently public by default",
      "Breaches of any service that required your date of birth at signup",
    ],
    risk: "Name plus date of birth plus address is the standard triple used to verify identity over the phone and to match records between databases. It is what lets a stranger pass a knowledge-based security check, and it is what lets brokers confidently merge scattered records into one profile of you.",
    steps: [
      { title: "Opt out of the people-search sites carrying it", body: "Most listings that show your age or full date of birth come from a handful of large aggregators. Their opt-outs are free and we publish step-by-step instructions for the ones that matter most." },
      { title: "Lock down social profiles", body: "Set birthday visibility to private everywhere, or remove the year. Many platforms treat the year as optional. This also stops the annual public reminder that tells anyone watching exactly when it is." },
      { title: "Check your voter registration exposure", body: "Several states publish voter rolls including date of birth, and some make them freely downloadable. Rules on confidentiality vary; your county elections office can tell you what is published and whether any exemption applies to you." },
      { title: "Stop giving it away unnecessarily", body: "Plenty of services ask for a full date of birth when they only need to know you are over eighteen. Where a site accepts a partial date or an age range, use it — every place that does not hold it is one that cannot leak it." },
      { title: "Ask the big three data brokers to suppress it", body: "The large background-data companies accept suppression requests that cover the underlying record rather than a single listing, which is more durable than opting out of consumer-facing sites one at a time." },
    ],
    hardTruth: "Where your date of birth appears in a genuine public record — a court filing, a property deed, some voter rolls — it usually cannot be removed, because the record itself is public by law and the publisher is entitled to reproduce it. You can remove the copies held by commercial aggregators, which is most of what shows up in a search for your name, but the underlying public record stays. And because a date of birth never changes, any copy that leaked once remains accurate forever, which is exactly what makes it valuable to whoever holds it.",
    faqs: [
      { question: "Why do people-search sites show my age or birthday?", answer: "Because it is one of the most reliable ways to distinguish you from everyone else with your name, so aggregators work hard to attach it. It typically comes from voter registration, court and property records, and purchased marketing data rather than from anything you posted." },
      { question: "Is my date of birth really sensitive?", answer: "On its own, not very. Combined with your name and address it becomes the standard identity-verification triple used by call centres and credit applications, and it is the field brokers use to merge separate records into a single profile. Its value comes from combination rather than secrecy." },
      { question: "Can I remove my date of birth from voter records?", answer: "It depends entirely on your state. Some publish full voter rolls including date of birth, some publish only year, some restrict access to registered parties or campaigns. A few offer confidentiality programmes for people at risk of harm. Your county elections office is the place to ask." },
    ],
    brokers: ["whitepages", "spokeo", "beenverified", "radaris"],
    relatedGuides: ["remove-public-records-online", "how-do-data-brokers-get-my-information"],
  },
  {
    slug: "relatives-and-family",
    dataType: "relatives and family members",
    title: "How to Remove Relatives and Family From People-Search Sites",
    description: "People-search listings name your relatives, which exposes them and helps scammers sound credible. How to get the family graph taken down.",
    h1: "How to remove your relatives from people-search sites",
    intro: "Open any people-search listing and the part that unsettles people most is rarely their own address — it is the list of relatives underneath it. Your mother, your siblings, your adult children, sometimes an ex-partner, each linked and clickable. That family graph is assembled from public records and it does two kinds of damage: it exposes people who never consented, and it hands a stranger the details that make a scam call sound legitimate.",
    sources: [
      "Marriage, divorce and birth records, which are public in most jurisdictions",
      "Property deeds listing co-owners and previous owners",
      "Shared-address history — brokers infer family from people who have lived at the same address",
      "Obituaries, which name surviving relatives in a conveniently structured list",
      "Social media connections and tagged photos",
    ],
    risk: "This is the mechanic behind grandparent scams and family-emergency fraud. A caller who knows your daughter's name, your street and your approximate age is far harder to dismiss than one who does not. It also matters for anyone whose safety depends on not being findable, because relatives are the standard route to locating someone who has moved.",
    steps: [
      { title: "Opt out yourself first", body: "Removing your own listing frequently removes you from the relative lists shown on your family members' listings too, because you are the same record viewed from a different angle. Start here — it is the highest-leverage single action." },
      { title: "Ask relatives to opt out as well", body: "Each person has to submit their own request; you cannot opt out on someone else's behalf at most brokers. Send them the direct opt-out links rather than a general suggestion — the completion rate is much higher when the specific link is in front of them." },
      { title: "Break the shared-address link", body: "Brokers infer family from address overlap. Where records list an old shared address, correcting or removing the address history often collapses the inferred relationship." },
      { title: "Prioritise anyone at genuine risk", body: "If someone in the family has a safety concern — a survivor of abuse, a public-facing professional, a minor — do their opt-outs first and check the sites that let you request expedited removal on safety grounds. Several states also run address confidentiality programmes." },
      { title: "Re-check every few months", body: "Family graphs reappear faster than most listings, because a single new public record — a property transfer, a marriage licence — regenerates the inference." },
    ],
    hardTruth: "You cannot opt out on a relative's behalf at most brokers, and you cannot stop a public record from naming them. Marriage certificates, property deeds and obituaries are public documents, and the family relationships they establish will keep being re-derived no matter how many listings you take down. The realistic goal is removing the aggregated, searchable presentation of the family graph — not erasing the underlying facts, which stay on file at the county.",
    faqs: [
      { question: "Can I remove my relatives' names from my listing?", answer: "Usually yes — opting out removes your listing including its relatives section. What you generally cannot do is remove your name from a relative's listing without them submitting their own request, since that is their record rather than yours." },
      { question: "Why do people-search sites know who my family is?", answer: "They infer it from public records and address history: marriage and divorce filings, property deeds with co-owners, obituaries naming survivors, and the simple fact of several people having been registered at the same address. Very little of it comes from social media." },
      { question: "How do I remove a deceased relative's listing?", answer: "Most major brokers have a process for this and generally ask for a death certificate or an obituary link. It is worth doing — listings for deceased people are actively used in identity fraud, because nobody is monitoring the accounts." },
      { question: "Does removing my listing protect my kids?", answer: "Partly. It removes them from your listing's relatives section, but if they are adults with their own records they will have their own listings, which need their own opt-outs. Minors generally should not have listings at all — if you find one, most brokers treat that as a priority removal." },
    ],
    brokers: ["truepeoplesearch", "familytreenow", "mylife", "radaris"],
    relatedGuides: ["what-is-doxxing", "remove-public-records-online"],
  },
  {
    slug: "property-records",
    dataType: "property and home ownership records",
    title: "Remove Your Property Records From People-Search Sites",
    description: "Property deeds are public, so your home purchase is searchable by name. What you can remove, what you can't, and how owners stay private.",
    h1: "How to remove property records from people-search sites",
    intro: "Buying a house creates a public document with your name and the property address on it, and that document is the origin of a surprising share of what people-search sites know about you. Deeds are public by design — the whole point of a land registry is that ownership is verifiable — which makes this one of the harder categories. There is still a meaningful difference between a record existing at the county and it being the first result for your name.",
    sources: [
      "County recorder and assessor offices, which publish deeds, transfers and assessed values",
      "Real-estate portals that mirror listing and sale history",
      "Mortgage filings, which are recorded against the property",
      "Property-tax rolls, public in most jurisdictions",
    ],
    risk: "A property record ties your name to a specific street address with high confidence, and it often includes purchase price and mortgage details. It is one of the strongest signals brokers use to confirm where you live, and it is the record that most reliably survives every other kind of cleanup.",
    steps: [
      { title: "Opt out of the aggregators, not the county", body: "The county record is not going anywhere, but the commercial sites that republish it in a name-searchable format will remove you on request. That is what changes your search results." },
      { title: "Ask real-estate portals to hide sale history", body: "Major portals will usually restrict or remove owner-name detail on request, particularly where there is a stated safety concern. This does not affect the underlying county record." },
      { title: "Check whether your state has an address confidentiality programme", body: "Many states run programmes for survivors of domestic violence, stalking and similar harms that provide a substitute address for public records. Eligibility is narrow and specific, but where it applies it is far stronger than any opt-out." },
      { title: "Consider how future purchases are titled", body: "For properties you have not yet bought, holding title through a trust or an LLC keeps your personal name off the recorded deed. This is a decision to take with a lawyer, and it does nothing for property you already own in your own name." },
      { title: "Remove the supporting listings", body: "Property data becomes far less useful to a stranger when it is not sitting next to your phone number and relatives. Clearing the people-search listings reduces what the property record adds." },
    ],
    hardTruth: "You cannot remove a deed from the public record. Land ownership is deliberately public so that title can be verified, and no privacy law overrides that — it is the same principle that lets you check who owns the house you are about to buy. What you can remove is the commercial republication that makes it searchable by your name instead of by parcel. Anyone offering to delete your property record from county files is describing something that does not happen.",
    faqs: [
      { question: "Can I remove my home address from public property records?", answer: "Not in the ordinary case. Deeds and tax rolls are public records and the county has a statutory duty to maintain them. The realistic move is removing the aggregator copies that make the record searchable by name, and checking whether your state's address confidentiality programme applies to you." },
      { question: "Does buying a house through an LLC keep my name private?", answer: "It can keep your personal name off the recorded deed, which is why it is common among people with genuine safety concerns. It adds cost and complexity, some lenders treat it differently, and it does nothing for property you already own in your own name. Worth discussing with a lawyer rather than acting on a web page." },
      { question: "Why does Zillow show who owns my house?", answer: "Because assessor and recorder data is public and portals ingest it. Most will restrict owner details on request, especially where you cite a safety concern — it is worth asking, and the request is free." },
    ],
    brokers: ["whitepages", "spokeo", "radaris", "peoplefinders"],
    relatedGuides: ["remove-address-from-internet", "why-is-my-address-online", "remove-public-records-online"],
  },
  {
    slug: "court-records",
    dataType: "court and criminal records",
    title: "How to Remove Court Records From Search Results",
    description: "Court records are public, but that doesn't mean nothing can be done. Expungement, sealing, de-indexing and what no service can promise.",
    h1: "How to remove court records from search results",
    intro: "Court records are public because open justice requires it, and that principle is not going to bend for an individual request. But 'public' and 'the first thing that appears when someone searches your name' are different things, and the gap between them is where the useful options live. This is also a category where the marketing gets furthest ahead of what is actually possible, so it is worth being precise.",
    sources: [
      "County, state and federal court electronic filing systems, most of which are searchable by party name",
      "Commercial background-check firms that bulk-purchase court data",
      "News coverage of proceedings",
      "People-search sites that attach criminal and civil record flags to profiles",
    ],
    risk: "Court records surface in employment, housing and licensing checks, and they do not always distinguish a dismissed charge from a conviction, or a civil dispute from wrongdoing. An inaccurate or unresolved-looking record does much of the damage of a real one.",
    steps: [
      { title: "Find out if you are eligible for expungement or sealing", body: "This is the only route that addresses the record itself. Eligibility depends on the state, the offence, the disposition and how much time has passed, and many people are eligible without knowing. Legal aid organisations and public defenders often assess this for free — start there rather than with a paid service." },
      { title: "Correct records that are simply wrong", body: "Background-check firms are subject to accuracy obligations under federal law. If a report shows a case that was dismissed as pending, attributes someone else's record to you, or omits a disposition, you can dispute it and they have to investigate. Misattribution is more common than people expect, particularly with common names." },
      { title: "Ask the court about restricting remote access", body: "Some jurisdictions distinguish between records available at the courthouse and records published online, and will restrict remote access in defined circumstances even where the file stays open. Worth asking the clerk what is available." },
      { title: "Opt out of the commercial republishers", body: "Background-data aggregators will remove you on request even when the court will not. That is often what actually changes your search results, since most people find the aggregator copy rather than the court's own system." },
      { title: "De-index what remains", body: "Search engines will remove some pages exposing personal information from results. The page stays online but stops appearing for your name, which is where most of the practical harm sits." },
    ],
    hardTruth: "An open court record that has not been expunged or sealed cannot be deleted, and no service can compel a court to remove it. Open judicial records are a constitutional-order principle, not a policy someone can be argued out of. Reputation firms that promise to erase court records are describing suppression at best. The genuine routes are expungement, correcting inaccurate reporting, restricting remote access where the jurisdiction allows it, and de-indexing — all of which are real, and none of which is deletion.",
    faqs: [
      { question: "Can court records be removed from the internet?", answer: "The court's own record generally cannot, unless it is expunged or sealed by order. Commercial copies on background-check and people-search sites can usually be removed on request, and search engines will de-index some pages. Those last two are what change what a search for your name returns." },
      { question: "How do I get a record expunged?", answer: "Through the court that handled the case, under your state's expungement or sealing statute. Eligibility varies widely by offence, disposition and elapsed time. Legal aid offices and public defenders frequently assess eligibility at no cost, which is a better starting point than a paid removal service." },
      { question: "Can I remove a dismissed case from background checks?", answer: "Often, yes. Background-check firms have accuracy obligations under federal law, and a case reported without its dismissal, or attributed to the wrong person, can be disputed and must be investigated. Get a copy of the report first so you can point to the specific error." },
      { question: "Do reputation-management companies remove court records?", answer: "They suppress rather than remove. Pushing a result off page one has real value, but it is not deletion, and a company describing it as deletion is overstating what it does. Ask precisely what will be removed versus what will be outranked before paying." },
    ],
    brokers: ["truthfinder", "instantcheckmate", "beenverified", "infotracer"],
    relatedGuides: ["remove-public-records-online", "remove-name-from-google"],
  },
  {
    slug: "voter-registration",
    dataType: "voter registration record",
    title: "How to Remove Your Voter Registration From Data Brokers",
    description: "Voter rolls are public in most states and feed people-search sites your address and date of birth. What's exposed and what you can restrict.",
    h1: "How to remove your voter registration data from data brokers",
    intro: "Voter rolls are one of the largest and least understood sources feeding the people-search industry. Depending on your state, the public file can include your full name, residential address, date of birth or birth year, party affiliation and voting history — not who you voted for, but whether you voted. In several states anyone can download the whole file, and brokers do.",
    sources: [
      "State and county election offices, which maintain the registration file",
      "Bulk file purchases, which are legal in many states for anyone or restricted to campaigns and researchers depending on jurisdiction",
      "Political data vendors that enrich the rolls with consumer data and resell them",
      "People-search sites that ingest the rolls to confirm addresses and dates of birth",
    ],
    risk: "Voter data is unusually authoritative. It is government-maintained, regularly updated and address-verified, which makes it one of the most reliable ways for a broker to confirm where you currently live — considerably more reliable than most commercial sources.",
    steps: [
      { title: "Find out what your state actually publishes", body: "This varies more than almost anything else in privacy. Some states publish full date of birth, some only birth year, some restrict the file to political committees, a few charge substantial fees that limit casual access. Your county elections office can tell you precisely what is in the public version of your record." },
      { title: "Check whether you qualify for a confidentiality exemption", body: "Most states exempt certain voters from the public file — commonly survivors of domestic violence and stalking, and often judges, law enforcement and protected-address programme participants. Where you qualify this is far stronger than any opt-out, because it stops the data at source." },
      { title: "Opt out of the brokers republishing it", body: "The state file itself will not change for most people, but the aggregators that ingest it will remove your listing on request. That is what alters your search results." },
      { title: "Keep your registration address current", body: "Stale addresses are worse than current ones: brokers keep both, so an old address gives them a second location to associate with you and a route to infer former housemates as relatives." },
      { title: "Be deliberate about political sign-ups", body: "Campaign petitions, surveys and donation forms feed the same commercial pipeline as the rolls, and are typically less regulated than the state file." },
    ],
    hardTruth: "In most states you cannot remove yourself from the public voter file while remaining registered to vote — the two are the same record, and publicity is part of how the electoral system is auditable. Confidentiality programmes exist but are deliberately narrow and require you to qualify. For everyone else the realistic goal is removing the commercial copies, not the state file. Deregistering to gain privacy means giving up your vote, which is a bad trade and one no privacy service should suggest.",
    faqs: [
      { question: "Is voter registration information public?", answer: "In most states, yes, though what is included and who may obtain it varies a great deal. Party affiliation and whether you voted are commonly public; how you voted never is. A handful of states restrict bulk access to political committees or charge fees high enough to deter casual buyers." },
      { question: "Can I make my voter registration private?", answer: "Only if you qualify for your state's confidentiality exemption. These typically cover survivors of domestic violence or stalking, and often judges, prosecutors and law enforcement. Your county elections office handles the application and can tell you what evidence is needed." },
      { question: "Do data brokers really use voter rolls?", answer: "Extensively. The rolls are government-maintained, address-verified and updated regularly, which makes them one of the most trustworthy inputs available for confirming a current address — considerably better than most purchased marketing data." },
    ],
    brokers: ["voterrecords", "whitepages", "spokeo", "peoplefinders"],
    relatedGuides: ["remove-address-from-internet", "how-do-data-brokers-get-my-information"],
  },
  {
    slug: "old-addresses",
    dataType: "previous address history",
    title: "How to Remove Old Addresses From People-Search Sites",
    description: "Every place you've lived stays in broker records for decades. Why address history is worse than your current address, and how to clear it.",
    h1: "How to remove your address history from people-search sites",
    intro: "Most people worry about their current address being published and never think about the list of previous ones sitting underneath it. That list is often longer and more revealing: a decade of moves, the cities you passed through, and — because brokers infer relationships from shared addresses — everyone you ever lived with. It is also the part that answers security questions.",
    sources: [
      "Change-of-address filings, which enter commercial databases",
      "Utility and telecom account records sold into marketing databases",
      "Credit header data — the identifying portion of a credit file, which sits outside most credit-report protections",
      "Property and rental records",
      "Voter registration updates when you re-register at a new address",
    ],
    risk: "Address history is the classic knowledge-based authentication question — 'which of these streets have you lived on?' — and a published history turns that check into a lookup. It also exposes former housemates and partners as inferred relatives, and for anyone who has moved to get away from someone, a trail of former addresses is exactly the thread that leads back.",
    steps: [
      { title: "Get a full picture before you start", body: "Run a search on yourself at the major people-search sites and write down every address listed. Most people are surprised by how far back it goes and by addresses they had forgotten. You cannot clear what you have not inventoried." },
      { title: "Opt out at the aggregators", body: "A standard opt-out normally removes the whole record including its address history, rather than the current address alone. Our guides cover the ones that matter most, and they are free." },
      { title: "Correct rather than only remove where you can", body: "Some brokers let you edit a record instead of deleting it. Removing incorrect old addresses is worth doing even where you cannot remove everything, because incorrect history creates its own problems in background checks." },
      { title: "Address credit header data", body: "The identifying part of your credit file — name, addresses, date of birth — is sold separately from your credit report and is not protected the same way. The large background-data companies accept suppression requests covering it, which is more durable than opting out of consumer sites one at a time." },
      { title: "Expect it to return, and plan for that", body: "Address history regenerates from each new record you create. Moving, registering to vote, or opening a utility account all re-seed it. This is maintenance rather than a one-time clear." },
    ],
    hardTruth: "Address history is among the hardest categories to clear permanently, because it is continuously rebuilt from records you have to create in order to live a normal life — a lease, a utility account, a voter registration, a change of address. You can remove the aggregated listings and you should, but assume the underlying trail persists in commercial databases you cannot see. For anyone whose safety depends on an old address staying unfindable, a state address confidentiality programme is a stronger tool than any removal service.",
    faqs: [
      { question: "Why do people-search sites list addresses I lived at years ago?", answer: "Because brokers keep records rather than replacing them. Each new address is appended to the file, so the history accumulates. It is commercially useful to them — a long history helps confirm identity and link records — which is exactly why it does not expire on its own." },
      { question: "Does removing my current address remove the old ones?", answer: "Usually yes. A standard opt-out removes the whole record including its history, rather than just the current entry. Verify afterwards, though — some sites remove the visible profile while keeping the underlying data and later republish it." },
      { question: "Can old addresses be used against me?", answer: "Yes, mainly through knowledge-based authentication. 'Which of these addresses have you lived at' is a common identity check, and a published history converts it into a lookup. It also exposes former housemates, who brokers then list as your relatives." },
    ],
    brokers: ["whitepages", "spokeo", "beenverified", "truepeoplesearch"],
    relatedGuides: ["remove-address-from-internet", "why-is-my-address-online"],
  },
];

export const getDataTypeGuide = (slug: string): DataTypeGuide | undefined =>
  DATA_TYPE_GUIDES.find((g) => g.slug === slug.toLowerCase());
