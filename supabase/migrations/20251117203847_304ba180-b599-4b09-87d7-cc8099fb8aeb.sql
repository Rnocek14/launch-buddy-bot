-- Add last_email_scan_date to profiles for incremental scanning
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_email_scan_date TIMESTAMPTZ;

-- Add reappeared_at to user_services to track when deleted services send emails again
ALTER TABLE public.user_services
ADD COLUMN IF NOT EXISTS reappeared_at TIMESTAMPTZ;

-- Add index for better query performance on new discoveries
CREATE INDEX IF NOT EXISTS idx_user_services_discovered_at 
ON public.user_services(user_id, discovered_at DESC);

-- Add index for deletion status queries
CREATE INDEX IF NOT EXISTS idx_user_services_deletion_requested 
ON public.user_services(user_id, deletion_requested_at) 
WHERE deletion_requested_at IS NOT NULL;