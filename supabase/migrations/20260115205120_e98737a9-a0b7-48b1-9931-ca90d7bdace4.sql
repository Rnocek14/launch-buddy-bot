-- Add result_count column for cleaner analytics
ALTER TABLE serp_requests_log ADD COLUMN IF NOT EXISTS result_count integer;

-- Add comment for clarity
COMMENT ON COLUMN serp_requests_log.result_count IS 'Number of SERP results returned, null for skipped/error';
COMMENT ON COLUMN serp_requests_log.response_hash IS 'Hash of top result URLs for deduplication analysis';