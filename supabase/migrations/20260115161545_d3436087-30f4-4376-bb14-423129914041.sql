-- Add diagnostic and confidence columns to broker_scan_results

ALTER TABLE broker_scan_results
  ADD COLUMN IF NOT EXISTS status_v2 TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS error_code TEXT,
  ADD COLUMN IF NOT EXISTS http_status INT,
  ADD COLUMN IF NOT EXISTS error_detail TEXT,
  ADD COLUMN IF NOT EXISTS detection_method TEXT NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS confidence NUMERIC,
  ADD COLUMN IF NOT EXISTS confidence_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS evidence_snippet TEXT,
  ADD COLUMN IF NOT EXISTS evidence_url TEXT;

-- Backfill from legacy status column
UPDATE broker_scan_results
SET status_v2 = CASE
  WHEN status IN ('found', 'exposed') THEN 'found'
  WHEN status IN ('clean', 'not_found') THEN 'not_found'
  WHEN status = 'error' THEN 'request_failed'
  ELSE 'unknown'
END
WHERE status_v2 = 'unknown';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_broker_scan_results_status_v2
  ON broker_scan_results(status_v2);

CREATE INDEX IF NOT EXISTS idx_broker_scan_results_method
  ON broker_scan_results(detection_method);