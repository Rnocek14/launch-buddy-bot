# Privacy Discovery Metrics & Maintenance

## Overview

This document covers metrics collection, data hygiene, and routine maintenance for the privacy contact discovery system.

## Metrics Collection

All discovery attempts are logged to the `discovery_metrics` table with:
- **Success/failure status** and error codes
- **Performance data** (response time, URLs tried)
- **Build context** (commit SHA, version)
- **Vendor detection** (OneTrust, Securiti, TrustArc)
- **Policy metadata** (type, confidence, score)

### Circuit Breakers

Metrics collection can be disabled via environment variables:

```bash
# Disable metrics writes (emergency use only)
DISCOVERY_DISABLE_METRICS=true

# Adjust per-domain time budget (3-60 seconds, default 25)
DISCOVERY_DOMAIN_BUDGET_MS=15000
```

See [ops/runbook.md](ops/runbook.md) for toggle instructions.

## Data Retention Policy

### Automatic Cleanup (Recommended)

To prevent unbounded growth, add a weekly cleanup job to remove raw metrics older than 90 days while preserving summary views:

```sql
-- Run weekly via cron (e.g., Sundays at 2 AM UTC)
DELETE FROM discovery_metrics
WHERE created_at < NOW() - INTERVAL '90 days';
```

**Note:** The `discovery_metrics_summary` materialized view retains aggregated data indefinitely for long-term trend analysis.

### Setting Up Automated Cleanup

#### Option 1: Supabase pg_cron (Recommended)

```sql
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule weekly cleanup
SELECT cron.schedule(
  'cleanup-old-metrics',           -- Job name
  '0 2 * * 0',                     -- Every Sunday at 2 AM UTC
  $$
  DELETE FROM discovery_metrics
  WHERE created_at < NOW() - INTERVAL '90 days';
  $$
);

-- Verify the job is scheduled
SELECT * FROM cron.job WHERE jobname = 'cleanup-old-metrics';
```

#### Option 2: GitHub Actions (Alternative)

Create `.github/workflows/cleanup-metrics.yml`:

```yaml
name: Cleanup Old Metrics

on:
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM UTC
  workflow_dispatch:      # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup metrics older than 90 days
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          curl -X POST "${SUPABASE_URL}/rest/v1/rpc/cleanup_old_metrics" \
            -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "Content-Type: application/json"
```

Then create the database function:

```sql
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM discovery_metrics
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;
```

### Manual Cleanup

For one-time cleanup:

```sql
-- Check current table size
SELECT 
  pg_size_pretty(pg_total_relation_size('discovery_metrics')) AS total_size,
  COUNT(*) AS total_rows,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '90 days') AS rows_to_delete
FROM discovery_metrics;

-- Delete old metrics
DELETE FROM discovery_metrics
WHERE created_at < NOW() - INTERVAL '90 days';

-- Reclaim disk space (optional, heavy operation)
VACUUM FULL discovery_metrics;
```

## Monitoring Best Practices

### 1. Daily Health Check

```sql
SELECT 
  DATE(created_at) AS day,
  COUNT(*) AS requests,
  ROUND(AVG((success)::int)::numeric, 3) AS pass_rate,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY time_ms) AS p95_ms
FROM discovery_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY day
ORDER BY day DESC;
```

### 2. Regression Detection

```sql
-- Compare performance across builds
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

### 3. Vendor Coverage

```sql
SELECT 
  COALESCE(vendor, 'unknown') AS vendor,
  COUNT(*) AS requests,
  ROUND(AVG((success)::int)::numeric, 3) AS pass_rate
FROM discovery_metrics
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY vendor
ORDER BY requests DESC;
```

## Storage Estimates

Approximate storage usage:

| Timeframe | Requests/Day | Storage/Day | Storage/90 Days |
|-----------|--------------|-------------|-----------------|
| Low       | 100          | ~50 KB      | ~4.5 MB         |
| Medium    | 1,000        | ~500 KB     | ~45 MB          |
| High      | 10,000       | ~5 MB       | ~450 MB         |
| Very High | 100,000      | ~50 MB      | ~4.5 GB         |

**Recommendation:** Enable automatic cleanup when reaching 50 MB total table size or if growth rate exceeds storage budget.

## Troubleshooting

### Metrics Not Being Logged

1. Check if metrics are disabled:
   ```sql
   -- Should return 'false' unless intentionally disabled
   SELECT current_setting('app.settings.discovery_disable_metrics', true);
   ```

2. Verify edge function has database permissions:
   ```sql
   -- Check RLS policies on discovery_metrics table
   SELECT * FROM pg_policies WHERE tablename = 'discovery_metrics';
   ```

3. Review edge function logs for errors:
   - [Edge Function Logs](https://supabase.com/dashboard/project/gqxkeezkajkiyjpnjgkx/functions/discover-privacy-contacts/logs)

### Metrics Table Growing Too Fast

1. Check for unusual request volume:
   ```sql
   SELECT 
     DATE(created_at) AS day,
     COUNT(*) AS requests
   FROM discovery_metrics
   WHERE created_at >= NOW() - INTERVAL '30 days'
   GROUP BY day
   ORDER BY requests DESC
   LIMIT 10;
   ```

2. Identify top domains:
   ```sql
   SELECT 
     domain,
     COUNT(*) AS requests
   FROM discovery_metrics
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY domain
   ORDER BY requests DESC
   LIMIT 20;
   ```

3. Temporarily disable metrics if needed:
   - Set `DISCOVERY_DISABLE_METRICS=true` in Supabase Edge Functions settings
   - Investigate root cause
   - Re-enable after resolving

## Related Documentation

- [Dashboard Queries](README.dashboards.md) - SQL queries for monitoring and analysis
- [Operations Runbook](ops/runbook.md) - Incident response and troubleshooting
- [Golden-10 Tests](README.golden10.md) - Quality gates and regression testing
