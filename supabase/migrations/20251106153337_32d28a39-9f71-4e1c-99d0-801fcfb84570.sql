-- Fix alpha_applications SELECT policy to restrict to admins only
DROP POLICY IF EXISTS "Users can view their own applications" ON public.alpha_applications;

CREATE POLICY "Only admins can view applications"
ON public.alpha_applications
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix email_preferences SELECT policy to restrict to authenticated users
DROP POLICY IF EXISTS "Anyone can read their own preferences with token" ON public.email_preferences;

CREATE POLICY "Users can view own preferences by email"
ON public.email_preferences
FOR SELECT
TO authenticated
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);