import { createClient } from 'npm:@supabase/supabase-js@2.79.0';
import { z } from 'npm:zod@3.23.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---- Lightweight top-funnel broker detection ----
// Reuses the SERP scoring + cache + budget governor from scan-brokers,
// but runs UNAUTHENTICATED against a small set of top brokers for the free scan.
// Goal: turn "estimated exposure" into "we actually found you on Whitepages".

type StatusV2 = 'found' | 'possible_match' | 'not_found' | 'unknown';

// Top 6 people-search brokers — high recognition, drive the "holy crap" moment.
const FREE_BROKERS: { slug: string; name: string; domain: string }[] = [
  { slug: 'whitepages', name: 'Whitepages', domain: 'whitepages.com' },
  { slug: 'truepeoplesearch', name: 'TruePeopleSearch', domain: 'truepeoplesearch.com' },
  { slug: 'fastpeoplesearch', name: 'FastPeopleSearch', domain: 'fastpeoplesearch.com' },
  { slug: 'spokeo', name: 'Spokeo', domain: 'spokeo.com' },
  { slug: 'radaris', name: 'Radaris', domain: 'radaris.com' },
  { slug: 'nuwber', name: 'Nuwber', domain: 'nuwber.com' },
];

const CONFIDENCE_THRESHOLDS = { FOUND: 0.75, POSSIBLE_MATCH: 0.55 };
const SERP_PARAMS = { engine: 'google', num: 5 } as const;

interface UserProfile {
  firstName: string;
  lastName: string;
  city: string;
  state: string;
}

const BodySchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  city: z.string().trim().max(80).optional().default(''),
  state: z.string().trim().max(40).optional().default(''),
});

// ---- SERP cache (shared serp_cache table) ----
function generateCacheKey(brokerSlug: string, query: string): string {
  const canonical = JSON.stringify({ provider: 'serpapi', ...SERP_PARAMS, broker: brokerSlug, q: query });
  let hash = 0;
  for (let i = 0; i < canonical.length; i++) {
    hash = ((hash << 5) - hash) + canonical.charCodeAt(i);
    hash |= 0;
  }
  return `serp_${brokerSlug}_${Math.abs(hash).toString(36)}`;
}

async function checkSerpCache(supabase: any, slug: string, query: string) {
  try {
    const cacheKey = generateCacheKey(slug, query);
    const { data, error } = await supabase
      .from('serp_cache')
      .select('results, expires_at')
      .eq('cache_key', cacheKey)
      .single();
    if (error || !data) return { hit: false as const };
    if (new Date(data.expires_at) < new Date()) return { hit: false as const };
    return { hit: true as const, results: data.results as Array<{ title: string; snippet: string; link: string }> };
  } catch {
    return { hit: false as const };
  }
}

async function storeSerpCache(
  supabase: any,
  slug: string,
  query: string,
  results: Array<{ title: string; snippet: string; link: string }>,
) {
  try {
    const cacheKey = generateCacheKey(slug, query);
    const expiresAt = new Date();
    const ttlDays = results.length === 0 ? 30 : 7;
    expiresAt.setTime(expiresAt.getTime() + ttlDays * 24 * 60 * 60 * 1000);
    await supabase.from('serp_cache').upsert({
      cache_key: cacheKey,
      broker_slug: slug,
      query,
      results,
      result_count: results.length,
      expires_at: expiresAt.toISOString(),
    }, { onConflict: 'cache_key' });
  } catch { /* non-fatal */ }
}

// Budget governor — the real hard cost cap on this unauthenticated endpoint.
async function consumeBudget(supabase: any): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('consume_serp_quota', { p_count: 1 });
    if (error) return false; // fail closed
    return data === true;
  } catch {
    return false;
  }
}

