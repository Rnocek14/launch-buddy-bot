import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Status V2 taxonomy
type StatusV2 = 'found' | 'possible_match' | 'not_found' | 'blocked' | 'rate_limited' | 'provider_error' | 'timeout' | 'parse_failed' | 'request_failed' | 'unknown';
type ErrorCode = 'blocked' | 'rate_limited' | 'provider_error' | 'timeout' | 'parse_failed' | 'request_failed' | 'budget_exhausted';
type DetectionMethod = 'direct' | 'browserless' | 'serp' | 'manual';

// Budget governor: check and consume SERP quota
async function checkSerpBudget(supabaseClient: any): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.rpc('consume_serp_quota', { p_count: 1 });
    if (error) {
      console.error('Budget check error:', error);
      return false; // Fail closed - don't allow SERP if we can't verify budget
    }
    return data === true;
  } catch (e) {
    console.error('Budget check exception:', e);
    return false;
  }
}

// Log SERP request for audit trail
async function logSerpRequest(
  supabaseClient: any,
  userId: string | null,
  brokerSlug: string,
  query: string,
  status: 'ok' | 'error' | 'skipped_budget' | 'cached',
  errorDetail?: string
): Promise<void> {
  try {
    await supabaseClient.from('serp_requests_log').insert({
      user_id: userId,
      broker_slug: brokerSlug,
      query,
      status,
      error_detail: errorDetail || null,
    });
  } catch (e) {
    console.error('Failed to log SERP request:', e);
  }
}

const CONFIDENCE_THRESHOLDS = {
  FOUND: 0.75,
  POSSIBLE_MATCH: 0.55,
};

// Broker detection patterns
const brokerPatterns: Record<string, {
  searchUrlTemplate: string;
  noResultsPatterns: string[];
  hasResultsPatterns: string[];
  domain: string;
}> = {
  'beenverified': {
    searchUrlTemplate: 'https://www.beenverified.com/f/optout/search?first={firstName}&last={lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'no records found', 'didn\'t find'],
    hasResultsPatterns: ['we found', 'results for', 'person-card', 'result-item'],
    domain: 'beenverified.com',
  },
  'spokeo': {
    searchUrlTemplate: 'https://www.spokeo.com/search?q={firstName}+{lastName}+{city}+{state}',
    noResultsPatterns: ['no results found', 'no matches', 'couldn\'t find'],
    hasResultsPatterns: ['results for', 'profile found', 'view details'],
    domain: 'spokeo.com',
  },
  'whitepages': {
    searchUrlTemplate: 'https://www.whitepages.com/name/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found', 'no listings'],
    hasResultsPatterns: ['people results', 'found', 'view profile'],
    domain: 'whitepages.com',
  },
  'truepeoplesearch': {
    searchUrlTemplate: 'https://www.truepeoplesearch.com/results?name={firstName}%20{lastName}&citystatezip={city}%20{state}',
    noResultsPatterns: ['no results', 'nothing found'],
    hasResultsPatterns: ['records found', 'view details', 'address history'],
    domain: 'truepeoplesearch.com',
  },
  'fastpeoplesearch': {
    searchUrlTemplate: 'https://www.fastpeoplesearch.com/name/{firstName}-{lastName}_{city}-{state}',
    noResultsPatterns: ['no results found', 'no records'],
    hasResultsPatterns: ['people found', 'results', 'view full report'],
    domain: 'fastpeoplesearch.com',
  },
  'thatsthem': {
    searchUrlTemplate: 'https://thatsthem.com/name/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no matches', 'no results'],
    hasResultsPatterns: ['we found', 'result', 'profile'],
    domain: 'thatsthem.com',
  },
  'radaris': {
    searchUrlTemplate: 'https://radaris.com/p/{firstName}/{lastName}/',
    noResultsPatterns: ['no records found', 'not found'],
    hasResultsPatterns: ['found', 'profile', 'view full'],
    domain: 'radaris.com',
  },
  'intelius': {
    searchUrlTemplate: 'https://www.intelius.com/people-search/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['results for', 'found', 'view report'],
    domain: 'intelius.com',
  },
  'peoplefinders': {
    searchUrlTemplate: 'https://www.peoplefinders.com/name/{firstName}-{lastName}/{state}/{city}',
    noResultsPatterns: ['no results', 'no matches'],
    hasResultsPatterns: ['results', 'people found', 'records'],
    domain: 'peoplefinders.com',
  },
  'usphonebook': {
    searchUrlTemplate: 'https://www.usphonebook.com/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'profile'],
    domain: 'usphonebook.com',
  },
  'instantcheckmate': {
    searchUrlTemplate: 'https://www.instantcheckmate.com/people/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'nothing found'],
    hasResultsPatterns: ['found', 'results', 'report'],
    domain: 'instantcheckmate.com',
  },
  'mylife': {
    searchUrlTemplate: 'https://www.mylife.com/pub/search?firstName={firstName}&lastName={lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['results', 'profile', 'reputation score'],
    domain: 'mylife.com',
  },
  'nuwber': {
    searchUrlTemplate: 'https://nuwber.com/search?name={firstName}%20{lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'nothing found'],
    hasResultsPatterns: ['found', 'results', 'profile'],
    domain: 'nuwber.com',
  },
  'familytreenow': {
    searchUrlTemplate: 'https://www.familytreenow.com/search/genealogy/results?first={firstName}&last={lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'no records'],
    hasResultsPatterns: ['found', 'results', 'record'],
    domain: 'familytreenow.com',
  },
  'peoplelooker': {
    searchUrlTemplate: 'https://www.peoplelooker.com/f/optout/search?first={firstName}&last={lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'profile'],
    domain: 'peoplelooker.com',
  },
  'truthfinder': {
    searchUrlTemplate: 'https://www.truthfinder.com/people-search?first={firstName}&last={lastName}&city={city}&state={state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'report'],
    domain: 'truthfinder.com',
  },
  'searchpeoplefree': {
    searchUrlTemplate: 'https://www.searchpeoplefree.com/find/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'profile'],
    domain: 'searchpeoplefree.com',
  },
  'cocofinder': {
    searchUrlTemplate: 'https://cocofinder.com/person/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'profile'],
    domain: 'cocofinder.com',
  },
  'cyberbackgroundchecks': {
    searchUrlTemplate: 'https://www.cyberbackgroundchecks.com/people/{firstName}-{lastName}/{city}-{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'results', 'records'],
    domain: 'cyberbackgroundchecks.com',
  },
  'voterrecords': {
    searchUrlTemplate: 'https://voterrecords.com/voters/{firstName}-{lastName}/{state}',
    noResultsPatterns: ['no results', 'not found'],
    hasResultsPatterns: ['found', 'voter', 'records'],
    domain: 'voterrecords.com',
  },
};

