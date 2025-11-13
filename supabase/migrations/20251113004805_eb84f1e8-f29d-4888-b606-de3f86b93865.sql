-- Add request_id columns for T1↔T2 correlation
alter table discovery_metrics add column if not exists request_id uuid;
alter table t2_retries add column if not exists request_id uuid;

create index if not exists idx_discovery_metrics_request_id on discovery_metrics(request_id);
create index if not exists idx_t2_retries_request_id on t2_retries(request_id);

-- Create RPC for queue summary
create or replace function t2_queue_summary()
returns table(status text, n bigint)
language sql security definer
as $$
  select status, count(*)::bigint as n
  from t2_retries
  group by status
  order by n desc;
$$;

grant execute on function t2_queue_summary() to anon, authenticated, service_role;