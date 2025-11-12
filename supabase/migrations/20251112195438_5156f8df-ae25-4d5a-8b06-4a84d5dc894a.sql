-- Phase 1.3: Indexes for new metrics fields
-- Keeps dashboards snappy as volume grows

create index if not exists idx_discovery_metrics_lang on discovery_metrics (lang);
create index if not exists idx_discovery_metrics_cache_hit on discovery_metrics (cache_hit);
create index if not exists idx_discovery_metrics_prefill on discovery_metrics (prefill_supported);
create index if not exists idx_discovery_metrics_attempt_timeouts on discovery_metrics (attempt_timeouts);