interface UserProfile {
  firstName: string;
  lastName: string;
  city: string;
  state: string;
}

// Scoring version for audit trail - increment when changing thresholds/logic
const SCORING_VERSION = 'serp_v2.1';

interface ScanResultV2 {
  brokerId: string;
  slug: string;
  status_v2: StatusV2;
  error_code: ErrorCode | null;
  http_status: number | null;
  error_detail: string | null;
  detection_method: DetectionMethod;
  confidence: number | null;
  confidence_breakdown: Record<string, number> | null;
  evidence_snippet: string | null;
  evidence_url: string | null;
  profile_url: string | null;
  extracted_data: Record<string, any> | null;
  evidence_query: string | null;
  scoring_version: string;
}

// Helper: ensure every return includes audit fields
function baseAuditFields(): Pick<ScanResultV2, 'scoring_version' | 'evidence_query'> {
  return { scoring_version: SCORING_VERSION, evidence_query: null };
}

// Helper: classify HTTP failure
function classifyHttpFailure(httpStatus: number | null, provider: 'browserless' | 'direct'): { status_v2: StatusV2; error_code: ErrorCode } {
  if (httpStatus === 403) return { status_v2: 'blocked', error_code: 'blocked' };
  if (httpStatus === 429) return { status_v2: 'rate_limited', error_code: 'rate_limited' };
  if (httpStatus && httpStatus >= 500) {
    return { 
      status_v2: provider === 'browserless' ? 'provider_error' : 'request_failed', 
      error_code: provider === 'browserless' ? 'provider_error' : 'request_failed' 
    };
  }
  return { status_v2: 'request_failed', error_code: 'request_failed' };
}

// Helper: normalize name to tokens for URL matching
function normalizeNameTokens(firstName: string, lastName: string): string[] {
  return [firstName, lastName]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

// Helper: check if URL path contains all name tokens
function urlHasNameTokens(url: string, tokens: string[]): boolean {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    return tokens.every(t => path.includes(t));
  } catch {
    return false;
  }
}

