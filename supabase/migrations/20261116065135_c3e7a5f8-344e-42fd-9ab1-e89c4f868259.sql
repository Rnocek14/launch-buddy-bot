ALTER TABLE public.data_brokers
  ADD COLUMN IF NOT EXISTS privacy_email text,
  ADD COLUMN IF NOT EXISTS removal_method text NOT NULL DEFAULT 'form',
  ADD COLUMN IF NOT EXISTS form_automation_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_verified_at timestamptz;

CREATE TABLE public.broker_removal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  broker_id uuid NOT NULL REFERENCES public.data_brokers(id) ON DELETE CASCADE,
  scan_result_id uuid REFERENCES public.broker_scan_results(id) ON DELETE SET NULL,
  method text NOT NULL DEFAULT 'form',
  status text NOT NULL DEFAULT 'found',
  listing_url text,
  sent_at timestamptz,
  follow_up_at timestamptz,
  attempts integer NOT NULL DEFAULT 0,
  removed_at timestamptz,
  last_error text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, broker_id)
);
GRANT SELECT ON public.broker_removal_requests TO authenticated;
GRANT UPDATE ON public.broker_removal_requests TO authenticated;
GRANT ALL ON public.broker_removal_requests TO service_role;
ALTER TABLE public.broker_removal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own removal requests" ON public.broker_removal_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update removal requests" ON public.broker_removal_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.validate_removal_status() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('found','request_sent','needs_customer','waiting','removed','failed') THEN
    RAISE EXCEPTION 'invalid removal status %', NEW.status;
  END IF;
  IF NEW.method NOT IN ('email','form','auto_form') THEN
    RAISE EXCEPTION 'invalid removal method %', NEW.method;
  END IF;
  IF NEW.status = 'removed' AND NEW.removed_at IS NULL THEN NEW.removed_at := now(); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validate_removal_status BEFORE INSERT OR UPDATE ON public.broker_removal_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_removal_status();
CREATE TRIGGER update_broker_removal_requests_updated_at BEFORE UPDATE ON public.broker_removal_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();