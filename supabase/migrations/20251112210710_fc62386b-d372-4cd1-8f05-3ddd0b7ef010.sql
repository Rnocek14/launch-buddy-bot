-- Phase 1.4: Tier-2 Headless Retry Queue

-- 1) Enum for retry reasons
do $$ begin
  create type retry_reason as enum ('bot_protection', 'no_policy_found', 'pdf_only', 'captcha', 'other');
exception when duplicate_object then null; end $$;

-- 2) Tier-2 queue
create table if not exists public.t2_retries (
  id            bigserial primary key,
  domain        text not null,
  seed_url      text,
  reason        retry_reason not null,
  status        text not null default 'queued', -- queued | running | done | failed
  attempts      int not null default 0,
  next_run_at   timestamptz not null default now(),
  last_error    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  result_url    text,
  policy_type   text,        -- 'html'|'pdf'
  vendor        text,        -- detected vendor if any
  t2_time_ms    int
);

create index if not exists idx_t2_retries_status_next
  on public.t2_retries (status, next_run_at asc);

create index if not exists idx_t2_retries_domain on public.t2_retries (domain);

-- Dedupe: only one queued/running per domain
create unique index if not exists uniq_t2_domain_recent
  on public.t2_retries (domain)
  where status in ('queued','running');

-- 3) Simple RLS (read for auth/anon, write for service role only)
alter table public.t2_retries enable row level security;

do $$ begin
  create policy t2_read on public.t2_retries
    for select using (true);
exception when duplicate_object then null; end $$;

-- Writes from edge functions (service key)
do $$ begin
  create policy t2_write on public.t2_retries
    for all to service_role using (true) with check (true);
exception when duplicate_object then null; end $$;

-- 4) Add T2 columns to discovery_metrics if not present
alter table public.discovery_metrics
  add column if not exists t2_used boolean,
  add column if not exists t2_success boolean,
  add column if not exists t2_time_ms int;