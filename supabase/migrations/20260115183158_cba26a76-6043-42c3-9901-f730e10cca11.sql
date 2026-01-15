-- Add audit columns for override tracking
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS override_reason text,
ADD COLUMN IF NOT EXISTS overridden_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS overridden_at timestamptz;

-- Comment the audit columns
COMMENT ON COLUMN public.subscriptions.override_reason IS 'Reason for the manual override (e.g., "Internal testing", "Comp account")';
COMMENT ON COLUMN public.subscriptions.overridden_by IS 'User ID of admin who set the override';
COMMENT ON COLUMN public.subscriptions.overridden_at IS 'Timestamp when override was set';

-- Drop any existing permissive policies on subscriptions
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;

-- Users can only READ their own subscription
CREATE POLICY "Users can read own subscription"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Block ALL user updates - only service role can update
-- This prevents privilege escalation via manual_override or tier
CREATE POLICY "Block user updates"
ON public.subscriptions
FOR UPDATE
TO authenticated
USING (false);

-- Block user inserts - subscriptions created by edge functions with service role
CREATE POLICY "Block user inserts"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (false);

-- Allow service role full access (for edge functions)
-- Note: Service role bypasses RLS by default, but explicit policy for clarity
CREATE POLICY "Service role manages subscriptions"
ON public.subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);