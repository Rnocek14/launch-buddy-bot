-- Create read-only view for sustained breach alerts
create or replace view public.discovery_alerts_24h as
with w as (
  select
    now() - interval '24 hours' as since
)
, base as (
  select
    success,
    time_ms,
    error_code,
    vendor,
    created_at
  from discovery_metrics, w
  where created_at >= w.since
)
select
  coalesce(round(avg((success)::int)::numeric, 3), 0) as pass_rate_24h,
  coalesce(percentile_cont(0.95) within group (order by time_ms), 0) as p95_ms_24h,
  (select jsonb_agg(ec order by n desc)
     from (select error_code as ec, count(*) n
           from base where not success and error_code is not null
           group by error_code
           order by n desc limit 5) t) as top_errors_24h
from base;

-- Grant read access to authenticated users and anon (read-only view, no sensitive data)
grant select on public.discovery_alerts_24h to anon;
grant select on public.discovery_alerts_24h to authenticated;