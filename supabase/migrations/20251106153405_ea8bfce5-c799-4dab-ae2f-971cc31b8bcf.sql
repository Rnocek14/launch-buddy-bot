-- Create a SECURITY DEFINER function to safely access email_analytics_summary
-- This replaces direct view access with controlled, admin-only access

CREATE OR REPLACE FUNCTION public.get_email_analytics_summary()
RETURNS TABLE (
  total_sent bigint,
  total_delivered bigint,
  total_opened bigint,
  total_clicked bigint,
  total_bounced bigint,
  total_complained bigint,
  unique_opens bigint,
  unique_clicks bigint,
  open_rate numeric,
  click_rate numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow admins to access this data
  SELECT 
    total_sent,
    total_delivered,
    total_opened,
    total_clicked,
    total_bounced,
    total_complained,
    unique_opens,
    unique_clicks,
    open_rate,
    click_rate
  FROM public.email_analytics_summary
  WHERE public.has_role(auth.uid(), 'admin'::app_role)
  LIMIT 1;
$$;