# Scan reliability repairs

- [x] Repair broker search failures, cache handling, domain matching, and diagnostics.
- [x] Correct unavailable/partial results and retries for individual and parent checks.
- [x] Remove invented exposure counts, promises, and parent-page proof.
- [x] Repair Gmail metadata-only repeat scans and connection wording.
- [x] Validate public scan flows, 35 targeted regression tests, and both Stripe checkouts.
- [ ] Restore HIBP access with an active subscription key (requires owner).
- [ ] Complete Google verification and authenticated Gmail consent/scan/disconnect checks (requires owner/provider access).

Public broker checks now complete all six searches. Authenticated Gmail behavior is covered by mocked provider regression tests, not a live account flow. Two unrelated existing env-parser tests still fail on blank values; not changed in this scan repair.