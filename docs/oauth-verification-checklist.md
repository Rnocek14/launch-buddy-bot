# Google + Microsoft OAuth Verification Checklist

This is the exact submission path for Deleteist (footprintfinder.co) to clear the "unverified app" warning on Gmail and Outlook consent screens. Until this is done, real users see Google's red "this app isn't verified" screen, which kills conversion on the Deep Scan flow.

**Realistic timeline:** 4–8 weeks end to end. Start now, in parallel with everything else.

---

## Part 1 — Google OAuth verification (Gmail)

### Why this matters
We request `https://www.googleapis.com/auth/gmail.readonly`, which Google classifies as a **restricted scope**. That requires:
1. OAuth consent screen verification, **and**
2. A **CASA Tier 2** security assessment from a Google-approved third-party lab.

Without it: users see "Google hasn't verified this app", click-through rate craters, and you're capped at 100 users.

### Step 1 — Google Cloud Console prep

In https://console.cloud.google.com → APIs & Services → OAuth consent screen:

- [ ] **User type**: External, Production
- [ ] **App name**: Deleteist
- [ ] **User support email**: support@footprintfinder.co (must be deliverable)
- [ ] **App logo**: upload `src/assets/footprint-finder-icon.png` (120×120 PNG, transparent or solid bg, ≤1MB)
- [ ] **App domain**: footprintfinder.co (must be verified in Search Console under same Google account)
- [ ] **Authorized domains**: `footprintfinder.co`
- [ ] **Application home page**: https://footprintfinder.co
- [ ] **Application privacy policy**: https://footprintfinder.co/privacy
- [ ] **Application terms of service**: https://footprintfinder.co/terms
- [ ] **Developer contact**: your real email (Google emails you with review feedback here)

### Step 2 — Scopes

Add **only** these scopes (less = faster review):
- `openid`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/gmail.readonly` ← restricted

### Step 3 — Scope justification (paste this verbatim)

For `gmail.readonly`:

> Deleteist helps users discover, audit, and request deletion of online accounts tied to their email address. We use `gmail.readonly` strictly to read **message metadata** (sender domain, sender display name, `List-Unsubscribe` headers, message date). We do **not** read, store, or transmit email body content, attachments, or subject lines beyond what is needed to detect transactional account-creation patterns (e.g. "Welcome to X", "Verify your X account"). Extracted metadata is hashed and stored server-side only as a list of services the user has accounts with, which the user can view, manage, and request deletion for from their dashboard. We never send email on the user's behalf, never modify or delete messages, and never share data with third parties. Users can disconnect at any time, which immediately deletes all stored metadata.

This language matches our actual implementation in `supabase/functions/scan-email/` and `scan-all-emails/`.

### Step 4 — Demo video (required for restricted scopes)

Record a 2–4 minute unlisted YouTube video showing **in this order**:

1. Land on https://footprintfinder.co → click "Connect Gmail" (or whatever the deep-scan entry CTA is).
2. Google OAuth consent screen — read each scope on camera, explain why.
3. Granted → scan runs → results page shows discovered services.
4. Show a service card → click "Delete account".
5. Show Settings → "Disconnect Gmail" → confirm data is deleted from dashboard.
6. Voiceover (or screen text) explicitly stating: "We never read message bodies, attachments, or send mail. Only sender metadata is processed, and users can disconnect at any time."

Upload as **unlisted** to YouTube, paste link into the OAuth verification form.

### Step 5 — CASA Tier 2 assessment

For restricted Gmail scopes, Google requires a passing CASA Tier 2 report from one of:
- **Leviathan Security** — https://www.leviathansecurity.com/casa
- **Bishop Fox** — https://bishopfox.com
- **NCC Group** — https://www.nccgroup.com
- **ISE** — https://www.ise.io
- See full list: https://appdefensealliance.dev/casa/tier-2

Typical cost: **$1,500 – $5,000**. Typical turnaround: **3–6 weeks**.

What they will ask for:
- [ ] SAST scan results (we can run `npm audit` + push code to e.g. Snyk before submission)
- [ ] DAST scan results (they usually run this themselves against a staging URL)
- [ ] Secure SDLC evidence (code review process, secret management, dependency scanning)
- [ ] Data flow diagram showing what data goes where (we have this implicitly — write it up: User → Supabase Edge Function → Gmail API → metadata extracted → Supabase Postgres with RLS)
- [ ] Incident response policy (one-pager is fine)
- [ ] Encryption-at-rest + in-transit proof (Supabase docs cover this; AES-256-GCM token encryption we already do)

### Step 6 — Submit

Google Cloud Console → OAuth consent screen → "Publish App" → "Prepare for verification" → fill the form → upload CASA report when complete.

Expect 2–3 back-and-forth emails over 4–6 weeks. Respond within 48h or they close the ticket.

### Interim mitigation (do this now, today)

While verification is pending:
- Add a banner to the OAuth error/warning screen explaining "Google's review is in progress — click 'Advanced → Go to Deleteist (unsafe)' to continue. You can also wait until verification completes."
- Keep the test-user list under 100 in the Cloud Console (you can add up to 100 manually-allowed users).

---

## Part 2 — Microsoft (Outlook / Mail.Read)

Microsoft is easier than Google but still required.

### Step 1 — Publisher Verification

In https://entra.microsoft.com → App registrations → your app → Branding & properties:
- [ ] **Publisher domain**: footprintfinder.co (verify via DNS TXT)
- [ ] **Verified publisher**: requires an MPN (Microsoft Partner Network) account — free, takes 1–2 days
  - Apply here: https://partner.microsoft.com/en-us/dashboard/account/v3/enrollment/welcome/azure
- [ ] Link MPN ID to the app registration

### Step 2 — Permissions and consent

- [ ] Scopes requested: `User.Read`, `Mail.Read` (no `Mail.Send`, no `Mail.ReadWrite`)
- [ ] "Admin consent required" should be **No** for Mail.Read (user can self-grant)
- [ ] Publisher domain verified → consent screen shows "Verified by [Publisher]" instead of warning

### Step 3 — Logo + privacy

In Branding & properties:
- [ ] Logo (240×240 PNG)
- [ ] Terms of service URL
- [ ] Privacy statement URL

Once publisher is verified + logo + URLs are set, the consent screen looks clean. No separate "submission" needed for Mail.Read at this scope level.

---

## Part 3 — Tracking + dashboard

Add a small admin row to track verification status:

| Item | Status | Date |
|---|---|---|
| Domain verified in Google Search Console | ☐ | |
| Consent screen branded (logo, URLs) | ☐ | |
| Scopes locked to gmail.readonly | ☐ | |
| Demo video recorded + uploaded | ☐ | |
| CASA lab engaged | ☐ | |
| CASA assessment passed | ☐ | |
| Google review submitted | ☐ | |
| Google verification approved | ☐ | |
| Microsoft MPN enrolled | ☐ | |
| Microsoft publisher verified | ☐ | |

---

## Notes / gotchas

- The Google reviewer **will** test your privacy policy URL — make sure it's reachable, mentions Gmail data specifically, and lists how to revoke access.
- The reviewer **will** check that `/privacy` and `/terms` are linked from the OAuth consent screen AND visible inside the app (footer is fine).
- If you change scopes after approval, you trigger a re-review. Lock scopes before submitting.
- Google specifically rejects apps whose privacy policies don't mention "Google user data" by name. Add a paragraph: *"Deleteist accesses Google user data via Gmail API with the `gmail.readonly` scope. We extract sender metadata only. We do not transfer Google user data to third parties except as needed to provide the service."*
