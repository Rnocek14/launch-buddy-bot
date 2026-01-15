-- Phase 1.1 Security Patch: Lock down function execution privileges

-- Revoke public execute on SERP budget functions
REVOKE ALL ON FUNCTION consume_serp_quota(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_serp_budget_status() FROM PUBLIC;

-- Grant execute only to service_role (Edge Functions)
GRANT EXECUTE ON FUNCTION consume_serp_quota(int) TO service_role;
GRANT EXECUTE ON FUNCTION get_serp_budget_status() TO service_role;

-- Double-check table privilege revocations (belt-and-suspenders)
REVOKE ALL ON TABLE serp_usage_daily FROM anon, authenticated;
REVOKE ALL ON TABLE serp_requests_log FROM anon, authenticated;

-- Ensure service_role has proper table access
GRANT SELECT, INSERT, UPDATE ON serp_usage_daily TO service_role;
GRANT SELECT, INSERT ON serp_requests_log TO service_role;