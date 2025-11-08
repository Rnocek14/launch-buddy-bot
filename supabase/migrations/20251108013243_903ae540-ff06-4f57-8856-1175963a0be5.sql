-- Add build tracking and vendor columns to discovery_metrics
alter table discovery_metrics
  add column if not exists build_sha text,
  add column if not exists build_ver text,
  add column if not exists vendor text;

-- Add index for vendor analysis
create index if not exists idx_discovery_metrics_vendor on discovery_metrics (vendor);