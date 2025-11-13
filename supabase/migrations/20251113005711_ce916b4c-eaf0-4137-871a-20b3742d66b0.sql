-- Quarantine cleanup: indexes + cleanup function

-- 1. Ensure helpful indexes
create index if not exists idx_discovery_quarantine_until_at
  on discovery_quarantine (until_at);

create index if not exists idx_discovery_quarantine_domain
  on discovery_quarantine (domain);

-- 2. Cleanup function: delete expired rows with optional grace period
create or replace function discovery_quarantine_cleanup(
  max_age_days integer default 7
)
returns table (
  deleted_count integer,
  remaining_active integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _deleted_count integer;
  _remaining_active integer;
begin
  -- Anything whose quarantine window ended more than `max_age_days` ago
  delete from discovery_quarantine dq
  where dq.until_at < now() - (max_age_days || ' days')::interval;

  get diagnostics _deleted_count = row_count;

  select count(*)::integer into _remaining_active
  from discovery_quarantine
  where until_at >= now();

  deleted_count := _deleted_count;
  remaining_active := _remaining_active;
  return next;
end;
$$;

-- 3. Tighten who can call this: only service roles / internal functions
revoke all on function discovery_quarantine_cleanup(integer) from public;
grant execute on function discovery_quarantine_cleanup(integer) to service_role;