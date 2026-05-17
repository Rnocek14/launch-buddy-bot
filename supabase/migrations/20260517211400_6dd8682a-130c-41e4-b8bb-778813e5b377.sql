-- Restrict referral code reads to owners and safe functions only
DROP POLICY IF EXISTS "Anyone can look up a referral code" ON public.referral_codes;
DROP POLICY IF EXISTS "Anyone can lookup a code by value" ON public.referral_codes;

CREATE OR REPLACE FUNCTION public.validate_referral_code(p_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'valid', EXISTS (
      SELECT 1
      FROM public.referral_codes rc
      WHERE rc.code = upper(trim(p_code))
        AND (rc.expires_at IS NULL OR rc.expires_at > now())
        AND (rc.max_uses IS NULL OR rc.uses_count < rc.max_uses)
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;

-- Restrict raw public_results reads; expose only safe fields through RPCs by share_id
DROP POLICY IF EXISTS "Public results are viewable by everyone" ON public.public_results;
DROP POLICY IF EXISTS "Users can view their own public results" ON public.public_results;

CREATE POLICY "Users can view their own public results"
ON public.public_results
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_public_result(p_share_id text)
RETURNS TABLE (
  share_id text,
  risk_score integer,
  risk_level text,
  service_count integer,
  top_categories jsonb,
  insights jsonb,
  view_count integer,
  conversion_count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pr.share_id,
    pr.risk_score,
    pr.risk_level,
    pr.service_count,
    pr.top_categories,
    pr.insights,
    pr.view_count,
    pr.conversion_count
  FROM public.public_results pr
  WHERE pr.share_id = p_share_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.increment_public_result_view(p_share_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.public_results
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE share_id = p_share_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_public_result_conversion(p_share_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.public_results
  SET conversion_count = COALESCE(conversion_count, 0) + 1
  WHERE share_id = p_share_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_result(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_public_result_view(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_public_result_conversion(text) TO anon, authenticated;