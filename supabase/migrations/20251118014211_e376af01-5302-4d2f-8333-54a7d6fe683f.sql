-- Explicitly set all views to SECURITY INVOKER to fix linter warnings
-- PostgreSQL defaults to SECURITY INVOKER for views, but we'll be explicit

-- Recreate discovery_alerts_24h with explicit SECURITY INVOKER
CREATE OR REPLACE VIEW public.discovery_alerts_24h 
WITH (security_invoker=true) AS
WITH w AS (
  SELECT now() - interval '24 hours' AS since
),
base AS (
  SELECT
    success,
    time_ms,
    error_code,
    vendor,
    created_at
  FROM discovery_metrics, w
  WHERE created_at >= w.since
)
SELECT
  COALESCE(ROUND(AVG(success::int), 3), 0) AS pass_rate_24h,
  COALESCE(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY time_ms), 0) AS p95_ms_24h,
  (
    SELECT jsonb_agg(t.ec ORDER BY t.n DESC)
    FROM (
      SELECT
        error_code AS ec,
        COUNT(*) AS n
      FROM base
      WHERE NOT success AND error_code IS NOT NULL
      GROUP BY error_code
      ORDER BY COUNT(*) DESC
      LIMIT 5
    ) t
  ) AS top_errors_24h
FROM base;

-- Recreate discovery_metrics_summary with explicit SECURITY INVOKER
CREATE OR REPLACE VIEW public.discovery_metrics_summary
WITH (security_invoker=true) AS
SELECT
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) AS total_requests,
  AVG(time_ms)::int AS avg_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY time_ms)::int AS p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY time_ms)::int AS p95_ms,
  (AVG(CASE WHEN success THEN 1 ELSE 0 END) * 100)::numeric(5,2) AS pass_rate,
  COUNT(DISTINCT domain) AS unique_domains,
  SUM(CASE WHEN policy_type = 'pdf' THEN 1 ELSE 0 END) AS pdf_count,
  SUM(CASE WHEN policy_type = 'html' THEN 1 ELSE 0 END) AS html_count
FROM discovery_metrics
WHERE created_at > now() - interval '7 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY DATE_TRUNC('day', created_at) DESC;

-- Recreate probe_metrics_dashboard with explicit SECURITY INVOKER
CREATE OR REPLACE VIEW public.probe_metrics_dashboard
WITH (security_invoker=true) AS
WITH daily_data AS (
  SELECT
    DATE_TRUNC('day', created_at) AS day,
    success,
    COALESCE(hit_in_top5, false) AS hit_in_top5,
    time_ms,
    NULLIF(vendor, '') AS vendor
  FROM discovery_metrics
  WHERE created_at >= now() - interval '14 days'
),
vendor_counts AS (
  SELECT
    day,
    vendor AS v,
    COUNT(*) AS vn
  FROM daily_data
  GROUP BY day, vendor
)
SELECT
  dd.day,
  ROUND(AVG(dd.success::int), 3) AS pass_rate,
  ROUND(AVG(dd.hit_in_top5::int), 3) AS precision_at_5,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY dd.time_ms) AS p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY dd.time_ms) AS p95_ms,
  COUNT(*) AS n,
  jsonb_agg(jsonb_build_object('vendor', vc.v, 'count', vc.vn) ORDER BY vc.vn DESC) FILTER (WHERE vc.v IS NOT NULL) AS vendors
FROM daily_data dd
LEFT JOIN vendor_counts vc USING (day)
GROUP BY dd.day
ORDER BY dd.day DESC;

COMMENT ON VIEW public.discovery_alerts_24h IS 'Real-time alerts view with SECURITY INVOKER';
COMMENT ON VIEW public.discovery_metrics_summary IS 'Metrics summary view with SECURITY INVOKER';
COMMENT ON VIEW public.probe_metrics_dashboard IS 'Probe metrics dashboard with SECURITY INVOKER';