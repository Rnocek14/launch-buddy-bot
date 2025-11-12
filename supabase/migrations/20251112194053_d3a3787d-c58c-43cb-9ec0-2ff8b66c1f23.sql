-- Phase 1.3: Add columns for vendor hints and tail latency tracking
alter table discovery_metrics
  add column if not exists prefill_supported boolean,
  add column if not exists attempt_timeouts int default 0;