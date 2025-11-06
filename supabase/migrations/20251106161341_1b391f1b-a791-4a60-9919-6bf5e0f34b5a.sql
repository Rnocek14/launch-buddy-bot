-- Add user_label column to unmatched_domains for custom tagging
ALTER TABLE public.unmatched_domains 
ADD COLUMN user_label text;

-- Create service_submissions table for users to submit new services for admin approval
CREATE TABLE public.service_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  domain text NOT NULL,
  suggested_name text NOT NULL,
  suggested_category text,
  email_from text NOT NULL,
  occurrence_count integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid
);

-- Enable RLS on service_submissions
ALTER TABLE public.service_submissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
ON public.service_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create submissions
CREATE POLICY "Users can create submissions"
ON public.service_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.service_submissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can update submissions (approve/reject)
CREATE POLICY "Admins can update submissions"
ON public.service_submissions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage service catalog
CREATE POLICY "Admins can insert services"
ON public.service_catalog
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update services"
ON public.service_catalog
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policy on unmatched_domains to allow updates
CREATE POLICY "Users can update own unmatched domains labels"
ON public.unmatched_domains
FOR UPDATE
USING (auth.uid() = user_id);