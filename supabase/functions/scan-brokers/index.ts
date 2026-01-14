import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Broker detection patterns
const brokerPatterns: Record<string, {
  searchUrlTemplate: string;
  noResultsPatterns: string[];
  hasResultsPatterns: string[];
}> = {
  'beenverified': {
    searchUrlTemplate: 'https://www.beenverified.com/f/optout/search?first={firstName}&last={lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'no records found', 'didn\'t find'],
    hasResultsPatterns: ['we found', 'results for', 'person-card', 'result-item'],
  },
  'spokeo': {
    searchUrlTemplate: 'https://www.spokeo.com/search?q={firstName}+{lastName}+{city}+{state}',
    noResultsPatterns: ['no results found', 'no matches', 'couldn\'t find'],
    hasResultsPatterns: ['results for', 'profile found', 'view details'],
  },
  'whitepages': {
    searchUrlTemplate: 'https://www.whitepages.com/name/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found', 'no listings'],
    hasResultsPatterns: ['people results', 'found', 'view profile'],
  },
  'truepeoplesearch': {
    searchUrlTemplate: 'https://www.truepeoplesearch.com/results?name={firstName}%20{lastName}&citystatezip={city}%20{state}',
    noResultsPatterns: ['no results', 'nothing found'],
    hasResultsPatterns: ['records found', 'view details', 'address history'],
  },
  'fastpeoplesearch': {
    searchUrlTemplate: 'https://www.fastpeoplesearch.com/name/{firstName}-{lastName}_{city}-{state}',
    noResultsPatterns: ['no results found', 'no records'],
    hasResultsPatterns: ['people found', 'results', 'view full report'],
  },
  'thatsthem': {
    searchUrlTemplate: 'https://thatsthem.com/name/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no matches', 'no results'],
    hasResultsPatterns: ['we found', 'result', 'profile'],
  },
  'radaris': {
    searchUrlTemplate: 'https://radaris.com/p/{firstName}/{lastName}/',
    noResultsPatterns: ['no records found', 'not found'],
    hasResultsPatterns: ['found', 'profile', 'view full'],
  },
  'intelius': {
    searchUrlTemplate: 'https://www.intelius.com/people-search/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['results for', 'found', 'view report'],
  },
  'peoplefinders': {
    searchUrlTemplate: 'https://www.peoplefinders.com/name/{firstName}-{lastName}/{state}/{city}',
    noResultsPatterns: ['no results', 'no matches'],
    hasResultsPatterns: ['results', 'people found', 'records'],
  },
  'usphonebook': {
    searchUrlTemplate: 'https://www.usphonebook.com/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'profile'],
  },
  'instantcheckmate': {
    searchUrlTemplate: 'https://www.instantcheckmate.com/people/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'nothing found'],
    hasResultsPatterns: ['found', 'results', 'report'],
  },
  'mylife': {
    searchUrlTemplate: 'https://www.mylife.com/pub/search?firstName={firstName}&lastName={lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['results', 'profile', 'reputation score'],
  },
  'nuwber': {
    searchUrlTemplate: 'https://nuwber.com/search?name={firstName}%20{lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'nothing found'],
    hasResultsPatterns: ['found', 'results', 'profile'],
  },
  'familytreenow': {
    searchUrlTemplate: 'https://www.familytreenow.com/search/genealogy/results?first={firstName}&last={lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'no records'],
    hasResultsPatterns: ['found', 'results', 'record'],
  },
  'peoplelooker': {
    searchUrlTemplate: 'https://www.peoplelooker.com/f/optout/search?first={firstName}&last={lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'profile'],
  },
  'truthfinder': {
    searchUrlTemplate: 'https://www.truthfinder.com/people-search?first={firstName}&last={lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'report'],
  },
  'searchpeoplefree': {
    searchUrlTemplate: 'https://www.searchpeoplefree.com/find/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'profile'],
  },
  'cocofinder': {
    searchUrlTemplate: 'https://cocofinder.com/person/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'profile'],
  },
  'cyberbackgroundchecks': {
    searchUrlTemplate: 'https://www.cyberbackgroundchecks.com/people/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'records'],
  },
  'voterrecords': {
    searchUrlTemplate: 'https://voterrecords.com/voters/{firstName}-{lastName}/{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'voter', 'records'],
  },
};

