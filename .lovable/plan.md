# Audit + shorten the purchase funnel & ship the OAuth verification checklist

## Where the app actually stands

**Production-ready:** core scan flows (HIBP free, OAuth deep, broker), Stripe live prices wired in `src/config/pricing.ts` (Pro $79/yr, Complete $129/yr, Family $179/yr, Parent Scan $39 one-time), subscriptions + customer portal + webhooks, RLS, cleanup wizard, deletion via Resend, public share pages.

**Real blockers before pushing paid traffic:**
1. **Google OAuth verification** — `gmail.readonly` is a *sensitive* scope. Until verified, Gmail users see the scary "Google hasn't verified this app" screen (huge drop-off).
2. **Microsoft publisher verification** — `Mail.Read` is similar; less scary screen but still capped at ~100 unverified users.
3. **Two competing checkout paths** — guest `instant-checkout` exists but isn't the default. Pricing page funnels everyone through `/subscribe` → auth gate → checkout (6–8 clicks).
4. **Resend domain auth** (SPF/DKIM/DMARC on footprintfinder.co) — confirm so deletion requests don't land in spam.

## Click-count audit (current state)

| Entry point | Current path | Clicks | Optimal? |
|---|---|---|---|
| Hero "Check My Exposure" | Hero → /free-scan → results → IcebergPanel `instant-checkout` → Stripe → pay → magic link | **3 clicks** | ✅ Already optimal |
| Pricing page "Start Monitoring" | /pricing → /subscribe?tier=pro → auth gate → /auth → email confirm → back to /subscribe → Stripe | **6–8 clicks + email roundtrip** | ❌ Too long |
| Navbar "Pricing" → upgrade | Same as above | 6–8 | ❌ |
| Free-scan IcebergPanel CTA | Already uses `instant-checkout` | 2 | ✅ |
| Post-scan dashboard upgrade | /subscribe → auth (if not signed in) → checkout | 4–5 | ⚠️ Auth'd users already short; guests long |

**Industry benchmark:** Stripe Checkout best practice is **3 clicks max** from intent to payment. Path A hits it; Path B doesn't.

## What I'll change

### Part 1 — Unify on guest checkout everywhere (the big win)

Make `instant-checkout` the default for **all cold-traffic CTAs**. Logged-in users skip the email collection and use existing `create-checkout-session`. The "magic" is: pay first, account is created post-payment via magic link (already built in `instant-checkout` + `/payment-success`).

**Files I will touch:**

1. **New helper: `src/lib/checkout.ts`**
   - `startCheckout({ priceId, email?, source })` — single entry point.
   - If user is logged in → call `create-checkout-session` (existing authed flow).
   - If guest → if `email` provided, call `instant-checkout` directly; otherwise open a tiny email-only modal, then `instant-checkout`.
   - Same-tab redirect (`window.location.href = data.url`) to avoid popup blockers.

2. **New tiny modal: `src/components/QuickCheckoutEmailDialog.tsx`**
   - Single email field + "Continue to secure checkout" button.
   - Used ONLY when a guest clicks a paid CTA without having entered an email upstream.

3. **`src/components/Pricing.tsx`**
   - Replace `<Link to="/subscribe?tier=...">` wrapping the Pro/Complete/Family buttons with `onClick={() => startCheckout({...})}`.
   - Guests get the modal → straight to Stripe (3 clicks total: card → modal → pay).
   - Logged-in users go straight to Stripe (2 clicks: card → pay).

4. **`src/pages/Subscribe.tsx`**
   - Keep the page for deep-link compatibility, but auto-trigger `startCheckout` on mount when `?tier=` is present. Drop the auth gate UI for guests; route them through `instant-checkout` instead. Logged-in users keep existing flow.

5. **Hero / post-scan CTAs**
   - Hero already optimal (sends to free-scan).
   - `IcebergPanel` already optimal.
   - Audit `DashboardEmptyState`, `TierUpgradePrompt`, `UpgradeModal`, `PostCheckoutNextSteps`, `ScanResultsBanner`, `Parents` page CTAs to also use `startCheckout`.

6. **Analytics**
   - Add `checkout_initiated` event with `source` on every entry point so we can A/B which surface converts best.

**Expected impact:** every paid CTA drops to 2–3 clicks. Email captured at point of intent (= better leads for recovery emails on abandoned carts).

### Part 2 — Google OAuth verification submission checklist

I'll create `docs/oauth-verification-checklist.md` with the exact submission steps. Google's review typically takes **4–6 weeks** and requires a CASA Tier 2 security assessment for `gmail.readonly` (cost ~$500–$2,500 via a Google-approved lab like Leviathan or Bishop Fox).

The doc will cover:

- **Google Cloud Console prep:** verified domain (footprintfinder.co), branded consent screen, scope justification text (already drafted in your memory `mem://auth/gmail-scope-limitation`), logo upload (use `src/assets/footprint-finder-icon.png`), homepage + privacy policy + ToS URLs.
- **Demo video script** (Google requires a 2–3 min YouTube unlisted video) showing: scope screen → what data is requested → what happens with it → user deleting their data.
- **Scope justification copy** specifically tuned for `gmail.readonly` metadata-only use case (matches your existing privacy stance).
- **CASA Tier 2 path:** lab list, what they need (SAST, DAST, secure SDLC evidence), expected timeline.
- **Microsoft equivalent:** Publisher Verification (MPN account) + app registration metadata for `Mail.Read`.
- **Interim mitigation:** add an explicit "Google's verification is in progress" notice on the consent error screen so users know it's safe to click "Advanced → Go to app".

### Part 3 — Quick wins I'll bundle

- **Persist guest email** in `localStorage` after the hero scan so the QuickCheckoutEmailDialog auto-fills it (one less keystroke).
- **`allow_promotion_codes: true`** is already on `instant-checkout` ✅. Add it to `create-checkout-session` too for parity.
- **Confirm Stripe Link + Apple/Google Pay** are enabled on the live account (one-click for returning buyers).
- **Resend DNS check** — I'll add a small dev script `scripts/check-resend-dns.ts` that pings the Resend API to verify SPF/DKIM/DMARC status on footprintfinder.co.

## Out of scope (intentionally)

- No new pricing tiers, no copy changes to landing page, no design refactor.
- No Stripe webhook changes — existing flow already provisions accounts post-payment.
- I won't *submit* the Google verification for you (you need to do that from your Google Cloud Console with your own org credentials), but everything you need to fill in will be ready.

## Deliverables

- `src/lib/checkout.ts` (new)
- `src/components/QuickCheckoutEmailDialog.tsx` (new)
- Edits to: `Pricing.tsx`, `Subscribe.tsx`, `DashboardEmptyState.tsx`, `TierUpgradePrompt.tsx`, `UpgradeModal.tsx`, `Parents.tsx` (any paid CTAs there)
- `supabase/functions/create-checkout-session/index.ts` — add `allow_promotion_codes: true`
- `docs/oauth-verification-checklist.md` (new)
- `scripts/check-resend-dns.ts` (new)

Approve and I'll ship it.
