-- Add evidence column to exposure_findings for proper storage
ALTER TABLE public.exposure_findings
ADD COLUMN IF NOT EXISTS evidence text;