// Helper: SERP confidence scoring with strong signal detection
function scoreSerpResult({
  title,
  snippet,
  url,
  user,
}: {
  title: string;
  snippet: string;
  url: string;
  user: UserProfile;
}): { total: number; breakdown: Record<string, number>; status_v2: StatusV2; has_strong_signal: boolean } {
  const text = `${title}\n${snippet}`.toLowerCase();
  const titleLower = title.toLowerCase();
  // Normalize fullName to handle empty lastName
  const fullName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .trim();

  let total = 0;
  const breakdown: Record<string, number> = {};

  // Check for full name match (keep at 0.30)
  if (text.includes(fullName)) {
    breakdown.name_match = 0.30;
    total += 0.30;
  }

  // Check for city match
  if (user.city && text.includes(user.city.toLowerCase())) {
    breakdown.city_match = 0.20;
    total += 0.20;
  }

  // Check for state match
  if (user.state && text.includes(user.state.toLowerCase())) {
    breakdown.state_match = 0.15;
    total += 0.15;
  }

  // Check for phone hint (light, don't overfit)
  const phoneHint = /\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/.test(text);
  if (phoneHint) {
    breakdown.phone_hint = 0.10;
    total += 0.10;
  }

  // Check for age hint
  const ageHint = /\b\d{2}\s*(?:years?\s*old|y\.?o\.?)\b/i.test(text) || /\bage[:\s]+\d{2}/i.test(text);
  if (ageHint) {
    breakdown.age_hint = 0.15;
    total += 0.15;
  }

  // Check for address hint (conservative regex, only for scoring not strong signal)
  const addressHint = /\b\d{1,6}\s+[a-z0-9.'-]{2,}\s+(st|street|ave|avenue|dr|drive|rd|road|ln|lane|blvd|boulevard|ct|court|cir|circle|pl|place|ter|terrace)\b/i.test(text);
  if (addressHint) {
    breakdown.address_hint = 0.10;
    total += 0.10;
  }

  total = Math.min(1.0, total);
  breakdown.total = total;

  // Strong signal detection (for Exposed status)
  const nameInTitle = titleLower.includes(fullName);
  const nameTokens = normalizeNameTokens(user.firstName, user.lastName);
  const nameInUrl = urlHasNameTokens(url, nameTokens);
  const hasStrongSignal = nameInTitle || nameInUrl || 
    (!!breakdown.name_match && (!!breakdown.age_hint || !!breakdown.phone_hint));
  
  breakdown.name_in_title = nameInTitle ? 1 : 0;
  breakdown.name_in_url = nameInUrl ? 1 : 0;
  breakdown.has_strong_signal = hasStrongSignal ? 1 : 0;

  // Corroborator check (for Possible exposure floor)
  const hasCorroborator = 
    !!breakdown.city_match ||
    !!breakdown.state_match ||
    !!breakdown.age_hint ||
    !!breakdown.phone_hint ||
    !!breakdown.address_hint;
  
  const canBePossible = !!breakdown.name_match && hasCorroborator;

  // Determine status with strong signal + corroborator requirements
  let status_v2: StatusV2 = 'not_found';
  if (total >= CONFIDENCE_THRESHOLDS.FOUND && hasStrongSignal) {
    status_v2 = 'found';
  } else if (total >= CONFIDENCE_THRESHOLDS.POSSIBLE_MATCH && canBePossible) {
    status_v2 = 'possible_match';
  }

  return { total, breakdown, status_v2, has_strong_signal: hasStrongSignal };
}

// Helper: build SERP queries
function buildSerpQueries(user: UserProfile, brokerDomain: string): string[] {
  const fn = user.firstName?.trim();
  const ln = user.lastName?.trim();
  const city = user.city?.trim();
  const state = user.state?.trim();

  const base = `"${fn} ${ln}" site:${brokerDomain}`;
  const queries = [base];

  if (city) queries.push(`"${fn} ${ln}" "${city}" site:${brokerDomain}`);
  if (state) queries.push(`"${fn} ${ln}" "${state}" site:${brokerDomain}`);

  return queries;
}

// Helper: SERP API search
async function serpSearch(query: string, apiKey: string): Promise<Array<{ title: string; snippet: string; link: string }>> {
  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', query);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('num', '5');

    const res = await fetch(url.toString(), { method: 'GET' });
    
    if (!res.ok) {
      console.log(`SERP API error: ${res.status}`);
      return [];
    }
    
    const json = await res.json();
    const organic = Array.isArray(json?.organic_results) ? json.organic_results : [];
    return organic.slice(0, 3).map((r: any) => ({
      title: r.title ?? '',
      snippet: r.snippet ?? '',
      link: r.link ?? '',
    }));
  } catch (error) {
    console.error('SERP search error:', error);
    return [];
  }
}

