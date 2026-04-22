
-- Track each alert email sent (used as the snapshot baseline for diffs)
CREATE TABLE public.exposure_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  new_broker_ids UUID[] NOT NULL DEFAULT '{}',
  new_breach_names TEXT[] NOT NULL DEFAULT '{}',
  new_broker_count INTEGER NOT NULL DEFAULT 0,
  new_breach_count INTEGER NOT NULL DEFAULT 0,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_error TEXT,
  trigger_source TEXT NOT NULL DEFAULT 'scheduled_rescan',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_exposure_alerts_user_sent ON public.exposure_alerts (user_id, sent_at DESC);

ALTER TABLE public.exposure_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exposure alerts"
ON public.exposure_alerts FOR SELECT
USING (auth.uid() = user_id);

-- Track which findings the user has already acknowledged (for NEW badges)
CREATE TABLE public.seen_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  finding_type TEXT NOT NULL CHECK (finding_type IN ('broker', 'breach')),
  finding_key TEXT NOT NULL,
  seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, finding_type, finding_key)
);

CREATE INDEX idx_seen_findings_user_type ON public.seen_findings (user_id, finding_type);

ALTER TABLE public.seen_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own seen findings"
ON public.seen_findings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their own findings as seen"
ON public.seen_findings FOR INSERT
WITH CHECK (auth.uid() = user_id);
