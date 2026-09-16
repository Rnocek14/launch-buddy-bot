-- Clear phantom "clean" broker scan results.
--
-- scan-brokers looked every broker up in a hardcoded pattern map. Brokers missing from
-- that map returned status_v2 'not_found', which the persisting caller mapped to
-- status 'clean'. The result: brokers that were never contacted at all were written to
-- broker_scan_results as clean and shown to paying customers as "we checked, you're not
-- listed". The function no longer scans pattern-less brokers, but the rows written by
-- earlier runs are still in the table and still making that false claim.
--
-- Why DELETE rather than re-status:
--   * Every allowed status means something we cannot truthfully assert. 'error' implies
--     we tried and failed; 'pending'/'scanning' implies a scan is in flight and would
--     leave the progress UI waiting forever.
--   * broker_scan_results is upserted on (user_id, broker_id), so an absent row is the
--     accurate state ("never checked") and the next scan re-populates it honestly if
--     the broker ever gets a detection pattern.
--
-- Idempotent: re-running matches nothing once the phantom rows are gone.

DO $$
DECLARE
  -- The brokers with no detection pattern in scan-brokers/index.ts. Anything these
  -- rows claim about a user was never verified over the network.
  v_unscannable_slugs TEXT[] := ARRAY[
    '411', '411locate', 'absolutepeoplesearch', 'addresses', 'advancedbackgroundchecks',
    'arrests', 'backgroundcheckrun', 'beenverifiednow', 'callercenter', 'callersmart',
    'checkpeople', 'clubset', 'clustrmaps', 'homemetry', 'inforver', 'jailbase',
    'mantapro', 'mugshots', 'neighborwho', 'numberguru', 'peekyou',
    'peoplebackgroundcheck', 'peoplebyname', 'peoplefinderscan', 'peoplesearchnow',
    'peoplesmart', 'peoplewhiz', 'peoplewise', 'phonebooks', 'pipl', 'publicdatausa',
    'publicrecordsnow', 'quickpeoplesearch', 'rehold', 'reversephonelookup',
    'searchquarry', 'smartbackgroundchecks', 'socialcatfish', 'spydialer',
    'truthbeknown', 'truthrecord', 'usa-people-search', 'usrecordsearch', 'xlek',
    'yellowpages', 'zabasearch'
  ];
  -- Belt and braces: the 20 brokers that DO have a pattern. Listing them explicitly
  -- means a typo in the array above can never delete a genuinely scanned result.
  v_scannable_slugs TEXT[] := ARRAY[
    'beenverified', 'spokeo', 'whitepages', 'truepeoplesearch', 'fastpeoplesearch',
    'thatsthem', 'radaris', 'intelius', 'peoplefinders', 'usphonebook',
    'instantcheckmate', 'mylife', 'nuwber', 'familytreenow', 'peoplelooker',
    'truthfinder', 'searchpeoplefree', 'cocofinder', 'cyberbackgroundchecks',
    'voterrecords'
  ];
  v_deleted INTEGER;
BEGIN
  -- Only the false "not listed" claims are removed. A 'found' row came from somewhere
  -- other than this bug, and an 'opted_out' row records a real user action — both stay.
  DELETE FROM public.broker_scan_results bsr
  USING public.data_brokers db
  WHERE bsr.broker_id = db.id
    AND db.slug = ANY (v_unscannable_slugs)
    AND db.slug <> ALL (v_scannable_slugs)
    AND (bsr.status = 'clean' OR bsr.status_v2 = 'not_found');

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Removed % phantom clean broker_scan_results row(s)', v_deleted;
END $$;
