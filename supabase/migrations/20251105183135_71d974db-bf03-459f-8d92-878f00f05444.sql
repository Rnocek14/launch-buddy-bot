-- Create enum for application status
CREATE TYPE public.alpha_status AS ENUM ('pending', 'approved', 'rejected');

-- Create alpha_applications table
CREATE TABLE public.alpha_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  current_tools TEXT,
  use_case TEXT NOT NULL,
  platform_preferences TEXT[] DEFAULT '{}',
  status alpha_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.alpha_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit applications
CREATE POLICY "Anyone can submit alpha applications"
ON public.alpha_applications
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own applications
CREATE POLICY "Users can view their own applications"
ON public.alpha_applications
FOR SELECT
USING (true);

-- Only admins can update applications
CREATE POLICY "Admins can manage all applications"
ON public.alpha_applications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create index for faster email lookups
CREATE INDEX idx_alpha_applications_email ON public.alpha_applications(email);
CREATE INDEX idx_alpha_applications_status ON public.alpha_applications(status);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_alpha_applications_updated_at
BEFORE UPDATE ON public.alpha_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();