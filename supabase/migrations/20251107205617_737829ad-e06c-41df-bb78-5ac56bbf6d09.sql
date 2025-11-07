-- Add new columns for structured error handling in contact_discovery_failures
ALTER TABLE contact_discovery_failures
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS suggested_action TEXT CHECK (suggested_action IN ('manual_entry', 'try_again_later', 'contact_support', 'provide_url'));

-- Add index for error code lookups
CREATE INDEX IF NOT EXISTS idx_contact_discovery_failures_error_code 
ON contact_discovery_failures(error_code);

-- Add index for suggested action filtering
CREATE INDEX IF NOT EXISTS idx_contact_discovery_failures_suggested_action 
ON contact_discovery_failures(suggested_action);