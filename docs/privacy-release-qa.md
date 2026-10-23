# Privacy release QA — acceptance checklist

Scope: security changes and the calmer consumer landing page in branch `fix/privacy-launch-foundation-2026-10`.

## Critical security
- [ ] Set GMAIL_TOKEN_ENCRYPTION_KEY in staging and production; never commit it.
- [ ] Gmail callback with a missing/invalid encryption key must redirect with an error and create **no** email connection.
- [ ] Outlook callback with a missing/invalid encryption key must reject the OAuth connection and create **no** plaintext token row.
- [ ] On expired Gmail and Outlook sessions: scan-email, scan-all-emails, and scheduled-rescan must refresh and save encrypted access/refresh tokens; old bytea token columns should be cleared if switching to encrypted text format.
- [ ] On database update failure: scan must report an error, not imply token persistence succeeded.
- [ ] Inspect all existing `email_connections` rows for `tokens_encrypted = false`; securely migrate or revoke/reconnect before public launch.
- [ ] Confirm no OAuth tokens, ID documents, or message bodies appear in logs or analytics.
- [ ] Investigate remaining encryption fallback/repair code paths that may reintroduce plaintext.

## Entitlements and providers
- [ ] Free: 1 inbox connection and three request actions per month, where configured.
- [ ] Pro: three inbox connections, no broker scan, monthly inbox rescan.
- [ ] Complete: five inbox connections, broker scanning, monthly inbox rescan.
- [ ] Family: billing owner + additional member profile permissions verified end-to-end; broker scans available to entitled member profiles, not just family purchaser.
- [ ] Expired/failed subscription: no protected broker scan access.
- [ ] Broker API: Browserless deployment endpoint is valid for configured account/region; fallback to SERP/direct produces evidence status, never fabricated 'clean'.
- [ ] A genuinely unscannable broker is labeled 'unknown/blocked' rather than 'not_found'.
- [ ] Test a broker where a name collision produces 'possible match' and show a manual verification path.
- [ ] Verify scheduled function has an actual deployed Cron job; function source alone is not proof of scheduled operation.

## Deletion and data rights
- [ ] Without authorized-agent consent, deletion endpoint rejects sending.
- [ ] Without verified privacy contact, manual form state is shown; do not call this automated removal.
- [ ] Resend sending identity/domain is verified and reaches a real third-party test inbox.
- [ ] Request state stays 'sent' until subsequent evidence justifies 'acknowledged' or 'verified removed'.
- [ ] Test jurisdiction-specific templates with a qualified legal reviewer before claims of legal compliance.
- [ ] Account closure always asks the user for confirmation and does not store account passwords.

## Website and growth
- [ ] Run npm ci, npm run typecheck, npm run build and npm run seo:audit on a clean checkout; confirm 25+ broker guide links still render when providers are healthy.
- [ ] Check homepage at 375px / 768px / 1440px; no horizontal overflow, truncated CTAs or color-contrast failures.
- [ ] Keyboard-only flow: form, nav, pricing, FAQs; visible focus and screen-reader labels.
- [ ] Free CTA leads to breach check without pretending inbox access; dashboard CTA leads to authentication.
- [ ] Make sure no fabricated customer counts, testimonials, 'best seller' badges, or guarantees remain in the conversion funnel.
- [ ] Check /privacy, /terms, refund terms, paid feature descriptions, and pricing against the product in production.
- [ ] Track 10 opted-in beta sessions and verify that users understand what was found, what was requested, and what was actually removed.

## Deployment discipline
- [ ] Do not merge/deploy automatically until GitHub CI is green and the manual test matrix is completed.
- [ ] Keep a rollback commit and deploy log; monitor error rates and billing after release.
- [ ] Security-affecting findings should have separate follow-up issues and independent code review.
