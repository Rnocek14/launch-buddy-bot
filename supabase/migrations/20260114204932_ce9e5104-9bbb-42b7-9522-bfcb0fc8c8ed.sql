-- First, update the tier check constraint to include 'complete'
ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_tier_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_tier_check CHECK (tier = ANY (ARRAY['free'::text, 'pro'::text, 'complete'::text]));

-- Insert/update subscription for rileynocek663@gmail.com
INSERT INTO public.subscriptions (user_id, tier, status)
SELECT u.id, 'complete', 'active'
FROM auth.users u
WHERE u.email = 'rileynocek663@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET tier = 'complete', status = 'active', updated_at = now();

-- Insert/update subscription for rnocek14@gmail.com  
INSERT INTO public.subscriptions (user_id, tier, status)
SELECT u.id, 'complete', 'active'
FROM auth.users u
WHERE u.email = 'rnocek14@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET tier = 'complete', status = 'active', updated_at = now();