function normalizeNameTokens(firstName: string, lastName: string): string[] {
  return [firstName, lastName].join(' ').toLowerCase().replace(/[^a-z\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
}

function urlHasNameTokens(url: string, tokens: string[]): boolean {
  try {
    const path = new URL(url).pathname.toLowerCase();
    return tokens.every(t => path.includes(t));
  } catch {
    return false;
  }
}

function scoreSerpResult({ title, snippet, url, user }: { title: string; snippet: string; url: string; user: UserProfile }) {
  const text = `${title}\n${snippet}`.toLowerCase();
  const titleLower = title.toLowerCase();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').toLowerCase().trim();

  let total = 0;
  const breakdown: Record<string, number> = {};

  if (text.includes(fullName)) { breakdown.name_match = 0.30; total += 0.30; }
  if (user.city && text.includes(user.city.toLowerCase())) { breakdown.city_match = 0.20; total += 0.20; }
  if (user.state && text.includes(user.state.toLowerCase())) { breakdown.state_match = 0.15; total += 0.15; }
  if (/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/.test(text)) { breakdown.phone_hint = 0.10; total += 0.10; }
  if (/\b\d{2}\s*(?:years?\s*old|y\.?o\.?)\b/i.test(text) || /\bage[:\s]+\d{2}/i.test(text)) { breakdown.age_hint = 0.15; total += 0.15; }
  if (/\b\d{1,6}\s+[a-z0-9.'-]{2,}\s+(st|street|ave|avenue|dr|drive|rd|road|ln|lane|blvd|boulevard|ct|court|cir|circle|pl|place|ter|terrace)\b/i.test(text)) { breakdown.address_hint = 0.10; total += 0.10; }

  total = Math.min(1.0, total);

  const nameInTitle = titleLower.includes(fullName);
  const nameTokens = normalizeNameTokens(user.firstName, user.lastName);
  const nameInUrl = urlHasNameTokens(url, nameTokens);
  const hasStrongSignal = nameInTitle || nameInUrl || (!!breakdown.name_match && (!!breakdown.age_hint || !!breakdown.phone_hint));

  const hasCorroborator = !!breakdown.city_match || !!breakdown.state_match || !!breakdown.age_hint || !!breakdown.phone_hint || !!breakdown.address_hint;
  const canBePossible = !!breakdown.name_match && hasCorroborator;

  let status_v2: StatusV2 = 'not_found';
  if (total >= CONFIDENCE_THRESHOLDS.FOUND && hasStrongSignal) status_v2 = 'found';
  else if (total >= CONFIDENCE_THRESHOLDS.POSSIBLE_MATCH && canBePossible) status_v2 = 'possible_match';

  return { total, status_v2 };
}

function buildQueries(user: UserProfile, domain: string): string[] {
  const fn = user.firstName?.trim();
  const ln = user.lastName?.trim();
  const city = user.city?.trim();
  // Keep it lightweight: at most 2 queries per broker.
  const queries = [`"${fn} ${ln}" site:${domain}`];
  if (city) queries.push(`"${fn} ${ln}" "${city}" site:${domain}`);
  return queries;
}

async function serpSearch(query: string, apiKey: string) {
  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', query);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('num', '5');
    const res = await fetch(url.toString(), { method: 'GET' });
    if (!res.ok) return [];
    const json = await res.json();
    const organic = Array.isArray(json?.organic_results) ? json.organic_results : [];
    return organic.slice(0, 3).map((r: any) => ({ title: r.title ?? '', snippet: r.snippet ?? '', link: r.link ?? '' }));
  } catch {
    return [];
  }
}

interface BrokerResult {
  slug: string;
  name: string;
  domain: string;
  status: StatusV2;
  confidence: number | null;
  profileUrl: string | null;
}

async function checkBroker(
  broker: { slug: string; name: string; domain: string },
  user: UserProfile,
  apiKey: string | null,
  supabase: any,
): Promise<BrokerResult> {
  const queries = buildQueries(user, broker.domain);
  let best: { score: ReturnType<typeof scoreSerpResult>; link: string } | null = null;

  for (const query of queries) {
    // Cache first — no budget consumed.
    let results: Array<{ title: string; snippet: string; link: string }> | null = null;
    const cached = await checkSerpCache(supabase, broker.slug, query);
    if (cached.hit && cached.results) {
      results = cached.results;
    } else if (apiKey) {
      // Cache miss — consume budget before hitting SERP.
      const allowed = await consumeBudget(supabase);
      if (!allowed) {
        // Budget exhausted; bail with whatever we have.
        break;
      }
      results = await serpSearch(query, apiKey);
      await storeSerpCache(supabase, broker.slug, query, results);
    } else {
      break;
    }

    for (const r of results) {
      try {
        const host = new URL(r.link).hostname.toLowerCase();
        if (!host.includes(broker.domain.toLowerCase())) continue;
      } catch {
        continue;
      }
      const score = scoreSerpResult({ title: r.title, snippet: r.snippet, url: r.link, user });
      if (!best || score.total > best.score.total) best = { score, link: r.link };
    }

    // Strong match — stop early to save budget.
    if (best && best.score.total >= CONFIDENCE_THRESHOLDS.FOUND) break;
  }

  if (!best) {
    return { slug: broker.slug, name: broker.name, domain: broker.domain, status: 'unknown', confidence: null, profileUrl: null };
  }
  return {
    slug: broker.slug,
    name: broker.name,
    domain: broker.domain,
    status: best.score.status_v2,
    confidence: Math.round(best.score.total * 100) / 100,
    profileUrl: best.score.status_v2 === 'found' ? best.link : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const serpApiKey = Deno.env.get('SERP_API_KEY') || null;

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Please provide your first and last name.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user: UserProfile = {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      city: parsed.data.city,
      state: parsed.data.state,
    };

    // Run brokers concurrently — the budget RPC is atomic, so this is safe and fast.
    const results: BrokerResult[] = await Promise.all(
      FREE_BROKERS.map((broker) =>
        checkBroker(broker, user, serpApiKey, supabase).catch((e) => {
          console.error(`[free-broker-check] ${broker.slug} failed:`, e);
          return { slug: broker.slug, name: broker.name, domain: broker.domain, status: 'unknown' as StatusV2, confidence: null, profileUrl: null };
        })
      )
    );

    const foundCount = results.filter((r) => r.status === 'found').length;
    const possibleCount = results.filter((r) => r.status === 'possible_match').length;

    return new Response(JSON.stringify({
      results,
      foundCount,
      possibleCount,
      checkedCount: results.length,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[free-broker-check] error:', e);
    return new Response(JSON.stringify({ error: 'Broker check unavailable right now' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
