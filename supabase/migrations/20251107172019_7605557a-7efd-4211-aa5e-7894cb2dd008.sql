-- Create bulk discovery jobs table
CREATE TABLE IF NOT EXISTS public.bulk_discovery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed')),
  total_services INTEGER NOT NULL DEFAULT 0,
  processed_services INTEGER NOT NULL DEFAULT 0,
  successful_discoveries INTEGER NOT NULL DEFAULT 0,
  failed_discoveries INTEGER NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(10, 2),
  actual_cost NUMERIC(10, 2),
  progress_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.bulk_discovery_jobs ENABLE ROW LEVEL SECURITY;

-- Admins can view all jobs
CREATE POLICY "Admins can view all bulk discovery jobs"
ON public.bulk_discovery_jobs
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can create jobs
CREATE POLICY "Admins can create bulk discovery jobs"
ON public.bulk_discovery_jobs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update jobs
CREATE POLICY "Admins can update bulk discovery jobs"
ON public.bulk_discovery_jobs
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_bulk_discovery_jobs_updated_at
BEFORE UPDATE ON public.bulk_discovery_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();