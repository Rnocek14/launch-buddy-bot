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
// This spends the FREE bucket (consume_free_serp_quota / serp_free_usage_daily), NOT the
// shared one scan-brokers spends for paying customers. This endpoint is verify_jwt=false
// with no captcha, so scripted traffic against it used to be able to drain the single
// daily counter and push every paid scan onto its budget_exhausted path. The two budgets
// are separate so the worst a flood here can do is take the free check offline.
// See supabase/migrations/20260916130300_separate_free_serp_quota.sql for the cap.
async function consumeFreeBudget(supabase: any): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('consume_free_serp_quota', { p_count: 1 });
    if (error) return false; // fail closed
    return data === true;
  } catch {
    return false;
  }
}

// ---- Best-effort per-IP speed bump ----
// Honest about what this is: it is NOT the cost control. Edge functions run as many
// short-lived isolates, so this Map is empty after every cold start and each concurrent
// instance keeps its own copy — a distributed or merely patient caller walks straight
// past it. The free SERP bucket in Postgres is the only counter that is atomic and shared
// across instances, and that is what actually caps the spend. This exists to blunt the
// cheapest attack (one host, one tight loop) and to stop an accidental client retry storm
// before it reaches SerpApi at all.
const IP_WINDOW_MS = 60_000;
// Deliberately loose: carrier-grade NAT and office networks put many genuine visitors
// behind one address, and the failure mode here is a real person being told to try again.
// A scripted flood runs orders of magnitude above this; a human filling in a form does not.
const IP_MAX_REQUESTS = 10;
const ipHits = new Map<string, number[]>();

