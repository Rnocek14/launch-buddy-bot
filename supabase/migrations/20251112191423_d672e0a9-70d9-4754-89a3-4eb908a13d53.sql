-- Phase 1.3: Sitemap probe cache table and metrics enhancements

-- Create probe_cache_sitemap table for 24h TTL caching
CREATE TABLE IF NOT EXISTS public.probe_cache_sitemap (
  domain text PRIMARY KEY,
  urls jsonb NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_probe_cache_sitemap_fetched_at 
  ON public.probe_cache_sitemap (fetched_at DESC);

-- RLS: allow read for anon/auth, writes only via service role
ALTER TABLE public.probe_cache_sitemap ENABLE ROW LEVEL SECURITY;

CREATE POLICY "probe_cache_read" ON public.probe_cache_sitemap
  FOR SELECT USING (true);

-- Update discovery_metrics columns for Phase 1.3
ALTER TABLE discovery_metrics
  ADD COLUMN IF NOT EXISTS urls_considered_top5 int,
  ADD COLUMN IF NOT EXISTS hit_in_top5 boolean,
  ADD COLUMN IF NOT EXISTS cache_hit boolean;

-- Ensure lang column can store locale codes like 'en-US'
ALTER TABLE discovery_metrics
  ALTER COLUMN lang TYPE text;

-- Add comment for documentation
COMMENT ON TABLE public.probe_cache_sitemap IS 'Phase 1.3: Caches sitemap probe results for 24h TTL to reduce latency';
COMMENT ON COLUMN discovery_metrics.urls_considered_top5 IS 'Phase 1.3: Number of top-5 candidate URLs considered';
COMMENT ON COLUMN discovery_metrics.hit_in_top5 IS 'Phase 1.3: Whether final URL was in top-5 candidates (precision@5)';
COMMENT ON COLUMN discovery_metrics.cache_hit IS 'Phase 1.3: Whether sitemap result came from cache';
