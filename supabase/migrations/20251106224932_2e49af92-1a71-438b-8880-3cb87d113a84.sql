-- Create privacy_contacts table to store AI-discovered contact methods
CREATE TABLE public.privacy_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES public.service_catalog(id) ON DELETE CASCADE,
  source_url TEXT,
  contact_type TEXT NOT NULL CHECK (contact_type IN ('email', 'form', 'phone', 'other')),
  value TEXT NOT NULL,
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  reasoning TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  added_by TEXT NOT NULL CHECK (added_by IN ('ai', 'user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.privacy_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all privacy contacts"
  ON public.privacy_contacts
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert privacy contacts"
  ON public.privacy_contacts
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update privacy contacts"
  ON public.privacy_contacts
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete privacy contacts"
  ON public.privacy_contacts
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_privacy_contacts_service_id ON public.privacy_contacts(service_id);
CREATE INDEX idx_privacy_contacts_verified ON public.privacy_contacts(verified);

-- Add trigger for updated_at
CREATE TRIGGER update_privacy_contacts_updated_at
  BEFORE UPDATE ON public.privacy_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();