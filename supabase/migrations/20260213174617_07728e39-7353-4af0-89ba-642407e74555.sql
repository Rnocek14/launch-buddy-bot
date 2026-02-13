CREATE OR REPLACE FUNCTION public.get_privacy_snapshot(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_count integer;
  v_new_since_last_scan integer;
  v_last_email_scan timestamptz;
  v_broker_status text;
  v_broker_found integer;
  v_broker_clean integer;
  v_broker_total integer;
  v_broker_last_scan timestamptz;
  v_broker_scan_started timestamptz;
  v_top_brokers jsonb;
  v_exposed_result_count integer;
  v_breach_total integer;
  v_breach_critical integer;
  v_breach_high integer;
  v_breach_last_scan timestamptz;
  v_overall_risk text;
BEGIN
  -- Hard auth guard: caller must be the user requesting their own data
  IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT last_email_scan_date INTO v_last_email_scan FROM profiles WHERE id = p_user_id;
  SELECT count(*)::integer INTO v_account_count FROM user_services WHERE user_id = p_user_id;

  IF v_last_email_scan IS NOT NULL THEN
    SELECT count(*)::integer INTO v_new_since_last_scan FROM user_services WHERE user_id = p_user_id AND discovered_at > v_last_email_scan;
  ELSE
    v_new_since_last_scan := 0;
  END IF;

  SELECT status, found_count, clean_count, total_brokers, completed_at, created_at
  INTO v_broker_status, v_broker_found, v_broker_clean, v_broker_total, v_broker_last_scan, v_broker_scan_started
  FROM broker_scans WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1;

  v_broker_found := coalesce(v_broker_found, 0);
  v_broker_clean := coalesce(v_broker_clean, 0);
  v_broker_total := coalesce(v_broker_total, 0);

  SELECT count(*)::integer INTO v_exposed_result_count FROM broker_scan_results WHERE user_id = p_user_id AND status_v2 IN ('found', 'possible_match');

  SELECT coalesce(jsonb_agg(row_to_json(t)::jsonb ORDER BY t.confidence DESC NULLS LAST), '[]'::jsonb)
  INTO v_top_brokers
  FROM (
    SELECT db.name, bsr.status_v2 AS status, bsr.confidence
    FROM broker_scan_results bsr
    JOIN data_brokers db ON db.id = bsr.broker_id
    WHERE bsr.user_id = p_user_id AND bsr.status_v2 IN ('found', 'possible_match')
    ORDER BY bsr.confidence DESC NULLS LAST
    LIMIT 3
  ) t;

  SELECT total_findings, critical_findings, high_findings, completed_at
  INTO v_breach_total, v_breach_critical, v_breach_high, v_breach_last_scan
  FROM exposure_scans WHERE user_id = p_user_id ORDER BY created_at DESC LIMIT 1;

  v_breach_total := coalesce(v_breach_total, 0);
  v_breach_critical := coalesce(v_breach_critical, 0);
  v_breach_high := coalesce(v_breach_high, 0);

  IF v_broker_status IN ('running', 'pending') THEN
    v_overall_risk := 'pending';
  ELSIF v_breach_critical > 0 THEN
    v_overall_risk := 'high';
  ELSIF v_broker_found > 0 THEN
    v_overall_risk := 'high';
  ELSIF v_breach_high > 0 THEN
    v_overall_risk := 'moderate';
  ELSIF v_account_count > 40 THEN
    v_overall_risk := 'moderate';
  ELSE
    v_overall_risk := 'low';
  END IF;

  RETURN jsonb_build_object(
    'accounts', jsonb_build_object('count', v_account_count, 'new_since_last_scan', v_new_since_last_scan, 'last_scan', v_last_email_scan),
    'brokers', jsonb_build_object('status', v_broker_status, 'found', v_broker_found, 'exposed_result_count', v_exposed_result_count, 'total_checked', v_broker_total, 'last_scan', v_broker_last_scan, 'scan_started', v_broker_scan_started, 'top_brokers', v_top_brokers),
    'breaches', jsonb_build_object('total', v_breach_total, 'critical', v_breach_critical, 'high', v_breach_high, 'last_scan', v_breach_last_scan),
    'overall_risk', v_overall_risk
  );
END;
$$;