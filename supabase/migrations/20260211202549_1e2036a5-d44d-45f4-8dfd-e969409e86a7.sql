
-- Email subscriptions table for tracking detected newsletter/marketing subscriptions
CREATE TABLE public.email_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  connection_id uuid REFERENCES public.email_connections(id) ON DELETE SET NULL,
  sender_domain text NOT NULL,
  sender_email text NOT NULL,
  sender_name text,
  subject_sample text,
  unsubscribe_url text,
  unsubscribe_mailto text,
  has_one_click boolean NOT NULL DEFAULT false,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  email_count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  unsubscribed_at timestamptz,
  last_unsubscribe_attempt_at timestamptz,
  last_error text,
  service_id uuid REFERENCES public.service_catalog(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, sender_email)
);

-- Enable RLS
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.email_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.email_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.email_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON public.email_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Service role full access for edge functions
CREATE POLICY "Service role full access on email_subscriptions"
  ON public.email_subscriptions FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role');

-- Index for fast lookups
CREATE INDEX idx_email_subscriptions_user_id ON public.email_subscriptions(user_id);
CREATE INDEX idx_email_subscriptions_sender_domain ON public.email_subscriptions(sender_domain);
CREATE INDEX idx_email_subscriptions_status ON public.email_subscriptions(status);

-- Trigger for updated_at
CREATE TRIGGER update_email_subscriptions_updated_at
  BEFORE UPDATE ON public.email_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Unsubscribe audit log
CREATE TABLE public.unsubscribe_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subscription_id uuid NOT NULL REFERENCES public.email_subscriptions(id) ON DELETE CASCADE,
  method text NOT NULL, -- 'one_click', 'url', 'mailto'
  sender_domain text NOT NULL,
  sender_email text NOT NULL,
  result text NOT NULL, -- 'success', 'failed', 'url_returned'
  error_message text,
  response_status integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.unsubscribe_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit log"
  ON public.unsubscribe_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on audit log"
  ON public.unsubscribe_audit_log FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role');

CREATE INDEX idx_unsubscribe_audit_user ON public.unsubscribe_audit_log(user_id);
CREATE INDEX idx_unsubscribe_audit_subscription ON public.unsubscribe_audit_log(subscription_id);
