UPDATE broker_scans 
SET status = 'completed', 
    scanned_count = 20, 
    found_count = 7, 
    clean_count = 4, 
    error_count = 9, 
    completed_at = now()
WHERE id = 'd6023624-7ea0-4583-8ec6-a9ab33c5001d';