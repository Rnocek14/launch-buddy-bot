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

interface ExtractedData {
  name?: string;
  age?: string;
  addresses?: string[];
  phone_numbers?: string[];
  emails?: string[];
  relatives?: string[];
  raw_snippet?: string;
}

interface ScanResult {
  brokerId: string;
  status: 'found' | 'clean' | 'error';
  profileUrl: string | null;
  matchConfidence: number;
  extractedData?: ExtractedData;
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

// Use Browserless to render pages like a real browser
async function fetchWithBrowserless(url: string, timeout: number = 30000): Promise<string | null> {
  const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
  
  if (!browserlessApiKey) {
    console.log('BROWSERLESS_API_KEY not set, falling back to direct fetch');
    return null;
  }

  try {
    const response = await fetch('https://chrome.browserless.io/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(browserlessApiKey + ':')}`,
      },
      body: JSON.stringify({
        url,
        waitForTimeout: 3000, // Wait for JS to render
        gotoOptions: {
          waitUntil: 'networkidle2',
          timeout: timeout,
        },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }),
    });

    if (!response.ok) {
      console.log(`Browserless error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error('Browserless fetch error:', error);
    return null;
  }
}

// Extract personal data from HTML response
function extractDataFromHtml(html: string, profile: UserProfile): ExtractedData {
  const data: ExtractedData = {};
  const htmlLower = html.toLowerCase();
  
  // Extract name if visible
  const fullName = `${profile.firstName} ${profile.lastName}`;
  if (htmlLower.includes(fullName.toLowerCase())) {
    data.name = fullName;
  }
  
  // Extract age (patterns like "Age: 35", "35 years old", "(35)")
  const agePatterns = [
    /age[:\s]+(\d{1,3})/i,
    /(\d{1,3})\s*years?\s*old/i,
    /\((\d{2,3})\)/,
  ];
  for (const pattern of agePatterns) {
    const match = html.match(pattern);
    if (match && parseInt(match[1]) > 10 && parseInt(match[1]) < 120) {
      data.age = match[1];
      break;
    }
  }
  
  // Extract addresses (common patterns)
  const addressPatterns = [
    // Street address patterns
    /\d+\s+[A-Za-z]+\s+(?:St(?:reet)?|Ave(?:nue)?|Rd|Road|Blvd|Boulevard|Dr(?:ive)?|Ln|Lane|Way|Ct|Court|Pl(?:ace)?)[,.\s]+[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}/gi,
    // City, State ZIP
    /[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?/g,
  ];
  
  const addresses = new Set<string>();
  for (const pattern of addressPatterns) {
    const matches = html.match(pattern);
    if (matches) {
      matches.slice(0, 5).forEach(addr => {
        const cleaned = addr.trim().replace(/\s+/g, ' ');
        if (cleaned.length > 10 && cleaned.length < 100) {
          addresses.add(cleaned);
        }
      });
    }
  }
  if (addresses.size > 0) {
    data.addresses = Array.from(addresses).slice(0, 5);
  }
  
  // Extract phone numbers
  const phonePattern = /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = new Set<string>();
  const phoneMatches = html.match(phonePattern);
  if (phoneMatches) {
    phoneMatches.slice(0, 10).forEach(phone => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10 || cleaned.length === 11) {
        // Format nicely
        const formatted = cleaned.length === 11 
          ? `(${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
          : `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        phones.add(formatted);
      }
    });
  }
  if (phones.size > 0) {
    data.phone_numbers = Array.from(phones).slice(0, 5);
  }
  
  // Extract email addresses
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = new Set<string>();
  const emailMatches = html.match(emailPattern);
  if (emailMatches) {
    emailMatches.forEach(email => {
      const lower = email.toLowerCase();
      // Filter out common non-personal emails
      if (!lower.includes('example.com') && 
          !lower.includes('noreply') && 
          !lower.includes('support@') &&
          !lower.includes('info@') &&
          lower.length < 50) {
        emails.add(lower);
      }
    });
  }
  if (emails.size > 0) {
    data.emails = Array.from(emails).slice(0, 5);
  }
  
  // Extract relatives/associates (look for "Related to:", "Relatives:", "Associates:", "Family:")
  const relativePatterns = [
    /(?:related?\s*to|relatives?|associates?|family)[:\s]+([^<\n]{10,200})/gi,
  ];
  const relatives = new Set<string>();
  for (const pattern of relativePatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      // Split by common delimiters and clean
      const names = match[1].split(/[,;•|]/).map(n => n.trim()).filter(n => {
        // Filter to look like names (2-3 words, each capitalized)
        const words = n.split(/\s+/);
        return words.length >= 2 && words.length <= 4 && 
               words.every(w => w.length > 1 && /^[A-Z]/.test(w));
      });
      names.forEach(n => relatives.add(n));
    }
  }
  if (relatives.size > 0) {
    data.relatives = Array.from(relatives).slice(0, 10);
  }
  
  // Store a sanitized snippet if we found something
  if (Object.keys(data).length > 0) {
    // Find a relevant snippet around the user's name
    const nameIndex = htmlLower.indexOf(profile.firstName.toLowerCase());
    if (nameIndex > 0) {
      const start = Math.max(0, nameIndex - 50);
      const end = Math.min(html.length, nameIndex + 200);
      let snippet = html.slice(start, end)
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (snippet.length > 50) {
        data.raw_snippet = snippet.slice(0, 200);
      }
    }
  }
  
  return data;
}

// Fallback direct fetch
async function fetchDirect(url: string, timeout: number = 10000): Promise<{ html: string | null; status: number }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { html: null, status: response.status };
    }

    return { html: await response.text(), status: response.status };
  } catch (error) {
    console.error('Direct fetch error:', error);
    return { html: null, status: 0 };
  }
}

async function scanBroker(
  slug: string,
  profile: UserProfile,
  useBrowserless: boolean = true
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
    let html: string | null = null;
    let usedBrowserless = false;

    // Try Browserless first for better accuracy
    if (useBrowserless) {
      html = await fetchWithBrowserless(searchUrl);
      usedBrowserless = html !== null;
    }

    // Fallback to direct fetch
    if (!html) {
      const directResult = await fetchDirect(searchUrl);
      
      if (directResult.status === 403 || directResult.status === 429) {
        // Blocked - mark as unknown so user can manually verify
        console.log(`${slug}: HTTP ${directResult.status} (blocked)`);
        return {
          slug,
          brokerId: '',
          status: 'error', // Will show as "unknown" in UI
          profileUrl: searchUrl,
          matchConfidence: 0,
          error: `Blocked (HTTP ${directResult.status})`,
        };
      }
      
      if (!directResult.html) {
        console.log(`${slug}: Failed to fetch`);
        return {
          slug,
          brokerId: '',
          status: 'error',
          profileUrl: searchUrl,
          matchConfidence: 0,
          error: 'Failed to fetch',
        };
      }
      
      html = directResult.html;
    }

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

    console.log(`${slug}: noResults=${hasNoResults}, hasResults=${hasResults}, nameInPage=${nameInPage}, browserless=${usedBrowserless}`);

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

    if (hasResults || nameInPage) {
      // Calculate confidence based on signals
      let confidence = 0.3;
      if (hasResults) confidence += 0.3;
      if (nameInPage) confidence += 0.25;
      if (usedBrowserless) confidence += 0.1; // Higher confidence with browser rendering
      
      // Extract personal data from the HTML
      const extractedData = extractDataFromHtml(html, profile);
      console.log(`${slug}: extracted data keys: ${Object.keys(extractedData).join(', ')}`);
      
      return {
        slug,
        brokerId: '',
        status: 'found',
        profileUrl: searchUrl,
        matchConfidence: Math.min(confidence, 0.95),
        extractedData: Object.keys(extractedData).length > 0 ? extractedData : undefined,
      };
    }

    // Inconclusive - mark as clean
    return {
      slug,
      brokerId: '',
      status: 'clean',
      profileUrl: null,
      matchConfidence: 0,
    };

  } catch (error) {
    console.error(`Error scanning ${slug}:`, error);
    return {
      slug,
      brokerId: '',
      status: 'error',
      profileUrl: searchUrl,
      matchConfidence: 0,
      error: String(error),
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

      // Check cooldown (5 minutes for testing, can be bypassed with force=true)
      const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes for testing
      const forceRescan = body.force === true;
      
      if (!forceRescan) {
        const { data: recentScan } = await supabase
          .from('broker_scans')
          .select('id, completed_at')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .gte('completed_at', new Date(Date.now() - COOLDOWN_MS).toISOString())
          .single();

        if (recentScan) {
          const completedAt = new Date(recentScan.completed_at);
          const nextScanAt = new Date(completedAt.getTime() + COOLDOWN_MS);
          const remainingMs = nextScanAt.getTime() - Date.now();
          const remainingMinutes = Math.ceil(remainingMs / 60000);
          
          return new Response(
            JSON.stringify({ 
              error: `Please wait ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} between scans`,
              last_scan: recentScan.completed_at,
              next_scan_at: nextScanAt.toISOString(),
              remaining_seconds: Math.ceil(remainingMs / 1000),
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.log(`Force rescan requested for user ${userId}`);
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

      // Run scans in parallel (batches of 3 for Browserless to avoid rate limits)
      const BATCH_SIZE = 3;
      let scannedCount = 0;
      let foundCount = 0;
      let cleanCount = 0;
      let errorCount = 0;

      for (let i = 0; i < (brokers?.length || 0); i += BATCH_SIZE) {
        const batch = brokers!.slice(i, i + BATCH_SIZE);
        
        // Add small delay between batches to avoid rate limiting
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const results = await Promise.all(
          batch.map(broker => scanBroker(broker.slug, userProfile, true))
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
              extracted_data: result.extractedData || null,
              error_message: result.error || null,
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
          extracted_data,
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
