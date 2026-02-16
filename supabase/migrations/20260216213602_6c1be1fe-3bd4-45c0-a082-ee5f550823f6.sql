-- Fix permissive public_results update policy: restrict to owner
DROP POLICY IF EXISTS "Users can update their own result stats" ON public.public_results;

CREATE POLICY "Users can update their own result stats"
ON public.public_results
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);