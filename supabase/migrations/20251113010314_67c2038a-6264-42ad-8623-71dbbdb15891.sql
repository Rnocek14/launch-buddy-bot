-- Quarantine override system with audit trail

create table if not exists discovery_quarantine_overrides (
  id          uuid primary key default gen_random_uuid(),
  domain      text not null,
  reason      text not null,
  actor       text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_discovery_quarantine_overrides_domain
  on discovery_quarantine_overrides (domain);

create or replace function discovery_quarantine_override(
  p_domain text,
  p_reason text,
  p_actor  text
)
returns table (
  domain text,
  removed boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Normalize
  p_domain := lower(trim(p_domain));

  -- Log override
  insert into discovery_quarantine_overrides (domain, reason, actor)
  values (p_domain, p_reason, p_actor);

  -- Remove from quarantine (if present)
  delete from discovery_quarantine
  where discovery_quarantine.domain = p_domain;

  return query
  select p_domain::text as domain,
         (select not exists(
            select 1 from discovery_quarantine where discovery_quarantine.domain = p_domain
          )) as removed;
end;
$$;

revoke all on function discovery_quarantine_override(text,text,text) from public;
grant execute on function discovery_quarantine_override(text,text,text) to service_role;