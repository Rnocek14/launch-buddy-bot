# Production Launch Checklist

**Version:** 1.0  
**Last Updated:** 2025-11-13  
**Owner:** Engineering / SRE

This checklist ensures Footprint Finder (Deleteist) is production-ready before public launch.

---

## 1. Infrastructure Readiness

### Supabase Configuration
- [ ] All required tables have RLS policies enabled and tested
- [ ] `discovery_quarantine` table has proper indexes (`until_at`, `domain`)
- [ ] `t2_retries` table has unique constraint on `(domain, status)` for active jobs
- [ ] `discovery_metrics` includes all tracking columns (`request_id`, `t2_used`, `t2_success`, etc.)
- [ ] Database functions are `security definer` with `search_path = public`
- [ ] Storage buckets (if any) have appropriate RLS policies
- [ ] Service role key is secured and only used server-side
- [ ] Anon key is safe to expose in client

### Edge Functions
- [ ] All edge functions listed in `supabase/config.toml`
- [ ] `verify_jwt` set correctly for each function (public vs authenticated)
- [ ] CORS headers configured for all functions (`Access-Control-Allow-Origin`, etc.)
- [ ] Functions handle OPTIONS requests properly
- [ ] Error handling includes user-friendly messages (no stack traces in production)
- [ ] Rate limit errors (429) and payment errors (402) are caught and surfaced
- [ ] All functions have adequate logging for debugging
- [ ] Secrets are loaded from Supabase vault, not hardcoded
- [ ] Functions tested with production-like payloads

### Secrets Management
- [ ] `LOVABLE_API_KEY` configured (auto-provisioned)
- [ ] `OPENAI_API_KEY` configured and tested
- [ ] `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` configured
- [ ] `GMAIL_TOKEN_ENCRYPTION_KEY` configured
- [ ] `BROWSERLESS_API_KEY` configured (for T2)
- [ ] `RESEND_API_KEY` configured
- [ ] `SUPABASE_DB_URL` available for advanced queries
- [ ] No secrets exposed in client-side code or logs
- [ ] All secrets rotated from dev/staging values

