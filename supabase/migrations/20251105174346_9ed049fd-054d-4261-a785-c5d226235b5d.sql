-- Enable realtime for waitlist table
ALTER TABLE public.waitlist REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.waitlist;