
-- Fix #1: Add unique constraint for upsert to work
ALTER TABLE public.email_subscriptions
  ADD CONSTRAINT email_subscriptions_user_sender_unique
  UNIQUE (user_id, sender_email);

-- Fix #2: Ensure missing columns exist with proper defaults
-- (last_unsubscribe_attempt_at, last_error already exist per schema, but ensure status default)
ALTER TABLE public.email_subscriptions
  ALTER COLUMN status SET DEFAULT 'active';

-- Fix #8: Add WITH CHECK to service role policies
DROP POLICY IF EXISTS "Service role full access on email_subscriptions" ON public.email_subscriptions;
CREATE POLICY "Service role full access on email_subscriptions"
  ON public.email_subscriptions
  FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

DROP POLICY IF EXISTS "Service role full access on audit log" ON public.unsubscribe_audit_log;
CREATE POLICY "Service role full access on audit log"
  ON public.unsubscribe_audit_log
  FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role')
  WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
