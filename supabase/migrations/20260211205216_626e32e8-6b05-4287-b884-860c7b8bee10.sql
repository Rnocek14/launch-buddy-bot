
-- RPC for atomic subscription count increment + monotonic last_seen_at
CREATE OR REPLACE FUNCTION public.increment_subscription_count(
  p_user_id uuid,
  p_sender_email text,
  p_add_count integer,
  p_last_seen timestamptz,
  p_subject text DEFAULT NULL,
  p_unsub_url text DEFAULT NULL,
  p_unsub_mailto text DEFAULT NULL,
  p_has_one_click boolean DEFAULT false,
  p_service_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE email_subscriptions
  SET
    email_count = email_count + p_add_count,
    last_seen_at = GREATEST(last_seen_at, p_last_seen),
    subject_sample = COALESCE(p_subject, subject_sample),
    unsubscribe_url = COALESCE(p_unsub_url, unsubscribe_url),
    unsubscribe_mailto = COALESCE(p_unsub_mailto, unsubscribe_mailto),
    has_one_click = p_has_one_click OR has_one_click,
    service_id = COALESCE(p_service_id, service_id),
    updated_at = now()
  WHERE user_id = p_user_id AND sender_email = p_sender_email;
END;
$$;
