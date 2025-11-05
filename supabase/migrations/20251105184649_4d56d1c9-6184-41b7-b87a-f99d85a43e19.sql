-- Drop and recreate the view with security_invoker=on to respect RLS
DROP VIEW IF EXISTS public.email_analytics_summary;

CREATE OR REPLACE VIEW public.email_analytics_summary 
WITH (security_invoker=on)
AS
SELECT 
  COUNT(*) FILTER (WHERE event_type = 'sent') as total_sent,
  COUNT(*) FILTER (WHERE event_type = 'delivered') as total_delivered,
  COUNT(*) FILTER (WHERE event_type = 'opened') as total_opened,
  COUNT(*) FILTER (WHERE event_type = 'clicked') as total_clicked,
  COUNT(*) FILTER (WHERE event_type = 'bounced') as total_bounced,
  COUNT(*) FILTER (WHERE event_type = 'complained') as total_complained,
  COUNT(DISTINCT email_id) FILTER (WHERE event_type = 'opened') as unique_opens,
  COUNT(DISTINCT email_id) FILTER (WHERE event_type = 'clicked') as unique_clicks,
  ROUND(
    (COUNT(*) FILTER (WHERE event_type = 'opened')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'delivered'), 0) * 100), 2
  ) as open_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE event_type = 'clicked')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'delivered'), 0) * 100), 2
  ) as click_rate
FROM public.email_analytics;

-- Grant access to view for authenticated users with admin role
GRANT SELECT ON public.email_analytics_summary TO authenticated;