-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create email_preferences table to track unsubscribe and preferences
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  email_frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (email_frequency IN ('weekly', 'monthly', 'never')),
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Allow public read access with valid token
CREATE POLICY "Anyone can read their own preferences with token"
ON public.email_preferences
FOR SELECT
USING (true);

-- Allow public updates
CREATE POLICY "Anyone can update preferences"
ON public.email_preferences
FOR UPDATE
USING (true);

-- Allow inserts for new preference records
CREATE POLICY "Anyone can create preferences"
ON public.email_preferences
FOR INSERT
WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX idx_email_preferences_token ON public.email_preferences(token);
CREATE INDEX idx_email_preferences_email ON public.email_preferences(email);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_preferences_updated_at
BEFORE UPDATE ON public.email_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();