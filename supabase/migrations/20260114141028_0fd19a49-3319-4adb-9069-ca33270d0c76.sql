-- Create exposure scans table to track scan jobs
CREATE TABLE public.exposure_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  search_params JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  sources_to_scan TEXT[] DEFAULT ARRAY['brokers', 'breaches', 'web_mentions'],
  sources_completed TEXT[] DEFAULT ARRAY[]::TEXT[],
  total_findings INT DEFAULT 0,
  critical_findings INT DEFAULT 0,
  high_findings INT DEFAULT 0,
  medium_findings INT DEFAULT 0,
  low_findings INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create exposure findings table to store all discovered exposures
CREATE TABLE public.exposure_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  scan_id UUID REFERENCES public.exposure_scans(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL, -- 'broker', 'search_engine', 'breach', 'social', 'web_mention'
  source_name TEXT NOT NULL, -- 'Spokeo', 'HaveIBeenPwned', 'Reddit', etc.
  url TEXT,
  title TEXT,
  snippet TEXT,
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  data_types_found TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['email', 'phone', 'address', 'photo']
  removal_difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'impossible'
  removal_url TEXT,
  removal_template_type TEXT, -- 'gdpr', 'ccpa', 'optout', 'dmca'
  status TEXT NOT NULL DEFAULT 'found', -- 'found', 'removal_requested', 'removed', 'dismissed'
  removal_requested_at TIMESTAMPTZ,
  removed_at TIMESTAMPTZ,
  found_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_exposure_scans_user_id ON public.exposure_scans(user_id);
CREATE INDEX idx_exposure_scans_status ON public.exposure_scans(status);
CREATE INDEX idx_exposure_findings_user_id ON public.exposure_findings(user_id);
CREATE INDEX idx_exposure_findings_scan_id ON public.exposure_findings(scan_id);
CREATE INDEX idx_exposure_findings_status ON public.exposure_findings(status);
CREATE INDEX idx_exposure_findings_severity ON public.exposure_findings(severity);
CREATE INDEX idx_exposure_findings_source_type ON public.exposure_findings(source_type);

-- Enable RLS
ALTER TABLE public.exposure_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exposure_findings ENABLE ROW LEVEL SECURITY;

-- RLS policies for exposure_scans
CREATE POLICY "Users can view their own exposure scans"
  ON public.exposure_scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exposure scans"
  ON public.exposure_scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exposure scans"
  ON public.exposure_scans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exposure scans"
  ON public.exposure_scans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for exposure_findings
CREATE POLICY "Users can view their own exposure findings"
  ON public.exposure_findings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exposure findings"
  ON public.exposure_findings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exposure findings"
  ON public.exposure_findings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exposure findings"
  ON public.exposure_findings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at on exposure_scans
CREATE TRIGGER update_exposure_scans_updated_at
  BEFORE UPDATE ON public.exposure_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on exposure_findings
CREATE TRIGGER update_exposure_findings_updated_at
  BEFORE UPDATE ON public.exposure_findings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();