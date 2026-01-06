-- Add last_auto_rescan_at column to profiles for tracking automated rescans
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_auto_rescan_at TIMESTAMPTZ;

-- Create index for efficient querying of Pro users due for rescan
CREATE INDEX IF NOT EXISTS idx_profiles_last_auto_rescan 
ON public.profiles (last_auto_rescan_at);

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.last_auto_rescan_at IS 'Timestamp of last automated monthly rescan for Pro users';