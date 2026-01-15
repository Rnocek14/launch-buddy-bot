-- Add non-negative constraint for result_count
ALTER TABLE serp_requests_log
  ADD CONSTRAINT serp_requests_log_result_count_nonnegative
  CHECK (result_count IS NULL OR result_count >= 0);