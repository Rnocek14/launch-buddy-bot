-- Add encrypted columns for tokens (bytea type for encrypted data)
ALTER TABLE gmail_connections 
ADD COLUMN IF NOT EXISTS access_token_encrypted bytea,
ADD COLUMN IF NOT EXISTS refresh_token_encrypted bytea;

-- For now, keep plaintext columns to allow gradual migration
-- We'll handle encryption in the application layer (edge functions)
-- and remove plaintext columns after verifying encryption works

-- Add a flag to track which records are encrypted
ALTER TABLE gmail_connections
ADD COLUMN IF NOT EXISTS tokens_encrypted boolean DEFAULT false;

-- Add comments to document the encryption strategy
COMMENT ON COLUMN gmail_connections.access_token IS 'OAuth access token (will be deprecated, use access_token_encrypted)';
COMMENT ON COLUMN gmail_connections.refresh_token IS 'OAuth refresh token (will be deprecated, use refresh_token_encrypted)';
COMMENT ON COLUMN gmail_connections.access_token_encrypted IS 'Encrypted OAuth access token (AES-256-GCM)';
COMMENT ON COLUMN gmail_connections.refresh_token_encrypted IS 'Encrypted OAuth refresh token (AES-256-GCM)';
COMMENT ON COLUMN gmail_connections.tokens_encrypted IS 'Flag indicating whether tokens are stored encrypted';