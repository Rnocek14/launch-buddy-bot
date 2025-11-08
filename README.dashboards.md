# Discovery Metrics Dashboards

SQL queries for monitoring privacy contact discovery performance.

## Daily Trend (Pass Rate, P50/P95)

```sql
with d as (
  select
    date_trunc('day', created_at) day,
    success,
    time_ms
  from discovery_metrics
  where created_at >= now() - interval '14 days'
)
select
  day,
  round(avg(case when success then 1 else 0 end)::numeric, 3) as pass_rate,
  percentile_cont(0.5) within group (order by time_ms) as p50_ms,
  percentile_cont(0.95) within group (order by time_ms) as p95_ms,
  count(*) as n
from d
group by 1
order by 1;
```

## Hot Failures (Last 24h)

```sql
select 
  error_code, 
  count(*) as occurrences
from discovery_metrics
where created_at >= now() - interval '24 hours'
  and success = false
group by error_code
order by occurrences desc;
```

## Regression by Commit

Track performance changes across deployments:

```sql
select 
  build_sha, 
  build_ver,
  count(*) n,
  round(avg(case when success then 1 else 0 end)::numeric,3) pass_rate,
  percentile_cont(0.95) within group (order by time_ms) p95_ms
from discovery_metrics
where created_at >= now() - interval '7 days'
  and build_sha is not null
group by 1, 2
order by max(created_at) desc
limit 10;
```

## Vendor Coverage

Analyze success rates by platform vendor:

```sql
select 
  coalesce(vendor, 'unknown') vendor, 
  count(*) n,
  round(avg(case when success then 1 else 0 end)::numeric,3) pass_rate,
  percentile_cont(0.5) within group (order by time_ms) p50_ms
from discovery_metrics
where created_at >= now() - interval '14 days'
group by 1
order by n desc;
```

## Top 3 Slowest Domains (Last 7d)

```sql
select
  domain,
  percentile_cont(0.95) within group (order by time_ms) as p95_ms,
  avg(time_ms) as avg_ms,
  count(*) as attempts
from discovery_metrics
where created_at >= now() - interval '7 days'
group by domain
order by p95_ms desc
limit 3;
```

## Success Rate by Domain (Last 30d)

```sql
select
  domain,
  count(*) as total_attempts,
  sum(case when success then 1 else 0 end) as successes,
  round(avg(case when success then 1 else 0 end)::numeric, 3) as success_rate,
  round(avg(time_ms)::numeric, 0) as avg_ms
from discovery_metrics
where created_at >= now() - interval '30 days'
group by domain
order by total_attempts desc;
```

## Alerting Rules

Set up alerts for:

- **Pass rate < 80% (24h)** → Slack/email alert
- **P95 > 5s (24h)** → Performance degradation alert
- **New error_code spikes** → Investigation needed

Example alert query (pass rate):

```sql
select 
  avg(case when success then 1 else 0 end) as pass_rate_24h
from discovery_metrics
where created_at >= now() - interval '24 hours'
having avg(case when success then 1 else 0 end) < 0.80;
```
