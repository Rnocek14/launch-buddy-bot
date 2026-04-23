
-- 1. Add a "searchable" flag so enterprise/B2B aggregators don't count as scan errors
ALTER TABLE public.data_brokers
  ADD COLUMN IF NOT EXISTS is_searchable boolean NOT NULL DEFAULT true;

-- 2. Mark known enterprise/B2B aggregators as opt-out-only (no public people search)
UPDATE public.data_brokers
SET is_searchable = false
WHERE slug IN (
  'acxiom', 'epsilon', 'lexisnexis', 'zoominfo', 'apollo',
  'rocketreach', 'lead411', 'infotracer', 'idtrue', 'persopo',
  'publicrecords360'
);

-- 3. Backfill search URLs for existing brokers that are searchable but were missing one
UPDATE public.data_brokers SET search_url = 'https://www.411.info/people/{firstName}-{lastName}/{state}' WHERE slug = '411';
UPDATE public.data_brokers SET search_url = 'https://www.advancedbackgroundchecks.com/names/{firstName}-{lastName}/{state}' WHERE slug = 'advancedbackgroundchecks';
UPDATE public.data_brokers SET search_url = 'https://www.checkpeople.com/search?first={firstName}&last={lastName}&state={state}' WHERE slug = 'checkpeople';
UPDATE public.data_brokers SET search_url = 'https://clustrmaps.com/persons/{firstName}-{lastName}' WHERE slug = 'clustrmaps';
UPDATE public.data_brokers SET search_url = 'https://www.peekyou.com/{firstName}_{lastName}' WHERE slug = 'peekyou';
UPDATE public.data_brokers SET search_url = 'https://www.smartbackgroundchecks.com/people/{firstName}-{lastName}/{state}' WHERE slug = 'smartbackgroundchecks';
UPDATE public.data_brokers SET search_url = 'https://www.usa-people-search.com/names/{firstName}-{lastName}' WHERE slug = 'usa-people-search';
UPDATE public.data_brokers SET search_url = 'https://www.zabasearch.com/people/{firstName}+{lastName}/{state}/' WHERE slug = 'zabasearch';
UPDATE public.data_brokers SET search_url = 'https://www.addresses.com/people/{firstName}+{lastName}/{state}' WHERE slug = 'addresses';
UPDATE public.data_brokers SET search_url = 'https://www.peoplebyname.com/{lastName}/{firstName}/{state}.php' WHERE slug = 'peoplebyname';
UPDATE public.data_brokers SET search_url = 'https://www.peoplesearchnow.com/person/{firstName}-{lastName}/{state}' WHERE slug = 'peoplesearchnow';
UPDATE public.data_brokers SET search_url = 'https://www.publicrecordsnow.com/name/{firstName}-{lastName}/{state}' WHERE slug = 'publicrecordsnow';
UPDATE public.data_brokers SET search_url = 'https://www.xlek.com/{firstName}-{lastName}-{state}' WHERE slug = 'xlek';
UPDATE public.data_brokers SET search_url = 'https://www.yellowpages.com/{state}/people-search/{firstName}-{lastName}' WHERE slug = 'yellowpages';

