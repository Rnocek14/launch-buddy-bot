# Grow Footprint Finder in stages

## Goal
Prepare the service to grow toward 100,000 paying customers without claiming that capacity before it is tested. Preserve the dashboard structure, current pricing, metadata-only privacy model, and verified-removal rules.

## First implementation: reliable removal delivery
- Check and enforce who may trigger automatic removal runs; keep scheduled work separate from customer actions.
- Replace the all-customers-in-one-run approach with small, resumable batches.
- Prevent overlapping runs from sending duplicate requests. Save each job before sending and use provider-supported idempotency for safe retries.
- Recheck active subscriptions, current authorization, and verified broker contact details before each send.
- Record failures and retry safely with bounded attempts, provider-aware backoff, and the existing sequential request spacing.
- Keep unsupported forms in the manual queue; do not enable unverified automatic submissions.

## Customer outcomes and operating visibility
- Add verified broker-removal counts to the existing monthly report, separately from requests sent and waiting requests.
- Show administrators waiting work, oldest pending requests, failed jobs, and customer-action blockers in the existing removal queue.
- Maintain the rule that a request is not a removal: only a successful later scan can confirm that the listing is no longer found.

## Prove capacity before increasing it
- Test duplicate-run prevention, retries, authorization withdrawal, provider outages, and scan-proof handling without sending real customer requests.
- Start with representative synthetic workloads for 100 and 1,000 customers, measuring completion time, queue age, errors, and provider cost.
- Use the results to set safe throughput and estimate costs before a separate 10,000/100,000-customer capacity exercise. Test data must be isolated from production.
- Track paid conversion, acquisition cost, support time, and renewal results before expanding spending; no acquisition or revenue forecast is guaranteed.

## Technical details
- Use Supabase-backed durable jobs and transactional job claims, with short Edge Function worker runs rather than one unbounded daily loop.
- Apply least-privilege access policies and indexes for due-job lookup, and record this structural decision in AGENTS.md.
- Extend the existing pure removal-policy tests and add focused worker integration tests. Verify deployed scheduling and an authorized end-to-end flow before reporting production readiness.
- Determine provider rate limits and test-environment availability before choosing concurrency or claiming throughput.

## External requirements and boundaries
- The owner must renew the HIBP subscription and securely supply the active key; Gmail verification requires the owner's Google application and recorded consent demonstration.
- Confirm Resend domain readiness before live broker emails. Sending verification requests or load tests against production is not included.
- Authenticated production checks require authorized account access; currently they remain unverified for the externally managed Supabase project.
- No dashboard redesign, price changes, new ad spending, removal partner purchase, or promise of 100,000-customer readiness is included.

## Completion standard
The first milestone is reliable, recoverable removal processing and honest customer reporting, backed by tests and measured capacity—not merely a redesigned site or a projected subscriber count.