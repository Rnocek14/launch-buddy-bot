-- Trigger function: auto-grant Pro to the test email on signup
CREATE OR REPLACE FUNCTION public.grant_pro_to_test_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'cj83052@gmail.com' THEN
    INSERT INTO public.subscriptions (
      user_id, tier, status, manual_override, override_reason, overridden_at, current_period_start, current_period_end
    ) VALUES (
      NEW.id, 'pro', 'active', true, 'test account auto-grant', now(), now(), now() + interval '100 years'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      tier = 'pro',
      status = 'active',
      manual_override = true,
      override_reason = COALESCE(public.subscriptions.override_reason, 'test account auto-grant'),
      overridden_at = now(),
      current_period_end = now() + interval '100 years',
      updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_grant_pro_test ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_pro_test
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.grant_pro_to_test_account();

-- Backfill in case the account already exists
DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE lower(email) = 'cj83052@gmail.com' LIMIT 1;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.subscriptions (
      user_id, tier, status, manual_override, override_reason, overridden_at, current_period_start, current_period_end
    ) VALUES (
      v_uid, 'pro', 'active', true, 'test account auto-grant', now(), now(), now() + interval '100 years'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      tier = 'pro',
      status = 'active',
      manual_override = true,
      override_reason = COALESCE(public.subscriptions.override_reason, 'test account auto-grant'),
      overridden_at = now(),
      current_period_end = now() + interval '100 years',
      updated_at = now();
  END IF;
END $$;