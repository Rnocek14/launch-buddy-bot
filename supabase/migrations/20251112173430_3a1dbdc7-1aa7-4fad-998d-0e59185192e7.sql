-- Phase 1.2 finalization: permissions and index

-- Grant read access to probe metrics dashboard
GRANT SELECT ON public.probe_metrics_dashboard TO anon;
GRANT SELECT ON public.probe_metrics_dashboard TO authenticated;

-- Index for vendor-based queries
CREATE INDEX IF NOT EXISTS idx_discovery_metrics_vendor ON discovery_metrics (vendor);