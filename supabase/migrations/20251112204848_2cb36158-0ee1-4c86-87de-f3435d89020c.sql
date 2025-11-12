-- 24h auto-mute for domains with repeated bot_protection
create table if not exists public.discovery_quarantine (
  domain text primary key,
  reason text not null,
  until_at timestamptz not null,
  attempts int not null default 1,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_discovery_quarantine_until_at on public.discovery_quarantine (until_at);

-- RLS: service role only (internal ops)
alter table public.discovery_quarantine enable row level security;

create policy "quarantine_service_role_only" on public.discovery_quarantine
for all using (auth.role() = 'service_role');

-- Auto-cleanup trigger for expired quarantines
create or replace function public.cleanup_expired_quarantines()
returns trigger as $$
begin
  delete from public.discovery_quarantine where until_at < now();
  return null;
end;
$$ language plpgsql security definer set search_path = public;

create trigger cleanup_expired_quarantines_trigger
  after insert or update on public.discovery_quarantine
  execute function public.cleanup_expired_quarantines();