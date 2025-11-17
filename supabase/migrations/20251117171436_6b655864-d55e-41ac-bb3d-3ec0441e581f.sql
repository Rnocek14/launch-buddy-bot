-- Create subscriptions table to track user tiers and usage
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'incomplete')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  deletion_count_this_period INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own subscription (for free tier initialization)
CREATE POLICY "Users can insert own subscription"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Service role can manage all subscriptions (for Stripe webhooks)
CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Function to get user's subscription tier
CREATE OR REPLACE FUNCTION public.get_user_subscription_tier(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
BEGIN
  SELECT tier INTO v_tier
  FROM public.subscriptions
  WHERE user_id = p_user_id
  AND status = 'active';
  
  -- If no subscription exists, create a free one
  IF v_tier IS NULL THEN
    INSERT INTO public.subscriptions (user_id, tier, status)
    VALUES (p_user_id, 'free', 'active')
    ON CONFLICT (user_id) DO NOTHING;
    RETURN 'free';
  END IF;
  
  RETURN v_tier;
END;
$$;

-- Function to get remaining deletions for free tier users
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
  
  -- Pro users have unlimited deletions
  IF v_tier = 'pro' THEN
    RETURN NULL; -- NULL indicates unlimited
  END IF;
  
  -- Free users get 3 deletions per period
  RETURN GREATEST(0, v_max_free_deletions - COALESCE(v_deletion_count, 0));
END;
$$;

-- Function to increment deletion count
CREATE OR REPLACE FUNCTION public.increment_deletion_count(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier TEXT;
  v_deletion_count INTEGER;
  v_max_free_deletions INTEGER := 3;
BEGIN
  -- Get current subscription
  SELECT tier, deletion_count_this_period
  INTO v_tier, v_deletion_count
  FROM public.subscriptions
  WHERE user_id = p_user_id
  AND status = 'active'
  FOR UPDATE; -- Lock the row
  
  -- If no subscription, create free tier
  IF v_tier IS NULL THEN
    INSERT INTO public.subscriptions (user_id, tier, status, deletion_count_this_period)
    VALUES (p_user_id, 'free', 'active', 1)
    ON CONFLICT (user_id) DO UPDATE
    SET deletion_count_this_period = subscriptions.deletion_count_this_period + 1;
    RETURN TRUE;
  END IF;
  
  -- Check if free user is at limit
  IF v_tier = 'free' AND v_deletion_count >= v_max_free_deletions THEN
    RETURN FALSE; -- Cannot increment, limit reached
  END IF;
  
  -- Increment the count
  UPDATE public.subscriptions
  SET deletion_count_this_period = deletion_count_this_period + 1,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Function to reset monthly deletion counts (for scheduled job)
CREATE OR REPLACE FUNCTION public.reset_monthly_deletion_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset deletion count for free tier users at the start of each period
  UPDATE public.subscriptions
  SET deletion_count_this_period = 0,
      updated_at = now()
  WHERE tier = 'free'
  AND status = 'active';
END;
$$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_subscriptions_updated_at();