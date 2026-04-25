-- Grant Complete tier to brulebarbar@gmail.com (auto-applies on signup, and now if account exists)

-- 1) Backfill: if the user already exists, grant immediately
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'brulebarbar@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (
      user_id, tier, status, manual_override, override_reason, overridden_at, current_period_start, current_period_end
    ) VALUES (
      v_user_id, 'complete', 'active', true, 'full access grant', now(), now(), now() + interval '100 years'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      tier = 'complete',
      status = 'active',
      manual_override = true,
      override_reason = COALESCE(public.subscriptions.override_reason, 'full access grant'),
      overridden_at = now(),
      current_period_end = now() + interval '100 years',
      updated_at = now();
  END IF;
END $$;

-- 2) Auto-grant on signup (mirrors grant_pro_to_test_account pattern)
CREATE OR REPLACE FUNCTION public.grant_complete_to_brulebarbar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF lower(NEW.email) = 'brulebarbar@gmail.com' THEN
    INSERT INTO public.subscriptions (
      user_id, tier, status, manual_override, override_reason, overridden_at, current_period_start, current_period_end
    ) VALUES (
      NEW.id, 'complete', 'active', true, 'full access grant', now(), now(), now() + interval '100 years'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      tier = 'complete',
      status = 'active',
      manual_override = true,
      override_reason = COALESCE(public.subscriptions.override_reason, 'full access grant'),
      overridden_at = now(),
      current_period_end = now() + interval '100 years',
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS grant_complete_brulebarbar_trigger ON auth.users;
CREATE TRIGGER grant_complete_brulebarbar_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.grant_complete_to_brulebarbar();