-- Create data_brokers table for storing broker metadata
CREATE TABLE public.data_brokers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  website TEXT NOT NULL,
  search_url TEXT,
  opt_out_url TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('crucial', 'high', 'normal', 'low')),
  requires_captcha BOOLEAN DEFAULT false,
  requires_phone BOOLEAN DEFAULT false,
  requires_id BOOLEAN DEFAULT false,
  opt_out_difficulty TEXT DEFAULT 'easy' CHECK (opt_out_difficulty IN ('easy', 'medium', 'hard')),
  opt_out_time_estimate TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create broker_scan_results table for storing user scan results
CREATE TABLE public.broker_scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.data_brokers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'found', 'clean', 'error', 'opted_out')),
  profile_url TEXT,
  screenshot_url TEXT,
  match_confidence NUMERIC(3,2),
  error_message TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE,
  opted_out_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, broker_id)
);

-- Create broker_scans table for tracking scan sessions
CREATE TABLE public.broker_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_brokers INTEGER DEFAULT 0,
  scanned_count INTEGER DEFAULT 0,
  found_count INTEGER DEFAULT 0,
  clean_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_brokers (public read, admin write)
CREATE POLICY "Anyone can view active brokers" ON public.data_brokers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage brokers" ON public.data_brokers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for broker_scan_results (users see their own)
CREATE POLICY "Users can view their own scan results" ON public.broker_scan_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scan results" ON public.broker_scan_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scan results" ON public.broker_scan_results
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all scan results" ON public.broker_scan_results
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for broker_scans (users see their own)
CREATE POLICY "Users can view their own scans" ON public.broker_scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scans" ON public.broker_scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans" ON public.broker_scans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all scans" ON public.broker_scans
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Indexes for performance
CREATE INDEX idx_broker_scan_results_user_id ON public.broker_scan_results(user_id);
CREATE INDEX idx_broker_scan_results_status ON public.broker_scan_results(status);
CREATE INDEX idx_broker_scans_user_id ON public.broker_scans(user_id);
CREATE INDEX idx_broker_scans_status ON public.broker_scans(status);
CREATE INDEX idx_data_brokers_priority ON public.data_brokers(priority);

-- Trigger for updated_at
CREATE TRIGGER update_data_brokers_updated_at
  BEFORE UPDATE ON public.data_brokers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_scan_results_updated_at
  BEFORE UPDATE ON public.broker_scan_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_broker_scans_updated_at
  BEFORE UPDATE ON public.broker_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial brokers (top 20 from BADBOOL crucial/high priority)