// Helper: SERP discovery for a broker with budget governance
async function serpDiscovery(
  slug: string,
  brokerDomain: string,
  user: UserProfile,
  apiKey: string,
  supabaseClient: any,
  userId: string | null
): Promise<ScanResultV2 & { budgetExhausted?: boolean }> {
  const queries = buildSerpQueries(user, brokerDomain);
  
  interface BestResultType { score: ReturnType<typeof scoreSerpResult>; result: { title: string; snippet: string; link: string }; query: string }
  let bestResult: BestResultType | null = null;
  let totalQueriesUsed = 0;
  
  for (const query of queries) {
    // Check budget before each SERP call
    const budgetOk = await checkSerpBudget(supabaseClient);
    if (!budgetOk) {
      console.log(`SERP budget exhausted for ${slug}`);
      await logSerpRequest(supabaseClient, userId, slug, query, 'skipped_budget', 'Daily SERP budget exhausted');
      
      // If we have a partial result, use it; otherwise return budget_exhausted
      // Use explicit cast to avoid TypeScript control flow narrowing issue
      const currentBest = bestResult as BestResultType | null;
      if (currentBest && currentBest.score.total >= CONFIDENCE_THRESHOLDS.POSSIBLE_MATCH) {
        // We have a usable partial result, break out of loop to return it
        break;
      }
      
      // No usable result - return budget exhausted error
      return {
        brokerId: '',
        slug,
        status_v2: 'unknown' as StatusV2,
        error_code: 'budget_exhausted' as ErrorCode,
        http_status: null,
        error_detail: 'Daily SERP search limit reached; manual check recommended',
        detection_method: 'serp' as DetectionMethod,
        confidence: null,
        confidence_breakdown: null,
        evidence_snippet: null,
        evidence_url: null,
        profile_url: null,
        extracted_data: null,
        evidence_query: query,
        scoring_version: SCORING_VERSION,
        budgetExhausted: true,
      };
    }
    
    const results = await serpSearch(query, apiKey);
    totalQueriesUsed++;
    
    // Log successful SERP request
    await logSerpRequest(supabaseClient, userId, slug, query, 'ok');
    
    for (const result of results) {
      // Ensure the result is actually from this broker's domain (stronger check)
      try {
        const host = new URL(result.link).hostname.toLowerCase();
        if (!host.endsWith(brokerDomain.toLowerCase()) && !host.includes(brokerDomain.toLowerCase())) {
          continue;
        }
      } catch {
        // URL parse failed, skip this result
        continue;
      }
      
      const score = scoreSerpResult({ title: result.title, snippet: result.snippet, url: result.link, user });
      
      if (!bestResult || score.total > bestResult.score.total) {
        bestResult = { score, result, query };
      }
    }
    
    // If we found a strong match, stop early (cost optimization)
    if (bestResult && bestResult.score.total >= CONFIDENCE_THRESHOLDS.FOUND) {
      console.log(`${slug}: Strong SERP match found, stopping early after ${totalQueriesUsed} queries`);
      break;
    }
    
    // Small delay between queries to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (bestResult && bestResult.score.total >= CONFIDENCE_THRESHOLDS.POSSIBLE_MATCH) {
    return {
      brokerId: '',
      slug,
      status_v2: bestResult.score.status_v2,
      error_code: null,
      http_status: null,
      error_detail: null,
      detection_method: 'serp',
      confidence: bestResult.score.total,
      confidence_breakdown: bestResult.score.breakdown,
      evidence_snippet: bestResult.result.snippet.slice(0, 500),
      evidence_url: bestResult.result.link,
      profile_url: bestResult.result.link,
      extracted_data: null,
      evidence_query: bestResult.query,
      scoring_version: SCORING_VERSION,
    };
  }

  // No matches found via SERP
  return {
    brokerId: '',
    slug,
    status_v2: 'not_found',
    error_code: null,
    http_status: null,
    error_detail: null,
    detection_method: 'serp',
    confidence: 0,
    confidence_breakdown: null,
    evidence_snippet: null,
    evidence_url: null,
    profile_url: null,
    extracted_data: null,
    evidence_query: null,
    scoring_version: SCORING_VERSION,
  };
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

// Jitter delay helper
function getJitterDelay(): number {
  return 2500 + Math.random() * 2000; // 2500-4500ms
}

// Use Browserless to render pages like a real browser
async function fetchWithBrowserless(url: string, timeout: number = 30000): Promise<{ html: string | null; status: number; error?: string }> {
  const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
  
  if (!browserlessApiKey) {
    console.log('BROWSERLESS_API_KEY not set');
    return { html: null, status: 0, error: 'BROWSERLESS_API_KEY not configured' };
  }

  try {
    // Try Bearer token first (more common)
    const response = await fetch(`https://chrome.browserless.io/content?token=${browserlessApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        waitForTimeout: 3000,
        gotoOptions: {
          waitUntil: 'networkidle2',
          timeout: timeout,
        },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.log(`Browserless error: ${response.status} - ${errorText.slice(0, 200)}`);
      return { html: null, status: response.status, error: `Browserless: ${response.status} ${errorText.slice(0, 100)}` };
    }

    return { html: await response.text(), status: 200 };
  } catch (error) {
    console.error('Browserless fetch error:', error);
    return { html: null, status: 0, error: String(error).slice(0, 200) };
  }
}

// Fallback direct fetch with better headers
async function fetchDirect(url: string, timeout: number = 10000): Promise<{ html: string | null; status: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { html: null, status: response.status, error: `HTTP ${response.status}` };
    }

    return { html: await response.text(), status: response.status };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { html: null, status: 0, error: 'Request timeout' };
    }
    console.error('Direct fetch error:', error);
    return { html: null, status: 0, error: String(error).slice(0, 200) };
  }
}

// Strip script/style tags for safe extraction (robust regex)
function stripScriptStyle(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Validate phone number (NANP)
function isValidNANP(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 10 && digits.length !== 11) return false;
  
  const npa = digits.length === 11 ? digits.slice(1, 4) : digits.slice(0, 3);
  const nxx = digits.length === 11 ? digits.slice(4, 7) : digits.slice(3, 6);
  
  // NPA cannot start with 0 or 1
  if (npa.startsWith('0') || npa.startsWith('1')) return false;
  // NXX cannot start with 0 or 1
  if (nxx.startsWith('0') || nxx.startsWith('1')) return false;
  // Reject 555 patterns (fake)
  if (nxx === '555') return false;
  // Reject repeated digits
  if (/^(\d)\1{9,}$/.test(digits)) return false;
  
  return true;
}

// Validate name looks like a real name
function isValidName(name: string): boolean {
  const words = name.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  // Each word should be alpha-heavy and reasonable length
  return words.every(w => 
    w.length >= 2 && 
    w.length <= 20 && 
    /^[A-Za-z][A-Za-z'-]*$/.test(w)
  );
}

// Extract data from HTML with strict validation
function extractDataFromHtmlStrict(html: string, profile: UserProfile): Record<string, any> | null {
  const cleanText = stripScriptStyle(html);
  const data: Record<string, any> = {};
  
  // Only proceed if page looks substantial (not a block page)
  if (cleanText.length < 500) return null;
  
  const fullName = `${profile.firstName} ${profile.lastName}`;
  if (!cleanText.toLowerCase().includes(fullName.toLowerCase())) {
    return null; // Name not found, don't extract
  }
  
  data.name = fullName;
  
  // Extract age with validation
  const agePatterns = [
    /age[:\s]+(\d{1,3})/i,
    /(\d{1,3})\s*years?\s*old/i,
  ];
  for (const pattern of agePatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const age = parseInt(match[1]);
      if (age >= 18 && age <= 100) {
        data.age = match[1];
        break;
      }
    }
  }
  
  // Extract phone numbers with strict validation
  const phonePattern = /(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = new Set<string>();
  const phoneMatches = cleanText.match(phonePattern);
  if (phoneMatches) {
    for (const phone of phoneMatches.slice(0, 10)) {
      if (isValidNANP(phone)) {
        const digits = phone.replace(/\D/g, '');
        const d = digits.length === 11 ? digits.slice(1) : digits;
        phones.add(`(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`);
      }
    }
  }
  if (phones.size > 0) {
    data.phone_numbers = Array.from(phones).slice(0, 5);
  }
  
  // Extract relatives with strict name validation
  const relativePatterns = [
    /(?:related?\s*to|relatives?|associates?|family)[:\s]+([^<\n]{10,200})/gi,
  ];
  const relatives = new Set<string>();
  for (const pattern of relativePatterns) {
    const matches = cleanText.matchAll(pattern);
    for (const match of matches) {
      const names = match[1].split(/[,;•|]/).map(n => n.trim()).filter(isValidName);
      names.forEach(n => relatives.add(n));
    }
  }
  if (relatives.size > 0) {
    data.relatives = Array.from(relatives).slice(0, 10);
  }
  
  // Store a snippet only if we found meaningful data
  if (Object.keys(data).length > 1) {
    const nameIndex = cleanText.toLowerCase().indexOf(profile.firstName.toLowerCase());
    if (nameIndex >= 0) {
      const start = Math.max(0, nameIndex - 30);
      const end = Math.min(cleanText.length, nameIndex + 170);
      data.raw_snippet = cleanText.slice(start, end);
    }
  }
  
  return Object.keys(data).length > 1 ? data : null;
}

// Main broker scan function with SERP fallback and budget governance
async function scanBrokerV2(
  slug: string,
  profile: UserProfile,
  serpApiKey: string | null,
  supabaseClient: any,
  userId: string | null
): Promise<ScanResultV2> {
  const pattern = brokerPatterns[slug];
  
  if (!pattern) {
    console.log(`No pattern for broker: ${slug}`);
    return {
      brokerId: '',
      slug,
      status_v2: 'not_found',
      error_code: null,
      http_status: null,
      error_detail: 'No pattern configured',
      detection_method: 'direct',
      confidence: null,
      confidence_breakdown: null,
      evidence_snippet: null,
      evidence_url: null,
      profile_url: null,
      extracted_data: null,
      evidence_query: null,
      scoring_version: SCORING_VERSION,
    };
  }

  const searchUrl = buildSearchUrl(pattern.searchUrlTemplate, profile);
  console.log(`Scanning ${slug}: ${searchUrl}`);

  let directFailed = false;
  let directError: { status_v2: StatusV2; error_code: ErrorCode; http_status: number | null; error_detail: string } | null = null;

  // Try Browserless first
  const browserlessResult = await fetchWithBrowserless(searchUrl);
  
  let directMethod: DetectionMethod = 'direct';
  
  if (browserlessResult.html && browserlessResult.status === 200) {
    // Successfully got HTML via Browserless
    directMethod = 'browserless';
    const parseResult = analyzeHtml(slug, browserlessResult.html, pattern, profile, searchUrl, 'browserless');
    if (parseResult.status_v2 === 'found' || parseResult.status_v2 === 'not_found') {
      return parseResult;
    }
    // If parse_failed, we'll try SERP fallback
    directFailed = true;
    directError = { 
      status_v2: 'parse_failed', 
      error_code: 'parse_failed', 
      http_status: 200, 
      error_detail: 'Could not confidently parse results' 
    };
  } else if (browserlessResult.status === 429 || browserlessResult.status === 400 || browserlessResult.status >= 500) {
    // Browserless provider error
    directMethod = 'browserless';
    directFailed = true;
    const { status_v2, error_code } = classifyHttpFailure(browserlessResult.status, 'browserless');
    directError = { status_v2, error_code, http_status: browserlessResult.status, error_detail: browserlessResult.error || '' };
  } else {
    // Browserless not available, try direct fetch
    await new Promise(resolve => setTimeout(resolve, getJitterDelay()));
    
    const directResult = await fetchDirect(searchUrl);
    
    if (directResult.html && directResult.status === 200) {
      directMethod = 'direct';
      const parseResult = analyzeHtml(slug, directResult.html, pattern, profile, searchUrl, 'direct');
      if (parseResult.status_v2 === 'found' || parseResult.status_v2 === 'not_found') {
        return parseResult;
      }
      directFailed = true;
      directError = { 
        status_v2: 'parse_failed', 
        error_code: 'parse_failed', 
        http_status: 200, 
        error_detail: 'Could not confidently parse results' 
      };
    } else {
      directFailed = true;
      const { status_v2, error_code } = classifyHttpFailure(directResult.status, 'direct');
      directError = { status_v2, error_code, http_status: directResult.status, error_detail: directResult.error || '' };
    }
  }

  // Direct/Browserless failed - try SERP fallback
  if (directFailed && serpApiKey) {
    console.log(`${slug}: Direct failed (${directError?.error_code}), trying SERP fallback`);
    const serpResult = await serpDiscovery(slug, pattern.domain, profile, serpApiKey, supabaseClient, userId);
    
    // SERP result overrides direct failure (but we note what happened in error_detail)
    if (serpResult.status_v2 === 'found' || serpResult.status_v2 === 'possible_match' || serpResult.status_v2 === 'not_found') {
      // Preserve note about original failure
      if (directError) {
        serpResult.error_detail = `Direct ${directError.error_code} (HTTP ${directError.http_status}); SERP used instead`;
      }
      return serpResult;
    }
  }

  // Return the direct error if SERP didn't help
  if (directError) {
    return {
      brokerId: '',
      slug,
      status_v2: directError.status_v2,
      error_code: directError.error_code,
      http_status: directError.http_status,
      error_detail: directError.error_detail,
      detection_method: directMethod,
      confidence: null,
      confidence_breakdown: null,
      evidence_snippet: null,
      evidence_url: null,
      profile_url: searchUrl,
      extracted_data: null,
      evidence_query: null,
      scoring_version: SCORING_VERSION,
    };
  }

  // Fallback unknown
  return {
    brokerId: '',
    slug,
    status_v2: 'unknown',
    error_code: null,
    http_status: null,
    error_detail: 'Could not determine result',
    detection_method: 'direct',
    confidence: null,
    confidence_breakdown: null,
    evidence_snippet: null,
    evidence_url: null,
    profile_url: searchUrl,
    extracted_data: null,
    evidence_query: null,
    scoring_version: SCORING_VERSION,
  };
}

// Analyze HTML and determine result
function analyzeHtml(
  slug: string,
  html: string,
  pattern: typeof brokerPatterns[string],
  profile: UserProfile,
  searchUrl: string,
  method: DetectionMethod
): ScanResultV2 {
  const htmlLower = html.toLowerCase();
  
  // Check for no results patterns
  const hasNoResults = pattern.noResultsPatterns.some(p => 
    htmlLower.includes(p.toLowerCase())
  );

  // Check for has results patterns
  const hasResults = pattern.hasResultsPatterns.some(p => 
    htmlLower.includes(p.toLowerCase())
  );

  // Check if user's name appears
  const nameInPage = htmlLower.includes(profile.firstName.toLowerCase()) && 
                     htmlLower.includes(profile.lastName.toLowerCase());

  console.log(`${pattern.domain}: noResults=${hasNoResults}, hasResults=${hasResults}, nameInPage=${nameInPage}`);

  // Determine result
  if (hasNoResults && !hasResults) {
    return {
      brokerId: '',
      slug,
      status_v2: 'not_found',
      error_code: null,
      http_status: 200,
      error_detail: null,
      detection_method: method,
      confidence: 0,
      confidence_breakdown: null,
      evidence_snippet: null,
      evidence_url: null,
      profile_url: null,
      extracted_data: null,
      evidence_query: null,
      scoring_version: SCORING_VERSION,
    };
  }

  if (hasResults || nameInPage) {
    // Calculate confidence
    let confidence = 0.30;
    const breakdown: Record<string, number> = { base: 0.30 };
    
    if (hasResults) {
      breakdown.result_pattern = 0.25;
      confidence += 0.25;
    }
    if (nameInPage) {
      breakdown.name_match = 0.25;
      confidence += 0.25;
    }
    
    confidence = Math.min(confidence, 0.90);
    breakdown.total = confidence;
    
    // Try to extract data with strict validation
    const extractedData = extractDataFromHtmlStrict(html, profile);
    
    // If we have extracted data, boost confidence
    if (extractedData && Object.keys(extractedData).length > 2) {
      confidence = Math.min(confidence + 0.10, 0.95);
      breakdown.extracted_data = 0.10;
      breakdown.total = confidence;
    }
    
    // Determine status based on confidence
    let status_v2: StatusV2 = 'possible_match';
    if (confidence >= CONFIDENCE_THRESHOLDS.FOUND) {
      status_v2 = 'found';
    }
    
    // Generate evidence snippet from clean text
    const cleanText = stripScriptStyle(html);
    const nameIndex = cleanText.toLowerCase().indexOf(profile.firstName.toLowerCase());
    let evidenceSnippet = null;
    if (nameIndex >= 0) {
      const start = Math.max(0, nameIndex - 30);
      const end = Math.min(cleanText.length, nameIndex + 270);
      evidenceSnippet = cleanText.slice(start, end);
    }
    
    return {
      brokerId: '',
      slug,
      status_v2,
      error_code: null,
      http_status: 200,
      error_detail: null,
      detection_method: method,
      confidence,
      confidence_breakdown: breakdown,
      evidence_snippet: evidenceSnippet,
      evidence_url: searchUrl,
      profile_url: searchUrl,
      extracted_data: extractedData,
      evidence_query: null,
      scoring_version: SCORING_VERSION,
    };
  }

  // Inconclusive
  return {
    brokerId: '',
    slug,
    status_v2: 'parse_failed',
    error_code: 'parse_failed',
    http_status: 200,
    error_detail: 'Inconclusive page content',
    detection_method: method,
    confidence: null,
    confidence_breakdown: null,
    evidence_snippet: null,
    evidence_url: null,
    profile_url: searchUrl,
    extracted_data: null,
    evidence_query: null,
    scoring_version: SCORING_VERSION,
  };
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
    const serpApiKey = Deno.env.get('SERP_API_KEY') || null;

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

    // Check if user has Complete subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription || subscription.tier !== 'complete') {
      return new Response(
        JSON.stringify({ error: 'Complete subscription required for broker scanning' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      
      // Check for existing scan in progress
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

      // Cooldown check (5 minutes)
      const COOLDOWN_MS = 5 * 60 * 1000;
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
          
          return new Response(
            JSON.stringify({ 
              error: `Please wait ${Math.ceil(remainingMs / 60000)} minutes between scans`,
              last_scan: recentScan.completed_at,
              next_scan_at: nextScanAt.toISOString(),
              remaining_seconds: Math.ceil(remainingMs / 1000),
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, city, state')
        .eq('id', userId)
        .single();

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

      // Create scan record
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

      console.log(`Created broker scan ${newScan.id} for user ${userId} (${userProfile.firstName} ${userProfile.lastName}), SERP API: ${serpApiKey ? 'configured' : 'not configured'}`);

      // Scan sequentially with jitter (concurrency=1 for reliability)
      let scannedCount = 0;
      let foundCount = 0;
      let cleanCount = 0;
      let errorCount = 0;

      for (const broker of brokers || []) {
        // Add jitter delay between brokers
        if (scannedCount > 0) {
          await new Promise(resolve => setTimeout(resolve, getJitterDelay()));
        }
        
        const result = await scanBrokerV2(broker.slug, userProfile, serpApiKey, supabase, user.id);
        result.brokerId = broker.id;
        
        scannedCount++;
        
        // Count by status
        if (result.status_v2 === 'found' || result.status_v2 === 'possible_match') {
          foundCount++;
        } else if (result.status_v2 === 'not_found') {
          cleanCount++;
        } else {
          errorCount++;
        }

        // Upsert result with v2 fields
        await supabase
          .from('broker_scan_results')
          .upsert({
            user_id: userId,
            broker_id: broker.id,
            status: (result.status_v2 === 'found' || result.status_v2 === 'possible_match') ? 'found' : result.status_v2 === 'not_found' ? 'clean' : 'error', // Legacy field
            status_v2: result.status_v2,
            error_code: result.error_code,
            http_status: result.http_status,
            error_detail: result.error_detail,
            detection_method: result.detection_method,
            confidence: result.confidence,
            confidence_breakdown: result.confidence_breakdown,
            evidence_snippet: result.evidence_snippet,
            evidence_url: result.evidence_url,
            profile_url: result.profile_url,
            extracted_data: result.extracted_data,
            evidence_query: result.evidence_query,
            scoring_version: result.scoring_version,
            error_message: result.error_detail,
            match_confidence: result.confidence,
            scanned_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,broker_id',
          });

        // Update progress
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

      // Mark complete
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

      console.log(`Completed scan ${newScan.id}: found=${foundCount}, clean=${cleanCount}, errors=${errorCount}`);

      return new Response(
        JSON.stringify({ 
          message: 'Scan completed',
          scan: completedScan,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const scanId = url.searchParams.get('scan_id');

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

      // Get results with v2 fields
      const { data: results } = await supabase
        .from('broker_scan_results')
        .select(`
          id,
          status,
          status_v2,
          error_code,
          http_status,
          error_detail,
          detection_method,
          confidence,
          confidence_breakdown,
          evidence_snippet,
          evidence_url,
          evidence_query,
          scoring_version,
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
