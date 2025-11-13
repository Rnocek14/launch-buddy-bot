# Discovery Metrics Dashboards

SQL queries for monitoring privacy contact discovery performance.

## Tail Latency & Cache Effectiveness

Monitor p95 latency, pass rate, cache hit rate, and attempt timeouts:

```sql
-- Tail latency vs cache hit (hourly, last 48 hours)
select
  date_trunc('hour', created_at) as hour,
  round(avg((success)::int)::numeric, 3) as pass_rate,
  percentile_cont(0.95) within group (order by time_ms) as p95_ms,
  round(avg((cache_hit)::int)::numeric, 3) as cache_rate,
  sum(coalesce(attempt_timeouts,0)) as attempt_timeouts
from discovery_metrics
where created_at >= now() - interval '48 hours'
group by 1
order by 1 desc;
```

## Locale Benefit Analysis

Measure precision@5 lift when language detection is enabled:

```sql
-- Precision@5 by detected language (14-day rolling)
select
  coalesce(nullif(lang,''),'unknown') as lang,
  round(avg((hit_in_top5)::int)::numeric, 3) as precision_at_5,
  count(*) as n
from discovery_metrics
where created_at >= now() - interval '14 days'
group by 1
order by n desc;
```

## Vendor Coverage

Track success rates and performance by detected vendor:

```sql
-- Success rate and p95 by vendor (14-day rolling)
select 
  coalesce(vendor, 'unknown') as vendor,
  count(*) as requests,
  round(avg((success)::int)::numeric, 3) as pass_rate,
  percentile_cont(0.95) within group (order by time_ms) as p95_ms,
  round(avg((prefill_supported)::int)::numeric, 3) as prefill_rate
from discovery_metrics
where created_at >= now() - interval '14 days'
group by vendor
order by requests desc;
```

## Daily Health Summary

Overall service health across key metrics:

```sql
-- Daily rollup: pass rate, p50, p95, precision@5, cache hit
select 
  date(created_at) as day,
  count(*) as total_requests,
  round(avg((success)::int)::numeric, 3) as pass_rate,
  round(avg((hit_in_top5)::int)::numeric, 3) as precision_at_5,
  round(avg((cache_hit)::int)::numeric, 3) as cache_rate,
  percentile_cont(0.50) within group (order by time_ms)::int as p50_ms,
  percentile_cont(0.95) within group (order by time_ms)::int as p95_ms,
  sum(coalesce(attempt_timeouts, 0)) as total_attempt_timeouts
from discovery_metrics
where created_at >= now() - interval '14 days'
group by day
order by day desc;
```

## Error Distribution

Track error patterns and affected domains:

```sql
-- Error frequency by type (7-day rolling)
select 
  error_code, 
  count(*) as occurrences,
  array_agg(distinct domain) as affected_domains
from discovery_metrics
where created_at >= now() - interval '7 days'
  and error_code is not null
group by error_code
order by occurrences desc;
```

## Slow Domain Analysis

Identify domains with consistently high latency:

```sql
-- Slowest domains by p95 (24-hour window, min 5 requests)
select 
  domain, 
  percentile_cont(0.95) within group (order by time_ms)::int as p95_ms,
  count(*) as requests,
  round(avg((success)::int)::numeric, 3) as pass_rate
from discovery_metrics
where created_at >= now() - interval '24 hours'
group by domain
having count(*) >= 5
order by p95_ms desc
limit 10;
```

## Build Regression Detection

Compare metrics across recent builds:

```sql
-- Performance by build (last 10 builds)
select 
  build_sha,
  count(*) as requests,
  round(avg((success)::int)::numeric, 3) as pass_rate,
  percentile_cont(0.95) within group (order by time_ms)::int as p95_ms,
  round(avg((hit_in_top5)::int)::numeric, 3) as precision_at_5
from discovery_metrics
where created_at >= now() - interval '7 days'
  and build_sha is not null
group by build_sha
order by max(created_at) desc
limit 10;
```

## Probe Effectiveness

Evaluate impact of sitemap and security.txt probes:

```sql
-- Success rate with/without sitemap cache
select 
  case when cache_hit then 'cached' else 'uncached' end as cache_status,
  count(*) as requests,
  round(avg((success)::int)::numeric, 3) as pass_rate,
  percentile_cont(0.95) within group (order by time_ms)::int as p95_ms
from discovery_metrics
where created_at >= now() - interval '14 days'
  and cache_hit is not null
group by cache_status;
```

## T2 Tier-2 Queue & Performance

Monitor T2 headless retry queue and effectiveness:

```sql
-- T2 backlog by status
select status, count(*) as n
from t2_retries
group by status
order by n desc;

-- T2 success rate & p95 (24h)
select
  round(avg((t2_success)::int)::numeric,3) as t2_pass_rate,
  percentile_cont(0.95) within group(order by t2_time_ms) as t2_p95_ms,
  count(*) as n
from discovery_metrics
where created_at >= now() - interval '24 hours'
  and t2_used is true;

-- T2 retry reasons (7-day)
select reason, count(*) as n
from t2_retries
where created_at >= now() - interval '7 days'
group by reason
order by n desc;

-- T2 vs T1 pass rate comparison
select
  method_used,
  round(avg((success)::int)::numeric,3) as pass_rate,
  percentile_cont(0.95) within group(order by time_ms) as p95_ms,
  count(*) as n
from discovery_metrics
where created_at >= now() - interval '24 hours'
group by method_used
order by method_used;
```

## Quarantine Health

Monitor domains in quarantine and cleanup effectiveness:

```sql
-- Active quarantines (currently blocked)
select
  domain,
  reason,
  attempts,
  until_at,
  last_error
from discovery_quarantine
where until_at >= now()
order by until_at desc;

-- Stale quarantines (should be cleaned by function)
select
  domain,
  reason,
  attempts,
  until_at,
  now() - until_at as age
from discovery_quarantine
where until_at < now()
order by until_at asc
limit 50;

-- Daily quarantine volume
select
  date(updated_at) as day,
  count(*) filter (where until_at >= now()) as active_now,
  count(*) as total_rows
from discovery_quarantine
group by day
order by day desc
limit 14;
```
