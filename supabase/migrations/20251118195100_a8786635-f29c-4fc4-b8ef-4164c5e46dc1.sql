-- Create analytics_events table for tracking user events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Add index for common queries
create index if not exists idx_analytics_events_created_at on public.analytics_events(created_at desc);
create index if not exists idx_analytics_events_event on public.analytics_events(event);
create index if not exists idx_analytics_events_user_id on public.analytics_events(user_id);

-- Enable RLS
alter table public.analytics_events enable row level security;

-- Only admins can view analytics events
create policy "Admins can view all analytics events"
  on public.analytics_events
  for select
  using (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert events (for edge function)
create policy "Service role can insert analytics events"
  on public.analytics_events
  for insert
  with check (true);