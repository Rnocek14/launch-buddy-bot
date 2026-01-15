-- Phase 1: SERP Budget Governor
-- Tracks daily SERP usage with hard caps and audit logging

-- Daily budget tracking
CREATE TABLE IF NOT EXISTS serp_usage_daily (
  day DATE PRIMARY KEY,
  searches_used INT NOT NULL DEFAULT 0,
  searches_limit INT NOT NULL DEFAULT 1000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit log for all SERP requests
CREATE TABLE IF NOT EXISTS serp_requests_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  broker_slug TEXT,
  query TEXT NOT NULL,
  response_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('ok', 'error', 'skipped_budget', 'cached')),
  error_detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying logs
CREATE INDEX idx_serp_requests_log_created ON serp_requests_log(created_at DESC);
CREATE INDEX idx_serp_requests_log_user ON serp_requests_log(user_id);
CREATE INDEX idx_serp_requests_log_status ON serp_requests_log(status);

-- Atomic budget consumption function
-- Returns true if quota available and consumed, false if exhausted
CREATE OR REPLACE FUNCTION consume_serp_quota(p_count INT DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  d DATE := CURRENT_DATE;
  used INT;
  lim INT;
BEGIN
  -- Ensure today's row exists
  INSERT INTO serp_usage_daily(day, searches_used, searches_limit)
  VALUES (d, 0, 1000)
  ON CONFLICT (day) DO NOTHING;

  -- Lock row and check budget
  SELECT searches_used, searches_limit INTO used, lim
  FROM serp_usage_daily WHERE day = d FOR UPDATE;

  IF used + p_count > lim THEN
    RETURN FALSE;
  END IF;

  -- Consume quota
  UPDATE serp_usage_daily
  SET searches_used = searches_used + p_count,
      updated_at = now()
  WHERE day = d;

  RETURN TRUE;
END $$;

-- Helper to get current budget status
CREATE OR REPLACE FUNCTION get_serp_budget_status()
RETURNS TABLE(day DATE, searches_used INT, searches_limit INT, remaining INT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(s.day, CURRENT_DATE) as day,
    COALESCE(s.searches_used, 0) as searches_used,
    COALESCE(s.searches_limit, 1000) as searches_limit,
    COALESCE(s.searches_limit - s.searches_used, 1000) as remaining
  FROM (SELECT 1) AS dummy
  LEFT JOIN serp_usage_daily s ON s.day = CURRENT_DATE;
$$;

-- RLS policies (admin-only for now)
ALTER TABLE serp_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE serp_requests_log ENABLE ROW LEVEL SECURITY;

-- Service role can read/write (for edge functions)
CREATE POLICY "Service role full access on serp_usage_daily"
ON serp_usage_daily FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access on serp_requests_log"
ON serp_requests_log FOR ALL
USING (true)
WITH CHECK (true);