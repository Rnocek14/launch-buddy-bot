UPDATE subscriptions 
SET tier = 'complete', 
    manual_override = true, 
    override_reason = 'Admin/test account — owner override',
    overridden_at = now(),
    updated_at = now()
WHERE user_id = '7b132505-9e2b-4a33-b7c7-7306a87f40fb';