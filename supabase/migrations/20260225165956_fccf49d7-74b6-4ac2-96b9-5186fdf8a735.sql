
-- Add privacy_action column to user_services (keep/delete/do_not_sell/null)
ALTER TABLE public.user_services 
ADD COLUMN IF NOT EXISTS privacy_action text DEFAULT NULL;

-- Add privacy_action_at timestamp
ALTER TABLE public.user_services 
ADD COLUMN IF NOT EXISTS privacy_action_at timestamp with time zone DEFAULT NULL;

-- Create service_action_log for tracking all privacy actions
CREATE TABLE IF NOT EXISTS public.service_action_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  service_id uuid NOT NULL REFERENCES public.service_catalog(id),
  action text NOT NULL, -- 'keep', 'delete', 'do_not_sell'
  previous_action text,
  method text, -- 'email', 'webform', 'manual'
  template_used text, -- 'gdpr-deletion', 'ccpa-deletion', 'ccpa-do-not-sell', etc.
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_action_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own action logs"
ON public.service_action_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own action logs"
ON public.service_action_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_service_action_log_user_service 
ON public.service_action_log(user_id, service_id);

CREATE INDEX IF NOT EXISTS idx_user_services_privacy_action 
ON public.user_services(user_id, privacy_action);
