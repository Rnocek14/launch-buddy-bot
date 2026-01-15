-- Update Riley's subscription to complete tier for testing
UPDATE subscriptions 
SET tier = 'complete', updated_at = now()
WHERE user_id = '7b132505-9e2b-4a33-b7c7-7306a87f40fb';