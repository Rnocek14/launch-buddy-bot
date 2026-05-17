# Google + Microsoft OAuth Verification Checklist

Submission path for Deleteist (footprintfinder.co) to clear the "unverified app" warning on Gmail and Outlook consent screens.

**Realistic timeline:** 2–4 weeks (Google), ~1 week (Microsoft). **Cost: $0.**

---

## Part 1 — Google OAuth verification (Gmail)

### Why this is cheaper than most guides say

We request **`https://www.googleapis.com/auth/gmail.metadata`** — headers only (From, To, Subject, Date, List-Unsubscribe). This is a **sensitive** scope, NOT restricted.

That means:
- ✅ Standard verification required (consent screen branding + demo video)
- ❌ **No CASA Tier 2 assessment**
- ❌ **No third-party security audit**
- ❌ **No $1,500–$5,000 lab fee**

If we ever switched to `gmail.readonly` (full message bodies), CASA would kick in. As long as we stay on `gmail.metadata`, we don't need it.

Verified in code: `supabase/functions/_shared/email-providers/gmail.ts` line 63 requests `gmail.metadata` only. The Gmail send scope is explicitly disabled (line 183).

### Step 1 — Google Cloud Console prep

Cloud Console → APIs & Services → OAuth consent screen:

- [ ] **User type**: External, Production
- [ ] **App name**: Deleteist
- [ ] **User support email**: support@footprintfinder.co (must be deliverable)
- [ ] **App logo**: upload `src/assets/footprint-finder-icon.png` (120×120 PNG, ≤1MB)
- [ ] **App domain**: footprintfinder.co (must be verified in Search Console under same Google account)
- [ ] **Authorized domains**: `footprintfinder.co`
- [ ] **Application home page**: https://footprintfinder.co
- [ ] **Application privacy policy**: https://footprintfinder.co/privacy
- [ ] **Application terms of service**: https://footprintfinder.co/terms
- [ ] **Developer contact**: your real email

### Step 2 — Scopes (lock to exactly these)

- `openid`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/gmail.metadata` ← sensitive (NOT restricted)

Do NOT add `gmail.readonly`, `gmail.send`, `gmail.modify`, or any other Gmail scope. Adding any of those triggers CASA.

### Step 3 — Scope justification (paste verbatim)

For `gmail.metadata`:

> Deleteist helps users discover, audit, and request deletion of online accounts tied to their email address. We use `gmail.metadata` to read **only message headers** (sender domain, sender display name, subject line, `List-Unsubscribe` header, message date). The Gmail API enforces that this scope **cannot** access message bodies, attachments, or snippets — only headers — which matches our privacy promise to users. Extracted sender domains are stored server-side as a list of services the user has accounts with, which the user can view, manage, and request deletion for from their dashboard. We never send email on the user's behalf, never modify or delete messages, and never share data with third parties. Users can disconnect at any time, which immediately deletes all stored metadata.

### Step 4 — Privacy policy paragraph (required)

Google specifically rejects apps whose privacy policies don't mention "Google user data" by name. Add this to `/privacy`:

> **Google user data.** Deleteist accesses Google user data via the Gmail API using the `gmail.metadata` scope. This scope, enforced by Google, allows us to read only email headers (sender, subject, date, List-Unsubscribe) — never message bodies, attachments, or content snippets. We use this metadata solely to identify services you have accounts with so we can help you manage or delete them. We do not transfer Google user data to third parties except as needed to provide the service, and we never use it for advertising. You can disconnect Google access at any time from Settings, which immediately deletes all stored metadata. Our use of information received from Google APIs adheres to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

### Step 5 — Demo video (2–4 min, unlisted YouTube)

Show in order:
1. Land on https://footprintfinder.co → click "Connect Gmail".
2. Google OAuth consent screen — read each scope on camera.
3. Granted → scan runs → results page shows discovered services.
4. Show a service card → click "Delete account".
5. Show Settings → "Disconnect Gmail" → confirm data is removed.
6. Voiceover (or on-screen text): "We use the `gmail.metadata` scope, which only allows reading email headers — never message bodies. Users can disconnect at any time."

Upload as **unlisted** to YouTube, paste link into the verification form.

### Step 6 — Submit

Cloud Console → OAuth consent screen → "Publish App" → "Prepare for verification" → fill the form.

**Expected turnaround: 2–4 weeks**, usually 1–2 email rounds. Respond within 48h or the ticket closes.

### Interim mitigation (do today)

Add up to 100 test users in Cloud Console → they skip the warning entirely. Good for beta users while verification is pending.

---

## Part 2 — Microsoft (Outlook / Mail.Read)

### Step 1 — Publisher Verification

https://entra.microsoft.com → App registrations → your app → Branding & properties:
- [ ] **Publisher domain**: footprintfinder.co (verify via DNS TXT)
- [ ] **Verified publisher**: requires MPN (Microsoft Partner Network) — **free**, 1–2 days
  - Apply: https://partner.microsoft.com/en-us/dashboard/account/v3/enrollment/welcome/azure
- [ ] Link MPN ID to the app registration

### Step 2 — Permissions

- [ ] Scopes: `User.Read`, `Mail.Read` (no `Mail.Send`, no `Mail.ReadWrite`)
- [ ] "Admin consent required" should be **No** for Mail.Read

### Step 3 — Branding

- [ ] Logo (240×240 PNG)
- [ ] Terms of service URL
- [ ] Privacy statement URL

Once publisher is verified, consent screen shows "Verified by [Publisher]". No separate submission needed for Mail.Read.

---

## Tracking

| Item | Status |
|---|---|
| Domain verified in Google Search Console | ☐ |
| Consent screen branded | ☐ |
| Scopes locked to `gmail.metadata` only | ☐ |
| Privacy policy mentions Google user data + Limited Use | ☐ |
| Demo video uploaded | ☐ |
| Google verification submitted | ☐ |
| Google verification approved | ☐ |
| Microsoft MPN enrolled | ☐ |
| Microsoft publisher verified | ☐ |

---

## Gotchas

- Reviewer **will** test your privacy policy URL. Must be reachable, must mention Gmail/Google by name, must link to revocation instructions.
- Reviewer **will** check that `/privacy` and `/terms` are linked from the OAuth consent screen AND visible inside the app footer.
- Changing scopes after approval triggers re-review. Lock scopes before submitting.
- If you ever need full message bodies in the future, you'll need to upgrade to `gmail.readonly` AND pay for CASA Tier 2. Avoid this — `gmail.metadata` is sufficient for the current product.
