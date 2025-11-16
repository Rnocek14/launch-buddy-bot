-- Phase 1: Rename gmail_connections to email_connections and add multi-provider support

-- Create provider enum
CREATE TYPE public.email_provider AS ENUM ('gmail', 'outlook');

-- Rename the table
ALTER TABLE public.gmail_connections RENAME TO email_connections;

-- Add new columns for multi-provider support
ALTER TABLE public.email_connections
ADD COLUMN provider public.email_provider NOT NULL DEFAULT 'gmail',
ADD COLUMN provider_user_id TEXT;

-- Update existing records to have provider set explicitly
UPDATE public.email_connections SET provider = 'gmail' WHERE provider IS NULL;

-- Create index for better query performance
CREATE INDEX idx_email_connections_user_provider ON public.email_connections(user_id, provider, is_primary);

-- Update RLS policies (drop old ones, create new ones with correct table name)
DROP POLICY IF EXISTS "Users can view their own Gmail connection" ON public.email_connections;
DROP POLICY IF EXISTS "Users can insert their own Gmail connection" ON public.email_connections;
DROP POLICY IF EXISTS "Users can update their own Gmail connection" ON public.email_connections;
DROP POLICY IF EXISTS "Users can delete their own Gmail connection" ON public.email_connections;

-- Create new RLS policies
CREATE POLICY "Users can view their own email connections"
ON public.email_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email connections"
ON public.email_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email connections"
ON public.email_connections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email connections"
ON public.email_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Add comment for documentation
COMMENT ON TABLE public.email_connections IS 'Stores OAuth connections for multiple email providers (Gmail, Outlook, etc.)';
COMMENT ON COLUMN public.email_connections.provider IS 'Email provider type (gmail, outlook)';
COMMENT ON COLUMN public.email_connections.provider_user_id IS 'Provider-specific user ID (e.g., Microsoft user ID for Outlook)';