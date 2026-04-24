UPDATE public.user_services us
SET deletion_requested_at = dr.first_sent,
    privacy_action = COALESCE(us.privacy_action, 'delete'),
    privacy_action_at = COALESCE(us.privacy_action_at, dr.first_sent)
FROM (
  SELECT user_id, service_id, MIN(created_at) AS first_sent
  FROM public.deletion_requests
  WHERE service_id IS NOT NULL
    AND status IN ('sent', 'pending', 'completed', 'in_progress')
  GROUP BY user_id, service_id
) dr
WHERE us.user_id = dr.user_id
  AND us.service_id = dr.service_id
  AND us.deletion_requested_at IS NULL;