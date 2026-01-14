-- Delete old mock results and reset scan for fresh testing
DELETE FROM public.broker_scan_results WHERE user_id = '7b132505-9e2b-4a33-b7c7-7306a87f40fb';
DELETE FROM public.broker_scans WHERE user_id = '7b132505-9e2b-4a33-b7c7-7306a87f40fb';