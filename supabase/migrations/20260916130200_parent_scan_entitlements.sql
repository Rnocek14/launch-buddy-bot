-- Fix: the $39 one-time Parent Protection Scan took money and recorded nothing.
--
-- create-parent-scan-payment opens a Stripe Checkout session in `payment` mode with
-- metadata.product = 'parent_protection_scan'. stripe-webhook's `mode === "payment"`
-- branch logged an affiliate conversion and then fell through -- no account, no
-- entitlement, no fulfilment. Meanwhile scan-brokers gates on subscriptions.tier being
-- 'complete' or 'family', and a one-time buyer has no subscriptions row at all, so even
-- a buyer who found their way to a logged-in session could not be fulfilled.
--
-- This table is the missing record of the purchase: one row per paid checkout session,
-- carrying the entitlement that scan-brokers now honours.
--
-- Idempotency is the reason for the UNIQUE on stripe_checkout_session_id. Stripe
-- redelivers checkout.session.completed on any non-2xx (and on manual replay), so the
-- webhook inserts with ON CONFLICT DO NOTHING: a second delivery must not create a second
-- entitlement, and -- just as important -- must not reset an already-consumed row back to
-- 'paid' and hand out a free second scan.

CREATE TABLE IF NOT EXISTS public.parent_scan_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Idempotency key. The checkout session id is what both the webhook and the
  -- /parents?purchase=success return URL carry, so it is the one identifier present on
  -- every path that could try to record this purchase.
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  -- The buyer (the adult child), resolved/provisioned by the webhook. Nullable because a
  -- guest checkout can land here before an auth user exists; purchaser_email is then the
  -- only handle we have and support can reconcile from it.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  purchaser_email TEXT,
  -- The parent's email typed into the form on /parents (metadata.parent_email). This is
  -- the subject of the scan, NOT the account owner.
  scan_target_email TEXT,
  affiliate_code TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT,
  -- 'paid'     -> entitlement is unspent; scan-brokers will let this user start one scan
  -- 'consumed' -> the scan it paid for has been started (see broker_scan_id)
  -- 'refunded' -> revoked by support/refund; never fulfils
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'consumed', 'refunded')),
  consumed_at TIMESTAMPTZ,
  broker_scan_id UUID REFERENCES public.broker_scans(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- scan-brokers looks up "does this user have an entitlement" on every request, including
-- every poll of a running scan, so the (user_id, status) lookup is the hot path.
CREATE INDEX IF NOT EXISTS idx_parent_scan_orders_user_status
  ON public.parent_scan_orders(user_id, status);
-- Support/reconciliation lookup when a guest checkout never got a user_id attached.
CREATE INDEX IF NOT EXISTS idx_parent_scan_orders_purchaser_email
  ON public.parent_scan_orders(lower(purchaser_email));

ALTER TABLE public.parent_scan_orders ENABLE ROW LEVEL SECURITY;

-- Buyers can see their own receipt/entitlement. Read-only: status transitions are a
-- fulfilment decision, never a client-side one, or the "one scan" would be self-service.
DROP POLICY IF EXISTS "Users view their own parent scan orders" ON public.parent_scan_orders;
CREATE POLICY "Users view their own parent scan orders"
  ON public.parent_scan_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- The webhook and scan-brokers both run with the service role. It bypasses RLS anyway;
-- this policy is stated explicitly so the intent survives a future FORCE ROW LEVEL SECURITY.
DROP POLICY IF EXISTS "Service role manages parent scan orders" ON public.parent_scan_orders;
CREATE POLICY "Service role manages parent scan orders"
  ON public.parent_scan_orders FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admins need to reconcile refunds and comp a re-scan after a failed fulfilment.
DROP POLICY IF EXISTS "Admins manage parent scan orders" ON public.parent_scan_orders;
CREATE POLICY "Admins manage parent scan orders"
  ON public.parent_scan_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS update_parent_scan_orders_updated_at ON public.parent_scan_orders;
CREATE TRIGGER update_parent_scan_orders_updated_at
  BEFORE UPDATE ON public.parent_scan_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
