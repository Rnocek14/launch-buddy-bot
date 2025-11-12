# Tier-2 Headless Retry Worker

## Overview

The T2 worker handles privacy contact discovery failures that require headless browser execution. It runs automatically via GitHub Actions every 10 minutes to process queued retry jobs.

## Architecture

```
T1 (Simple Fetch) → Fails with bot_protection/captcha
                  ↓
            Enqueue to t2_retries
                  ↓
        T2 Worker (Playwright) → Success
                  ↓
          Update metrics (t2_success=true)
```

## Queue Flow

1. **Enqueue**: Edge function `discover-privacy-contacts` adds failed domains to `t2_retries` table
2. **Lease**: Worker picks up oldest queued jobs (default: 5 per run)
3. **Process**: Playwright navigates domain, detects vendor, finds privacy policy
4. **Complete**: Results stored in `discovery_metrics` with `t2_used=true`
5. **Retry**: Failed jobs rescheduled with exponential backoff (max 3 attempts)

## Configuration

Set via Supabase Edge Functions environment:

```bash
# Enable T2 (default: false)
ENABLE_T2=true

# Which error codes trigger T2 retry
# Currently: bot_protection, captcha
# Add 'no_policy_found' if desired
```

Set via GitHub Actions secrets:

```bash
# Worker settings (in .github/workflows/t2-worker.yml)
T2_BATCH=5              # Jobs per run
T2_MAX_ATTEMPTS=3       # Max retries before marking failed
T2_BACKOFF_MS=15000     # Backoff multiplier
T2_TIMEOUT_MS=60000     # Per-job timeout
```

## Monitoring

### Queue Health

```sql
-- Current backlog
select status, count(*) from t2_retries group by status;

-- Alert if > 25 queued
select count(*) from t2_retries 
where status='queued' and next_run_at <= now();
```

### Performance

```sql
-- T2 pass rate & p95 (24h)
select
  round(avg((t2_success)::int)::numeric,3) as t2_pass_rate,
  percentile_cont(0.95) within group(order by t2_time_ms) as t2_p95_ms,
  count(*) as n
from discovery_metrics
where created_at >= now() - interval '24 hours'
  and t2_used is true;
```

### Retry Reasons

```sql
-- Why are domains being retried?
select reason, count(*) as n
from t2_retries
where created_at >= now() - interval '7 days'
group by reason
order by n desc;
```

## Safety Rails

* **PII-free**: Never send or store PII — only URLs, vendor names, timings
* **Quarantine-aware**: Domains in `discovery_quarantine` are skipped automatically by T1
* **Global cap**: If Golden-25 median > 4s AND T2 backlog > 100, consider auto-disabling `ENABLE_T2`
* **Robots.txt**: Respects rate limits, uses descriptive User-Agent

## Local Testing

```bash
# Install dependencies
npm i playwright
npx playwright install --with-deps chromium

# Set environment
export SUPABASE_URL="https://gqxkeezkajkiyjpnjgkx.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"
export T2_BATCH=2
export T2_MAX_ATTEMPTS=2
export T2_BACKOFF_MS=5000
export T2_TIMEOUT_MS=30000

# Run worker
npx tsx tools/t2-worker.ts
```

## Scheduled Execution

The worker runs automatically via `.github/workflows/t2-worker.yml`:

```yaml
schedule:
  - cron: '*/10 * * * *'  # Every 10 minutes
```

Manually trigger via GitHub Actions UI:
1. Go to Actions → Tier2-Worker
2. Click "Run workflow"

## Troubleshooting

### High Backlog

**Symptom**: `t2_retries` queue growing faster than processing

**Actions**:
1. Check worker logs for errors
2. Increase `T2_BATCH` (with caution — watch p95)
3. Run workflow manually to catch up
4. Consider Browserless API for horizontal scaling

### High p95

**Symptom**: T2 p95 > 15s sustained

**Actions**:
1. Query slowest domains
2. Add to `SLOW_BUDGET_OVERRIDES` if necessary
3. Check for geographic latency issues
4. Consider regional worker deployment

### Low Pass Rate

**Symptom**: T2 pass rate < 70%

**Actions**:
1. Review `last_error` in `t2_retries` (status='failed')
2. Check for vendor portal changes
3. Update vendor hints in `_shared/vendor_hints.ts`
4. Consider manual review of persistent failures

## Vendor Detection

The worker detects vendor platforms by scanning for common scripts and patterns:

- **OneTrust**: `onetrust`, `otprivacy`, `optanon`
- **Securiti**: `securiti.ai`, `privacy-central`
- **TrustArc**: `trustarc`
- **Transcend**: `transcend.`
- **Cookiebot**, **Osano**, etc.

Detected vendors are stored in metrics for analysis and future form autofill.

## Future Enhancements (Phase 1.5+)

* **Browserless Integration**: Replace Playwright with Browserless API for serverless scaling
* **Stealth Mode**: Add stealth plugins to reduce bot detection
* **Vendor Autofill**: Use `vendor_form_hints` to auto-populate forms (client-side only, no PII server-side)
* **Adaptive Budgets**: Auto-adjust per-domain timeouts based on historical p95
* **Priority Queue**: Fast-track high-value domains or user-initiated requests
