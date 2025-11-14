# Monitoring & Alerting Setup

This document outlines the monitoring infrastructure for Footprint Finder's privacy contact discovery service.

## Overview

The application uses a multi-layered monitoring approach:
- **Automated testing** via GitHub Actions (Golden-10 and Golden-25 test suites)
- **Slack webhooks** for real-time alerts
- **Database metrics** for performance tracking
- **24-hour sustained alert monitoring**

## Slack Integration

### Setup

1. **Create Slack Incoming Webhook**
   - Go to your Slack workspace → Apps → Incoming Webhooks
   - Create a new webhook for your monitoring channel
   - Copy the webhook URL

2. **Configure Repository Secret**
   - Navigate to GitHub repository → Settings → Secrets and variables → Actions
   - Add a new secret named `SLACK_WEBHOOK_URL`
   - Paste your Slack webhook URL as the value

3. **Verify Configuration**
   - The webhook is automatically used by `.github/workflows/alerts-24h.yml`
   - Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` secrets are also configured

### Alert Workflows

#### Golden Test Alerts (Nightly)
- **File**: `.github/workflows/golden10.yml` and `.github/workflows/golden25.yml`
- **Schedule**: Nightly at 2 AM UTC
- **Purpose**: Test core discovery functionality against known domains
- **Alert Conditions**: 
  - Pass rate below threshold (< 85%)
  - P95 latency above threshold (> 3000ms)
  - Individual test failures

#### Sustained Breach Alerts (24h)
- **File**: `.github/workflows/alerts-24h.yml`
- **Schedule**: Hourly at :15 past the hour
- **Purpose**: Detect sustained performance degradation
- **Alert Conditions**:
  - Pass rate below 70% for 24 hours
  - P95 latency above 5000ms for 24 hours
  - Includes top error codes and affected domains

### Alert Message Format

Slack alerts include:
- **Title**: Alert type and severity
- **Metrics**: Pass rate, median/P95 latency
- **Build context**: Git SHA and workflow run link
- **Failures**: Top 5 failed domains with error details
- **Errors**: Most common error codes in the period

### Testing Alerts

```bash
# Manually trigger 24h alert check
curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/alerts-24h.yml/dispatches \
  -d '{"ref":"main"}'
```

## Metrics Dashboard

### Database Views

The application provides several pre-built views for monitoring:

#### `discovery_alerts_24h`
```sql
SELECT * FROM discovery_alerts_24h;
```
Returns:
- `pass_rate_24h`: Success rate over last 24 hours
- `p95_ms_24h`: 95th percentile latency
- `top_errors_24h`: JSON array of most common errors

#### `probe_metrics_dashboard`
```sql
SELECT * FROM probe_metrics_dashboard 
WHERE day >= NOW() - INTERVAL '7 days'
ORDER BY day DESC;
```
Returns daily aggregates:
- Request counts
- Pass rates
- Latency percentiles (P50, P95)
- Vendor distribution
- Precision metrics

### Key Metrics to Monitor

1. **Pass Rate** (Target: > 85%)
   - Percentage of successful privacy contact discoveries
   - Drop below 70% triggers critical alert

2. **P95 Latency** (Target: < 3000ms)
   - 95th percentile response time
   - Above 5000ms indicates performance issues

3. **Error Codes** (Monitor trends)
   - `bot_protection`: Sites blocking automated access
   - `no_policy_found`: Unable to locate privacy policy
   - `timeout`: Request took too long
   - `pdf_only`: Only PDF privacy policy available

4. **Quarantine Queue**
   - Domains temporarily blocked due to errors
   - Should remain < 50 active entries

5. **T2 Retry Backlog**
   - Tier-2 headless retry queue
   - Queued + Running should be < 100

## Operational Procedures

### Daily Health Check

```sql
-- Quick health snapshot
SELECT 
  COUNT(*) as requests_24h,
  ROUND(AVG(success::int), 3) as pass_rate,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY time_ms) as p95_ms
FROM discovery_metrics
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- Recent failures
SELECT error_code, COUNT(*) as count
FROM discovery_metrics
WHERE created_at >= NOW() - INTERVAL '1 hour'
  AND success = FALSE
GROUP BY error_code
ORDER BY count DESC
LIMIT 10;
```

### Weekly Review

1. Check Golden test results for regressions
2. Review top error domains and investigate patterns
3. Analyze vendor coverage and success rates
4. Review quarantine list for stuck domains
5. Check T2 retry success rate

### Incident Response

When alerts fire:

1. **Check Status Page**
   ```sql
   SELECT public_status_snapshot();
   ```

2. **Identify Scope**
   - Is it affecting all domains or specific vendors?
   - Is it Tier-1 or Tier-2 failures?
   - Check recent deployment changes

3. **Triage Steps**
   - Review `ops/runbook.md` for specific error codes
   - Check edge function logs in Supabase dashboard
   - Verify external dependencies (Browserless, APIs)

4. **Escalation**
   - Page on-call engineer for critical outages
   - Update status page if user-facing
   - Document incident in postmortem template

## Alert Tuning

### Adjusting Thresholds

Edit thresholds in `tools/alerts-24h.js`:

```javascript
// Current thresholds
const PASS_RATE_THRESHOLD = 0.70;    // 70%
const P95_LATENCY_THRESHOLD = 5000;  // 5 seconds

// Adjust based on baseline performance
```

### Silencing Alerts

To temporarily silence alerts during maintenance:

1. Disable workflow in GitHub Actions UI
2. Or set `SLACK_WEBHOOK_URL` secret to empty string
3. Re-enable after maintenance window

### Custom Alerts

Add new alert conditions in `tools/alerts-24h.js`:

```javascript
// Example: Alert on high quarantine count
const { data: quarantine } = await supabase
  .from('discovery_quarantine')
  .select('count(*)');

if (quarantine[0].count > 100) {
  // Send alert
}
```

## Integration with Other Tools

### Supabase Dashboard
- Edge function logs: https://supabase.com/dashboard/project/[PROJECT_ID]/functions
- Database performance: https://supabase.com/dashboard/project/[PROJECT_ID]/database/metrics

### GitHub Actions
- Workflow runs: Repository → Actions tab
- View logs and re-run failed jobs

### Local Testing
```bash
# Run golden tests locally
npm run golden10
npm run golden25

# Check 24h metrics
node tools/alerts-24h.js "Test Alert"
```

## Future Enhancements

Planned monitoring improvements:
- [ ] Integrate with PagerDuty for on-call rotation
- [ ] Add Grafana dashboards for visualization
- [ ] Implement synthetic monitoring for key user flows
- [ ] Add cost tracking for edge function usage
- [ ] Create SLI/SLO tracking for user-facing endpoints

## Support

For monitoring issues:
- **Slack**: #footprint-alerts channel
- **On-call**: Refer to PagerDuty schedule
- **Documentation**: `ops/runbook.md` for detailed troubleshooting
