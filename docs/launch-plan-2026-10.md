# Footprint Finder — launch plan (23 October 2026)

## Positioning and guardrails
**Positioning:** Find evidence of forgotten online accounts, understand your exposure, and take practical steps to reduce it — in one approachable privacy workspace.

**Promise:** A free email breach check, optional read-only Gmail/Outlook discovery, deletion-request tools when verified service contacts exist, guided broker opt-outs, and plan-dependent monthly inbox rescans.

**Never claim:** "we erase everything," "we close accounts automatically," "broker removal completed" based solely on request dispatch, "100% private," a specific conversion/removal rate without verified measurement, or counts of customers/requests not backed by analytics. Keep the free email check distinct from OAuth inbox analysis and authenticated broker scanning.

## Release gate — required before actively driving traffic
- [ ] PR passes CI, build, and mobile/browser visual QA; no build regression.
- [ ] Verify Supabase migrations deployed and row-level security tested with two isolated test accounts.
- [ ] Reconnect Gmail and Outlook end to end; verify failed token encryption refuses connection and logs never contain tokens or email bodies.
- [ ] Confirm Pro, Complete, and Family monthly email rescan limits are applied; confirm Complete/Family broker access.
- [ ] Smoke-test free breach check, broker check provider failures, creation/payment/cancellation of live Stripe plans, authorized-agent consent, Resend delivery and request status.
- [ ] Google OAuth app is appropriately verified before broad public inbox-connect promotion.
- [ ] Ensure pricing, refund commitments, Terms, consent language, cookie/analytics disclosures and cancellation align with operations.
- [ ] Obtain 10 consented beta users and collect real scan outcome metrics; check mismatches before paid distribution.
- [ ] Confirm home CTA does not imply free access to inbox or comprehensive broker scans.
- [ ] Publish only after deliberately reviewing the PR, because this branch changes authentication and payments-adjacent UX.

## 30-day rollout

### Week 1 — reliability & first-run experience
1. Run release gate and fix all P0 findings, with a separate change for any database schema migration.
2. Test the complete guest journey on iPhone Safari, Android Chrome and desktop. Require a useful result or transparent degraded state, never a dead spinner.
3. Instrument acquisition funnel: landing page view → free scan start → valid scan → auth created → provider connected → services found → first requested deletion → request delivered → paid conversion. Distinguish 'delivered' and 'verified removed'.
4. Add a one-question optional post-scan survey: "What were you hoping to remove?" (old accounts, brokers, breach, family protection, not sure).
5. Identify first 10 testers who willingly consent to provide feedback. Do not use their personal exposure results in marketing without explicit additional permission.

### Week 2 — trusted beta & proof
1. Invite 10–20 real users, balanced across Gmail/Outlook and free/paid access. Ask them to explain where the product feels confusing.
2. Collect permissioned testimonials only from completed, actual experiences; do not manufacture counts or quotes.
3. Review weekly metrics: scan success rate, OAuth completion rate, confirmed accounts, real deliverability, customer confusion cases, median time to first useful action.
4. Produce a 60-second walkthrough with a clearly labeled demo/sanitized account: free check → optionally connect inbox → review services → request deletion → track status. Do not show fake success badges.
5. Fix the top three drop-offs before new features.

### Week 3 — organic acquisition
1. Update 10 high-intent SEO pages already present in the repo (/delete, /remove-from, /privacy-rights, /vs) after checking facts and linking to the appropriate free check; avoid duplicate thin programmatic pages.
2. Publish 3 educational videos: finding forgotten accounts, difference between unsubscribing and deletion, and what a data-broker opt-out actually does.
3. Offer a useful free checklist on the homepage and relevant guides without gating basic factual advice behind email collection.
4. Reach out personally to 10 privacy writers, independent security bloggers, and journalists with a genuine educational angle; avoid paying for disguised endorsements.
5. Share the product transparently in relevant community discussions only when asked or allowed by community rules; contribute actionable guidance before links.

### Week 4 — repeat what works
1. Compare first-touch attribution and activation by channel; prioritize users who finish a meaningful cleanup step, not raw traffic.
2. If activation and deliverability are healthy, test a **small** search campaign for queries like "find old accounts linked to email", clearly explaining the free check vs connected inbox features.
3. Test one headline at a time against activation, not just clicks: "Your digital life, back in your hands" vs "Find forgotten accounts. Make privacy cleanup easier."
4. Build a measured report: acquisition, scans, provider connects, requests sent, provider acknowledgments, confirmed removals, refunds, and user-reported confusion.
5. Use feedback to select one next feature: verified removal follow-up, better service discovery, or streamlined guided broker opt-outs. Do not attempt the entire Cloaked suite at once.

## Starter launch assets

### Founder post (LinkedIn / personal social)
I've been building Footprint Finder because most of us have signed up for services we no longer remember — and figuring out how to clean up that history is a chore.

You can start with a free email breach check. If you choose to connect Gmail or Outlook, the app uses read-only email metadata to help surface services you may have signed up for. From there, it organizes privacy-request options and guides you through next steps.

It's an early product, so I'm looking for people willing to test it and tell me what's confusing. Not every record can be found or deleted, and I want the product to be upfront about that.

https://footprintfinder.co

### Short video script (35–45 sec)
"How many websites have you signed up for over the years? Shopping, apps, old newsletters — most of us lose track. I've been building Footprint Finder to help make that easier. Start with a free breach check. If you want, connect your inbox with read-only access so the app can look for sign-up clues in email headers. Then review the services and your privacy-request options. It's not a magic 'erase everything' button, but it's a clearer place to start. You can try it at footprintfinder.co."

### Five educational topics
- "Unsubscribe does not mean delete my data": show the two different actions.
- "The quickest way to find forgotten sign-ups": explain inbox-metadata discovery.
- "Why a data broker may list you again": discuss persistence and rescan limitations.
- "What GDPR/CCPA deletion rights actually cover": distinguish location and exceptions.
- "What I learned building a privacy app": founder behind-the-scenes with real product demos.

## Measurement and criteria
These are **proposed targets**, not historical facts: at least 10 consented beta testers; at least 90% completion on a supported free scan in provider-healthy conditions; 0 unhandled critical errors in the smoke-test flows; 100% requests shown as 'sent' only after provider accepted delivery; clearly tracked opt-out completion verification. Only experiment with paid acquisition after the production smoke tests pass.

## Next release after this branch
Ship automated opt-out submission only for a handful of broker procedures, with user authorization, anti-bot/manual handoff, recorded evidence, and a clear removal verification loop. Test each site repeatedly. Keep the product promise narrow until true completion rates can be demonstrated.
