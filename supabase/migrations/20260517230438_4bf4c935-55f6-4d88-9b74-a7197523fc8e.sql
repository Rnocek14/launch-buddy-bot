
-- 1. Remove privilege escalation: anyone could insert themselves as 'owner'
DROP POLICY IF EXISTS "Users can insert themselves as owner" ON public.organization_members;

-- 2. Restrict discovery_metrics SELECT to admins only
DROP POLICY IF EXISTS "Authenticated users can read discovery metrics" ON public.discovery_metrics;
CREATE POLICY "Admins can read discovery metrics"
  ON public.discovery_metrics FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Restrict probe_cache_sitemap to service_role only (no public read)
DROP POLICY IF EXISTS "probe_cache_read" ON public.probe_cache_sitemap;

-- 4. Restrict challenge_participants SELECT to authenticated users
DROP POLICY IF EXISTS "Users can view challenge participants" ON public.challenge_participants;
CREATE POLICY "Authenticated users can view challenge participants"
  ON public.challenge_participants FOR SELECT
  TO authenticated
  USING (true);

-- 5. Replace jwt() role check with auth.role() on email_subscriptions and unsubscribe_audit_log
DROP POLICY IF EXISTS "Service role full access on email_subscriptions" ON public.email_subscriptions;
CREATE POLICY "Service role full access on email_subscriptions"
  ON public.email_subscriptions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access on unsubscribe_audit_log" ON public.unsubscribe_audit_log;
CREATE POLICY "Service role full access on unsubscribe_audit_log"
  ON public.unsubscribe_audit_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 6. email_analytics: drop any permissive insert policies so only service_role (bypasses RLS) can insert
DROP POLICY IF EXISTS "Anyone can insert email analytics" ON public.email_analytics;
DROP POLICY IF EXISTS "Public can insert email analytics" ON public.email_analytics;
DROP POLICY IF EXISTS "Allow insert email analytics" ON public.email_analytics;
DROP POLICY IF EXISTS "anon insert" ON public.email_analytics;
-- Explicit deny via no policy; only service_role bypasses RLS

-- 7. OAuth CSRF state table
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;
-- No policies => only service_role can read/write
