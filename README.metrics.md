# Discovery Metrics & Monitoring

## Overview

The `discovery_metrics` table tracks performance and accuracy of privacy contact discovery across all domains. This enables data-driven improvements and regression detection.

## Metrics Table Schema

```sql
discovery_metrics (
  id uuid,
  domain text,                    -- Service domain (e.g., "grubhub.com")
  success boolean,                -- Did we find contacts?
  method_used text,               -- Discovery method: 't1' (Tier 1)
  time_ms integer,                -- Latency in milliseconds
  urls_considered integer,        -- How many URLs we tried
  status_map jsonb,               -- HTTP status codes encountered
  policy_type text,               -- 'html' | 'pdf'
  score numeric,                  -- Final score of winning URL
  confidence text,                -- 'high' | 'medium' | 'low'
  lang text,                      -- Detected language (e.g., 'en')
  error_code text,                -- Error code if failed
  created_at timestamptz
)
```

## Key Queries

### 7-Day Performance Summary

```sql
select * from discovery_metrics_summary;
```

Returns:
- `day`: Date bucket
- `total_requests`: Total discovery attempts
- `avg_ms`, `p50_ms`, `p95_ms`: Latency percentiles
- `pass_rate`: Success percentage
- `unique_domains`: Distinct domains attempted
- `pdf_count`, `html_count`: Policy type breakdown

### Domain-Specific History

```sql
select
  created_at,
  success,
  time_ms,
  policy_type,
  confidence,
  error_code
from discovery_metrics
where domain = 'grubhub.com'
order by created_at desc
limit 10;
```

### Failure Analysis

```sql
select
  error_code,
  count(*) as occurrences,
  avg(time_ms)::integer as avg_time,
  array_agg(distinct domain) as affected_domains
from discovery_metrics
where success = false
  and created_at > now() - interval '24 hours'
group by error_code
order by occurrences desc;
```

## Error Codes & Actions

The edge function emits standardized error codes mapped to user-actionable hints:

| Error Code | User Message | Hint | Retryable |
|------------|--------------|------|-----------|
| `no_policy_found` | Could not locate privacy policy | Try Phase 1.2 probes or manual entry | No |
| `fetch_failed` | Failed to fetch page | Retry with exponential backoff | Yes |
| `timeout` | Request timed out | Retry with backoff | Yes |
| `bot_protection` | Bot protection detected | Escalate to Tier 2 (browserless) | No |
| `invalid_content` | Content could not be parsed | Manual verification needed | No |
| `dns_error` | Domain name resolution failed | Check domain validity | Yes |
| `ssl_error` | SSL/TLS certificate error | Certificate issue | No |
| `redirect_loop` | Too many redirects | Configuration issue | No |

See `supabase/functions/_shared/error-codes.ts` for implementation.

## CI Integration

### GitHub Actions Golden-10 Test

Located at `.github/workflows/golden10.yml`, this workflow:

1. **Triggers on:**
   - PRs touching `discover-privacy-contacts/`
   - Pushes to `main`
   - Daily cron at 2 AM UTC
   - Manual workflow dispatch

2. **Runs:**
   - `node golden10.ts` against 10 major domains
   - Validates acceptance gates:
     - ≥8/10 pass rate
     - Median time ≤2.5s

3. **Outputs:**
   - Console table with ✅/❌ per domain
   - `golden10.summary.json` artifact (30-day retention)
   - PR comment with results

### Running Locally

```bash
# With Node.js 18+
node golden10.ts

# Output
GOLDEN-10 REPORT
================
✅ grubhub.com      1234 ms  https://grubhub.com/privacy-policy
✅ united.com       1567 ms  https://united.com/privacy-central
...
----------------
Pass: 9/10
Median time: 1456 ms

Saved: golden10.summary.json
```

## Monitoring Recommendations

1. **Daily Dashboard**: Query `discovery_metrics_summary` for pass rate and latency trends
2. **Alerting**: Set up notifications if:
   - Pass rate drops below 80% for 24h
   - P95 latency exceeds 5s
   - New error codes appear at high volume
3. **Weekly Review**: Analyze top failing domains and error codes
4. **Regression Detection**: Compare golden-10 results across commits

## Next Steps (Phase 1.2)

- [ ] Add `platform_detected` field (OneTrust, Securiti, TrustArc)
- [ ] Track `pre_fill_supported` boolean
- [ ] Expand to Golden-25 test suite
- [ ] Create Supabase dashboard view for metrics
- [ ] Add Slack/Discord notifications for CI failures
