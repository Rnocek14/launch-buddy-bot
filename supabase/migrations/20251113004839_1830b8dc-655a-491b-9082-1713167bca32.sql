-- Fix security definer search path for t2_queue_summary
create or replace function t2_queue_summary()
returns table(status text, n bigint)
language sql 
security definer
set search_path = public
as $$
  select status, count(*)::bigint as n
  from t2_retries
  group by status
  order by n desc;
$$;