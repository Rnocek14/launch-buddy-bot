-- Probe metrics dashboard view
-- Daily rollup: pass rate, precision@5, p50/p95, vendor coverage

CREATE OR REPLACE VIEW probe_metrics_dashboard AS
WITH daily_data AS (
  SELECT
    date_trunc('day', created_at) AS day,
    success,
    COALESCE(hit_in_top5, false) AS hit_in_top5,
    time_ms,
    NULLIF(vendor, '') AS vendor
  FROM discovery_metrics
  WHERE created_at >= now() - INTERVAL '14 days'
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
  ROUND(AVG((dd.success)::int)::numeric, 3) AS pass_rate,
  ROUND(AVG((dd.hit_in_top5)::int)::numeric, 3) AS precision_at_5,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY dd.time_ms) AS p50_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY dd.time_ms) AS p95_ms,
  COUNT(*) AS n,
  jsonb_agg(
    jsonb_build_object('vendor', vc.v, 'count', vc.vn) 
    ORDER BY vc.vn DESC
  ) FILTER (WHERE vc.v IS NOT NULL) AS vendors
FROM daily_data dd
LEFT JOIN vendor_counts vc USING (day)
GROUP BY dd.day
ORDER BY dd.day DESC;

COMMENT ON VIEW probe_metrics_dashboard IS 'Daily probe metrics: pass rate, precision@5, latency percentiles, and vendor detection distribution for the last 14 days';