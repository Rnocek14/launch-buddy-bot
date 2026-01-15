-- Add manual_override column to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS manual_override boolean DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN public.subscriptions.manual_override IS 'When true, the check-subscription edge function will skip Stripe sync and use the database tier directly. For admin/testing purposes.';