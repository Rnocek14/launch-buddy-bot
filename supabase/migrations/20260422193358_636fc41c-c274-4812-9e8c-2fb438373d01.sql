-- Allow anonymous and authenticated users to insert analytics events
-- (events are write-only to public; only admins can read them back)
DROP POLICY IF EXISTS "Service role can insert analytics events" ON public.analytics_events;

CREATE POLICY "Anyone can insert analytics events"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (true);