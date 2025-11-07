-- Discovery metrics table for tracking privacy contact discovery performance
create table if not exists public.discovery_metrics (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  success boolean not null,
  method_used text not null default 't1',
  time_ms integer not null,
  urls_considered integer,
  status_map jsonb,
  policy_type text check (policy_type in ('html', 'pdf')),
  score numeric,
  confidence text check (confidence in ('high', 'medium', 'low')),
  lang text,
  error_code text,
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_discovery_metrics_created_at on public.discovery_metrics (created_at desc);
create index if not exists idx_discovery_metrics_domain on public.discovery_metrics (domain);
create index if not exists idx_discovery_metrics_success on public.discovery_metrics (success);

-- Enable RLS
alter table public.discovery_metrics enable row level security;

-- Policy: Public read for authenticated users (metrics are not sensitive)
create policy "Authenticated users can read discovery metrics"
  on public.discovery_metrics
  for select
  using (auth.role() = 'authenticated');

-- Policy: Service role can insert metrics (edge functions)
create policy "Service role can insert discovery metrics"
  on public.discovery_metrics
  for insert
  with check (true);

-- Helpful view: Last 7 days performance
create or replace view public.discovery_metrics_summary as
select
  date_trunc('day', created_at) as day,
  count(*) as total_requests,
  avg(time_ms)::integer as avg_ms,
  percentile_cont(0.5) within group (order by time_ms)::integer as p50_ms,
  percentile_cont(0.95) within group (order by time_ms)::integer as p95_ms,
  (avg(case when success then 1 else 0 end) * 100)::numeric(5,2) as pass_rate,
  count(distinct domain) as unique_domains,
  sum(case when policy_type = 'pdf' then 1 else 0 end) as pdf_count,
  sum(case when policy_type = 'html' then 1 else 0 end) as html_count
from public.discovery_metrics
where created_at > now() - interval '7 days'
group by date_trunc('day', created_at)
order by day desc;
