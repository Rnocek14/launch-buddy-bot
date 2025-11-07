-- Phase 1: Add contact verification tracking

-- Add verification columns to service_catalog
ALTER TABLE service_catalog 
ADD COLUMN IF NOT EXISTS contact_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contact_quality_score INTEGER DEFAULT 0 CHECK (contact_quality_score >= 0 AND contact_quality_score <= 100);

-- Add verification columns to privacy_contacts
ALTER TABLE privacy_contacts 
ADD COLUMN IF NOT EXISTS mx_validated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN service_catalog.contact_verified IS 'Whether the privacy contact has been verified as working';
COMMENT ON COLUMN service_catalog.contact_quality_score IS 'Quality score 0-100 based on verification, success rate, etc';
COMMENT ON COLUMN privacy_contacts.mx_validated IS 'Whether the email has passed MX record validation';
COMMENT ON COLUMN privacy_contacts.last_validated_at IS 'Last time this contact was validated';