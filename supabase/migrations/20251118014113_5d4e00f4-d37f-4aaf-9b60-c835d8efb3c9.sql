-- Fix SECURITY DEFINER issues
-- The get_email_analytics_summary function had SECURITY DEFINER which bypasses RLS
-- We need to remove it and ensure proper access control through the base table RLS

-- Drop and recreate get_email_analytics_summary WITHOUT security definer
DROP FUNCTION IF EXISTS public.get_email_analytics_summary();

CREATE OR REPLACE FUNCTION public.get_email_analytics_summary()
RETURNS TABLE(
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
-- NO SECURITY DEFINER - runs with caller's privileges
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

-- Grant execute to authenticated users (they still need admin role to see data)
GRANT EXECUTE ON FUNCTION public.get_email_analytics_summary() TO authenticated;

COMMENT ON FUNCTION public.get_email_analytics_summary() IS 
'Returns email analytics summary. Requires admin role. Runs with SECURITY INVOKER (caller privileges).';
