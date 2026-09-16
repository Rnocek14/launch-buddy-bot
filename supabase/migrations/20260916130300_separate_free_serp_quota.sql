-- Give the free/anonymous broker check its own daily SERP budget, separate from the one
-- paying customers' scans spend from.
--
-- free-broker-check is deployed with verify_jwt = false. It checks no auth header, has no
-- captcha and no durable rate limit, and its consumeBudget() called consume_serp_quota() --
-- the SAME counter scan-brokers spends on behalf of Complete/Family customers, against the
-- SAME single 1000/day row in serp_usage_daily. So a loop of curl against the public
-- endpoint could drain the whole day's budget in minutes, and from then on every paying
-- customer's scan would take scan-brokers' budget_exhausted path and fall back to "manual
-- check recommended". Cheap anonymous traffic taking the paid product offline is the hole
-- this closes: after this migration the free path can only ever exhaust its own bucket.
--
-- Shape: a separate table and a separate function, rather than a bucket/kind column on
-- serp_usage_daily. `day` is that table's PRIMARY KEY, and consume_serp_quota() does
-- `SELECT searches_used, searches_limit INTO used, lim ... WHERE day = d FOR UPDATE` --
-- a second row per day would make that SELECT INTO pick an arbitrary bucket, and would
-- hand get_serp_budget_status() two rows where its callers expect one. The paid path is
-- load-bearing, so it is left exactly as it was: same table, same function, same
-- signature, same 1000/day cap. Nothing below touches it.
--
-- ============================================================================
-- OPERATOR: CHANGING THE FREE CAP
-- ============================================================================
-- The cap lives on the row, exactly like the paid table, and consume_free_serp_quota()
-- inserts each new day WITHOUT naming searches_limit so the COLUMN DEFAULT supplies it.
-- That makes the cap a one-line change, with no function edit and no redeploy:
--
--   -- every future day:
--   ALTER TABLE public.serp_free_usage_daily ALTER COLUMN searches_limit SET DEFAULT 400;
--   -- and today too, since today's row already exists carrying the old limit:
--   UPDATE public.serp_free_usage_daily SET searches_limit = 400 WHERE day = current_date;
--
-- Read it back with:  SELECT * FROM public.get_free_serp_budget_status();
--
-- Sizing the default: one free check is 6 brokers x at most 2 queries = at most 12 SERP
-- calls, and far fewer once serp_cache is warm, because free-broker-check consults the
-- cache BEFORE it consumes any budget. 200 is therefore ~16 completely cold checks a day
-- and many times that warm, while capping the free path's worst case at a fifth of the
-- paid budget's spend. Raise it if the free funnel is legitimately hitting the ceiling --
-- the point of this migration is that hitting it can no longer hurt a paying customer.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.serp_free_usage_daily (
  -- One row per UTC-ish calendar day. Same implicit daily reset as serp_usage_daily:
  -- there is no reset job, a new day simply gets a fresh row starting at 0.
  day DATE PRIMARY KEY,
  searches_used INT NOT NULL DEFAULT 0,
  -- Per-day copy of the cap, so changing the default only affects days not yet started
  -- and an operator can also grant a one-off bump for today alone.
  searches_limit INT NOT NULL DEFAULT 200,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Atomic consumption for the FREE/anonymous path only.
-- Deliberately a mirror of consume_serp_quota() rather than a refactor of it: the paid
-- function is the one thing here that must not change behaviour, so it is not touched.
CREATE OR REPLACE FUNCTION public.consume_free_serp_quota(p_count INT DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d DATE := current_date;
  used INT;
  lim INT;
BEGIN
  -- searches_limit is deliberately omitted so the column default applies. That is what
  -- makes the cap an ALTER ... SET DEFAULT for the operator instead of an edit in here.
  INSERT INTO public.serp_free_usage_daily(day)
  VALUES (d)
  ON CONFLICT (day) DO NOTHING;

  -- Row lock before the check, because free-broker-check fans its 6 brokers out with
  -- Promise.all: without FOR UPDATE, concurrent requests would read the same `used` and
  -- oversubscribe the cap -- which is the whole thing this bucket exists to prevent.
  SELECT searches_used, searches_limit INTO used, lim
  FROM public.serp_free_usage_daily WHERE day = d FOR UPDATE;

  IF used + p_count > lim THEN
    RETURN false;
  END IF;

  UPDATE public.serp_free_usage_daily
  SET searches_used = searches_used + p_count,
      updated_at = now()
  WHERE day = d;

  RETURN true;
END $$;

-- Operator/observability helper, mirroring get_serp_budget_status(). Returns no row
-- before the day's first free search, which is indistinguishable from 0 used.
CREATE OR REPLACE FUNCTION public.get_free_serp_budget_status()
RETURNS TABLE(day DATE, searches_used INT, searches_limit INT, remaining INT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    day,
    searches_used,
    searches_limit,
    GREATEST(0, searches_limit - searches_used) AS remaining
  FROM public.serp_free_usage_daily
  WHERE day = current_date;
$$;

-- Same lockdown as 20260115204303 applied to the paid counter: this table is spend
-- accounting for an endpoint anonymous callers can reach, so nothing but the edge
-- functions' service_role may read or move it.
ALTER TABLE public.serp_free_usage_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can read serp_free_usage_daily" ON public.serp_free_usage_daily;
CREATE POLICY "Service role can read serp_free_usage_daily"
  ON public.serp_free_usage_daily FOR SELECT
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can insert serp_free_usage_daily" ON public.serp_free_usage_daily;
CREATE POLICY "Service role can insert serp_free_usage_daily"
  ON public.serp_free_usage_daily FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update serp_free_usage_daily" ON public.serp_free_usage_daily;
CREATE POLICY "Service role can update serp_free_usage_daily"
  ON public.serp_free_usage_daily FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

REVOKE ALL ON TABLE public.serp_free_usage_daily FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.serp_free_usage_daily TO service_role;

-- The free bucket's RPC must be no more reachable than the paid one. anon holds the
-- publishable key that the free page already uses, so leaving EXECUTE on PUBLIC would let
-- a browser burn the free bucket by calling the RPC directly, bypassing the endpoint.
REVOKE ALL ON FUNCTION public.consume_free_serp_quota(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_free_serp_budget_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_free_serp_quota(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_free_serp_budget_status() TO service_role;
