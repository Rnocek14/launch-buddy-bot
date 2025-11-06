-- Add INSERT policy for user_services table
CREATE POLICY "Users can insert own services"
ON public.user_services
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);