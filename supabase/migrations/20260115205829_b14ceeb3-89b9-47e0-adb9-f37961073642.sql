-- Phase 2: SERP Cache table
CREATE TABLE IF NOT EXISTS serp_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  broker_slug text NOT NULL,
  query text NOT NULL,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  result_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

-- Index for cache lookups
CREATE INDEX IF NOT EXISTS idx_serp_cache_key ON serp_cache(cache_key);

-- Index for TTL cleanup
CREATE INDEX IF NOT EXISTS idx_serp_cache_expires ON serp_cache(expires_at);

-- Enable RLS
ALTER TABLE serp_cache ENABLE ROW LEVEL SECURITY;

-- Service-role only policies (same pattern as other SERP tables)
CREATE POLICY "serp_cache_service_select" ON serp_cache
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "serp_cache_service_insert" ON serp_cache
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "serp_cache_service_update" ON serp_cache
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "serp_cache_service_delete" ON serp_cache
  FOR DELETE USING (auth.role() = 'service_role');

-- Revoke direct access from anon/authenticated
REVOKE ALL ON TABLE serp_cache FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON serp_cache TO service_role;

-- Add comments
COMMENT ON TABLE serp_cache IS 'Cache for SERP API results to reduce API costs';
COMMENT ON COLUMN serp_cache.cache_key IS 'SHA256 hash of query string for fast lookups';
COMMENT ON COLUMN serp_cache.expires_at IS 'TTL - default 7 days, results older are stale';