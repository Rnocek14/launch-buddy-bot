import { createClient } from 'npm:@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Stores an email address that has explicitly consented to be contacted.
 *
 * Runs with the service role so the browser never gets insert rights on
 * scan_leads — otherwise the table would be trivially stuffable from the
 * console by anyone who read the bundle.
 *
 * Two writes per capture, deliberately:
 *   1. scan_leads     — the consent record and its audit trail.
 *   2. email_preferences — mints the unsubscribe token so the existing
 *      /unsubscribe?token= page works for these addresses with no new UI.
 *      Skipped if a preferences row already exists, so we never resurrect
 *      someone who previously unsubscribed.
 */

// Per-isolate rate limit, mirroring free-breach-check. Not a security
// boundary on its own — it just makes casual abuse tedious.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const consented = body.consented === true;
    const source = String(body.source ?? 'free_scan').slice(0, 64);
    const sourceDetail = body.sourceDetail ? String(body.sourceDetail).slice(0, 128) : null;
    const sourcePath = body.sourcePath ? String(body.sourcePath).slice(0, 256) : null;
    const consentCopy = body.consentCopy ? String(body.consentCopy).slice(0, 512) : null;

    if (!email || !EMAIL_RE.test(email) || email.length > 320) {
      return new Response(JSON.stringify({ error: 'Valid email required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Refusing without consent is the whole point of this function existing.
    // A caller that forgets the flag must not silently capture the address.
    if (!consented) {
      return new Response(JSON.stringify({ error: 'Consent required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (isRateLimited(email)) {
      return new Response(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } },
    );

    const { error: leadError } = await supabase
      .from('scan_leads')
      .upsert(
        {
          email,
          source,
          source_detail: sourceDetail,
          source_path: sourcePath,
          consented: true,
          consented_at: new Date().toISOString(),
          consent_copy: consentCopy,
        },
        { onConflict: 'email' },
      );

    if (leadError) {
      console.error('[capture-scan-lead] insert failed:', leadError);
      return new Response(JSON.stringify({ error: 'Could not save' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mint an unsubscribe token, but never overwrite an existing row — if
    // this address previously unsubscribed, that decision stands and a new
    // consent tick should not quietly flip `unsubscribed` back to false.
    const { data: existing } = await supabase
      .from('email_preferences')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!existing) {
      const { error: prefError } = await supabase
        .from('email_preferences')
        .insert({ email, unsubscribed: false });
      if (prefError) {
        // Non-fatal: the lead is stored, they just have no token yet. Logged
        // rather than surfaced, because the user's action did succeed.
        console.error('[capture-scan-lead] preferences insert failed:', prefError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[capture-scan-lead] error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
