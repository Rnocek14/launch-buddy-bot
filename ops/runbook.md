# Privacy Contact Discovery Operations Runbook

## Overview

This runbook covers incident response for the privacy contact discovery service, including Golden-10 test failures, performance degradation, and operational troubleshooting.

## Common Symptoms & Triage

### Gate Failures

**Symptoms:**
- Golden-10 CI fails with pass rate < 8/10
- Median response time > 2500ms
- Slack alert: "Golden-10 CI – Gate FAILED"

**Triage Steps:**

1. **Review Slack Summary**
   - Check which domains failed
   - Note the error codes and response times
   - Look for patterns (same vendor, same error type)

2. **Query Recent Metrics (24h hot failures)**
   ```sql
   SELECT domain, error_code, COUNT(*) AS failures
   FROM discovery_metrics
   WHERE created_at >= NOW() - INTERVAL '24 hours'
     AND success = false
   GROUP BY domain, error_code
   ORDER BY failures DESC
   LIMIT 10;
   ```

3. **Identify Top 3 Slowest Domains**
   ```sql
   SELECT domain, time_ms
   FROM discovery_metrics
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   ORDER BY time_ms DESC
   LIMIT 3;
   ```

### Pass Rate Drop

**Symptoms:**
- Sustained pass rate < 80% over 24h
- Multiple domains failing with same error code

**Actions:**

- **If `bot_protection` spike:**
  - Queue affected domains for Tier-2 Playwright retry
  - Consider rotating Browserless instances
  - Check if rate limiting is in effect

- **If `no_policy_found` spike:**
  - Enable Phase 1.2 probes (security.txt, sitemap) in config
  - Re-run Golden-10 locally to verify improvement
  - Consider expanding URL discovery heuristics

- **If `timeout` spike:**
  - Check Browserless API status
  - Verify `DISCOVERY_DOMAIN_BUDGET_MS` setting (default 25000ms)
  - Review network latency to target domains

### P95 Latency Spike

**Symptoms:**
- P95 > 5000ms sustained over 24h
- Slow response times for specific domains

**Actions:**

1. **Identify slow domains:**
   ```sql
   SELECT domain, 
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY time_ms) AS p95_ms,
          COUNT(*) AS requests
   FROM discovery_metrics
   WHERE created_at >= NOW() - INTERVAL '24 hours'
   GROUP BY domain
   HAVING COUNT(*) > 5
   ORDER BY p95_ms DESC
   LIMIT 5;
   ```

2. **Check for:**
   - Heavy JavaScript execution (SPA sites)
   - Large PDF downloads
   - Geographic latency (international domains)
   - Browserless queue backlog

3. **Mitigations:**
   - Increase `DISCOVERY_DOMAIN_BUDGET_MS` for known slow domains
   - Enable caching for frequently accessed domains
   - Consider regional Browserless deployment

### New Error Code Spike

**Symptoms:**
- New or increased frequency of specific error codes
- Domains that previously succeeded now failing

**Investigation:**

1. **Query error distribution:**
   ```sql
   SELECT error_code, COUNT(*) AS occurrences,
          ARRAY_AGG(DISTINCT domain) AS affected_domains
   FROM discovery_metrics
   WHERE created_at >= NOW() - INTERVAL '7 days'
     AND error_code IS NOT NULL
   GROUP BY error_code
   ORDER BY occurrences DESC;
   ```

2. **Common error codes:**
   - `bot_protection`: Site blocking automated access
   - `no_policy_found`: No privacy policy detected
   - `timeout`: Request exceeded time budget
   - `parse_error`: Failed to extract structured data
   - `network_error`: Connection or DNS issues

## Circuit Breakers & Emergency Controls

### Environment Variables

All toggles can be set in Supabase Edge Functions settings without code changes:

- `DISCOVERY_DISABLE_METRICS` (default: `false`)
  - Set to `true` to stop writing to `discovery_metrics` table
  - Use when: Database under heavy load or schema migration in progress

- `DISCOVERY_DOMAIN_BUDGET_MS` (default: `25000`)
  - Maximum time (ms) to spend discovering contacts per domain
  - Increase for slow domains; decrease to improve throughput

### Rollback Procedure

1. **Immediate disable:**
   - Set `DISCOVERY_DISABLE_METRICS=true` in Supabase Edge Functions settings
   - Redeploy function (automatic on save)

2. **Revert code changes:**
   - Check GitHub Actions history for last known good commit
   - Revert via PR or direct push to main
   - Monitor Golden-10 results after redeployment

3. **Database rollback:**
   - Migrations are timestamped in `supabase/migrations/`
   - Use Supabase dashboard to roll back specific migrations if needed

## Monitoring & Alerting

### Daily Health Check

Run this query to assess overall service health:

```sql
SELECT 
  DATE(created_at) AS day,
  COUNT(*) AS total_requests,
  ROUND(AVG((success)::int)::numeric, 3) AS pass_rate,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY time_ms) AS p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY time_ms) AS p95_ms
FROM discovery_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day DESC;
```

### Vendor Coverage

Track success rates by detected privacy vendor:

```sql
SELECT 
  COALESCE(vendor, 'unknown') AS vendor,
  COUNT(*) AS requests,
  ROUND(AVG((success)::int)::numeric, 3) AS pass_rate,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY time_ms) AS p95_ms
FROM discovery_metrics
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY vendor
ORDER BY requests DESC;
```

### Build Regression Detection

Compare performance across builds:

```sql
SELECT 
  build_sha,
  COUNT(*) AS requests,
  ROUND(AVG((success)::int)::numeric, 3) AS pass_rate,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY time_ms) AS p95_ms
FROM discovery_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND build_sha IS NOT NULL
GROUP BY build_sha
ORDER BY MAX(created_at) DESC
LIMIT 10;
```

## Escalation & Ownership

- **Primary Owner:** Platform On-Call
- **Response SLA:** 2 hours during business hours (9am-5pm PST)
- **Severity Levels:**
  - **P0 (Critical):** Pass rate < 50% sustained > 4 hours
  - **P1 (High):** Gate failures blocking deployments
  - **P2 (Medium):** Individual domain failures or slow performance
  - **P3 (Low):** Metrics anomalies, no user impact

## Useful Links

- [Golden-10 Dashboard](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/golden10.yml)
- [Metrics Table](https://supabase.com/dashboard/project/gqxkeezkajkiyjpnjgkx/editor/28679)
- [Edge Function Logs](https://supabase.com/dashboard/project/gqxkeezkajkiyjpnjgkx/functions/discover-privacy-contacts/logs)
- [Slack Channel: #privacy-discovery](https://YOUR_WORKSPACE.slack.com/archives/CHANNEL_ID)

## Roadmap Items (Phase 1.2+)

1. **Enhanced Probes:**
   - `security.txt` RFC 9116 support
   - `sitemap.xml` (including gzip) parsing
   
2. **Vendor Fingerprinting:**
   - Persist `platform_detected` and `pre_fill_supported`
   - Enable automated form-fill for known vendors

3. **Expanded Test Coverage:**
   - Golden-10 → Golden-25 (PDF-only, locale-forced, SPA)
   
4. **Advanced Alerting:**
   - Deadband alerts (sustained breaches only)
   - Slack threaded updates
   - PagerDuty integration for P0/P1
