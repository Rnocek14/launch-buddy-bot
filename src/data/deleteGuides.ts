// Service-specific deletion guides. Each entry powers /delete/:slug
// Keep instructions accurate and link to the official deletion page.

export type DeleteGuide = {
  slug: string;
  service: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  timeEstimate: string;
  officialUrl: string;
  intro: string;
  whatTheyKeep: string[];
  steps: { title: string; body: string }[];
  gotchas: string[];
};

export const DELETE_GUIDES: DeleteGuide[] = [
  {
    slug: "facebook",
    service: "Facebook",
    category: "Social",
    difficulty: "Medium",
    timeEstimate: "5 min + 30-day wait",
    officialUrl: "https://www.facebook.com/help/delete_account",
    intro:
      "Facebook permanently deletes your account 30 days after you submit the request. Logging in during that window cancels the deletion.",
    whatTheyKeep: [
      "Messages you sent to friends (stored in their inboxes)",
      "Log data, retained for legal/security purposes",
      "Backups for up to 90 days after deletion completes",
    ],
    steps: [
      { title: "Download your data first", body: "Settings → Your Facebook information → Download your information. Pick the date range and format." },
      { title: "Open the deletion page", body: "Go to Settings → Accounts Center → Personal details → Account ownership and control → Deactivation or deletion." },
      { title: "Choose Delete account", body: "Select 'Delete account', enter your password, and confirm." },
      { title: "Do not log in for 30 days", body: "Any login (including via a third-party app that uses Facebook) cancels the deletion." },
    ],
    gotchas: [
      "Apps you logged into 'with Facebook' will break — switch them to email login first.",
      "Pages where you are the only admin are also deleted.",
    ],
  },
  {
    slug: "instagram",
    service: "Instagram",
    category: "Social",
    difficulty: "Easy",
    timeEstimate: "3 min + 30-day wait",
    officialUrl: "https://www.instagram.com/accounts/remove/request/permanent/",
    intro:
      "Instagram deletes your account 30 days after the request. Photos, comments and likes are removed and cannot be restored.",
    whatTheyKeep: [
      "Copies of content in Meta backup systems for up to 90 days",
      "Messages you sent are visible in other users' inboxes",
    ],
    steps: [
      { title: "Request your data", body: "Settings → Accounts Center → Your information and permissions → Download your information." },
      { title: "Open the delete page", body: "Visit instagram.com/accounts/remove/request/permanent/ while logged in." },
      { title: "Pick a reason and confirm", body: "Enter your password and tap Delete." },
    ],
    gotchas: ["You cannot sign up again with the same username afterward."],
  },
  {
    slug: "amazon",
    service: "Amazon",
    category: "Shopping",
    difficulty: "Medium",
    timeEstimate: "10 min + 5-15 day wait",
    officialUrl: "https://www.amazon.com/gp/help/customer/contact-us",
    intro:
      "Amazon closes accounts only after a customer service request. You lose order history, Kindle library, Prime, AWS, and digital purchases.",
    whatTheyKeep: [
      "Order records required for tax/legal reasons",
      "Reviews you wrote (may be anonymized but not deleted)",
    ],
    steps: [
      { title: "Cancel Prime and subscriptions", body: "Stop Prime, Audible, Kindle Unlimited, and any Subscribe & Save items first." },
      { title: "Use up gift card balance", body: "Closing the account forfeits any remaining balance." },
      { title: "Open Help → Contact Us", body: "Choose 'Prime or something else' → 'Login and security' → 'Close my account'." },
      { title: "Confirm the email Amazon sends", body: "They send a confirmation link — clicking it starts the closure." },
    ],
    gotchas: [
      "AWS accounts must be closed separately via the AWS console.",
      "Kindle books and Audible audiobooks become permanently inaccessible.",
    ],
  },
  {
    slug: "linkedin",
    service: "LinkedIn",
    category: "Professional",
    difficulty: "Easy",
    timeEstimate: "5 min",
    officialUrl: "https://www.linkedin.com/help/linkedin/answer/63",
    intro: "LinkedIn closes your account immediately, but search engines may cache your profile for weeks.",
    whatTheyKeep: ["Recommendations you gave others remain on their profiles unless removed first.", "InMails you sent stay in recipients' inboxes."],
    steps: [
      { title: "Export your data", body: "Settings & Privacy → Data privacy → Get a copy of your data." },
      { title: "Open Close account", body: "Settings & Privacy → Account preferences → Account management → Close account." },
      { title: "Confirm the reason and password", body: "Pick a reason, enter your password, and submit." },
    ],
    gotchas: [
      "Premium subscriptions must be cancelled first or you keep getting billed.",
      "Before closing, turn off data sharing: Settings & Privacy → Data privacy → How LinkedIn uses your data → 'Manage your data and activity' and disable third-party data sharing and advertising data — closing the account alone does not retroactively pull data already shared with partners.",
    ],
  },
  {
    slug: "spotify",
    service: "Spotify",
    category: "Entertainment",
    difficulty: "Easy",
    timeEstimate: "5 min",
    officialUrl: "https://support.spotify.com/us/article/close-account/",
    intro: "Spotify lets you close your account from a dedicated web page. You can recover it within 7 days.",
    whatTheyKeep: ["Playlists you made public remain visible to followers until full deletion.", "Payment records for accounting purposes."],
    steps: [
      { title: "Cancel Premium first", body: "Otherwise you keep getting billed even after closure." },
      { title: "Visit the close-account page", body: "Go to support.spotify.com/article/close-account and follow the wizard." },
      { title: "Confirm via email", body: "Spotify sends a confirmation link — click within 24 hours." },
    ],
    gotchas: ["Closing your account does not delete data Spotify shares with partner labels for royalty reporting."],
  },
  {
    slug: "twitter",
    service: "X (Twitter)",
    category: "Social",
    difficulty: "Easy",
    timeEstimate: "3 min + 30-day wait",
    officialUrl: "https://help.x.com/en/managing-your-account/how-to-deactivate-x-account",
    intro: "X 'deactivates' your account immediately and permanently deletes it after 30 days of no logins.",
    whatTheyKeep: ["Tweets indexed by search engines and third parties.", "Direct messages remain in recipients' inboxes."],
    steps: [
      { title: "Download your archive", body: "Settings → Your account → Download an archive of your data." },
      { title: "Open Deactivate your account", body: "Settings → Your account → Deactivate your account." },
      { title: "Confirm with password", body: "Enter your password. Do not log in for 30 days." },
    ],
    gotchas: ["X Premium must be cancelled separately."],
  },
  {
    slug: "tiktok",
    service: "TikTok",
    category: "Social",
    difficulty: "Easy",
    timeEstimate: "3 min + 30-day wait",
    officialUrl: "https://support.tiktok.com/en/log-in-troubleshoot/log-in/deleting-an-account",
    intro: "TikTok deactivates immediately and deletes after 30 days. Logging back in cancels deletion.",
    whatTheyKeep: ["Videos downloaded or reshared by other users.", "Analytics data in aggregate form."],
    steps: [
      { title: "Open Settings and privacy", body: "Profile → Menu → Settings and privacy → Account." },
      { title: "Pick Deactivate or delete account", body: "Follow the prompts and choose a reason." },
      { title: "Confirm via SMS or email", body: "TikTok verifies it is you before scheduling the deletion." },
    ],
    gotchas: ["Creator Fund balances are forfeited if not withdrawn first."],
  },
  {
    slug: "snapchat",
    service: "Snapchat",
    category: "Social",
    difficulty: "Easy",
    timeEstimate: "3 min + 30-day wait",
    officialUrl: "https://accounts.snapchat.com/accounts/delete_account",
    intro: "Snapchat deactivates for 30 days, then permanently deletes. You can reactivate by logging in during the wait period.",
    whatTheyKeep: ["Snaps already saved by recipients.", "Chat logs reported for safety review."],
    steps: [
      { title: "Visit the delete-account page", body: "accounts.snapchat.com/accounts/delete_account." },
      { title: "Enter username and password", body: "Confirm to start the 30-day countdown." },
    ],
    gotchas: ["Snapchat+ subscriptions need a separate cancel via the App Store / Play Store."],
  },
  {
    slug: "reddit",
    service: "Reddit",
    category: "Social",
    difficulty: "Medium",
    timeEstimate: "10 min",
    officialUrl: "https://www.reddit.com/settings/account",
    intro: "Reddit deletes the account but keeps your comments and posts under '[deleted]' unless you remove each one manually.",
    whatTheyKeep: ["All your posts and comments remain visible, attributed to '[deleted]'.", "Archived copies on third-party sites like Reveddit."],
    steps: [
      { title: "Edit or delete posts you care about", body: "Use a tool like Power Delete Suite (or do it manually) before closing the account — otherwise content stays public forever." },
      { title: "Open account settings", body: "reddit.com/settings/account." },
      { title: "Click Delete account", body: "Confirm with your password." },
    ],
    gotchas: ["Reddit will not retroactively scrub your content. Edit first, then delete."],
  },
  {
    slug: "pinterest",
    service: "Pinterest",
    category: "Social",
    difficulty: "Easy",
    timeEstimate: "5 min + 14-day wait",
    officialUrl: "https://help.pinterest.com/en/article/deactivate-or-close-your-account",
    intro: "Pinterest deactivates instantly and fully deletes after 14 days.",
    whatTheyKeep: ["Pins that other users have re-pinned remain on their boards."],
    steps: [
      { title: "Open settings", body: "Account management → Close account." },
      { title: "Pick a reason and confirm by email", body: "Pinterest sends a confirmation link." },
    ],
    gotchas: ["Business accounts need to disconnect ad billing first."],
  },
  {
    slug: "gmail",
    service: "Gmail",
    category: "Email",
    difficulty: "Medium",
    timeEstimate: "15 min",
    officialUrl: "https://myaccount.google.com/deleteservices",
    intro:
      "You can delete a single Gmail address without nuking your whole Google account — useful for an old or secondary inbox. Removing just Gmail keeps your Google account (Drive, Photos, YouTube) alive under a different login email.",
    whatTheyKeep: [
      "Emails you sent remain in recipients' inboxes.",
      "Data in other Google services (Drive, Photos, YouTube) stays unless you delete the whole account.",
      "Backups retained for a short period after deletion completes.",
    ],
    steps: [
      { title: "Export your mail first", body: "Use Google Takeout (takeout.google.com) to download your Gmail before you delete anything — this is irreversible." },
      { title: "Open Delete a Google service", body: "Go to myaccount.google.com → Data & privacy → 'Delete a Google service' (or visit myaccount.google.com/deleteservices)." },
      { title: "Delete just Gmail", body: "Find Gmail in the list and click the trash icon. You'll be asked to provide a different email address to sign in with going forward." },
      { title: "Confirm via the verification link", body: "Google emails the new address — click the link to finish removing the Gmail service." },
    ],
    gotchas: [
      "To delete the entire Google account instead, use myaccount.google.com/deleteaccount.",
      "If the address is used for sign-in elsewhere, switch those logins to another email first or you'll be locked out.",
    ],
  },
  {
    slug: "ticketmaster",
    service: "Ticketmaster",
    category: "Shopping",
    difficulty: "Medium",
    timeEstimate: "10 min + support wait",
    officialUrl: "https://help.ticketmaster.com/hc/en-us/articles/9305522921745",
    intro:
      "Ticketmaster has no instant self-serve delete button — you submit a privacy/closure request and they process it, which can take a few days. Closing also affects your linked Live Nation account.",
    whatTheyKeep: [
      "Order and payment history retained for legal and tax purposes.",
      "Transferred or resold tickets remain associated with the recipient.",
    ],
    steps: [
      { title: "Sign in and download your data", body: "Submit a data access/export request from the Privacy area first if you want a copy of your order history." },
      { title: "Open the account-closure request", body: "Go to the Ticketmaster Help Center and use the 'Close my account' / privacy request form (help.ticketmaster.com)." },
      { title: "Verify your identity", body: "Confirm via the email on file so they can match the request to your account." },
      { title: "Wait for confirmation", body: "Closure is handled by support — you'll get an email when it's done." },
    ],
    gotchas: [
      "Pending orders or upcoming events can block closure until they pass.",
      "Your Live Nation login is linked — closing one may affect the other.",
    ],
  },
  {
    slug: "myfitnesspal",
    service: "MyFitnessPal",
    category: "Health",
    difficulty: "Easy",
    timeEstimate: "5 min",
    officialUrl: "https://support.myfitnesspal.com/hc/en-us/articles/360032625292",
    intro:
      "MyFitnessPal holds sensitive health, weight, and diet data, so deleting an unused account is worth it. Deletion must be done from the website, not the app, and is permanent.",
    whatTheyKeep: [
      "Aggregated, de-identified data may be retained for analytics.",
      "Forum posts you made may remain unless removed first.",
    ],
    steps: [
      { title: "Export your data", body: "Settings → Export Data to download your food and exercise history (web only)." },
      { title: "Cancel Premium first", body: "If you pay for Premium, cancel via the App Store/Play Store or web billing so you're not charged after deletion." },
      { title: "Open the delete page", body: "Log in at myfitnesspal.com → Settings → scroll to 'Delete Account'." },
      { title: "Confirm permanently", body: "Enter your password and confirm — this cannot be undone." },
    ],
    gotchas: [
      "The mobile app only lets you 'log out' — full deletion requires the website.",
      "MyFitnessPal had a major 2018 breach; if you reused that password anywhere, change it too.",
    ],
  },
  {
    slug: "temu",
    service: "Temu",
    category: "Shopping",
    difficulty: "Easy",
    timeEstimate: "5 min",
    officialUrl: "https://www.temu.com/bgt_static_pages/account-deletion.html",
    intro:
      "Temu collects a lot of behavioral and device data. You can request permanent deletion in-app; there's typically a short grace window before it finalizes.",
    whatTheyKeep: [
      "Order and transaction records kept for legal, tax, and fraud purposes.",
      "Some data retained until open orders, refunds, or disputes are resolved.",
    ],
    steps: [
      { title: "Resolve open orders", body: "Make sure no orders, returns, or refunds are in progress — these block deletion." },
      { title: "Open account settings", body: "In the Temu app: You → Settings → Account → 'Delete account' (or via temu.com on the web)." },
      { title: "Pick a reason and confirm", body: "Follow the prompts and confirm the permanent deletion request." },
      { title: "Don't log back in during the grace period", body: "Logging in can cancel the pending deletion, similar to social apps." },
    ],
    gotchas: [
      "Uninstalling the app does NOT delete your account or data — you must submit the request.",
      "Unused credits or coupons are forfeited on deletion.",
    ],
  },
  {
    slug: "shein",
    service: "SHEIN",
    category: "Shopping",
    difficulty: "Easy",
    timeEstimate: "5 min + 14-day wait",
    officialUrl: "https://www.shein.com/",
    intro:
      "SHEIN lets you request account deletion from the app or site; it usually completes after a short verification/grace period. Like Temu, uninstalling alone does nothing.",
    whatTheyKeep: [
      "Purchase history retained for legal and accounting requirements.",
      "Reviews and photos you posted may stay until removed.",
    ],
    steps: [
      { title: "Clear pending orders and points", body: "Resolve open orders/returns and spend or write off any points first." },
      { title: "Open account security settings", body: "Me → Settings → Account Security / Account Management → 'Request Account Deletion'." },
      { title: "Verify your identity", body: "Confirm via the code sent to your email or phone." },
      { title: "Wait out the grace period", body: "Deletion finalizes after the stated waiting period if you don't log back in." },
    ],
    gotchas: [
      "Wallet balances, points, and coupons are lost permanently.",
      "Deleting the app does not remove your data — submit the in-account request.",
    ],
  },
  {
    slug: "tinder",
    service: "Tinder",
    category: "Dating",
    difficulty: "Easy",
    timeEstimate: "5 min",
    officialUrl: "https://www.help.tinder.com/hc/en-us/articles/115003356046",
    intro:
      "Old dating profiles are some of the most sensitive data to leave online. Deleting Tinder in-app fully removes your profile — note that 'unmatching' or just deleting the app does not delete your account.",
    whatTheyKeep: [
      "Messages you sent remain visible to matches you spoke with.",
      "Some data retained for safety, fraud, and legal compliance.",
    ],
    steps: [
      { title: "Cancel any subscription first", body: "Cancel Tinder Plus/Gold/Platinum via the App Store/Play Store — deleting the profile does not stop billing." },
      { title: "Open Settings", body: "Profile → Settings and scroll to the bottom." },
      { title: "Tap Delete Account", body: "Choose 'Delete Account' (not just 'Pause'), pick a reason, and confirm." },
      { title: "Confirm permanently", body: "Tinder removes your profile and matches — this is irreversible." },
    ],
    gotchas: [
      "'Pause my account' hides you but keeps your data — choose Delete for full removal.",
      "Deleting the app from your phone does NOT delete your account.",
      "Tinder, Hinge, OkCupid and Match share a parent company (Match Group); each app must be deleted separately.",
    ],
  },
];

export function getDeleteGuide(slug: string) {
  return DELETE_GUIDES.find((g) => g.slug === slug.toLowerCase());
}
