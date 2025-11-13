-- Create golden_runs table to track Golden-10 and Golden-25 baseline results
CREATE TABLE IF NOT EXISTS public.golden_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pass_rate_g10 NUMERIC,
  median_ms_g10 INTEGER,
  pass_rate_g25 NUMERIC,
  median_ms_g25 INTEGER,
  build_sha TEXT,
  build_ver TEXT
);

-- Enable RLS on golden_runs (public readable)
ALTER TABLE public.golden_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Golden runs are publicly readable"
  ON public.golden_runs
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert golden runs"
  ON public.golden_runs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Create public status snapshot RPC function
CREATE OR REPLACE FUNCTION public.public_status_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now               timestamptz := now();
  v_15m_ago           timestamptz := v_now - interval '15 minutes';
  v_24h_ago           timestamptz := v_now - interval '24 hours';

  -- T1 (method_used = 't1' or null)
  t1_pass_15m         numeric;
  t1_p95_15m          numeric;
  t1_pass_24h         numeric;
  t1_p95_24h          numeric;
  t1_precision_24h    numeric;
  t1_cache_rate_24h   numeric;

  -- T2
  t2_pass_24h         numeric;
  t2_p95_24h          numeric;
  t2_backlog_queued   integer;
  t2_backlog_running  integer;
  t2_backlog_failed   integer;

  -- Quarantine
  q_active_count      integer;

  -- Golden baselines
  g10_pass_rate       numeric;
  g10_median_ms       numeric;
  g25_pass_rate       numeric;
  g25_median_ms       numeric;
  g_last_run_at       timestamptz;

  -- Build meta
  meta_build_sha      text;
  meta_build_ver      text;

  -- Derived status
  overall_status      text;
  overall_message     text;
BEGIN
  ----------------------------------------------------------------
  -- T1 metrics
  ----------------------------------------------------------------
  SELECT
    round(avg((success)::int), 3) as pass_15m,
    percentile_cont(0.95) within group (order by time_ms) as p95_15m
  INTO t1_pass_15m, t1_p95_15m
  FROM discovery_metrics
  WHERE created_at >= v_15m_ago
    AND (method_used IS NULL OR method_used = 't1');

  SELECT
    round(avg((success)::int), 3) as pass_24h,
    percentile_cont(0.95) within group (order by time_ms) as p95_24h,
    round(avg((hit_in_top5)::int), 3) as precision_24h,
    round(avg((cache_hit)::int), 3) as cache_rate_24h
  INTO t1_pass_24h, t1_p95_24h, t1_precision_24h, t1_cache_rate_24h
  FROM discovery_metrics
  WHERE created_at >= v_24h_ago
    AND (method_used IS NULL OR method_used = 't1');

  ----------------------------------------------------------------
  -- T2 metrics
  ----------------------------------------------------------------
  SELECT
    round(avg((t2_success)::int), 3) as pass_24h,
    percentile_cont(0.95) within group (order by t2_time_ms) as p95_24h
  INTO t2_pass_24h, t2_p95_24h
  FROM discovery_metrics
  WHERE created_at >= v_24h_ago
    AND t2_used IS TRUE;

  SELECT
    sum(case when status = 'queued'  then 1 else 0 end) as queued,
    sum(case when status = 'running' then 1 else 0 end) as running,
    sum(case when status = 'failed'  then 1 else 0 end) as failed
  INTO t2_backlog_queued, t2_backlog_running, t2_backlog_failed
  FROM t2_retries;

  ----------------------------------------------------------------
  -- Quarantine
  ----------------------------------------------------------------
  SELECT count(*)::integer
  INTO q_active_count
  FROM discovery_quarantine
  WHERE until_at >= v_now;

  ----------------------------------------------------------------
  -- Golden baselines
  ----------------------------------------------------------------
  SELECT
    pass_rate_g10,
    median_ms_g10,
    pass_rate_g25,
    median_ms_g25,
    created_at
  INTO g10_pass_rate, g10_median_ms, g25_pass_rate, g25_median_ms, g_last_run_at
  FROM golden_runs
  ORDER BY created_at DESC
  LIMIT 1;

  ----------------------------------------------------------------
  -- Build metadata
  ----------------------------------------------------------------
  SELECT build_sha, build_ver
  INTO meta_build_sha, meta_build_ver
  FROM discovery_metrics
  WHERE build_sha IS NOT NULL OR build_ver IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  ----------------------------------------------------------------
  -- Derive overall status
  ----------------------------------------------------------------
  IF t1_pass_15m IS NULL THEN
    overall_status := 'unknown';
    overall_message := 'No recent traffic.';
  ELSE
    IF t1_pass_15m >= 0.85
       AND (t1_p95_15m IS NULL OR t1_p95_15m <= 3000)
       AND (t2_backlog_queued IS NULL OR t2_backlog_queued < 25)
    THEN
      overall_status := 'operational';
      overall_message := 'All systems functional.';
    ELSIF t1_pass_15m >= 0.70 THEN
      overall_status := 'degraded';
      overall_message := 'Experiencing elevated errors or latency.';
    ELSE
      overall_status := 'major_outage';
      overall_message := 'High error rate or latency.';
    END IF;
  END IF;

  ----------------------------------------------------------------
  -- Return JSON snapshot
  ----------------------------------------------------------------
  RETURN jsonb_build_object(
    'as_of',          v_now,
    'overall', jsonb_build_object(
      'status',   overall_status,
      'message',  overall_message
    ),
    't1', jsonb_build_object(
      'pass_15m',        t1_pass_15m,
      'p95_15m_ms',      t1_p95_15m,
      'pass_24h',        t1_pass_24h,
      'p95_24h_ms',      t1_p95_24h,
      'precision_24h',   t1_precision_24h,
      'cache_rate_24h',  t1_cache_rate_24h
    ),
    't2', jsonb_build_object(
      'pass_24h',         t2_pass_24h,
      'p95_24h_ms',       t2_p95_24h,
      'backlog', jsonb_build_object(
        'queued',  coalesce(t2_backlog_queued, 0),
        'running', coalesce(t2_backlog_running, 0),
        'failed',  coalesce(t2_backlog_failed, 0)
      )
    ),
    'quarantine', jsonb_build_object(
      'active_domains', coalesce(q_active_count, 0)
    ),
    'golden', jsonb_build_object(
      'g10_pass_rate', g10_pass_rate,
      'g10_median_ms', g10_median_ms,
      'g25_pass_rate', g25_pass_rate,
      'g25_median_ms', g25_median_ms,
      'last_run_at',   g_last_run_at
    ),
    'meta', jsonb_build_object(
      'build_sha', meta_build_sha,
      'build_ver', meta_build_ver
    )
  );
END;
$$;

-- Grant execute permissions
REVOKE ALL ON FUNCTION public.public_status_snapshot() FROM public;
GRANT EXECUTE ON FUNCTION public.public_status_snapshot() TO anon;
GRANT EXECUTE ON FUNCTION public.public_status_snapshot() TO authenticated;
GRANT EXECUTE ON FUNCTION public.public_status_snapshot() TO service_role;