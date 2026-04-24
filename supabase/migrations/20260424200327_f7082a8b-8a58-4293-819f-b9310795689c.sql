-- Add signal/intelligence columns to user_services
ALTER TABLE public.user_services
  ADD COLUMN IF NOT EXISTS intent_signals jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS confidence_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS activity_status text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS cleanup_priority integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_transaction_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_security_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz,
  ADD COLUMN IF NOT EXISTS signals_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_user_services_cleanup_priority
  ON public.user_services (user_id, cleanup_priority DESC);

CREATE INDEX IF NOT EXISTS idx_user_services_activity_status
  ON public.user_services (user_id, activity_status);

-- RPC: merge classified signals into user_services for a single (user, service) pair.
-- Called by the scan worker after classifying messages from a single sender domain.
CREATE OR REPLACE FUNCTION public.upsert_service_signals(
  p_user_id uuid,
  p_service_id uuid,
  p_signals jsonb,
  p_confidence integer,
  p_activity_status text,
  p_cleanup_priority integer,
  p_last_transaction_at timestamptz DEFAULT NULL,
  p_last_security_at timestamptz DEFAULT NULL,
  p_last_activity_at timestamptz DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify other users data';
  END IF;

  UPDATE public.user_services
  SET
    intent_signals      = COALESCE(p_signals, intent_signals),
    confidence_score    = GREATEST(confidence_score, COALESCE(p_confidence, 0)),
    activity_status     = COALESCE(p_activity_status, activity_status),
    cleanup_priority    = GREATEST(cleanup_priority, COALESCE(p_cleanup_priority, 0)),
    last_transaction_at = GREATEST(last_transaction_at, p_last_transaction_at),
    last_security_at    = GREATEST(last_security_at, p_last_security_at),
    last_activity_at    = GREATEST(last_activity_at, p_last_activity_at),
    signals_updated_at  = now()
  WHERE user_id = p_user_id AND service_id = p_service_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_service_signals(
  uuid, uuid, jsonb, integer, text, integer, timestamptz, timestamptz, timestamptz
) TO authenticated, service_role;