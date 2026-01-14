-- Add mock broker scan results for testing
INSERT INTO public.broker_scan_results (user_id, broker_id, status, profile_url, match_confidence, scanned_at)
VALUES 
  -- Found exposures (5 brokers)
  ('7b132505-9e2b-4a33-b7c7-7306a87f40fb', '49936628-bd2f-4e86-9fd9-517c3c6755be', 'found', 'https://beenverified.com/profile/riley-nocek', 0.85, now()),
  ('7b132505-9e2b-4a33-b7c7-7306a87f40fb', '03a0e01c-0775-4ad2-bea5-8e021d6902e1', 'found', 'https://spokeo.com/Riley-Nocek', 0.78, now()),
  ('7b132505-9e2b-4a33-b7c7-7306a87f40fb', '450d04e3-d97c-4878-8571-e2e99ae307d0', 'found', 'https://whitepages.com/name/riley-nocek', 0.92, now()),
  ('7b132505-9e2b-4a33-b7c7-7306a87f40fb', 'e54094de-c3a0-4dab-88f5-439efa575c8e', 'found', 'https://radaris.com/p/riley/nocek', 0.67, now()),
  ('7b132505-9e2b-4a33-b7c7-7306a87f40fb', '2dfdab2e-274e-43b1-aee3-ee799e844897', 'found', 'https://peoplefinders.com/profile/riley-nocek', 0.71, now()),
  -- Clean (no exposure found - 5 brokers)
  ('7b132505-9e2b-4a33-b7c7-7306a87f40fb', '40ac6925-51a8-4a40-b1bf-340d630356c8', 'clean', NULL, 0, now()),
  ('7b132505-9e2b-4a33-b7c7-7306a87f40fb', '3add73ab-c9e7-4ecb-8e62-e072e5e282b8', 'clean', NULL, 0, now()),
  ('7b132505-9e2b-4a33-b7c7-7306a87f40fb', 'e1ead6f1-471d-4b2b-b5c7-612866e76733', 'clean', NULL, 0, now()),
  ('7b132505-9e2b-4a33-b7c7-7306a87f40fb', '0d699cf9-4e80-4fcb-84fa-fb2a29c9baf5', 'clean', NULL, 0, now()),
  ('7b132505-9e2b-4a33-b7c7-7306a87f40fb', '18bf95c8-81ce-4132-9934-8e037ac06e7b', 'clean', NULL, 0, now());

-- Update the scan status to completed
UPDATE public.broker_scans 
SET 
  status = 'completed',
  started_at = now() - interval '2 minutes',
  completed_at = now(),
  scanned_count = 10,
  found_count = 5,
  clean_count = 5,
  updated_at = now()
WHERE id = 'f5a2074c-2593-4b1f-abb2-e6ab6d4e6417';