-- Create table for tracking failed contact discovery attempts
CREATE TABLE IF NOT EXISTS public.contact_discovery_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.service_catalog(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  failure_type TEXT NOT NULL, -- 'fetch_failed', 'no_policy_found', 'ai_error', 'no_contacts_found', 'all_filtered'
  error_message TEXT,
  urls_tried TEXT[], -- Array of URLs that were attempted
  http_status_codes JSONB, -- Map of URL -> status code
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_discovery_failures ENABLE ROW LEVEL SECURITY;

-- Admin can view all failures
CREATE POLICY "Admins can view all discovery failures"
ON public.contact_discovery_failures
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can insert their own failures
CREATE POLICY "Users can log their own failures"
ON public.contact_discovery_failures
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_discovery_failures_service ON public.contact_discovery_failures(service_id);
CREATE INDEX idx_discovery_failures_created ON public.contact_discovery_failures(created_at DESC);
CREATE INDEX idx_discovery_failures_type ON public.contact_discovery_failures(failure_type);