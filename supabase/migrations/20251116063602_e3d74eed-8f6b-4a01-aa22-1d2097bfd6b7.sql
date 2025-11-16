-- Enable multiple Gmail accounts per user
-- Remove unique constraint on user_id to allow multiple connections
ALTER TABLE gmail_connections 
  DROP CONSTRAINT IF EXISTS gmail_connections_user_id_key;

-- Add columns for multi-account support
ALTER TABLE gmail_connections
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_label TEXT;

-- Create unique constraint: only one primary account per user
CREATE UNIQUE INDEX IF NOT EXISTS gmail_connections_user_primary_idx 
  ON gmail_connections(user_id) 
  WHERE is_primary = true;

-- Add composite index for faster lookups
CREATE INDEX IF NOT EXISTS gmail_connections_user_email_idx 
  ON gmail_connections(user_id, email);

-- Set existing connections as primary (migration helper)
UPDATE gmail_connections
SET is_primary = true,
    account_label = email
WHERE is_primary IS NULL OR is_primary = false;

-- Add optional column to track which account discovered each service
ALTER TABLE user_services
  ADD COLUMN IF NOT EXISTS discovered_from_connection_id UUID REFERENCES gmail_connections(id);