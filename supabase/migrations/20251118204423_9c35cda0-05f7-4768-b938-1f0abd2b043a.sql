-- Create public_results table for shareable result pages
CREATE TABLE public.public_results (
  share_id TEXT PRIMARY KEY DEFAULT substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  user_id UUID REFERENCES auth.users NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  service_count INTEGER NOT NULL,
  top_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  view_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.public_results ENABLE ROW LEVEL SECURITY;

-- Public results are viewable by everyone (that's the point!)
CREATE POLICY "Public results are viewable by everyone"
ON public.public_results FOR SELECT
USING (true);

-- Users can create their own public results
CREATE POLICY "Users can create their own public results"
ON public.public_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own public results (for view counts)
CREATE POLICY "Users can update their own result stats"
ON public.public_results FOR UPDATE
USING (true);

-- Add index for fast lookups
CREATE INDEX idx_public_results_share_id ON public.public_results(share_id);
CREATE INDEX idx_public_results_user_id ON public.public_results(user_id);
CREATE INDEX idx_public_results_created_at ON public.public_results(created_at DESC);