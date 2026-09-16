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
-- Idempotent: both statements match on the exact state they remove, so a second run is a
-- no-op once the phantom rows are gone.

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
  v_repaired INTEGER;
BEGIN
  -- Only the false "not listed" claims are removed. Anything carrying a user action stays.
  --
  -- The status/status_v2 pair is matched with AND, not OR, and that matters. The two columns
  -- drift apart because several callers write one without the other:
  --   * src/pages/BrokerScan.tsx handleMarkFound      -> status='found',     status_v2 untouched
  --   * src/pages/BrokerScan.tsx handleMarkOptedOut   -> status='opted_out', status_v2 untouched
  -- A phantom row the user acted on therefore still carries status_v2='not_found', so an
  -- `OR status_v2 = 'not_found'` would delete exactly the rows this migration means to keep --
  -- including opted_out_at, which src/lib/brokerResultState.ts reads as confirmed removal and
  -- which the 30-day re-verification depends on. Matching both columns leaves those rows alone.
  --
  -- Nothing is lost by the narrower match: migration 20260115161545 backfilled
  -- status_v2='not_found' for every legacy status IN ('clean','not_found') row, so a phantom
  -- clean row always has both values, and the only writer that ever set status='clean' set
  -- status_v2='not_found' in the same upsert.
  --
  -- The timestamp guards catch the other drift case: RemediationSection.tsx and
  -- BrokerExposureSection.tsx set opt_out_started_at / opted_out_at without touching either
  -- status column, so a row can read 'clean' while recording a removal the user has started or
  -- completed. The clean claim on such a row is still false, but the removal record is real and
  -- irreplaceable, so the row survives; the next honest scan overwrites the status in place.
  DELETE FROM public.broker_scan_results bsr
  USING public.data_brokers db
  WHERE bsr.broker_id = db.id
    AND db.slug = ANY (v_unscannable_slugs)
    AND db.slug <> ALL (v_scannable_slugs)
    AND bsr.status = 'clean'
    AND bsr.status_v2 = 'not_found'
    AND bsr.opted_out_at IS NULL
    AND bsr.opt_out_started_at IS NULL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Removed % phantom clean broker_scan_results row(s)', v_deleted;

  -- Belt and braces for the one surviving combination that could still read as clean.
  -- handleMarkFound writes status='found' and leaves status_v2 alone, and
  -- src/lib/brokerResultState.ts tests status_v2 before it falls back to status -- so a row
  -- the user marked found would still be rendered "clear" off the stale status_v2. Repairing
  -- status_v2 to match the status the user already set asserts nothing new; it just stops the
  -- denormalised column from contradicting them. (Today the UI only offers "mark found" from
  -- the "couldn't check" list, which a phantom clean row never appeared in, so this should
  -- match nothing -- it is here so the migration's guarantee has no gap.)
  UPDATE public.broker_scan_results bsr
  SET status_v2 = 'found'
  FROM public.data_brokers db
  WHERE bsr.broker_id = db.id
    AND db.slug = ANY (v_unscannable_slugs)
    AND db.slug <> ALL (v_scannable_slugs)
    AND bsr.status = 'found'
    AND bsr.status_v2 = 'not_found';

  GET DIAGNOSTICS v_repaired = ROW_COUNT;
  RAISE NOTICE 'Repaired status_v2 on % user-reported found row(s)', v_repaired;
END $$;
