-- Create enum for identifier types
CREATE TYPE identifier_type AS ENUM ('email', 'phone', 'username', 'other');

-- Create the user_identifiers table
CREATE TABLE public.user_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type identifier_type NOT NULL,
  value text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'manual',
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, type, value)
);

-- Enable RLS
ALTER TABLE public.user_identifiers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own identifiers"
  ON public.user_identifiers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own identifiers"
  ON public.user_identifiers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own identifiers"
  ON public.user_identifiers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own identifiers"
  ON public.user_identifiers
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_identifiers_updated_at
  BEFORE UPDATE ON public.user_identifiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Constraint: Only one primary identifier per type per user
CREATE UNIQUE INDEX idx_user_identifiers_primary_type 
  ON public.user_identifiers(user_id, type) 
  WHERE is_primary = true;

-- Add new columns to deletion_requests table
ALTER TABLE public.deletion_requests 
ADD COLUMN identifier_used_id uuid REFERENCES public.user_identifiers(id) ON DELETE SET NULL,
ADD COLUMN identifier_used_value text,
ADD COLUMN identifier_used_type identifier_type;

-- Create index for performance
CREATE INDEX idx_deletion_requests_identifier ON public.deletion_requests(identifier_used_id);

-- Initialize primary email identifiers for existing users
INSERT INTO public.user_identifiers (user_id, type, value, is_primary, source, verified)
SELECT 
  p.id,
  'email'::identifier_type,
  p.email,
  true,
  'manual',
  true
FROM public.profiles p
WHERE p.email IS NOT NULL
ON CONFLICT (user_id, type, value) DO NOTHING;