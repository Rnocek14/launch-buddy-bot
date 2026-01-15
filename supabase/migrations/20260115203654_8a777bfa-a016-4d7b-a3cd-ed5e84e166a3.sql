-- Fix RLS policies to be service_role only (not open to everyone)

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Service role full access to serp_usage_daily" ON serp_usage_daily;
DROP POLICY IF EXISTS "Service role full access to serp_requests_log" ON serp_requests_log;

-- Create properly restricted policies for serp_usage_daily
CREATE POLICY "Service role can read serp_usage_daily"
  ON serp_usage_daily FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert serp_usage_daily"
  ON serp_usage_daily FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update serp_usage_daily"
  ON serp_usage_daily FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create properly restricted policies for serp_requests_log
CREATE POLICY "Service role can read serp_requests_log"
  ON serp_requests_log FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert serp_requests_log"
  ON serp_requests_log FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Revoke direct table access from anon and authenticated roles
REVOKE ALL ON serp_usage_daily FROM anon, authenticated;
REVOKE ALL ON serp_requests_log FROM anon, authenticated;

-- Grant only to service_role
GRANT SELECT, INSERT, UPDATE ON serp_usage_daily TO service_role;
GRANT SELECT, INSERT ON serp_requests_log TO service_role;

-- Harden SECURITY DEFINER functions with proper search_path
-- Drop and recreate consume_serp_quota with hardened settings
DROP FUNCTION IF EXISTS consume_serp_quota(int);

CREATE OR REPLACE FUNCTION consume_serp_quota(p_count int DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date := current_date;
  used int;
  lim int;
BEGIN
  -- Ensure today's row exists
  INSERT INTO serp_usage_daily(day, searches_used, searches_limit)
  VALUES (d, 0, 1000)
  ON CONFLICT (day) DO NOTHING;

  -- Atomic read with lock
  SELECT searches_used, searches_limit INTO used, lim
  FROM serp_usage_daily WHERE day = d FOR UPDATE;

  -- Check if budget allows
  IF used + p_count > lim THEN
    RETURN false;
  END IF;

  -- Consume quota
  UPDATE serp_usage_daily
  SET searches_used = searches_used + p_count,
      updated_at = now()
  WHERE day = d;

  RETURN true;
END $$;

-- Drop and recreate get_serp_budget_status with hardened settings
DROP FUNCTION IF EXISTS get_serp_budget_status();

CREATE OR REPLACE FUNCTION get_serp_budget_status()
RETURNS TABLE(day date, searches_used int, searches_limit int, remaining int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    day,
    searches_used,
    searches_limit,
    GREATEST(0, searches_limit - searches_used) as remaining
  FROM serp_usage_daily
  WHERE day = current_date;
$$;