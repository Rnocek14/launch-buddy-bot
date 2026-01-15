-- Delete old broker scan data to allow fresh scans
DELETE FROM public.broker_scan_results WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('rnocek14@gmail.com', 'rileynocek663@gmail.com', 'olineflips@hotmail.com')
);

DELETE FROM public.broker_scans WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('rnocek14@gmail.com', 'rileynocek663@gmail.com', 'olineflips@hotmail.com')
);