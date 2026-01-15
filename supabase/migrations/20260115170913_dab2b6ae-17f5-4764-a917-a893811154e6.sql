
-- Transfer Complete subscription to rnocek14@gmail.com
UPDATE subscriptions 
SET tier = 'complete', 
    updated_at = NOW()
WHERE user_id = 'b1254d04-7469-49c2-bbf6-5e689f4d5804';

-- Downgrade the old account to free
UPDATE subscriptions 
SET tier = 'free',
    updated_at = NOW()
WHERE user_id = '7b132505-9e2b-4a33-b7c7-7306a87f40fb';
