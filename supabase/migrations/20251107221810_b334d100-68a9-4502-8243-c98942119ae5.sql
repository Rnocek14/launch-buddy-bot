-- Add indexes for discovery_metrics table for dashboard performance
create index if not exists idx_discovery_metrics_created_at on discovery_metrics (created_at desc);
create index if not exists idx_discovery_metrics_domain on discovery_metrics (domain);
create index if not exists idx_discovery_metrics_success on discovery_metrics (success);