interface UserProfile {
  firstName: string;
  lastName: string;
  city: string;
  state: string;
}

interface ScanResult {
  brokerId: string;
  status: 'found' | 'clean' | 'error';
  profileUrl: string | null;
  matchConfidence: number;
  error?: string;
}

function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

function buildSearchUrl(template: string, profile: UserProfile): string {
  return template
    .replace('{firstName}', encodeURIComponent(profile.firstName))
    .replace('{lastName}', encodeURIComponent(profile.lastName))
    .replace('{city}', encodeURIComponent(profile.city))
    .replace('{state}', encodeURIComponent(profile.state));
}

async function scanBroker(
  slug: string,
  profile: UserProfile,
  timeout: number = 10000
): Promise<ScanResult & { slug: string }> {
  const pattern = brokerPatterns[slug];
  
  if (!pattern) {
    console.log(`No pattern for broker: ${slug}`);
    return {
      slug,
      brokerId: '',
      status: 'clean',
      profileUrl: null,
      matchConfidence: 0,
    };
  }

  const searchUrl = buildSearchUrl(pattern.searchUrlTemplate, profile);
  console.log(`Scanning ${slug}: ${searchUrl}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Many brokers block scraping - treat as inconclusive
      console.log(`${slug}: HTTP ${response.status}`);
      return {
        slug,
        brokerId: '',
        status: 'clean',
        profileUrl: null,
        matchConfidence: 0,
      };
    }

    const html = await response.text();
    const htmlLower = html.toLowerCase();

    // Check for no results patterns
    const hasNoResults = pattern.noResultsPatterns.some(p => 
      htmlLower.includes(p.toLowerCase())
    );

    // Check for has results patterns
    const hasResults = pattern.hasResultsPatterns.some(p => 
      htmlLower.includes(p.toLowerCase())
    );

    // Check if user's name appears in the response
    const nameInPage = htmlLower.includes(profile.firstName.toLowerCase()) && 
                       htmlLower.includes(profile.lastName.toLowerCase());

    console.log(`${slug}: noResults=${hasNoResults}, hasResults=${hasResults}, nameInPage=${nameInPage}`);

    // Determine result
    if (hasNoResults && !hasResults) {
      return {
        slug,
        brokerId: '',
        status: 'clean',
        profileUrl: null,
        matchConfidence: 0,
      };
    }

    if (hasResults && nameInPage) {
      // Likely found - calculate confidence
      const confidence = hasResults && nameInPage ? 0.75 : hasResults ? 0.5 : 0.3;
      return {
        slug,
        brokerId: '',
        status: 'found',
        profileUrl: searchUrl,
        matchConfidence: confidence,
      };
    }

    // Inconclusive - mark as clean to avoid false positives
    return {
      slug,
      brokerId: '',
      status: 'clean',
      profileUrl: null,
      matchConfidence: 0,
    };

  } catch (error) {
    console.error(`Error scanning ${slug}:`, error);
    // Treat timeouts/errors as clean to avoid false positives
    return {
      slug,
      brokerId: '',
      status: 'clean',
      profileUrl: null,
      matchConfidence: 0,
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Check if user has Complete subscription (broker scanning requires Complete tier)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // Broker scanning requires Complete tier
    if (!subscription || subscription.tier !== 'complete') {
      return new Response(
        JSON.stringify({ error: 'Complete subscription required for broker scanning' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // Start a new scan
      const body = await req.json().catch(() => ({}));
      
      // Check if user already has a scan in progress
      const { data: existingScan } = await supabase
        .from('broker_scans')
        .select('id, status')
        .eq('user_id', userId)
        .in('status', ['pending', 'running'])
        .single();

      if (existingScan) {
        return new Response(
          JSON.stringify({ 
            error: 'A scan is already in progress',
            scan_id: existingScan.id,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check cooldown (1 scan per 24 hours)
      const { data: recentScan } = await supabase
        .from('broker_scans')
        .select('id, completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (recentScan) {
        return new Response(
          JSON.stringify({ 
            error: 'Please wait 24 hours between scans',
            last_scan: recentScan.completed_at,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user profile for search (including city and state)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, city, state')
        .eq('id', userId)
        .single();

      // Parse name from profile or email
      let userProfile: UserProfile;
      if (profile?.full_name) {
        const { firstName, lastName } = parseFullName(profile.full_name);
        userProfile = {
          firstName,
          lastName,
          city: body.city || profile.city || '',
          state: body.state || profile.state || '',
        };
      } else {
        // Fallback to email username
        const emailName = user.email?.split('@')[0] || 'user';
        userProfile = {
          firstName: emailName,
          lastName: '',
          city: body.city || profile?.city || '',
          state: body.state || profile?.state || '',
        };
      }

      // Get active brokers
      const { data: brokers, count: brokerCount } = await supabase
        .from('data_brokers')
        .select('id, slug', { count: 'exact' })
        .eq('is_active', true);

      // Create new scan record
      const { data: newScan, error: scanError } = await supabase
        .from('broker_scans')
        .insert({
          user_id: userId,
          status: 'running',
          started_at: new Date().toISOString(),
          total_brokers: brokerCount || 0,
          scanned_count: 0,
          found_count: 0,
          clean_count: 0,
          error_count: 0,
        })
        .select()
        .single();

      if (scanError || !newScan) {
        console.error('Error creating scan:', scanError);
        return new Response(
          JSON.stringify({ error: 'Failed to create scan' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Created broker scan ${newScan.id} for user ${userId} (${userProfile.firstName} ${userProfile.lastName})`);

      // Run scans in parallel (batches of 5 to avoid overwhelming)
      const BATCH_SIZE = 5;
      let scannedCount = 0;
      let foundCount = 0;
      let cleanCount = 0;
      let errorCount = 0;

      for (let i = 0; i < (brokers?.length || 0); i += BATCH_SIZE) {
        const batch = brokers!.slice(i, i + BATCH_SIZE);
        
        const results = await Promise.all(
          batch.map(broker => scanBroker(broker.slug, userProfile))
        );

        // Save results for each broker
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          const broker = batch[j];
          
          scannedCount++;
          if (result.status === 'found') foundCount++;
          else if (result.status === 'clean') cleanCount++;
          else errorCount++;

          // Upsert result
          await supabase
            .from('broker_scan_results')
            .upsert({
              user_id: userId,
              broker_id: broker.id,
              status: result.status,
              profile_url: result.profileUrl,
              match_confidence: result.matchConfidence,
              scanned_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,broker_id',
            });
        }

        // Update scan progress
        await supabase
          .from('broker_scans')
          .update({
            scanned_count: scannedCount,
            found_count: foundCount,
            clean_count: cleanCount,
            error_count: errorCount,
          })
          .eq('id', newScan.id);
      }

      // Mark scan as completed
      const { data: completedScan } = await supabase
        .from('broker_scans')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          scanned_count: scannedCount,
          found_count: foundCount,
          clean_count: cleanCount,
          error_count: errorCount,
        })
        .eq('id', newScan.id)
        .select()
        .single();

      console.log(`Completed scan ${newScan.id}: found=${foundCount}, clean=${cleanCount}`);

      return new Response(
        JSON.stringify({ 
          message: 'Scan completed',
          scan: completedScan,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Get scan status and results
      const url = new URL(req.url);
      const scanId = url.searchParams.get('scan_id');

      // Get the latest scan or specific scan
      let scanQuery = supabase
        .from('broker_scans')
        .select('*')
        .eq('user_id', userId);

      if (scanId) {
        scanQuery = scanQuery.eq('id', scanId);
      } else {
        scanQuery = scanQuery.order('created_at', { ascending: false }).limit(1);
      }

      const { data: scan } = await scanQuery.single();

      if (!scan) {
        return new Response(
          JSON.stringify({ scan: null, results: [] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get results for this user
      const { data: results } = await supabase
        .from('broker_scan_results')
        .select(`
          id,
          status,
          profile_url,
          match_confidence,
          scanned_at,
          opted_out_at,
          broker:data_brokers(
            id,
            name,
            slug,
            website,
            opt_out_url,
            opt_out_difficulty,
            opt_out_time_estimate,
            instructions,
            requires_captcha,
            requires_phone,
            requires_id
          )
        `)
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false });

      // Get all brokers for reference
      const { data: brokers } = await supabase
        .from('data_brokers')
        .select('id, name, slug, priority, opt_out_difficulty')
        .eq('is_active', true)
        .order('priority');

      return new Response(
        JSON.stringify({ 
          scan,
          results: results || [],
          brokers: brokers || [],
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
