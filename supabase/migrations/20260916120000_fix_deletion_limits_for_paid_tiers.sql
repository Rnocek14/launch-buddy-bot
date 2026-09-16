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
-- Two things are widened here, and nothing else: the subscriptions.tier CHECK constraint (so a
-- 'family' row can exist at all) and the tier gate inside get_remaining_deletions(). Everything
-- else about the function -- the SECURITY DEFINER context, the search_path pin, the free-tier row
-- bootstrap and the free-tier fallback -- is preserved as-is.

-- The 'family' branch below is dead code without this: subscriptions_tier_check was last set by
-- 20260114204932 to CHECK (tier = ANY (ARRAY['free','pro','complete'])), so the column physically
-- cannot hold 'family'. check-subscription maps the Family price IDs to tier 'family' and then
-- swallows the resulting constraint violation (it only logStep()s updateError/insertError), so a
-- paying Family customer's row silently stays at its previous tier -- usually 'free' -- and they
-- keep getting the 3/month cap. Widen the constraint first, then the tier gate below can actually
-- be reached. No backfill is needed: check-subscription re-syncs the tier from Stripe on its next
-- call, which now succeeds.
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_tier_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_tier_check CHECK (tier = ANY (ARRAY['free'::text, 'pro'::text, 'complete'::text, 'family'::text]));

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
