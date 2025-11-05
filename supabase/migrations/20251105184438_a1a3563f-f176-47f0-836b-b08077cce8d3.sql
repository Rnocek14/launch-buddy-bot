-- Create enum for email event types
CREATE TYPE public.email_event_type AS ENUM (
  'sent',
  'delivered',
  'delivery_delayed',
  'complained',
  'bounced',
  'opened',
  'clicked',
  'unsubscribed'
);

-- Create email_analytics table
CREATE TABLE public.email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL,
  email_address TEXT NOT NULL,
  event_type email_event_type NOT NULL,
  email_subject TEXT,
  link_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;

-- Only admins can view analytics
CREATE POLICY "Admins can view all email analytics"
ON public.email_analytics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for faster queries
CREATE INDEX idx_email_analytics_email_id ON public.email_analytics(email_id);
CREATE INDEX idx_email_analytics_email_address ON public.email_analytics(email_address);
CREATE INDEX idx_email_analytics_event_type ON public.email_analytics(event_type);
CREATE INDEX idx_email_analytics_created_at ON public.email_analytics(created_at DESC);

-- Create view for email analytics summary
CREATE OR REPLACE VIEW public.email_analytics_summary AS
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