-- 4. Add 32 new high-value brokers
INSERT INTO public.data_brokers (slug, name, website, search_url, opt_out_url, priority, opt_out_difficulty, is_active, is_searchable) VALUES
  ('pipl', 'Pipl', 'https://pipl.com', 'https://pipl.com/search/?q={firstName}+{lastName}+{state}', 'https://pipl.com/personal-information-removal-request', 'crucial', 'medium', true, true),
  ('rehold', 'Rehold', 'https://rehold.com', 'https://rehold.com/{firstName}+{lastName}/{state}', 'https://rehold.com/optout', 'high', 'easy', true, true),
  ('neighborwho', 'NeighborWho', 'https://www.neighborwho.com', 'https://www.neighborwho.com/people/{firstName}-{lastName}/{state}', 'https://www.neighborwho.com/app/optout', 'high', 'medium', true, true),
  ('spydialer', 'Spy Dialer', 'https://www.spydialer.com', 'https://www.spydialer.com/default.aspx?searchtype=name&fn={firstName}&ln={lastName}&st={state}', 'https://www.spydialer.com/optout.aspx', 'high', 'easy', true, true),
  ('backgroundcheckrun', 'BackgroundCheck.Run', 'https://backgroundcheck.run', 'https://backgroundcheck.run/people/{firstName}-{lastName}/{state}', 'https://backgroundcheck.run/optout', 'high', 'easy', true, true),
  ('usrecordsearch', 'US Records Search', 'https://www.usrecordsearch.com', 'https://www.usrecordsearch.com/people/{firstName}-{lastName}/{state}', 'https://www.usrecordsearch.com/optout', 'normal', 'medium', true, true),
  ('searchquarry', 'SearchQuarry', 'https://www.searchquarry.com', 'https://www.searchquarry.com/namesearch/?fn={firstName}&ln={lastName}&st={state}', 'https://www.searchquarry.com/optout/', 'normal', 'medium', true, true),
  ('peoplewhiz', 'PeopleWhiz', 'https://www.peoplewhiz.com', 'https://www.peoplewhiz.com/people/{firstName}-{lastName}/{state}', 'https://www.peoplewhiz.com/people-removal', 'high', 'easy', true, true),
  ('peoplewise', 'PeopleWise', 'https://peoplewise.com', 'https://peoplewise.com/people/{firstName}-{lastName}/{state}', 'https://peoplewise.com/optout', 'normal', 'easy', true, true),
  ('truthrecord', 'TruthRecord', 'https://www.truthrecord.org', 'https://www.truthrecord.org/people/{firstName}-{lastName}/{state}', 'https://www.truthrecord.org/optout', 'normal', 'medium', true, true),
  ('absolutepeoplesearch', 'Absolute People Search', 'https://www.absolutepeoplesearch.com', 'https://www.absolutepeoplesearch.com/p/{firstName}-{lastName}/{state}', 'https://www.absolutepeoplesearch.com/optout', 'normal', 'easy', true, true),
  ('peoplefinderscan', 'PeopleFinderScan', 'https://www.peoplefinderscan.com', 'https://www.peoplefinderscan.com/people/{firstName}-{lastName}/{state}', 'https://www.peoplefinderscan.com/optout', 'normal', 'easy', true, true),
  ('mantapro', 'Manta Pro', 'https://www.manta.com', 'https://www.manta.com/people/{firstName}-{lastName}', 'https://www.manta.com/help/contact', 'normal', 'medium', true, true),
  ('411locate', '411Locate', 'https://www.411locate.com', 'https://www.411locate.com/people/{firstName}-{lastName}/{state}', 'https://www.411locate.com/optout', 'normal', 'easy', true, true),
  ('peoplebackgroundcheck', 'PeopleBackgroundCheck', 'https://www.peoplebackgroundcheck.com', 'https://www.peoplebackgroundcheck.com/people/{firstName}-{lastName}/{state}', 'https://www.peoplebackgroundcheck.com/optout', 'normal', 'easy', true, true),
  ('inforver', 'Inforver', 'https://inforver.com', 'https://inforver.com/people/{firstName}-{lastName}/{state}', 'https://inforver.com/optout', 'normal', 'medium', true, true),
  ('quickpeoplesearch', 'QuickPeopleSearch', 'https://www.quickpeoplesearch.com', 'https://www.quickpeoplesearch.com/people/{firstName}-{lastName}/{state}', 'https://www.quickpeoplesearch.com/optout', 'normal', 'easy', true, true),
  ('peoplesmart', 'PeopleSmart', 'https://www.peoplesmart.com', 'https://www.peoplesmart.com/results/?fn={firstName}&ln={lastName}&st={state}', 'https://www.peoplesmart.com/optout-go', 'high', 'medium', true, true),
  ('publicdatausa', 'PublicDataUSA', 'https://www.publicdatausa.com', 'https://www.publicdatausa.com/people/{firstName}-{lastName}/{state}', 'https://www.publicdatausa.com/optout', 'normal', 'medium', true, true),
  ('mugshots', 'Mugshots.com', 'https://mugshots.com', 'https://mugshots.com/search.html?q={firstName}+{lastName}+{state}', 'https://mugshots.com/contact-us.html', 'crucial', 'hard', true, true),
  ('arrests', 'Arrests.org', 'https://arrests.org', 'https://arrests.org/?s={firstName}+{lastName}+{state}', 'https://arrests.org/contact-us/', 'crucial', 'hard', true, true),
  ('jailbase', 'JailBase', 'https://www.jailbase.com', 'https://www.jailbase.com/search/?fn={firstName}&ln={lastName}', 'https://www.jailbase.com/contact/', 'crucial', 'hard', true, true),
  ('homemetry', 'Homemetry', 'https://homemetry.com', 'https://homemetry.com/person/{firstName}+{lastName}', 'https://homemetry.com/control', 'high', 'medium', true, true),
  ('callercenter', 'CallerCenter', 'https://www.callercenter.com', 'https://www.callercenter.com/searchname.aspx?n={firstName}+{lastName}', 'https://www.callercenter.com/optout.aspx', 'normal', 'easy', true, true),
  ('callersmart', 'CallerSmart', 'https://www.callersmart.com', 'https://www.callersmart.com/people/{firstName}-{lastName}', 'https://www.callersmart.com/contact', 'normal', 'medium', true, true),
  ('numberguru', 'NumberGuru', 'https://www.numberguru.com', 'https://www.numberguru.com/people/{firstName}-{lastName}/{state}', 'https://www.numberguru.com/optout', 'normal', 'easy', true, true),
  ('reversephonelookup', 'ReversePhoneLookup', 'https://www.reversephonelookup.com', 'https://www.reversephonelookup.com/people/{firstName}-{lastName}/{state}', 'https://www.reversephonelookup.com/contact', 'normal', 'medium', true, true),
  ('phonebooks', 'Phonebooks', 'https://www.phonebooks.com', 'https://www.phonebooks.com/people/{firstName}-{lastName}/{state}', 'https://www.phonebooks.com/optout', 'normal', 'easy', true, true),
  ('clubset', 'ClubSet', 'https://clubset.com', 'https://clubset.com/people/{firstName}-{lastName}/{state}', 'https://clubset.com/optout', 'normal', 'easy', true, true),
  ('socialcatfish', 'Social Catfish', 'https://socialcatfish.com', 'https://socialcatfish.com/search/name/?fn={firstName}&ln={lastName}', 'https://socialcatfish.com/opt-out', 'high', 'medium', true, true),
  ('beenverifiednow', 'BeenVerifiedNow', 'https://www.beenverifiednow.com', 'https://www.beenverifiednow.com/people/{firstName}-{lastName}/{state}', 'https://www.beenverifiednow.com/optout', 'normal', 'easy', true, true),
  ('truthbeknown', 'TruthBeKnown', 'https://www.truthbeknown.com', 'https://www.truthbeknown.com/people/{firstName}-{lastName}/{state}', 'https://www.truthbeknown.com/optout', 'normal', 'easy', true, true)
ON CONFLICT (slug) DO NOTHING;

-- 5. Helpful index for the scanner's filter
CREATE INDEX IF NOT EXISTS idx_data_brokers_active_searchable
  ON public.data_brokers (priority, is_active, is_searchable)
  WHERE is_active = true;
