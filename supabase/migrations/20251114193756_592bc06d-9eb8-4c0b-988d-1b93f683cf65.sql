-- Fix Critical RLS Security Issues - Corrected
-- Phase 1: Security & Critical Fixes

-- 1. Enable RLS on discovery_quarantine_overrides
ALTER TABLE public.discovery_quarantine_overrides ENABLE ROW LEVEL SECURITY;

-- Add admin-only access policy for quarantine overrides
CREATE POLICY "Only admins can view quarantine overrides"
ON public.discovery_quarantine_overrides
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert quarantine overrides"
ON public.discovery_quarantine_overrides
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix email_preferences critical vulnerability - restrict updates properly
DROP POLICY IF EXISTS "Anyone can update preferences" ON public.email_preferences;

CREATE POLICY "Users can update preferences by email match"
ON public.email_preferences
FOR UPDATE
USING (
  email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())
);

-- Note: Views inherit RLS from their underlying tables, so no policies needed on views
-- The underlying tables (discovery_metrics, email_analytics, etc.) already have proper RLS