### GitHub Integration
- [ ] Repository connected to GitHub
- [ ] `.github/workflows/` includes all automation (T2 smoke, quarantine cleanup, Golden-25, alerts)
- [ ] GitHub Actions secrets configured (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SLACK_WEBHOOK_URL`)
- [ ] Default branch protection enabled (optional, recommended)
- [ ] CI/CD pipelines tested end-to-end

---

## 2. SRE & Monitoring Readiness

### Metrics Collection
- [ ] `discovery_metrics` table receives data from all discovery paths (T1, T2)
- [ ] Metrics include: `success`, `time_ms`, `error_code`, `method_used`, `t2_used`, `t2_success`, `vendor`, `lang`, `policy_type`, `request_id`, etc.
- [ ] `t2_retries` table tracks queue status (`queued`, `running`, `completed`, `failed`, `exhausted`)
- [ ] `discovery_quarantine` logs domain failures with `reason`, `attempts`, `until_at`, `last_error`
- [ ] `discovery_quarantine_overrides` audits manual interventions

### Dashboards
- [ ] Dashboard queries documented in `README.dashboards.md`
- [ ] Daily health summary query tested (pass rate, p50, p95, precision@5, cache rate)
- [ ] T2 queue backlog query tested (status counts)
- [ ] T2 vs T1 comparison query tested
- [ ] Quarantine health queries tested (active, stale, daily volume, overrides)
- [ ] Error distribution query tested (error codes, affected domains)
- [ ] Slow domain analysis query tested (p95 by domain)
- [ ] Vendor coverage query tested (success rate by vendor)
- [ ] All dashboard queries run against production data without errors

### Alerts (GitHub Actions + Slack)
- [ ] `.github/workflows/alerts-24h.yml` configured to run daily
- [ ] Alert thresholds set:
  - [ ] T2 backlog > 25 (queued & due)
  - [ ] T2 p95 > 15s (24h, n≥20)
  - [ ] T2 pass rate < 70% (24h, n≥20)
  - [ ] Overall pass rate degradation (optional)
- [ ] Slack webhook configured and tested
- [ ] Alerts include links to dashboards and runbook
- [ ] False positive rate acceptable (not spamming Slack)

### Observability
- [ ] Edge function logs accessible via Supabase dashboard
- [ ] T2 worker logs include `request_id` for correlation
- [ ] Console errors surfaced in logs (no silent failures)
- [ ] Request/response payloads logged (sanitized, no PII)
- [ ] Timeout errors logged with context
- [ ] All log levels appropriate (INFO, WARN, ERROR)

---

## 3. Security & Compliance

### Row Level Security (RLS)
- [ ] All tables containing user data have RLS enabled
- [ ] `user_services`, `user_identifiers`, `deletion_requests` policies tested
- [ ] `discovery_quarantine` accessible only to service role
- [ ] `privacy_contacts`, `service_catalog` accessible to admins only
- [ ] Public tables (e.g., `waitlist`, `service_catalog`) have read-only policies for anon users
- [ ] No tables leak data across users (tested with different `auth.uid()` values)

### Authentication & Authorization
- [ ] Supabase Auth enabled and tested (email, Google OAuth)
- [ ] User roles (`admin`, `user`) managed via `user_roles` table
- [ ] `has_role()` function works correctly
- [ ] Admin-only routes protected on client and server
- [ ] JWT verification enabled for authenticated edge functions
- [ ] Session handling tested (login, logout, token refresh)

### Data Privacy
- [ ] No user PII logged to console or metrics (emails, names, addresses)
- [ ] Gmail tokens encrypted using `GMAIL_TOKEN_ENCRYPTION_KEY`
- [ ] Deletion requests include audit trail (`deletion_requests` table)
- [ ] Privacy policy and ToS reviewed (legal compliance)
- [ ] GDPR/CCPA compliance reviewed (if applicable)
- [ ] Data retention policy defined (e.g., quarantine cleanup after 7 days)

### API Security
- [ ] Rate limiting implemented for public endpoints (Supabase, Resend, Lovable AI)
- [ ] Error messages sanitized (no internal details exposed)
- [ ] Input validation on all edge functions (domain, email, text fields)
- [ ] SQL injection prevention (using Supabase client methods, not raw SQL)
- [ ] CORS configured to allow only trusted origins (or `*` if intentionally public)

---

## 4. Performance & Reliability

### Golden-25 & Golden-10 Baselines
- [ ] Golden-25 domains tested and pass rate ≥ 92% (current baseline)
- [ ] Golden-10 domains tested and pass rate ≥ 90%
- [ ] CI/CD includes Golden-25/10 regression tests (`.github/workflows/golden25.yml`, `golden10.yml`)
- [ ] Failures trigger alerts and block deployments (if configured)

### Tail Latency Gates
- [ ] T1 p95 < 3s (measured via `discovery_metrics`)
- [ ] T2 p95 < 15s (measured via `discovery_metrics.t2_time_ms`)
- [ ] Slow domains quarantined automatically (bot protection, timeouts)
- [ ] Cache hit rate > 40% (sitemap/security.txt probes)
- [ ] Attempt timeouts logged and minimized

### Error Budgets
- [ ] Overall pass rate target: ≥ 85% (adjustable)
- [ ] T2 pass rate target: ≥ 70% (adjustable)
- [ ] Error budget consumption tracked weekly
- [ ] Alerts trigger when budget exhausted

### Load Testing
- [ ] T1 tested with 100+ concurrent requests (optional)
- [ ] T2 worker tested with queue backlog > 50 jobs
- [ ] Database handles expected read/write load
- [ ] Edge functions scale without throttling
- [ ] No memory leaks or resource exhaustion

---

## 5. Rollback & Kill Switches

### Emergency Controls
- [ ] `ENABLE_T2=false` env var tested (disables T2 enqueuing)
- [ ] T2 worker can be paused by stopping GitHub Action or setting flag
- [ ] Quarantine cleanup can be run manually (`tools/quarantine-cleanup.ts`)
- [ ] Quarantine override tested (`tools/quarantine-override.ts`)
- [ ] Database migrations reversible (or documented as non-reversible)

### Runbook
- [ ] `ops/runbook.md` includes:
  - [ ] How to disable T2
  - [ ] How to clear quarantine
  - [ ] How to investigate slow domains
  - [ ] How to handle rate limits (Browserless, Lovable AI, Resend)
  - [ ] How to rotate secrets
  - [ ] How to roll back a bad deployment
- [ ] Runbook tested by non-author (knowledge transfer)

### Rollback Plan
- [ ] Frontend changes rollback: revert commit, redeploy via Lovable
- [ ] Backend changes rollback: revert migration, run new migration (if safe)
- [ ] Edge functions rollback: redeploy previous version via Lovable or GitHub
- [ ] Database rollback: restore from Supabase backup (tested)

---

## 6. Testing & Quality Assurance

### Smoke Tests
- [ ] `tools/t2-smoke.ts` tested locally and in CI
- [ ] Smoke test covers: queue seeding, worker run, metrics write
- [ ] Smoke test includes assertions (at least one job progressed)
- [ ] Smoke test runs on-demand via GitHub Actions (`.github/workflows/t2-smoke.yml`)

### Unit Tests
- [ ] `supabase/functions/_shared/t2-filter.test.ts` passes (href filter, backoff logic)
- [ ] `supabase/functions/_shared/probes.test.ts` passes (sitemap, security.txt parsing)
- [ ] `supabase/functions/_shared/vendor_hints.test.ts` passes (vendor detection)
- [ ] `supabase/functions/_shared/quarantine.test.ts` passes (quarantine logic)

### Integration Tests
- [ ] T1 → T2 flow tested end-to-end (manual or automated)
- [ ] Gmail OAuth flow tested (connect, scan, disconnect)
- [ ] Deletion request flow tested (create, send, track)
- [ ] Contact discovery flow tested (T1 success, T1 failure → T2 retry)
- [ ] Quarantine flow tested (add, check, remove, cleanup)

### Edge Cases
- [ ] Domains with bot protection handled (CloudFlare, Akamai, Imperva)
- [ ] Domains with slow load times (> 10s) handled
- [ ] Domains with redirects (3xx) handled
- [ ] Domains with invalid SSL certs handled
- [ ] Domains with `data:` or `javascript:` URLs filtered
- [ ] Domains already in quarantine skipped (no duplicate enqueue)

---

## 7. User-Facing Readiness

### Rate Limits & Quotas
- [ ] Lovable AI rate limits documented (429 errors caught, toast shown)
- [ ] Lovable AI payment errors documented (402 errors caught, toast shown)
- [ ] Browserless rate limits documented (quota monitoring in place)
- [ ] Resend rate limits documented (email sending throttled if needed)
- [ ] Users informed of rate limits in UI (toasts, error messages)

### Error Handling (UX)
- [ ] Discovery failures show friendly messages ("We couldn't find a privacy contact for this service. Try again later.")
- [ ] Network errors show retry prompts
- [ ] Form validation errors clear and actionable
- [ ] Loading states prevent double-clicks
- [ ] Toasts dismiss automatically or manually

### Documentation
- [ ] README.md updated with project overview
- [ ] README.dashboards.md includes all dashboard queries
- [ ] README.metrics.md includes metrics schema and usage
- [ ] README.golden10.md / README.golden25.md include baseline domains
- [ ] `ops/runbook.md` includes all operational procedures
- [ ] `tools/README.t2-worker.md` includes T2 worker setup and usage

### Legal & Compliance
- [ ] Privacy policy published and linked in footer
- [ ] Terms of Service published and linked in footer
- [ ] Cookie consent banner (if applicable)
- [ ] Data deletion requests handled (via `deletion_requests` table)
- [ ] User data export available (via Supabase dashboard or API)

---

## 8. Deployment & Release

### Pre-Launch
- [ ] All checklist items above completed
- [ ] Staging environment tested (if applicable)
- [ ] Production environment provisioned (Lovable publish + custom domain)
- [ ] DNS records configured for custom domain
- [ ] SSL certificate active (auto-provisioned by Lovable)
- [ ] Final code review completed (GitHub PR or manual review)

### Launch
- [ ] Frontend deployed via Lovable (click "Update" in publish dialog)
- [ ] Backend changes already live (edge functions, migrations auto-deployed)
- [ ] GitHub Actions running (T2 worker, quarantine cleanup, alerts)
- [ ] Smoke tests passing in production
- [ ] Alerts wired to Slack (test with manual alert trigger)
- [ ] Status page live (if built)

### Post-Launch Monitoring (First 48 Hours)
- [ ] Watch `discovery_metrics` for anomalies (pass rate drop, p95 spike)
- [ ] Watch `t2_retries` queue backlog (should stay < 25)
- [ ] Watch `discovery_quarantine` for new domains (investigate repeated failures)
- [ ] Watch Slack alerts for threshold violations
- [ ] Watch edge function logs for errors
- [ ] Watch Supabase dashboard for database performance issues
- [ ] User feedback collected (support tickets, Discord, email)

### Week 1 Review
- [ ] Metrics reviewed: overall pass rate, T1/T2 split, p95, precision@5
- [ ] Top error codes analyzed (`error_code` distribution)
- [ ] Top slow domains analyzed (p95 by domain)
- [ ] Quarantine volume acceptable (not overwhelming)
- [ ] No security incidents or data leaks
- [ ] User feedback positive or manageable
- [ ] Performance meets SLOs (p95 < 3s for T1, < 15s for T2)

---

## 9. Phase 2 Planning (Post-Launch)

### Metrics-Driven Decision Points
- [ ] Collect 2-4 weeks of production data
- [ ] Analyze tail failure reasons (PDF extraction, bot protection, weird vendors)
- [ ] Determine if Vision OCR is worth the investment (uplift > 5% for meaningful traffic)
- [ ] Determine if browser extension is requested by users
- [ ] Determine if form autofill is requested by users
- [ ] Prioritize Phase 2 features based on ROI and user demand

### Phase 2 Roadmap (Tentative)
- [ ] **1.5:** OCR/Vision tier (optional, for scanned PDFs and canvas content)
- [ ] **2.0:** Form autofill (prefill vendor deletion forms with user data)
- [ ] **2.1:** Domain knowledge caching (historical success paths per domain)
- [ ] **2.2:** Browser extension (in-page helpers, screenshot portal detection)
- [ ] **2.3:** Structured privacy portal integrations (OneTrust, TrustArc, etc.)
- [ ] **2.4:** Adaptive budgets (dynamic p95 thresholds based on domain history)
- [ ] **2.5:** Enterprise mode (bulk deletion, batch processing, API access)

---

## Summary

**This checklist is complete when all items are checked.** If any item is blocked, document the blocker and mitigation plan in `ops/runbook.md`.

**Launch Approval:** Engineering Lead, SRE Lead, Legal (if applicable)

**Launch Date:** TBD

**Post-Launch Owner:** Engineering / SRE

---

**Good luck with the launch! 🚀**
