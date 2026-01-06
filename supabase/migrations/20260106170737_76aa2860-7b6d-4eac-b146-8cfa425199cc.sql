-- Create enterprise leads table
CREATE TABLE public.enterprise_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  employees TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enterprise_leads ENABLE ROW LEVEL SECURITY;

-- Only admins can read leads
CREATE POLICY "Admins can read enterprise leads" 
ON public.enterprise_leads 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit enterprise leads" 
ON public.enterprise_leads 
FOR INSERT 
WITH CHECK (true);

-- Admins can update leads
CREATE POLICY "Admins can update enterprise leads" 
ON public.enterprise_leads 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_enterprise_leads_updated_at
BEFORE UPDATE ON public.enterprise_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();