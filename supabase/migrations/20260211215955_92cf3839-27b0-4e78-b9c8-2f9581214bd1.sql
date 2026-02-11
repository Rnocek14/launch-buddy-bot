
-- Add opt_out_started_at to distinguish "user clicked remove" from "confirmed removed"
ALTER TABLE public.broker_scan_results
ADD COLUMN opt_out_started_at timestamp with time zone DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.broker_scan_results.opt_out_started_at IS 'Timestamp when user initiated the opt-out process (clicked Remove). Different from opted_out_at which means confirmed removal.';
