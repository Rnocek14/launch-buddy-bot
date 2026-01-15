-- Add extracted_data column to store parsed broker information
ALTER TABLE public.broker_scan_results 
ADD COLUMN IF NOT EXISTS extracted_data JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.broker_scan_results.extracted_data IS 'Structured data extracted from broker: { name, age, addresses[], phone_numbers[], emails[], relatives[] }';