INSERT INTO public.data_brokers (name, slug, website, search_url, opt_out_url, priority, opt_out_difficulty, opt_out_time_estimate, requires_captcha, requires_phone, requires_id, instructions) VALUES
('BeenVerified', 'beenverified', 'https://beenverified.com', 'https://www.beenverified.com/f/optout/search', 'https://www.beenverified.com/f/optout/search', 'crucial', 'easy', '24-48 hours', false, false, false, '1. Search for your name\n2. Find your listing and click "Opt Out"\n3. Enter your email for verification\n4. Click link in confirmation email'),
('Spokeo', 'spokeo', 'https://spokeo.com', 'https://www.spokeo.com/search', 'https://www.spokeo.com/optout', 'crucial', 'easy', '24-48 hours', false, false, false, '1. Search for your profile on Spokeo\n2. Copy the profile URL\n3. Go to optout page and paste URL\n4. Enter email and submit'),
('Whitepages', 'whitepages', 'https://whitepages.com', 'https://www.whitepages.com', 'https://www.whitepages.com/suppression-requests', 'crucial', 'medium', '24-48 hours', true, true, false, '1. Search for your listing\n2. Click on your profile\n3. Request removal\n4. Verify via phone call'),
('Intelius', 'intelius', 'https://intelius.com', 'https://www.intelius.com', 'https://www.intelius.com/opt-out', 'crucial', 'easy', '24-48 hours', false, false, false, '1. Go to opt-out page\n2. Enter your information\n3. Submit request\n4. Check email for confirmation'),
('TruePeopleSearch', 'truepeoplesearch', 'https://truepeoplesearch.com', 'https://www.truepeoplesearch.com', 'https://www.truepeoplesearch.com/removal', 'crucial', 'easy', '24-48 hours', false, false, false, '1. Find your listing\n2. Click "Remove This Record"\n3. Complete the removal form'),
('FastPeopleSearch', 'fastpeoplesearch', 'https://fastpeoplesearch.com', 'https://www.fastpeoplesearch.com', 'https://www.fastpeoplesearch.com/removal', 'crucial', 'easy', '24-48 hours', false, false, false, '1. Search for your record\n2. Click on your profile\n3. Click "Remove This Record"\n4. Confirm removal'),
('USPhonebook', 'usphonebook', 'https://usphonebook.com', 'https://www.usphonebook.com', 'https://www.usphonebook.com/opt-out', 'high', 'easy', '24-48 hours', false, false, false, '1. Search for your listing\n2. Click opt-out link\n3. Complete verification'),
('ThatsThem', 'thatsthem', 'https://thatsthem.com', 'https://thatsthem.com', 'https://thatsthem.com/optout', 'high', 'easy', '24-48 hours', true, false, false, '1. Go to opt-out page\n2. Enter your info\n3. Complete CAPTCHA\n4. Submit request'),
('Radaris', 'radaris', 'https://radaris.com', 'https://radaris.com', 'https://radaris.com/control/privacy', 'crucial', 'hard', '7-14 days', true, false, true, '1. Create account on Radaris\n2. Claim your profile\n3. Submit removal request\n4. May require ID verification'),
('PeopleFinders', 'peoplefinders', 'https://peoplefinders.com', 'https://www.peoplefinders.com', 'https://www.peoplefinders.com/opt-out', 'high', 'easy', '24-48 hours', false, false, false, '1. Find your listing\n2. Go to opt-out page\n3. Submit removal request'),
('InstantCheckmate', 'instantcheckmate', 'https://instantcheckmate.com', 'https://www.instantcheckmate.com', 'https://www.instantcheckmate.com/opt-out/', 'high', 'easy', '24-48 hours', false, false, false, '1. Search for your record\n2. Go to opt-out page\n3. Enter information\n4. Submit request'),
('MyLife', 'mylife', 'https://mylife.com', 'https://www.mylife.com', 'https://www.mylife.com/ccpa/index.pubview', 'crucial', 'hard', '30-45 days', true, true, false, '1. Search for your profile\n2. Submit CCPA removal request\n3. Verify identity via phone\n4. Wait for processing'),
('PeopleLooker', 'peoplelooker', 'https://peoplelooker.com', 'https://www.peoplelooker.com', 'https://www.peoplelooker.com/f/optout/search', 'high', 'easy', '24-48 hours', false, false, false, '1. Search for your listing\n2. Click opt-out\n3. Enter email\n4. Confirm via email'),
('TruthFinder', 'truthfinder', 'https://truthfinder.com', 'https://www.truthfinder.com', 'https://www.truthfinder.com/opt-out/', 'high', 'easy', '24-48 hours', false, false, false, '1. Go to opt-out page\n2. Enter your info\n3. Find and select your record\n4. Submit removal'),
('Nuwber', 'nuwber', 'https://nuwber.com', 'https://nuwber.com', 'https://nuwber.com/removal/link', 'high', 'easy', '24-48 hours', true, false, false, '1. Search for your profile\n2. Click "Remove My Info"\n3. Complete CAPTCHA\n4. Submit request'),
('SearchPeopleFree', 'searchpeoplefree', 'https://searchpeoplefree.com', 'https://www.searchpeoplefree.com', 'https://www.searchpeoplefree.com/opt-out', 'high', 'easy', '24-48 hours', false, false, false, '1. Find your listing\n2. Click remove\n3. Complete verification'),
('CocoFinder', 'cocofinder', 'https://cocofinder.com', 'https://cocofinder.com', 'https://cocofinder.com/remove-my-info', 'high', 'easy', '48-72 hours', true, false, false, '1. Search for your record\n2. Go to removal page\n3. Submit request with verification'),
('Cyberbackgroundchecks', 'cyberbackgroundchecks', 'https://cyberbackgroundchecks.com', 'https://www.cyberbackgroundchecks.com', 'https://www.cyberbackgroundchecks.com/removal', 'high', 'easy', '24-48 hours', false, false, false, '1. Find your profile\n2. Click remove\n3. Confirm removal request'),
('VoterRecords', 'voterrecords', 'https://voterrecords.com', 'https://voterrecords.com', 'https://voterrecords.com/optout', 'high', 'medium', '48-72 hours', false, false, false, '1. Search for your record\n2. Submit opt-out request\n3. May need to contact directly'),
('FamilyTreeNow', 'familytreenow', 'https://familytreenow.com', 'https://www.familytreenow.com', 'https://www.familytreenow.com/optout', 'high', 'easy', '24-48 hours', false, false, false, '1. Search for your profile\n2. Click opt-out\n3. Confirm your identity\n4. Submit removal');