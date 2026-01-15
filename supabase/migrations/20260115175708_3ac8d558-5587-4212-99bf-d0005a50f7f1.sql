-- Add scoring version and evidence query columns for audit trail
ALTER TABLE public.broker_scan_results
ADD COLUMN IF NOT EXISTS scoring_version text,
ADD COLUMN IF NOT EXISTS evidence_query text;