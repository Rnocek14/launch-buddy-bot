import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Guardrail 1: URL Validation ───────────────────────────────────────────
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^\[?::1\]?$/,
  /^\[?fe80:/i,
  /^\[?fc00:/i,
  /^\[?fd/i,
];

function isPrivateOrLocalhost(hostname: string): boolean {
  if (hostname === 'localhost') return true;
  return PRIVATE_IP_PATTERNS.some(p => p.test(hostname));
}

function validateUnsubscribeUrl(url: string, senderDomain: string): { valid: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  // Scheme must be https (allow http only as last resort, but flag it)
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { valid: false, reason: `Blocked scheme: ${parsed.protocol}` };
  }

  // Block IP literals and private networks
  if (isPrivateOrLocalhost(parsed.hostname)) {
    return { valid: false, reason: 'Blocked: private/localhost IP' };
  }

  // IP literal check (raw IPv4 or IPv6 in hostname)
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(parsed.hostname) || parsed.hostname.startsWith('[')) {
    return { valid: false, reason: 'Blocked: IP literal in hostname' };
  }

  // Domain validation: unsubscribe URL host should relate to sender domain
  // Allow subdomains of the sender domain, or well-known unsubscribe services
  const KNOWN_UNSUB_SERVICES = [
    'list-manage.com', 'mailchimp.com', 'sendgrid.net', 'constantcontact.com',
    'campaign-archive.com', 'mailgun.org', 'postmarkapp.com', 'mandrillapp.com',
    'brevo.com', 'sendinblue.com', 'hubspot.com', 'klaviyo.com', 'convertkit.com',
    'substack.com', 'beehiiv.com', 'buttondown.email', 'revue.email',
    'aweber.com', 'getresponse.com', 'drip.com', 'activecampaign.com',
    'email.mg', 'rsgsv.net', 'list-manage.com', 'mcsv.net',
  ];

  const urlHost = parsed.hostname.toLowerCase();
  const normalizedSender = senderDomain.toLowerCase();

  const isDomainRelated = urlHost === normalizedSender ||
    urlHost.endsWith('.' + normalizedSender) ||
    normalizedSender.endsWith('.' + urlHost) ||
    KNOWN_UNSUB_SERVICES.some(s => urlHost === s || urlHost.endsWith('.' + s));

  if (!isDomainRelated) {
    return { valid: false, reason: `Domain mismatch: ${urlHost} vs sender ${normalizedSender}` };
  }

  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    const { subscriptionId, confirm } = await req.json();
    if (!subscriptionId) throw new Error('subscriptionId is required');

    // ─── Guardrail 3: Require explicit confirmation ────────────────────
    if (!confirm) {
      throw new Error('Explicit confirmation required. Set confirm: true to proceed.');
    }

    // Fetch subscription (RLS ensures user owns it)
    const { data: subscription, error: subError } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) throw new Error('Subscription not found');
    if (subscription.status === 'unsubscribed') {
      return new Response(JSON.stringify({ success: true, message: 'Already unsubscribed', method: 'none' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let method = 'none';
    let result = 'url_returned';
    let errorMessage: string | undefined;
    let responseStatus: number | undefined;
    let responseUrl: string | undefined;

    // ─── Attempt one-click POST (RFC 8058) ─────────────────────────────
    if (subscription.has_one_click && subscription.unsubscribe_url) {
      const validation = validateUnsubscribeUrl(subscription.unsubscribe_url, subscription.sender_domain);
      
      if (validation.valid) {
        method = 'one_click';
        try {
          // Follow redirects manually with hop validation (max 3)
          let currentUrl = subscription.unsubscribe_url;
          let response: Response | null = null;
          const MAX_REDIRECTS = 3;

          for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
            const hopValidation = validateUnsubscribeUrl(currentUrl, subscription.sender_domain);
            if (!hopValidation.valid) {
              throw new Error(`Redirect hop ${hop} blocked: ${hopValidation.reason}`);
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            response = await fetch(currentUrl, {
              method: hop === 0 ? 'POST' : 'GET', // POST only on first request
              headers: hop === 0 ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {},
              body: hop === 0 ? 'List-Unsubscribe=One-Click-Unsubscribe' : undefined,
              signal: controller.signal,
              redirect: 'manual',
            });
            clearTimeout(timeout);

            // If redirect, follow manually
            if ([301, 302, 303, 307, 308].includes(response.status)) {
              const location = response.headers.get('location');
              if (!location) break;
              currentUrl = new URL(location, currentUrl).toString();
              continue;
            }
            break; // non-redirect response
          }

          responseStatus = response?.status;

          // ─── Guardrail 2: Only mark success on clear 2xx ───────────
          if (response?.ok) {
            result = 'success';
          } else {
            result = 'failed';
            errorMessage = `One-click POST returned ${response?.status ?? 'no response'}`;
          }
        } catch (fetchError) {
          result = 'failed';
          errorMessage = fetchError instanceof Error ? fetchError.message : 'Fetch failed';
          console.error('One-click unsubscribe failed:', errorMessage);
        }
      } else {
        console.warn(`URL validation failed for ${subscription.unsubscribe_url}: ${validation.reason}`);
        errorMessage = `URL blocked: ${validation.reason}`;
        result = 'failed';
        method = 'one_click';
      }
    }

    // ─── Fallback: return URL for manual open ──────────────────────────
    if (result !== 'success' && subscription.unsubscribe_url) {
      const validation = validateUnsubscribeUrl(subscription.unsubscribe_url, subscription.sender_domain);
      if (validation.valid) {
        responseUrl = subscription.unsubscribe_url;
        if (method === 'none') method = 'url';
        if (result !== 'failed') result = 'url_returned';
      }
    }

    // ─── Fallback: return mailto for manual send ───────────────────────
    if (result !== 'success' && !responseUrl && subscription.unsubscribe_mailto) {
      responseUrl = subscription.unsubscribe_mailto;
      if (method === 'none') method = 'mailto';
      if (result !== 'failed') result = 'url_returned';
    }

    // Update subscription status
    const newStatus = result === 'success' ? 'unsubscribed' : subscription.status;
    await supabaseAdmin
      .from('email_subscriptions')
      .update({
        status: newStatus,
        ...(result === 'success' && { unsubscribed_at: new Date().toISOString() }),
        last_unsubscribe_attempt_at: new Date().toISOString(),
        last_error: result === 'failed' ? errorMessage : null,
      })
      .eq('id', subscriptionId);

    // ─── Guardrail 3: Audit log ────────────────────────────────────────
    await supabaseAdmin
      .from('unsubscribe_audit_log')
      .insert({
        user_id: user.id,
        subscription_id: subscriptionId,
        method,
        sender_domain: subscription.sender_domain,
        sender_email: subscription.sender_email,
        result,
        error_message: errorMessage || null,
        response_status: responseStatus || null,
      });

    return new Response(JSON.stringify({
      success: result === 'success',
      result,
      method,
      redirectUrl: responseUrl,
      error: errorMessage,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in execute-unsubscribe:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
