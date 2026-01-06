-- Add response tracking fields to deletion_requests table
ALTER TABLE public.deletion_requests 
ADD COLUMN IF NOT EXISTS response_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS response_type TEXT CHECK (response_type IN ('confirmed', 'denied', 'needs_info', 'partial', 'no_response')),
ADD COLUMN IF NOT EXISTS response_notes TEXT,
ADD COLUMN IF NOT EXISTS days_to_response INTEGER GENERATED ALWAYS AS (
  CASE 
    WHEN response_received_at IS NOT NULL AND created_at IS NOT NULL 
    THEN EXTRACT(DAY FROM (response_received_at - created_at))::INTEGER
    ELSE NULL
  END
) STORED,
ADD COLUMN IF NOT EXISTS follow_up_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_follow_up_at TIMESTAMP WITH TIME ZONE;

-- Create index for filtering by response status
CREATE INDEX IF NOT EXISTS idx_deletion_requests_response_type 
ON public.deletion_requests(response_type);

-- Create index for finding requests awaiting response
CREATE INDEX IF NOT EXISTS idx_deletion_requests_awaiting_response 
ON public.deletion_requests(created_at) 
WHERE response_received_at IS NULL AND status = 'sent';