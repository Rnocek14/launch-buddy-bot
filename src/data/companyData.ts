/**
 * "What does <company> know about me" — powers /what-they-know/:slug
 *
 * WHY THIS CLUSTER IS THE STRATEGIC ONE
 * -------------------------------------
 * Every competitor in this category — DeleteMe, Incogni, Optery, OneRep,
 * Privacy Bee — removes you from data brokers. None of them can answer "what
 * does Google know about me", because none of them look at the accounts you
 * created. They work outward from your name into public records; this works
 * inward from your inbox into private accounts.
 *
 * That makes this the one high-volume query set where the competition
 * structurally cannot follow us, and where our actual product is the answer
 * rather than a bolt-on. A reader who has just downloaded their Google archive
 * and found twelve years of location history has exactly one next question:
 * "which other companies have this much?" That question is the product.
 *
 * ACCURACY RULES
 * --------------
 * 1. Only describe data-export tools that genuinely exist. Every one below is
 *    a documented, long-standing feature.
 * 2. Describe categories of data, not specific technical claims about
 *    internals we cannot verify.
 * 3. `keepsAnyway` must be honest. Deletion is never total, and saying so is
 *    the part readers remember.
 */

export interface CompanyDataGuide {
  slug: string;
  /** Display name, e.g. "Google". */
  company: string;
  title: string;
  /** Under 160 characters. */
  description: string;
  h1: string;
  intro: string;
  /** Categories of data the company holds. */
  collects: string[];
  /** The thing that surprises people when they open the archive. */
  surprising: string;
  /** How to request your own copy. */
  downloadSteps: Array<{ title: string; body: string }>;
  /** How to reduce what is collected going forward. */
  limitSteps: string[];
  /** What deleting your account actually achieves. */
  deleteNote: string;
  /** What survives deletion. Required — never soften. */
  keepsAnyway: string[];
  faqs: Array<{ question: string; answer: string }>;
  /** Matching slug in DELETE_GUIDES, if we have a deletion guide. */
  deleteGuideSlug?: string;
}

