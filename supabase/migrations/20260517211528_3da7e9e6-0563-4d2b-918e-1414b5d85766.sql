CREATE OR REPLACE FUNCTION public.use_referral_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_referral_code RECORD;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    SELECT * INTO v_referral_code
    FROM public.referral_codes
    WHERE code = upper(p_code)
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR uses_count < max_uses);

    IF v_referral_code IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired referral code');
    END IF;

    IF v_referral_code.user_id = v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Cannot use your own referral code');
    END IF;

    IF EXISTS(SELECT 1 FROM public.referral_conversions WHERE referred_user_id = v_user_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'You have already used a referral code');
    END IF;

    INSERT INTO public.referral_conversions (referral_code_id, referrer_user_id, referred_user_id)
    VALUES (v_referral_code.id, v_referral_code.user_id, v_user_id);

    UPDATE public.referral_codes
    SET uses_count = uses_count + 1, updated_at = now()
    WHERE id = v_referral_code.id;

    RETURN jsonb_build_object('success', true);
END;
$$;