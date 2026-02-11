
-- Replace the two-step approach with a single atomic upsert RPC
CREATE OR REPLACE FUNCTION public.increment_subscription_count(
  p_user_id uuid,
  p_sender_email text,
  p_add_count integer,
  p_last_seen timestamptz,
  p_subject text DEFAULT NULL,
  p_unsub_url text DEFAULT NULL,
  p_unsub_mailto text DEFAULT NULL,
  p_has_one_click boolean DEFAULT false,
  p_service_id uuid DEFAULT NULL,
  p_connection_id uuid DEFAULT NULL,
  p_sender_domain text DEFAULT NULL,
  p_sender_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO email_subscriptions (
    user_id, sender_email, sender_domain, sender_name,
    connection_id, email_count, last_seen_at, subject_sample,
    unsubscribe_url, unsubscribe_mailto, has_one_click, service_id
  ) VALUES (
    p_user_id, p_sender_email,
    COALESCE(p_sender_domain, ''),
    p_sender_name,
    p_connection_id,
    p_add_count,
    COALESCE(p_last_seen, now()),
    p_subject,
    p_unsub_url,
    p_unsub_mailto,
    p_has_one_click,
    p_service_id
  )
  ON CONFLICT (user_id, sender_email) DO UPDATE SET
    email_count    = email_subscriptions.email_count + EXCLUDED.email_count,
    last_seen_at   = GREATEST(email_subscriptions.last_seen_at, EXCLUDED.last_seen_at),
    subject_sample = CASE
      WHEN EXCLUDED.last_seen_at > email_subscriptions.last_seen_at
      THEN COALESCE(EXCLUDED.subject_sample, email_subscriptions.subject_sample)
      ELSE email_subscriptions.subject_sample
    END,
    unsubscribe_url    = COALESCE(EXCLUDED.unsubscribe_url, email_subscriptions.unsubscribe_url),
    unsubscribe_mailto = COALESCE(EXCLUDED.unsubscribe_mailto, email_subscriptions.unsubscribe_mailto),
    has_one_click      = EXCLUDED.has_one_click OR email_subscriptions.has_one_click,
    service_id         = COALESCE(EXCLUDED.service_id, email_subscriptions.service_id),
    sender_name        = COALESCE(EXCLUDED.sender_name, email_subscriptions.sender_name),
    updated_at         = now();
  -- first_seen_at is never touched on conflict — stable by design
END;
$$;

-- Composite index for dashboard reads
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_user_status_lastseen
  ON public.email_subscriptions (user_id, status, last_seen_at DESC);
