
-- 1. Add missing telemetry columns to discovery_metrics
ALTER TABLE public.discovery_metrics
  ADD COLUMN IF NOT EXISTS urls_fetched integer,
  ADD COLUMN IF NOT EXISTS probe_used text,
  ADD COLUMN IF NOT EXISTS llm_calls integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS input_tokens integer,
  ADD COLUMN IF NOT EXISTS output_tokens integer,
  ADD COLUMN IF NOT EXISTS model_used text,
  ADD COLUMN IF NOT EXISTS browserless_used boolean DEFAULT false;

-- 2. Clean up bad data FIRST (before adding constraint)
-- Delete low-confidence contacts
DELETE FROM public.privacy_contacts WHERE confidence = 'low';

-- Delete hallucinated form URLs (validation failed)
DELETE FROM public.privacy_contacts
WHERE contact_type = 'form'
  AND reasoning LIKE '%URL validation failed%';

-- Delete privacy policy URLs stored as form contacts
DELETE FROM public.privacy_contacts
WHERE contact_type = 'form'
  AND value LIKE '%/privacy%'
  AND value NOT LIKE '%delete%'
  AND value NOT LIKE '%dsar%'
  AND value NOT LIKE '%request%'
  AND value NOT LIKE '%opt-out%'
  AND value NOT LIKE '%rights%';

-- Delete generic contact pages
DELETE FROM public.privacy_contacts
WHERE contact_type = 'form'
  AND (value LIKE '%/contact' OR value LIKE '%/contactus' OR value LIKE '%/contact-us')
  AND value NOT LIKE '%privacy%';

-- 3. NOW add strict CHECK constraint (no 'low' allowed)
ALTER TABLE public.privacy_contacts DROP CONSTRAINT IF EXISTS privacy_contacts_confidence_check;
ALTER TABLE public.privacy_contacts ADD CONSTRAINT privacy_contacts_confidence_check
  CHECK (confidence = ANY (ARRAY['high'::text, 'medium'::text]));
