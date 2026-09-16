-- Fix: paying Complete ($129/yr) and Family ($179/yr) customers were capped at 3 deletion
-- requests per month -- the same cap as the free tier -- while cheaper Pro ($79/yr) customers
-- got unlimited deletions.
--
-- get_remaining_deletions() only special-cased 'pro'; every other tier fell through to the
-- free-tier cap, so Complete and Family users hit "You've used all 3 free deletion requests
-- this month. Upgrade to Pro for unlimited deletions." despite already paying more than Pro.
--
-- TIER_LIMITS in src/config/pricing.ts has deletionsPerMonth: null (unlimited) for pro,
-- complete and family, and the Complete plan is sold as "Everything in Pro, plus:", so the
-- intended behaviour is unlimited deletions for all three paid tiers.
--
-- This migration only widens that one tier check. Everything else about the function -- the
-- SECURITY DEFINER context, the search_path pin, the free-tier row bootstrap and the free-tier
-- fallback -- is preserved as-is.

CREATE OR REPLACE FUNCTION public.get_remaining_deletions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_deletion_count INTEGER;
  v_max_free_deletions INTEGER := 3;
BEGIN
  SELECT tier, deletion_count_this_period
  INTO v_tier, v_deletion_count
  FROM public.subscriptions
  WHERE user_id = p_user_id
  AND status = 'active';
  
  -- If no subscription exists, initialize as free
  IF v_tier IS NULL THEN
    INSERT INTO public.subscriptions (user_id, tier, status)
    VALUES (p_user_id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN v_max_free_deletions;
  END IF;
  
  -- All paid tiers have unlimited deletions, not just pro
  IF v_tier IN ('pro', 'complete', 'family') THEN
    RETURN NULL; -- NULL indicates unlimited
  END IF;
  
  -- Free users get 3 deletions per period
  RETURN GREATEST(0, v_max_free_deletions - COALESCE(v_deletion_count, 0));
END;
$$;

-- Note on public.increment_deletion_count(): it is already correct and is intentionally left
-- unchanged. Its cap is gated on `v_tier = 'free' AND v_deletion_count >= v_max_free_deletions`,
-- so it never refused to increment for complete or family -- it enforces the cap on the free
-- tier only. The customer-facing block came solely from get_remaining_deletions(), which the
-- send-deletion-request edge function checks before sending.
