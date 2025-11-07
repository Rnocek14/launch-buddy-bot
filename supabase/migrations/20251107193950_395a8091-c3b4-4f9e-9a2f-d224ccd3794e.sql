-- Create table for manual contact submissions requiring admin approval
CREATE TABLE IF NOT EXISTS public.manual_contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.service_catalog(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('email', 'form', 'phone')),
  value TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.manual_contact_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view their own submissions"
ON public.manual_contact_submissions
FOR SELECT
USING (auth.uid() = submitted_by);

-- Users can create submissions
CREATE POLICY "Users can create submissions"
ON public.manual_contact_submissions
FOR INSERT
WITH CHECK (auth.uid() = submitted_by);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.manual_contact_submissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update submissions (for approval/rejection)
CREATE POLICY "Admins can update submissions"
ON public.manual_contact_submissions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_manual_submissions_service ON public.manual_contact_submissions(service_id);
CREATE INDEX idx_manual_submissions_status ON public.manual_contact_submissions(status);
CREATE INDEX idx_manual_submissions_submitted_by ON public.manual_contact_submissions(submitted_by);

-- Create trigger for updated_at
CREATE TRIGGER update_manual_contact_submissions_updated_at
BEFORE UPDATE ON public.manual_contact_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();