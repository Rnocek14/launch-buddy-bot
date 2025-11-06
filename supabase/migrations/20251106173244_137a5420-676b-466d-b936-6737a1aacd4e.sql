-- Phase 1: Core Deletion System Tables & Extensions (Fixed)

-- =============================================================================
-- 1. EXTEND EXISTING TABLES
-- =============================================================================

-- Add deletion-related columns to service_catalog
ALTER TABLE service_catalog 
  ADD COLUMN IF NOT EXISTS deletion_url TEXT,
  ADD COLUMN IF NOT EXISTS deletion_difficulty TEXT CHECK (deletion_difficulty IN ('easy', 'medium', 'hard', 'impossible')),
  ADD COLUMN IF NOT EXISTS deletion_method TEXT,
  ADD COLUMN IF NOT EXISTS privacy_email TEXT,
  ADD COLUMN IF NOT EXISTS privacy_form_url TEXT,
  ADD COLUMN IF NOT EXISTS deletion_instructions JSONB,
  ADD COLUMN IF NOT EXISTS requires_2fa BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gdpr_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS ccpa_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS justdelete_me_url TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;

-- Add deletion tracking to user_services
ALTER TABLE user_services 
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deletion_status TEXT CHECK (deletion_status IN ('active', 'deletion_pending', 'deleted', 'failed')),
  ADD COLUMN IF NOT EXISTS deletion_notes TEXT,
  ADD COLUMN IF NOT EXISTS marked_for_deletion BOOLEAN DEFAULT false;

-- =============================================================================
-- 2. NEW CORE TABLES
-- =============================================================================

-- Table: deletion_requests - Tracks all deletion requests made on behalf of users
CREATE TABLE IF NOT EXISTS deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES service_catalog(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('manual_link', 'email_sent', 'form_submitted', 'api_call')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'awaiting_verification', 'verified', 'completed', 'failed', 'rejected')),
  method TEXT,
  contact_email TEXT,
  request_body JSONB,
  response_data JSONB,
  verification_required BOOLEAN DEFAULT false,
  verification_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_deletion_requests_user ON deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_status ON deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_deletion_requests_service ON deletion_requests(service_id);

-- RLS for deletion_requests
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own deletion requests" ON deletion_requests;
CREATE POLICY "Users can view their own deletion requests"
  ON deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own deletion requests" ON deletion_requests;
CREATE POLICY "Users can create their own deletion requests"
  ON deletion_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own deletion requests" ON deletion_requests;
CREATE POLICY "Users can update their own deletion requests"
  ON deletion_requests FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all deletion requests" ON deletion_requests;
CREATE POLICY "Admins can view all deletion requests"
  ON deletion_requests FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: user_authorizations - Stores user consent to act as authorized agent
CREATE TABLE IF NOT EXISTS user_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  authorized_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  consent_version TEXT NOT NULL DEFAULT 'v1.0',
  jurisdiction TEXT,
  signature_data JSONB,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_authorizations_user ON user_authorizations(user_id);

-- RLS for user_authorizations
ALTER TABLE user_authorizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own authorization" ON user_authorizations;
CREATE POLICY "Users can view their own authorization"
  ON user_authorizations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own authorization" ON user_authorizations;
CREATE POLICY "Users can create their own authorization"
  ON user_authorizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all authorizations" ON user_authorizations;
CREATE POLICY "Admins can view all authorizations"
  ON user_authorizations FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Table: request_templates - Pre-built email/form templates for deletion requests
CREATE TABLE IF NOT EXISTS request_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('gdpr', 'ccpa', 'general_deletion', 'data_portability', 'do_not_sell')),
  subject_template TEXT,
  body_template TEXT NOT NULL,
  jurisdiction TEXT,
  legal_citations TEXT[],
  requires_fields TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- RLS for request_templates
ALTER TABLE request_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Templates are publicly readable" ON request_templates;
CREATE POLICY "Templates are publicly readable"
  ON request_templates FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage templates" ON request_templates;
CREATE POLICY "Admins can manage templates"
  ON request_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================================================
-- 3. DATABASE FUNCTIONS
-- =============================================================================

-- Function: Check if user is authorized agent
CREATE OR REPLACE FUNCTION is_authorized_agent(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_authorizations 
    WHERE user_id = user_uuid 
    AND revoked_at IS NULL
  );
END;
$$;

-- Trigger to update updated_at on deletion_requests
DROP TRIGGER IF EXISTS update_deletion_requests_updated_at ON deletion_requests;
CREATE TRIGGER update_deletion_requests_updated_at
  BEFORE UPDATE ON deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on request_templates
DROP TRIGGER IF EXISTS update_request_templates_updated_at ON request_templates;
CREATE TRIGGER update_request_templates_updated_at
  BEFORE UPDATE ON request_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();