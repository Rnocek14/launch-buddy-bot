
-- ============================================================
-- FIX 1: CRITICAL — Remove conflicting INSERT policy on subscriptions
-- that allows users to self-assign any tier (privilege escalation)
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;

-- ============================================================
-- FIX 2: Remove overly permissive "full access" policies on
-- serp_requests_log and serp_usage_daily that expose data publicly
-- ============================================================
DROP POLICY IF EXISTS "Service role full access on serp_requests_log" ON public.serp_requests_log;
DROP POLICY IF EXISTS "Service role full access on serp_usage_daily" ON public.serp_usage_daily;

-- ============================================================
-- FIX 3: Restrict t2_retries to service_role only (was public true)
-- ============================================================
DROP POLICY IF EXISTS "t2_read" ON public.t2_retries;
CREATE POLICY "t2_read_service_role"
  ON public.t2_retries
  FOR SELECT
  TO service_role
  USING (true);