function clientIp(req: Request): string | null {
  // x-forwarded-for is "client, proxy1, proxy2" — the first entry is the caller.
  const fwd = req.headers.get('x-forwarded-for');
  const first = fwd?.split(',')[0]?.trim();
  if (first) return first;
  return req.headers.get('cf-connecting-ip')?.trim() || null;
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  // Bound the map: a spray of spoofed addresses must not grow this isolate's memory
  // without limit. Dropping the whole window is fine — the DB bucket is the real cap.
  if (ipHits.size > 5000) ipHits.clear();
  const recent = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  if (recent.length >= IP_MAX_REQUESTS) {
    ipHits.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipHits.set(ip, recent);
  return false;
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

  // The breakdown is the whole point of the free check: it is literal evidence that
  // this page publishes the visitor's phone number, age or street address. It used to
  // be computed here and thrown away one call below the checkout button. Surface only
  // the personal-data signals — name/city/state merely say "this is you", which the
  // result row already communicates.
  const evidence: string[] = [];
  if (breakdown.address_hint) evidence.push('street address');
  if (breakdown.phone_hint) evidence.push('phone number');
  if (breakdown.age_hint) evidence.push('age');

  return { total, status_v2, evidence };
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

interface SerpOutcome {
  /**
   * False when the call never produced an answer: non-2xx from SerpApi, a network error,
   * or the 6s abort below. This MUST stay distinct from a successful search that returned
   * zero organic results -- the two are identical on the wire (an empty array) but mean
   * opposite things, and only the second one is evidence of absence.
   */
  ok: boolean;
  results: Array<{ title: string; snippet: string; link: string }>;
}

async function serpSearch(query: string, apiKey: string): Promise<SerpOutcome> {
  // Bound each SERP call so one slow provider response can't hang the whole
  // broker check (which the client renders as a spinner).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google');
    url.searchParams.set('q', query);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('num', '5');
    const res = await fetch(url.toString(), { method: 'GET', signal: controller.signal });
    if (!res.ok) {
      console.warn(`[free-broker-check] SERP ${res.status} for ${query.substring(0, 40)}`);
      return { ok: false, results: [] };
    }
    const json = await res.json();
    const organic = Array.isArray(json?.organic_results) ? json.organic_results : [];
    return {
      ok: true,
      results: organic.slice(0, 3).map((r: any) => ({ title: r.title ?? '', snippet: r.snippet ?? '', link: r.link ?? '' })),
    };
  } catch {
    // Includes the AbortError from the 6s timeout above, which fires often enough that
    // treating it as "no listings" would be actively wrong.
    return { ok: false, results: [] };
  } finally {
    clearTimeout(timeout);
  }
}

interface BrokerResult {
  slug: string;
  name: string;
  domain: string;
  status: StatusV2;
  confidence: number | null;
  profileUrl: string | null;
  /** Personal-data signals found in the listing, e.g. ['street address','phone number']. */
  evidence: string[];
}

interface BrokerCheck {
  result: BrokerResult;
  /**
   * True when this broker stopped short because the FREE daily bucket was spent, i.e.
   * there was work we chose not to do. The caller folds this into `degraded` so a thin
   * result can never be rendered as an all-clear.
   */
  budgetExhausted: boolean;
  /**
   * True when a SERP call we did make came back as a failure rather than an answer, or
   * the broker threw outright. Same consequence as budgetExhausted -- this broker was
   * never actually checked, so it must not contribute to an all-clear.
   */
  serpFailed: boolean;
}

async function checkBroker(
  broker: { slug: string; name: string; domain: string },
  user: UserProfile,
  apiKey: string | null,
  supabase: any,
): Promise<BrokerCheck> {
  const queries = buildQueries(user, broker.domain);
  let best: { score: ReturnType<typeof scoreSerpResult>; link: string } | null = null;
  let budgetExhausted = false;
  let serpFailed = false;

  for (const query of queries) {
    // Cache first — no budget consumed. Keep it this way: cache hits are what let the
    // free funnel keep working on a small bucket.
    let results: Array<{ title: string; snippet: string; link: string }> | null = null;
    const cached = await checkSerpCache(supabase, broker.slug, query);
    if (cached.hit && cached.results) {
      results = cached.results;
    } else if (apiKey) {
      // Cache miss — consume free budget before hitting SERP.
      const allowed = await consumeFreeBudget(supabase);
      if (!allowed) {
        // Free bucket exhausted (or the RPC failed and we failed closed). Bail with
        // whatever we have, and flag it so the response degrades honestly.
        budgetExhausted = true;
        break;
      }
      const search = await serpSearch(query, apiKey);
      if (!search.ok) {
        // Do NOT write this empty list to serp_cache. scan-brokers computes the identical
        // cache_key for the identical query and reads this same table on behalf of PAYING
        // customers, and storeSerpCache() below gives a zero-result entry a 30-DAY TTL --
        // so a timed-out anonymous check would hand a paid scan a "not found" on a broker
        // nobody ever searched, for a month. scan-brokers guards its own failures with a
        // 6h error TTL; the cheapest equivalent in here is to cache nothing at all and let
        // the next caller do a real search.
        // continue, not break: before this change a failed call returned [] and the loop
        // simply moved on to the city-qualified query, which is often the one that finds
        // the person. Breaking here would trade a real "we found you" reveal for nothing,
        // and the budget cost is unchanged -- 2 queries per broker was always the ceiling.
        serpFailed = true;
        continue;
      }
      results = search.results;
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
    return {
      result: { slug: broker.slug, name: broker.name, domain: broker.domain, status: 'unknown', confidence: null, profileUrl: null, evidence: [] },
      budgetExhausted,
      serpFailed,
    };
  }
  return {
    result: {
      slug: broker.slug,
      name: broker.name,
      domain: broker.domain,
      status: best.score.status_v2,
      confidence: Math.round(best.score.total * 100) / 100,
      // Also returned for possible_match: the visitor can open it and judge for
      // themselves, which is more honest than asserting a match we are unsure of.
      profileUrl:
        best.score.status_v2 === 'found' || best.score.status_v2 === 'possible_match'
          ? best.link
          : null,
      evidence: best.score.evidence,
    },
    budgetExhausted,
    serpFailed,
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

  // Cheapest possible check, before we parse a body or build a client. When the caller
  // can't be identified we do NOT limit: a missing header must not collapse every visitor
  // into one shared bucket and brick the free scan. The DB bucket still caps the spend.
  const ip = clientIp(req);
  if (ip && isRateLimited(ip)) {
    // 429 with no results — supabase-js surfaces this as an error and the UI shows its
    // "try again in a moment" state. Never a results payload, which would read as an
    // all-clear.
    return new Response(JSON.stringify({ error: 'Too many checks from this connection. Please try again in a minute.' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
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

    // Run brokers concurrently — the budget RPC locks the day's row, so this is safe and fast.
    const checks: BrokerCheck[] = await Promise.all(
      FREE_BROKERS.map((broker) =>
        checkBroker(broker, user, serpApiKey, supabase).catch((e) => {
          console.error(`[free-broker-check] ${broker.slug} failed:`, e);
          return {
            result: { slug: broker.slug, name: broker.name, domain: broker.domain, status: 'unknown' as StatusV2, confidence: null, profileUrl: null, evidence: [] },
            budgetExhausted: false,
            serpFailed: true,
          };
        })
      )
    );

    const results: BrokerResult[] = checks.map((c) => c.result);
    const budgetExhausted = checks.some((c) => c.budgetExhausted);
    const serpFailed = checks.some((c) => c.serpFailed);
    if (budgetExhausted) {
      console.warn('[free-broker-check] free SERP bucket exhausted — returning degraded result');
    }

    const foundCount = results.filter((r) => r.status === 'found').length;
    const possibleCount = results.filter((r) => r.status === 'possible_match').length;
    const notFoundCount = results.filter((r) => r.status === 'not_found').length;
    const unknownCount = results.filter((r) => r.status === 'unknown').length;

    // "Degraded" = we could NOT meaningfully perform the check, so a zero result
    // must NOT be presented as a reassuring "you're clean". This happens when the
    // SERP key is unset, when the free daily bucket ran out part-way through (we
    // knowingly skipped searches we would otherwise have run), or when every broker
    // came back inconclusive (SERP failure / no indexed data). Only when at least one
    // broker was actually searched (found / possible / not_found) AND nothing was
    // skipped for budget is a zero-exposure result trustworthy.
    // budgetExhausted and serpFailed are included even when some brokers did answer: a
    // partial pass is exactly the case where "0 listings" would read as an all-clear and
    // be wrong. The UI only swaps in the degraded copy when nothing was found, so this
    // costs the "we found you on N sites" moment nothing.
    const degraded = !serpApiKey || budgetExhausted || serpFailed || (foundCount + possibleCount + notFoundCount === 0);

    return new Response(JSON.stringify({
      results,
      foundCount,
      possibleCount,
      notFoundCount,
      unknownCount,
      checkedCount: results.length,
      degraded,
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
