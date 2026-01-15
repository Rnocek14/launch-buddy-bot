-- Get user IDs and upsert complete tier subscriptions
INSERT INTO public.subscriptions (user_id, tier, status, updated_at)
SELECT id, 'complete', 'active', now()
FROM auth.users
WHERE email IN ('rnocek14@gmail.com', 'rileynocek663@gmail.com', 'olineflips@hotmail.com')
ON CONFLICT (user_id) 
DO UPDATE SET tier = 'complete', status = 'active', updated_at = now();