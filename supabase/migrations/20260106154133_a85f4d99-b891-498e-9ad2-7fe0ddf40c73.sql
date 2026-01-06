-- Add discovery_source column to track how services were discovered
ALTER TABLE user_services 
ADD COLUMN IF NOT EXISTS discovery_source TEXT DEFAULT 'email';

-- Create index for filtering by source
CREATE INDEX IF NOT EXISTS idx_user_services_discovery_source ON user_services(discovery_source);

-- Add comment for documentation
COMMENT ON COLUMN user_services.discovery_source IS 'How the service was discovered: email, extension, or manual';