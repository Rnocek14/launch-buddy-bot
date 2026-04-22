
-- Affiliates table: one row per partner
CREATE TABLE public.affiliates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  payout_email TEXT,
  audience_description TEXT,
  promotion_channels TEXT[] DEFAULT '{}',
  website_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','suspended')),
  commission_rate NUMERIC NOT NULL DEFAULT 0.40,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_signups INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,
  total_earnings_cents INTEGER NOT NULL DEFAULT 0,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliates_code ON public.affiliates(code);
CREATE INDEX idx_affiliates_user_id ON public.affiliates(user_id);
CREATE INDEX idx_affiliates_status ON public.affiliates(status);

ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

-- Anyone can apply
CREATE POLICY "Anyone can apply as affiliate"
  ON public.affiliates FOR INSERT
  WITH CHECK (true);

-- Affiliates view their own row (by user_id or email match)
CREATE POLICY "Affiliates view their own row"
  ON public.affiliates FOR SELECT
  USING (
    auth.uid() = user_id
    OR email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
  );

-- Admins manage all
CREATE POLICY "Admins manage affiliates"
  ON public.affiliates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Click tracking
CREATE TABLE public.affiliate_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL,
  source_url TEXT,
  landing_path TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_affiliate_clicks_affiliate_id ON public.affiliate_clicks(affiliate_id);
CREATE INDEX idx_affiliate_clicks_created_at ON public.affiliate_clicks(created_at DESC);

ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log clicks"
  ON public.affiliate_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Affiliates view their own clicks"
  ON public.affiliate_clicks FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates
      WHERE auth.uid() = user_id
        OR email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
    )
  );

CREATE POLICY "Admins view all clicks"
  ON public.affiliate_clicks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Conversion tracking
CREATE TABLE public.affiliate_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('signup','subscription','one_time_purchase')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  commission_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','reversed')),
  stripe_payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX idx_affiliate_conversions_affiliate_id ON public.affiliate_conversions(affiliate_id);
CREATE INDEX idx_affiliate_conversions_referred_user ON public.affiliate_conversions(referred_user_id);

ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates view their conversions"
  ON public.affiliate_conversions FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM public.affiliates
      WHERE auth.uid() = user_id
        OR email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
    )
  );

CREATE POLICY "Admins manage conversions"
  ON public.affiliate_conversions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_affiliates_updated_at
  BEFORE UPDATE ON public.affiliates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique affiliate code
CREATE OR REPLACE FUNCTION public.generate_affiliate_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.affiliates WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;
