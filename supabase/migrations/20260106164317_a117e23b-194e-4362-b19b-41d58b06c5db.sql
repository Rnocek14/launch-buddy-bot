-- Fix 1: public_results UPDATE policy - restrict to own records only
DROP POLICY IF EXISTS "Users can update their own results" ON public.public_results;
CREATE POLICY "Users can update their own results" 
ON public.public_results 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix 2: t2_retries - remove public access, restrict to service role only
DROP POLICY IF EXISTS "Enable read access for all users" ON public.t2_retries;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.t2_retries;
DROP POLICY IF EXISTS "Enable update for all users" ON public.t2_retries;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.t2_retries;

-- Only service role can access t2_retries (no policies = service role only when RLS enabled)
-- RLS is already enabled, so removing all policies restricts to service role

-- Fix 3: alpha_applications - add rate limiting via trigger
CREATE OR REPLACE FUNCTION public.check_alpha_application_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Count applications from same email in last hour
  SELECT COUNT(*) INTO recent_count
  FROM public.alpha_applications
  WHERE email = NEW.email
  AND created_at > NOW() - INTERVAL '1 hour';
  
  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS alpha_application_rate_limit ON public.alpha_applications;
CREATE TRIGGER alpha_application_rate_limit
BEFORE INSERT ON public.alpha_applications
FOR EACH ROW
EXECUTE FUNCTION public.check_alpha_application_rate_limit();

-- Fix 4: discovery_metrics - add basic validation for inserts
DROP POLICY IF EXISTS "Enable insert for all users" ON public.discovery_metrics;
CREATE POLICY "Enable insert for authenticated users" 
ON public.discovery_metrics 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Fix 5: request_templates - restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can view request templates" ON public.request_templates;
CREATE POLICY "Authenticated users can view request templates" 
ON public.request_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);