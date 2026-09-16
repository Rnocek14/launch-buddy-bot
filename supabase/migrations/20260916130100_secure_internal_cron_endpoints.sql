-- Re-point the monthly Pro rescan cron job at the now-authenticated scheduled-rescan
-- endpoint.
--
-- scheduled-rescan builds a service-role client and spends real money on every hit
-- (Gmail/Outlook API calls, token refreshes, Resend sends), and it was reachable by
-- anyone who knew the URL. It now requires the same `x-email-secret` header that
-- send-welcome-email checks, so the job scheduled in
-- 20260106153308_d0b3793e-237b-4fcc-af6b-4db676ff4284.sql would start getting 403s.
-- Unschedule it and schedule it again with the header attached.
--
-- ============================================================================
-- OPERATOR ACTION REQUIRED BEFORE (OR IMMEDIATELY AFTER) APPLYING THIS MIGRATION
-- ============================================================================
-- The secret is deliberately NOT hardcoded here — migrations are committed to git.
-- It is read at job runtime from a database-level setting, the same mechanism
-- send_welcome_email_trigger() already uses (see 20251106155059_*.sql). Set it once,
-- to the exact value of the EMAIL_SECRET secret configured on the edge functions:
--
--   ALTER DATABASE postgres SET app.settings.email_secret = '<EMAIL_SECRET value>';
--
-- If that setting is missing, current_setting() below raises rather than silently
-- posting an empty header: a hard error lands in cron.job_run_details, whereas a
-- silent 403 would only show up as a rescan that quietly never ran again.
-- Verify after applying with:
--
--   SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'monthly-pro-rescan';
--   SELECT status, return_message FROM cron.job_run_details
--     WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'monthly-pro-rescan')
--     ORDER BY start_time DESC LIMIT 5;
-- ============================================================================

-- Drop by lookup rather than cron.unschedule('monthly-pro-rescan') directly, which
-- errors when the job is absent (e.g. a fresh database replaying all migrations).
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'monthly-pro-rescan';

-- Same schedule and body as the original job; only the headers change. The anon-key
-- Authorization header is kept so the functions gateway still routes the request.
SELECT cron.schedule(
  'monthly-pro-rescan',
  '0 3 1 * *',
  $$
  SELECT
    net.http_post(
      url := 'https://gqxkeezkajkiyjpnjgkx.supabase.co/functions/v1/scheduled-rescan',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeGtlZXprYWpraXlqcG5qZ2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjM4NDYsImV4cCI6MjA3NzkzOTg0Nn0.64_sr6feszswWrxHBogLYLPZvlnibTY_7ZOFd1l1Vfw',
        'x-email-secret', current_setting('app.settings.email_secret')
      ),
      body := '{"source": "cron"}'::jsonb
    ) AS request_id;
  $$
);

-- Note: send-exposure-alert has no cron job of its own — it is only ever invoked
-- from scan-brokers and scheduled-rescan — so there is nothing to reschedule for it.
-- The 'monthly-discovery-report' job (20260416145531_*.sql) targets
-- send-monthly-discovery-report, a different function, and is intentionally untouched.