export const COMPANY_DATA_GUIDES: CompanyDataGuide[] = [
  {
    slug: "google",
    company: "Google",
    title: "What Does Google Know About Me? How to See Everything",
    description: "Google holds your location history, every search, every video and your ad profile. How to download the lot, read it, and cut it back.",
    h1: "What does Google know about you?",
    intro: "Google almost certainly holds more information about you than any other single company, and unusually, it will hand you a copy of nearly all of it if you ask. Most people who do this are shocked less by any single item than by the timespan — a decade or more of continuous record, collected across products they forgot they were signed into.",
    collects: [
      "Location history — where your phone has been, often accurate to a specific building, going back years",
      "Every search you have run while signed in, including the ones you deleted from your browser",
      "YouTube watch and search history, which is a remarkably precise portrait of your interests",
      "The advertising profile Google has inferred about you: age bracket, relationship status, income band, interests",
      "Contacts, calendar entries, photos and their embedded location data",
      "Voice recordings from Assistant, if you have ever enabled that",
      "App activity from Android devices and sites using Google sign-in",
    ],
    surprising: "The advertising profile is the item that lands hardest. Google publishes what it has inferred about you at myadcenter.google.com — an explicit list of assumptions about your age, income, relationship status and interests. Some of it will be wrong, which is its own kind of unsettling, and all of it is what advertisers buy access to.",
    downloadSteps: [
      { title: "Go to Google Takeout", body: "takeout.google.com. It is Google's official data export tool and it covers essentially every product you have used." },
      { title: "Choose what to export", body: "'Select all' gives you everything but produces an enormous archive. If you want the revealing parts specifically, take Location History, My Activity, YouTube history and Ads." },
      { title: "Pick a delivery method", body: "Export as a zip by email link. Large archives are split into several files and can take hours or days to prepare — Google emails you when it is ready." },
      { title: "Read the location history first", body: "It usually arrives as JSON, which is hard to read raw. Google's own Timeline view at google.com/maps/timeline is the readable version and covers the same data." },
      { title: "Check your ad profile separately", body: "myadcenter.google.com shows the inferences rather than the raw data. It takes two minutes and is the fastest way to see what has been concluded about you." },
    ],
    limitSteps: [
      "Turn off Location History and Web & App Activity at myactivity.google.com — this stops future collection rather than deleting the past.",
      "Set auto-delete to 3 months for activity you cannot turn off entirely; it is not on by default for older accounts.",
      "Turn off ad personalisation at myadcenter.google.com. You still see ads, they are just no longer built on your profile.",
      "Audit third-party apps with access to your Google account and revoke anything you do not recognise.",
      "Sign out of Chrome, or use a separate browser profile, for anything you would rather not have logged against your identity.",
    ],
    deleteNote: "You can delete individual products' data without deleting your account, which is what most people actually want. Deleting the whole Google account is drastic — it takes Gmail, Photos, Drive, purchases and any Android device sign-in with it, and it is not reversible after the grace period.",
    keepsAnyway: [
      "Data other people hold about you — emails you sent that sit in someone else's Gmail",
      "Records Google is legally required to retain, including for tax and law enforcement purposes",
      "Aggregated and anonymised data already used to train systems or build audience models",
      "Backups, for a period after deletion completes",
    ],
    faqs: [
      { question: "How do I see everything Google knows about me?", answer: "Use Google Takeout at takeout.google.com to export your data, and check myactivity.google.com for a browsable view of your search, YouTube and app history. myadcenter.google.com separately shows the advertising profile Google has inferred about you, which is often the most revealing single page." },
      { question: "Does Google track my location even when I'm not using Maps?", answer: "If Location History is enabled, your Android device or the Google apps on your iPhone can record location in the background regardless of whether Maps is open. You can view what has been recorded at google.com/maps/timeline and turn the setting off at myactivity.google.com." },
      { question: "Can I delete my Google data without deleting my account?", answer: "Yes, and for most people that is the right move. myactivity.google.com lets you delete search, YouTube and location history individually, and set auto-delete going forward. Deleting the account itself takes Gmail, Photos and Drive with it." },
      { question: "Does turning off ad personalisation stop tracking?", answer: "No. It stops your profile being used to target the ads you see. Google continues collecting the underlying activity unless you separately turn off Web & App Activity and Location History." },
    ],
    deleteGuideSlug: "gmail",
  },
  {
    slug: "facebook",
    company: "Facebook",
    title: "What Does Facebook Know About Me? Download and See",
    description: "Facebook tracks you across sites you visit, not just on Facebook. How to see the off-platform activity file and what it reveals.",
    h1: "What does Facebook know about you?",
    intro: "The Facebook data most people expect — posts, photos, messages, friends — is the least interesting part of the archive. The part that surprises people is the record of activity that happened nowhere near Facebook: the shops, apps and news sites that reported your visit back, because they had a Meta pixel installed and you never knew.",
    collects: [
      "Everything you posted, plus the drafts and posts you deleted",
      "Your full message history, including messages you deleted from your own view",
      "Off-platform activity — the sites and apps that sent Meta a record of your visit or purchase",
      "The advertising interests Meta has inferred, and the advertiser lists you appear on",
      "Facial recognition data from tagged photos, depending on when and where you used the service",
      "Contacts uploaded from your phone, including people who never used Facebook",
      "Login locations, devices and IP addresses over time",
    ],
    surprising: "The 'Off-Facebook activity' file is the one that changes how people think about this. It lists businesses that sent Meta a record of your interaction with them — often hundreds, frequently including things you did on a phone while logged out. Most people have no memory of any of it and no idea those companies had that relationship with Meta.",
    downloadSteps: [
      { title: "Open Accounts Center", body: "Settings → Accounts Center → Your information and permissions. Meta consolidated Facebook and Instagram settings here, so the same place covers both." },
      { title: "Choose 'Download your information'", body: "Select the date range and format. HTML is far easier to read than JSON if you just want to look through it." },
      { title: "Request everything the first time", body: "Partial exports miss the categories people most want to see. Take the whole thing once, then narrow later if you re-export." },
      { title: "Look at 'Off-Facebook activity' separately", body: "It has its own viewer under Accounts Center → Your activity off Meta technologies. This is the file worth opening first." },
      { title: "Check your ad interests", body: "The inferred-interests list sits in ad preferences and is usually a much shorter, blunter read than the full archive." },
    ],
    limitSteps: [
      "Clear and then disconnect off-platform activity in Accounts Center — clearing alone does not stop future collection, you have to disconnect it too.",
      "Turn off facial recognition features where the option is available in your region.",
      "Review and remove third-party apps that have Facebook login access.",
      "Turn off contact uploading in the Messenger and Facebook apps, and delete contacts already uploaded.",
      "Limit ad topics in ad preferences, understanding this changes targeting rather than collection.",
    ],
    deleteNote: "Deactivating and deleting are very different. Deactivation hides your profile and keeps everything. Deletion is permanent after a grace period, during which logging in cancels it — including logging into anything using 'Continue with Facebook'.",
    keepsAnyway: [
      "Messages you sent, which remain in recipients' inboxes",
      "Content others posted about you, including photos you were tagged in",
      "Log data retained for security and legal reasons",
      "Backups for a period after deletion completes",
    ],
    faqs: [
      { question: "What is Off-Facebook activity?", answer: "A record of your interactions with businesses outside Meta's apps — websites and apps that sent Meta a report of your visit or purchase, usually via a tracking pixel or SDK. You can view the list in Accounts Center and both clear it and disconnect it, though clearing alone does not stop future collection." },
      { question: "Does Facebook listen to my microphone?", answer: "Meta has consistently denied using the microphone for ad targeting, and independent researchers have not demonstrated it. The reason ads feel uncannily relevant is usually simpler and more thorough: off-platform tracking, location data, contact graphs and inference from people connected to you." },
      { question: "How do I see what Facebook knows about me?", answer: "Accounts Center → Your information and permissions → Download your information. Choose HTML for readability. Check 'Off-Facebook activity' and your ad interests separately — those two are more revealing than the posts and photos most people expect to find." },
      { question: "Does deleting Facebook delete my Instagram data?", answer: "Not automatically. They are separate accounts even though Accounts Center manages both, and each has to be deleted separately. Data already shared between them under Meta's own policies is not undone by deleting one." },
    ],
    deleteGuideSlug: "facebook",
  },
  {
    slug: "amazon",
    company: "Amazon",
    title: "What Does Amazon Know About Me? Request Your Data",
    description: "Amazon holds every purchase, every search, Alexa recordings and Kindle reading data. How to request the archive and read it.",
    h1: "What does Amazon know about you?",
    intro: "Amazon's record of you is unusually concrete. Most companies hold inferences about your interests; Amazon holds a receipt. Every purchase, going back to whenever you opened the account, alongside what you searched for and did not buy, what you hovered over, and — if you own their devices — what you said out loud and what you read.",
    collects: [
      "Complete purchase history, with dates, prices and delivery addresses",
      "Every product search and item viewed, including what you decided against",
      "Alexa voice recordings and transcripts, if you own an Echo device",
      "Kindle reading data — which books, which pages, how long you spent, what you highlighted",
      "Prime Video watch history",
      "Addresses you have shipped to, which is a decade of address history in one file",
      "Advertising audience segments you have been placed in",
    ],
    surprising: "The address list. Purchase history is expected; a complete record of every address you have ever shipped to — old homes, workplaces, relatives, an ex-partner's flat — is a personal history nobody realises they are compiling. It is also, incidentally, the same address-history data brokers work hard to assemble.",
    downloadSteps: [
      { title: "Go to Request My Data", body: "Account & Lists → Your Account → Data Privacy, or search 'Request My Data' in Amazon help. The exact path moves around, but the tool is stable." },
      { title: "Pick a category or request everything", body: "Categories include ordering, devices, Alexa, Kindle and advertising. 'Request all your data' is the complete version." },
      { title: "Confirm by email", body: "Amazon emails to confirm the request before processing. Requests can take up to a month for the full archive." },
      { title: "Open the ordering and address files first", body: "These are the readable, revealing ones. Alexa and Kindle files are more technical but worth a look if you use those devices." },
    ],
    limitSteps: [
      "Delete Alexa voice recordings in the Alexa app, and turn off recording retention entirely if you do not want them kept.",
      "Turn off 'Help improve Alexa' so recordings are not reviewed by humans.",
      "Remove old shipping addresses from your address book — they are kept indefinitely otherwise.",
      "Clear your browsing history within Amazon, which is separate from your browser history.",
      "Opt out of interest-based ads in Amazon's advertising preferences.",
    ],
    deleteNote: "Closing an Amazon account is significant and largely irreversible: you lose Kindle books, Prime Video purchases, Audible audiobooks and any other digital content, because those are licences tied to the account rather than things you own outright.",
    keepsAnyway: [
      "Transaction records retained for tax, accounting and legal obligations — typically for years",
      "Reviews you posted, which may remain published",
      "Data held by third-party sellers you bought from, which is outside Amazon's control",
      "Anything shared with Amazon's advertising partners before deletion",
    ],
    faqs: [
      { question: "How do I download my Amazon data?", answer: "Use the 'Request My Data' tool in your account's Data Privacy section. You can request individual categories — ordering, Alexa, Kindle, advertising — or everything at once. Amazon confirms by email and the full archive can take up to a month." },
      { question: "Does Amazon keep Alexa recordings?", answer: "By default Alexa retains voice recordings, and they are viewable and deletable in the Alexa app under Privacy settings. You can also set recordings not to be saved at all, and separately turn off the setting that allows humans to review them." },
      { question: "Can I delete my Amazon order history?", answer: "You can archive orders so they no longer appear in your default view, but you cannot delete the underlying records — Amazon retains transaction data for tax and legal reasons. Closing the account does not erase completed transaction records either." },
      { question: "What happens to my Kindle books if I close my Amazon account?", answer: "You lose access to them. Kindle books, Audible audiobooks and Prime Video purchases are licences tied to the account, not files you own. This is the single biggest reason to think carefully before closing a long-standing Amazon account." },
    ],
    deleteGuideSlug: "amazon",
  },
  {
    slug: "tiktok",
    company: "TikTok",
    title: "What Does TikTok Know About Me? See Your Data File",
    description: "TikTok's recommendation engine runs on precise behavioural data — watch time per video, rewatches, pauses. How to download what it holds.",
    h1: "What does TikTok know about you?",
    intro: "TikTok's algorithm has a reputation for reading people accurately, and the reason is not mysterious. It measures behaviour most platforms ignore: exactly how long you watched each video, whether you rewatched it, where you paused, what made you scroll away instantly. Those signals are a more honest account of your interests than anything you would type into a profile.",
    collects: [
      "Watch time per video, rewatches and scroll-away points — the core of the recommendation system",
      "Every search, like, comment, share and follow",
      "Device information, including model, operating system and network details",
      "Approximate location derived from network information, plus precise location if you granted it",
      "Keystroke patterns and typing rhythm, disclosed in its privacy policy",
      "Contacts and social connections, if you allowed syncing",
      "Content of messages sent through the app",
    ],
    surprising: "The interest profile built purely from watch behaviour. You never told TikTok anything, but the inferred-interest list in your data file reads like something written by someone who has been watching you closely — because functionally that is what happened, one video at a time.",
    downloadSteps: [
      { title: "Open Settings and privacy", body: "Profile → menu → Settings and privacy → Account → Download your data." },
      { title: "Choose your format", body: "TXT is readable immediately; JSON is complete but harder to scan. Take TXT if you just want to look." },
      { title: "Request and wait", body: "The file usually takes a few days to prepare. It appears under the 'Download data' tab in the same menu — TikTok does not always email you." },
      { title: "Read the activity and interest files", body: "Watch history and inferred interests are the revealing parts. Video-by-video engagement is where the recommendation accuracy comes from." },
    ],
    limitSteps: [
      "Turn off personalised ads in Settings → Ads → Ads personalisation.",
      "Revoke contact and location permissions at the operating-system level, not just in the app.",
      "Clear your watch and search history in Settings → Activity centre.",
      "Set your account to private if you do not need a public audience.",
      "Use the app rather than granting broad phone permissions where you can — permissions are easier to grant than to remember to revoke.",
    ],
    deleteNote: "Deleting your TikTok account starts a 30-day deactivation window during which logging in cancels the deletion. After that it is permanent and your videos, drafts and messages go with it.",
    keepsAnyway: [
      "Messages you sent, which remain visible to recipients",
      "Videos others saved, downloaded or duetted before deletion",
      "Data retained for legal and safety obligations",
      "Anything already shared with advertising or analytics partners",
    ],
    faqs: [
      { question: "How do I download my TikTok data?", answer: "Settings and privacy → Account → Download your data. Choose TXT for readability, request the file, and check back in the same menu after a few days — TikTok posts it there rather than always emailing you." },
      { question: "Does TikTok track keystrokes?", answer: "TikTok's privacy policy discloses collection of keystroke patterns and rhythms, which is behavioural-biometric data used for things like fraud detection. That disclosure is broader than most people expect, and it is worth reading the policy rather than relying on summaries — including this one." },
      { question: "How does TikTok know me so well?", answer: "It measures behaviour rather than asking for preferences. Watch time per video, rewatches, pauses and instant scroll-aways are far more honest signals than anything you would enter in a profile, and the volume of short videos gives the system an unusual number of data points per session." },
      { question: "Does deleting TikTok remove my data?", answer: "It removes your account, videos and messages from the platform after the 30-day window. It does not retrieve data already shared with advertising partners, does not delete messages sitting in other people's inboxes, and does not affect content others saved before you left." },
    ],
    deleteGuideSlug: "tiktok",
  },
  {
    slug: "apple",
    company: "Apple",
    title: "What Does Apple Know About Me? Get Your Privacy Report",
    description: "Apple markets privacy hard, and collects less than most — but it still holds purchases, Siri history and device data. Here's the real picture.",
    h1: "What does Apple know about you?",
    intro: "Apple has built a brand on collecting less, and by the standards of this list that is broadly fair — much of what it does is processed on your device rather than on its servers. But 'less than Google' is not 'nothing', and the gap between Apple's marketing and its actual data holdings is worth seeing for yourself rather than taking anyone's word for.",
    collects: [
      "Purchase history across App Store, iTunes, Books and Apple services",
      "Siri request history, retained in a form tied to a random identifier rather than your Apple ID",
      "iCloud contents — photos, backups, documents, depending on what you sync",
      "Device identifiers, model information and diagnostics",
      "Apple Pay transaction records, though Apple states card numbers are not stored on its servers",
      "App Store search and browsing activity",
      "Health data if you use the Health app, though this is encrypted and Apple states it cannot read it",
    ],
    surprising: "The volume of purchase history. A decade of App Store and iTunes activity is a detailed record of interests, habits and phases of life — the fitness app from a January, the language app from before a trip, the medical app from a difficult month. It is less obviously invasive than location history and often more personal.",
    downloadSteps: [
      { title: "Go to the Data and Privacy portal", body: "privacy.apple.com and sign in with your Apple ID. This is Apple's official access-and-deletion portal." },
      { title: "Choose 'Request a copy of your data'", body: "You can select individual categories or everything. Categories are clearly labelled, which is not true of every company's export tool." },
      { title: "Pick a file size and wait", body: "Apple splits large archives into chunks you choose the size of. Preparation typically takes up to a week, and Apple emails when it is ready." },
      { title: "Start with purchase and device data", body: "These are the readable parts. iCloud content arrives as the files themselves, which you probably already have." },
    ],
    limitSteps: [
      "Turn off Siri history retention and delete existing history in Settings → Siri & Search.",
      "Review Significant Locations under Privacy & Security → Location Services → System Services — most people do not know this exists.",
      "Turn off personalised ads in Settings → Privacy & Security → Apple Advertising.",
      "Use App Tracking Transparency to deny cross-app tracking, which limits third parties rather than Apple.",
      "Review which apps have Photos, Contacts and Location access, and downgrade Location to 'While Using'.",
    ],
    deleteNote: "privacy.apple.com also handles account deletion, and it is genuinely permanent. You lose purchases, iCloud content, iMessage continuity and any device relying on that Apple ID — treat it as a much bigger decision than closing an ordinary account.",
    keepsAnyway: [
      "Transaction records retained for tax and legal obligations",
      "Data held by app developers you bought from, which is entirely outside Apple's control",
      "Anything you shared into iCloud shared albums or with other people",
      "Backups for a period after deletion",
    ],
    faqs: [
      { question: "Is Apple really more private than Google?", answer: "On data collection, broadly yes — Apple's business model does not depend on advertising to the same degree, and more processing happens on-device. That is a difference of degree rather than kind: Apple still holds purchase history, Siri requests, device data and whatever you sync to iCloud. Verify it with the export rather than taking the marketing at face value." },
      { question: "How do I download my Apple data?", answer: "privacy.apple.com → Request a copy of your data. Choose categories or everything, pick a file chunk size, and wait up to about a week. Apple emails you when the archive is ready." },
      { question: "What is Significant Locations on my iPhone?", answer: "A record of places you visit frequently, kept on-device and used for features like traffic predictions. Apple states it is encrypted and it cannot read it, but it is genuinely surprising to see. Settings → Privacy & Security → Location Services → System Services → Significant Locations, where you can also clear it." },
      { question: "Does App Tracking Transparency stop Apple tracking me?", answer: "No. It governs whether other companies' apps may track you across apps and websites. Apple's own data collection is controlled separately, under Apple Advertising in Privacy settings." },
    ],
  },
  {
    slug: "linkedin",
    company: "LinkedIn",
    title: "What Does LinkedIn Know About Me? Download Your Data",
    description: "LinkedIn holds your full career history, every profile view, messages and inferred salary band. How to see the file and limit it.",
    h1: "What does LinkedIn know about you?",
    intro: "LinkedIn is the one platform where people voluntarily publish a complete, verified employment history under their real name — which makes it structurally different from every other account you hold. Add the behavioural data it collects alongside that, and it holds a professional profile of unusual accuracy, some of which is visible to recruiters and some of which is not visible to anyone but LinkedIn.",
    collects: [
      "Your full employment and education history, as published",
      "Every profile you viewed, and every search you ran",
      "Messages, connection requests and their timing",
      "Inferred seniority, skills, salary band and job-change likelihood",
      "Contacts imported from your email or phone, including people not on LinkedIn",
      "Content engagement — what you read, paused on and clicked",
      "Devices, locations and login history",
    ],
    surprising: "The inferences about job-change likelihood. LinkedIn's business is partly selling recruiters access to people who might move, and behavioural signals feed that assessment. Your profile-viewing pattern and engagement can suggest you are looking well before you have told anyone — including, in principle, your employer's recruiters.",
    downloadSteps: [
      { title: "Open Settings & Privacy", body: "Me → Settings & Privacy → Data privacy → Get a copy of your data." },
      { title: "Choose the fuller archive", body: "LinkedIn offers a fast basic export and a larger complete one. Take the complete version — the basic file omits most of the interesting parts." },
      { title: "Wait for the email", body: "The larger archive typically takes up to 24 hours and arrives as a download link." },
      { title: "Look at imported contacts and search history", body: "Most people are surprised by how many contacts were uploaded from a phone sync years ago, and by the completeness of their search record." },
    ],
    limitSteps: [
      "Turn off 'Profile viewing options' to browse privately, which also stops others seeing you viewed them.",
      "Remove imported contacts under Data privacy → Manage your synced contacts — syncing uploads people who never consented.",
      "Turn off 'Share profile updates with your network' before editing your profile during a job search.",
      "Review 'Data for personalisation' and 'Social, economic and workplace research' settings, both usually on by default.",
      "Turn off open-to-work signalling to recruiters if your current employer uses LinkedIn Recruiter.",
    ],
    deleteNote: "Closing a LinkedIn account removes your profile and connections, and after a short window it is not recoverable. Given that a LinkedIn profile is often the top result for a professional's name, consider whether an emptied profile serves you better than none — an absent profile can leave a worse gap than a minimal one.",
    keepsAnyway: [
      "Messages you sent, which stay in recipients' inboxes",
      "Comments and posts on others' content, in some cases",
      "Data already exported by recruiters using LinkedIn's tools",
      "Records retained for legal and security obligations",
    ],
    faqs: [
      { question: "Can my employer see that I'm job hunting on LinkedIn?", answer: "Not directly, but signals leak. Profile updates broadcast to your network unless you turn that off first, and open-to-work signalling is only hidden from recruiters at your own company on a best-effort basis. Turn off update sharing before editing, and be deliberate about the open-to-work setting." },
      { question: "How do I download my LinkedIn data?", answer: "Settings & Privacy → Data privacy → Get a copy of your data. Choose the complete archive rather than the fast basic one, which omits search history, imported contacts and engagement data. The full file usually arrives within a day." },
      { question: "Does LinkedIn have my phone contacts?", answer: "If you ever allowed contact syncing, yes — including people who are not on LinkedIn and never agreed to anything. You can view and delete the uploaded list under Data privacy → Manage your synced contacts." },
      { question: "Should I delete my LinkedIn profile?", answer: "Usually no. A LinkedIn profile is often the highest-ranking result for a professional name, which means it displaces things you control less. Trimming it back to essentials generally serves you better than deleting it and leaving whatever else ranks in its place." },
    ],
    deleteGuideSlug: "linkedin",
  },
  {
    slug: "instagram",
    company: "Instagram",
    title: "What Does Instagram Know About Me? See Your Archive",
    description: "Instagram logs what you linger on, not just what you like, and shares data with Meta. How to download the file and read it.",
    h1: "What does Instagram know about you?",
    intro: "Instagram measures attention rather than approval. Likes are the small part; the substantial part is dwell time — which posts you slowed down for, which stories you rewatched, which profiles you visited repeatedly without ever interacting. All of it sits under the same Meta account infrastructure as Facebook, whether or not you have ever used Facebook.",
    collects: [
      "Every post, story and reel you viewed, and how long you spent on each",
      "Profiles you visited, including ones you never followed or interacted with",
      "Searches, including accounts you looked up and did not open",
      "Direct messages, including unsent ones in some cases",
      "Off-platform activity shared with Meta via pixels on other websites",
      "Contacts synced from your phone",
      "Location data from tagged posts and device permissions",
    ],
    surprising: "The list of accounts you have viewed. Instagram does not show this to anyone else, but it is in your archive — a record of whose profile you visited and how often, including people you deliberately do not follow. Reading it is a distinctly uncomfortable experience for most people.",
    downloadSteps: [
      { title: "Open Accounts Center", body: "Settings → Accounts Center → Your information and permissions → Download your information. Meta manages Instagram and Facebook from the same place." },
      { title: "Select Instagram specifically", body: "If your accounts are linked, choose which to export. Selecting all gives you the Meta-wide picture." },
      { title: "Choose HTML", body: "Far more readable than JSON for browsing. Choose 'All time' unless you have a reason to narrow it." },
      { title: "Open 'Your activity off Meta technologies'", body: "Separate from the main archive and consistently the most surprising file for people who thought Instagram only saw Instagram." },
    ],
    limitSteps: [
      "Disconnect off-platform activity in Accounts Center — clearing it alone does not stop future collection.",
      "Turn off contact syncing and delete already-uploaded contacts.",
      "Set your account to private, which limits who can see you but not what Meta collects.",
      "Turn off activity status so your online presence is not broadcast.",
      "Review connected third-party apps and revoke ones you no longer use.",
    ],
    deleteNote: "Instagram offers deactivation and deletion separately. Deletion has a 30-day grace period during which logging in cancels it. Deleting Instagram does not delete a linked Facebook account, and vice versa — they are separate deletions.",
    keepsAnyway: [
      "Messages in recipients' inboxes",
      "Screenshots and reposts made by others before deletion",
      "Data already shared with Meta's advertising partners",
      "Records retained for legal and safety purposes",
    ],
    faqs: [
      { question: "Can people see if I look at their Instagram profile?", answer: "Not for ordinary profile visits — only stories show viewers. But Instagram itself records every profile you visit, and that record is in your downloadable archive. It is private from other users, not from Meta." },
      { question: "How do I download my Instagram data?", answer: "Settings → Accounts Center → Your information and permissions → Download your information. Choose HTML for readability and 'All time' for the complete picture. Check off-platform activity separately." },
      { question: "Does Instagram share my data with Facebook?", answer: "They are both Meta products and data is shared within Meta under a single privacy policy, whether or not you have a Facebook account. Accounts Center makes that relationship explicit, and off-platform activity is collected across both." },
      { question: "Does deleting Instagram delete my Facebook data?", answer: "No. They are separate accounts managed from a shared settings surface, and each must be deleted individually. Data already shared between them under Meta's policies is not undone by deleting either one." },
    ],
    deleteGuideSlug: "instagram",
  },
  {
    slug: "microsoft",
    company: "Microsoft",
    title: "What Does Microsoft Know About Me? Privacy Dashboard",
    description: "Windows, Xbox, Office and Bing all report to one Microsoft account. The privacy dashboard shows the lot — here's how to read it.",
    h1: "What does Microsoft know about you?",
    intro: "Microsoft's data collection is easy to underestimate because it is spread across products that do not feel connected. Windows telemetry, Bing searches, Xbox activity, Office usage and Edge browsing all report to the same account, and the combined picture is closer to Google's than most people assume. Unusually, Microsoft puts nearly all of it on one dashboard.",
    collects: [
      "Bing search history tied to your account",
      "Windows diagnostic and telemetry data, at a level set by your privacy settings",
      "Xbox gameplay activity, achievements and social interactions",
      "Edge browsing history if syncing is enabled",
      "Location history from Windows devices and mobile apps",
      "Office document activity and usage patterns",
      "Voice data from Cortana, where that was used",
    ],
    surprising: "That the dashboard exists at all, and how much is on it. Microsoft's privacy dashboard consolidates search, browse, location, app and voice activity in one place — far more discoverable than most companies manage — and most Windows users have simply never opened it.",
    downloadSteps: [
      { title: "Go to the privacy dashboard", body: "account.microsoft.com/privacy and sign in. This is the single console for Microsoft account data." },
      { title: "Browse each activity category first", body: "Search, browse, location, apps and voice each have their own view. Browsing them is faster than waiting for an export." },
      { title: "Request the full export if you want it", body: "'Download your data' produces a complete archive, which takes longer to prepare than the dashboard views." },
      { title: "Check Windows diagnostic settings", body: "Settings → Privacy & security → Diagnostics & feedback on the device itself. The level here determines how much Windows reports, and it is set per device rather than per account." },
    ],
    limitSteps: [
      "Set Windows diagnostic data to 'Required only' in Settings → Privacy & security → Diagnostics & feedback.",
      "Clear each category on the privacy dashboard — they clear separately, not all at once.",
      "Turn off 'Tailored experiences' in Windows privacy settings, which uses diagnostic data for personalisation.",
      "Turn off the advertising ID so apps cannot use it for cross-app profiling.",
      "Review app permissions for location, camera and microphone in Windows settings.",
    ],
    deleteNote: "Closing a Microsoft account takes Xbox purchases and history, Office 365 subscription access, OneDrive contents and Outlook.com mail with it. Microsoft applies a 60-day waiting period during which you can reverse it, which is longer than most companies offer.",
    keepsAnyway: [
      "Purchase and licence records retained for legal and tax reasons",
      "Data held by game publishers and third-party services linked to your Xbox account",
      "Enterprise-managed data if your account is tied to a workplace tenant",
      "Backups for a period after closure",
    ],
    faqs: [
      { question: "How do I see what Microsoft knows about me?", answer: "account.microsoft.com/privacy. The dashboard shows search, browse, location, app and voice activity in one place and lets you clear each category. A full export is available too, but the dashboard is faster for simply looking." },
      { question: "Does Windows spy on me?", answer: "Windows sends diagnostic and telemetry data to Microsoft, at a level you control in Settings → Privacy & security → Diagnostics & feedback. Setting it to 'Required only' meaningfully reduces what is sent. It is not covert — it is default-on and adjustable, which is a different thing from spying." },
      { question: "Can I use Windows without a Microsoft account?", answer: "Local accounts remain possible, though Microsoft has made them progressively harder to select during setup on consumer editions. A local account keeps device activity from being tied to a cloud profile, at the cost of syncing and some features." },
      { question: "Does clearing my dashboard actually delete the data?", answer: "It removes the activity from your account view and Microsoft states it is deleted from the associated records. Aggregated and de-identified data derived from it, and anything retained for legal or security purposes, is not covered — which is true of every company on this list." },
    ],
  },
  {
    slug: "uber",
    company: "Uber",
    title: "What Does Uber Know About Me? Download Your Trip Data",
    description: "Uber holds every trip you've taken with precise pickup and drop-off points — a movement history few people think about. How to see it.",
    h1: "What does Uber know about you?",
    intro: "Uber's data is unusually precise about a specific thing: where you physically went and when. Every trip has a timestamped pickup and drop-off point, which over a few years builds a movement history — home, work, the clinic, the airport, whose flat you left at two in the morning. Very few people think of a rideshare app as a location tracker, and it is one of the most exact ones most people carry.",
    collects: [
      "Every trip with precise pickup and drop-off coordinates and timestamps",
      "Payment methods and complete transaction history",
      "Saved addresses, typically including home and work",
      "Ratings you gave and received",
      "In-app communications with drivers",
      "Device information and app usage",
      "Location data collected while the app is in use, and in background if permitted",
    ],
    surprising: "Seeing your own trip history plotted out. Individually each ride is unremarkable; as a continuous record it is a detailed account of your movements, relationships and routines over years — the kind of picture people assume only a phone carrier holds.",
    downloadSteps: [
      { title: "Open the privacy section", body: "Uber app → Account → Privacy → Privacy Center, or riders.uber.com on the web." },
      { title: "Choose 'Download your data'", body: "You can request specific categories or everything. Trip data is the substantial part." },
      { title: "Wait for the link", body: "Uber emails a download link, typically within a few days." },
      { title: "Open the trips file", body: "It is a spreadsheet of coordinates and timestamps. Mapping even a month of it is the fastest way to understand what location data actually reveals." },
    ],
    limitSteps: [
      "Set location permission to 'While Using the App' rather than 'Always' at the operating-system level.",
      "Delete saved addresses, especially home and work labels.",
      "Turn off marketing communications and data sharing for advertising in privacy settings.",
      "Review linked accounts and payment methods, removing unused ones.",
    ],
    deleteNote: "Uber supports account deletion through the Privacy Center, with a waiting period before it completes. Trip records associated with drivers and required for regulatory, tax and safety purposes are retained regardless.",
    keepsAnyway: [
      "Trip records retained for regulatory, tax and safety obligations",
      "Data associated with the driver's side of each trip",
      "Records connected to any dispute, incident or investigation",
      "Payment records held by your card issuer, entirely outside Uber",
    ],
    faqs: [
      { question: "How do I download my Uber trip history?", answer: "Uber app → Account → Privacy → Privacy Center → Download your data, or riders.uber.com. Uber emails a link within a few days. The trips file is a spreadsheet of coordinates and timestamps." },
      { question: "Does Uber track me when I'm not using the app?", answer: "It depends on the permission you granted. 'Always' allows background location; 'While Using' restricts it to active use. Change it in your phone's operating system settings rather than in the app, since the OS setting is what actually governs it." },
      { question: "Can I delete my Uber trip history?", answer: "You can request account deletion, but Uber retains trip records needed for regulatory, tax and safety obligations — including records tied to the drivers. Individual trips cannot be selectively erased from those retained records." },
    ],
  },
  {
    slug: "spotify",
    company: "Spotify",
    title: "What Does Spotify Know About Me? Request Your Data",
    description: "Spotify knows what you listen to at 3am and infers mood, routine and life events from it. How to download the extended history.",
    h1: "What does Spotify know about you?",
    intro: "Listening data is more revealing than it sounds. What you play, when you play it and how often you skip builds a picture of your routine, your mood and sometimes your life events — the sudden shift in what someone listens to after a breakup is legible in the data, and Spotify's recommendation systems are built to notice exactly that kind of change.",
    collects: [
      "Complete streaming history, with timestamps down to the play",
      "Skips, repeats and how far into each track you got",
      "Playlists, including private ones and ones you deleted",
      "Search history within the app",
      "Device and location information",
      "Inferred taste profile and audience segments used for advertising",
      "Social connections where you linked Facebook or contacts",
    ],
    surprising: "The extended streaming history, which is a separate request from the standard export and covers your entire account lifetime with per-play timestamps. Most people have never seen a record of their own habits at that resolution — including the 3am listening they had forgotten about.",
    downloadSteps: [
      { title: "Go to privacy settings on the web", body: "spotify.com → Account → Privacy settings. This is not available in the mobile app." },
      { title: "Request account data first", body: "The standard export covers roughly the last year of streaming plus playlists and account details. It arrives within a few days." },
      { title: "Then request extended streaming history separately", body: "This is a distinct checkbox covering your entire listening history, and it takes considerably longer — up to about a month. It is the interesting one." },
      { title: "Open the streaming history file", body: "JSON with per-play timestamps. Even skimming it shows patterns most people do not consciously know about themselves." },
    ],
    limitSteps: [
      "Turn off 'Tailored ads' and review data-sharing settings in privacy settings.",
      "Disconnect Facebook and other linked social accounts.",
      "Turn off 'Listening activity' sharing so followers cannot see what you play in real time.",
      "Use private sessions for listening you would rather not have profiled.",
      "Review third-party apps with Spotify access and revoke unused ones.",
    ],
    deleteNote: "Spotify account deletion is handled through support and has a short recovery window. Deleting takes your playlists with it, including collaborative ones you created — export them first if they matter to you.",
    keepsAnyway: [
      "Payment and subscription records retained for tax and legal reasons",
      "Collaborative playlists others contributed to, in some cases",
      "Aggregated data used for artist analytics and recommendation models",
      "Data already shared with advertising partners",
    ],
    faqs: [
      { question: "How do I get my full Spotify listening history?", answer: "Request 'extended streaming history' specifically at spotify.com → Account → Privacy settings. It is a separate checkbox from the standard data export, covers your whole account lifetime, and can take about a month to arrive. The standard export only covers roughly the last year." },
      { question: "Can Spotify see my private playlists?", answer: "Private means hidden from other users, not from Spotify. Private playlists are in your data export and are part of your account like any other. Private sessions similarly hide activity from followers rather than from Spotify." },
      { question: "Does Spotify sell my listening data?", answer: "Spotify uses listening data for recommendations, advertising targeting on its ad-supported tier, and aggregated artist analytics. Its privacy policy governs sharing with partners — worth reading directly rather than relying on any summary, including this one." },
    ],
    deleteGuideSlug: "spotify",
  },
];

export const getCompanyDataGuide = (slug: string): CompanyDataGuide | undefined =>
  COMPANY_DATA_GUIDES.find((g) => g.slug === slug.toLowerCase());
