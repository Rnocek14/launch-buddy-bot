-- Schedule the monthly rescan job to run on the 1st of each month at 3am UTC
-- This calls the scheduled-rescan edge function for Pro user email rescans
SELECT cron.schedule(
  'monthly-pro-rescan',
  '0 3 1 * *',
  $$
  SELECT
    net.http_post(
      url := 'https://gqxkeezkajkiyjpnjgkx.supabase.co/functions/v1/scheduled-rescan',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeGtlZXprYWpraXlqcG5qZ2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjM4NDYsImV4cCI6MjA3NzkzOTg0Nn0.64_sr6feszswWrxHBogLYLPZvlnibTY_7ZOFd1l1Vfw"}'::jsonb,
      body := '{"source": "cron"}'::jsonb
    ) AS request_id;
  $$
);