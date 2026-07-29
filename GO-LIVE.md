# Go-Live Checklist

The code is production-ready (builds, typechecks, tests pass). What remains is
external configuration that lives in *your* accounts — the app can't run these
for you. Work top-to-bottom; items are ordered by "what breaks without it."

> **Check the live state before working through this by hand:** `npm run readiness`
> probes the running system and reports which of the items below are actually
> configured, rather than reminding you to look. It writes nothing, is safe to
> run against production repeatedly, and exits non-zero on a revenue-blocking
> failure so it can gate a deploy. Items it cannot reach are reported as "not
> checked" rather than failed — run it from a network with access to your
> Supabase project and the public site.

Secrets are set as **Supabase Edge Function secrets** unless noted:
`supabase secrets set NAME=value` (or Dashboard → Project → Edge Functions → Secrets).
**Never commit secret values.** After changing secrets, redeploy the functions.

---

## 1. Stripe — required to collect any money 🔴

Without this, checkout fails silently ("No such price") or subscriptions never record.

- [ ] `STRIPE_SECRET_KEY` = your **live** key (`sk_live_…`, NOT `sk_test_…`). The
      price IDs in `src/config/pricing.ts` are all live-mode, so a test key fails
      every checkout. (The checkout functions now return a clear error if this is
      mismatched.)
- [ ] Confirm all live price IDs exist in the Stripe **live** dashboard (toggle
      Test mode OFF): Pro/Complete monthly+annual, Family, and the parent-scan
      one-time price.
- [ ] `STRIPE_WEBHOOK_SECRET` = the signing secret (`whsec_…`) of the **live**
      webhook endpoint (a test-mode secret makes signature verification fail).
- [ ] Create the live webhook endpoint → your deployed `stripe-webhook` function
      URL, subscribed to: `checkout.session.completed`,
      `customer.subscription.updated`, `customer.subscription.deleted`,
      `invoice.payment_failed`.
- [ ] **Verify:** run one real purchase → confirm a row appears in `subscriptions`
      and a `purchase` row in `analytics_events`.

## 2. Resend — required for any outbound email 🔴

Without a verified domain, deletion requests, alerts, welcome/billing emails all
fail with `RESEND_DOMAIN_NOT_VERIFIED`.

- [ ] `RESEND_API_KEY` = your Resend key.
- [ ] Verify your sending domain at https://resend.com/domains (publish the SPF,
      DKIM, DMARC DNS records). Check status with
      `RESEND_API_KEY=re_xxx bun scripts/check-resend-dns.ts`.
- [ ] `RESEND_FROM_DOMAIN` = your verified domain (default `footprintfinder.co`).
      Optionally `RESEND_FROM="Footprint Finder <noreply@yourdomain>"` to override
      the whole sender.
- [ ] `RESEND_WEBHOOK_SECRET` (if using inbound/delivery webhooks).
- [ ] **Verify:** trigger a deletion request or welcome email → confirm delivery
      to a third-party inbox (not just your own).

## 3. OAuth — required for inbox connect (the core product) 🔴

- [ ] `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET`, with the callback
      URL pointing at the deployed `gmail-oauth-callback` function.
- [ ] `MICROSOFT_OAUTH_CLIENT_ID` / `MICROSOFT_OAUTH_CLIENT_SECRET`, callback →
      `outlook-oauth-callback`.
- [ ] `GMAIL_TOKEN_ENCRYPTION_KEY` — used to encrypt stored OAuth tokens. Set a
      strong random value **before** any user connects (rotating it later
      invalidates stored tokens).
- [ ] Google OAuth consent screen: scope is read-only `gmail.metadata` (chosen to
      avoid the CASA restricted-scope assessment). It is still a **sensitive**
      scope — you must submit the app for **OAuth verification** to serve more
      than 100 users. See 3a below.
- [ ] **Verify:** connect a Gmail and an Outlook account end-to-end; confirm a row
      in `email_connections` keyed to the right user.

### 3a. Google OAuth verification — the demo video 🔴

**Full submission steps live in [`docs/oauth-verification-checklist.md`](docs/oauth-verification-checklist.md)** —
consent screen fields, the verbatim scope justification, the video shot list and
the Microsoft path. Do not duplicate that checklist here; follow it there.

Two things to know before you record:

- Until verification is approved you are hard-capped at **100 users**, and
  everyone who connects sees an "unverified app" interstitial — which reads as a
  security warning on a product whose entire pitch is privacy. This is the
  biggest ceiling on the core product. Adding up to 100 test users in the Cloud
  console lets beta users skip the warning in the meantime.
- The video must show the **OAuth client ID** on screen (leave the address bar
  readable during the consent redirect) and must show the data actually being
  used after consent, not just the consent screen. A video that shows the grant
  but never shows the discovered-accounts list populating is the most common
  reason for a bounce, and a bounce restarts the 2–4 week clock.

⚠️ **Consent-screen name must match the site.** The checklist currently
specifies the app name "Deleteist" while the domain, homepage, privacy policy
and every page of the app say "Footprint Finder". Google checks that consent
screen branding matches the branding on the verified domain, so a mismatch here
is an avoidable rejection. Use **Footprint Finder** unless you are actually
rebranding the site.

## 4. Scan data providers

- [ ] `HIBP_API_KEY` 🔴 — HaveIBeenPwned key; without it the breach check (the
      free-scan hook) returns nothing.
- [ ] `SERP_API_KEY` 🟠 — SerpAPI, powers the live broker check. Without it the
      check now shows an honest "couldn't finish — estimate still stands" state
      (it no longer false-positives "you're clean"), but you get no real listings.
- [ ] `BROWSERLESS_API_KEY` 🟠 — full authenticated broker scan (Complete tier).
- [ ] `OPENAI_API_KEY` 🟠 — AI contact discovery; degrades to regex/heuristics
      without it.

## 5. Database

- [ ] Apply all migrations: `supabase db push` (or `npm run db:push`). This
      creates `analytics_events`, `subscriptions` (with nullable
      `current_period_*`), `oauth_states`, `serp_cache`, `email_connections`, etc.
- [ ] Confirm Row-Level Security is enabled on all tables (it ships in the
      migrations — verify in the dashboard).

## 6. App config / frontend

- [ ] `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (anon), and
      `VITE_SUPABASE_PROJECT_ID` in the frontend build env (`.env`).
- [ ] `APP_BASE_URL` / `SITE_URL` = your production URL (used in emails and OAuth
      redirects).
- [ ] `EMAIL_SECRET` — signs unsubscribe/one-click links.
- [ ] Deploy all edge functions:
      `npm run functions:deploy && npm run functions:deploy:webhooks`.

---

## Smoke test (do all six, in prod)

1. Land on `/` → run the free scan with a real email → see results (no infinite spinner).
2. Run the broker listings check → see named results OR the honest degraded state (never a dead-end).
3. Click Remove My Information → complete a **real** Stripe checkout (try monthly and annual).
4. Land back on `/payment-success` → account provisions and you reach the dashboard.
5. Connect a Gmail inbox → scan finds accounts.
6. Send a deletion request → it actually delivers to a third-party inbox.

Legend: 🔴 app broken without it · 🟠 feature degrades gracefully without it.
