const serve = Deno.serve;
import { createClient } from "npm:@supabase/supabase-js@2.79.0";
import { getEmailProvider } from "../_shared/email-providers/factory.ts";
import { ProviderType } from "../_shared/email-providers/types.ts";
import { decrypt } from "../_shared/encryption.ts";
import {
  classifySubject,
  emptySignals,
  addSignal,
  computeProfile,
  type ServiceSignals,
} from "../_shared/subject-classifier.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Unauthorized');
    }
    const user = { id: userData.user.id };

    console.log(`Scanning all emails for user: ${user.id}`);

    // Check subscription tier
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const tier = subscription?.tier || 'free';
    console.log(`User tier: ${tier}`);

    // Get all email connections
    const { data: connections, error: connectionsError } = await supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false });

    if (connectionsError) {
      throw new Error(`Failed to fetch email connections: ${connectionsError.message}`);
    }

    if (!connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No email connections found',
          scannedEmails: [],
          totalDiscovered: 0,
          totalReappeared: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Filter connections based on tier
    let connectionsToScan = connections;
    if (tier === 'free') {
      // Free tier: only scan primary email
      connectionsToScan = connections.filter(c => c.is_primary).slice(0, 1);
    } else {
      // Pro tier: scan up to 3 emails
      connectionsToScan = connections.slice(0, 3);
    }

    console.log(`Scanning ${connectionsToScan.length} email(s): ${connectionsToScan.map(c => c.email).join(', ')}`);

    // Get parameters from request
    const { maxResults = 100, after, query, fullScan = false } = await req.json().catch(() => ({}));
    console.log(`fullScan: ${fullScan}, maxResults: ${maxResults}`);

    // Aggregate results
    let totalNewServices = 0;
    let totalReappearedServices = 0;
    let totalMessagesScanned = 0;
    const scannedEmails: string[] = [];
    const errors: Array<{ email: string; error: string }> = [];

    // Scan each connection
    for (const connection of connectionsToScan) {
      try {
        console.log(`Scanning email: ${connection.email}`);
        const result = await processConnection(connection, user, maxResults, after, query, supabase, fullScan);
        
        scannedEmails.push(connection.email);
        totalNewServices += result.newServices || 0;
        totalReappearedServices += result.reappearedServices || 0;
        totalMessagesScanned += result.messagesScanned || 0;

        console.log(`Completed scan for ${connection.email}: ${result.newServices} new, ${result.reappearedServices} reappeared`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error scanning ${connection.email}:`, errorMsg);
        errors.push({
          email: connection.email,
          error: errorMsg
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        scannedEmails,
        totalDiscovered: totalNewServices,
        totalReappeared: totalReappearedServices,
        totalMessagesScanned,
        tier,
        connectionsScanned: connectionsToScan.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in scan-all-emails:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function processConnection(connection: any, user: any, maxResults: number, after: any, query: any, supabase: any, fullScan: boolean = false) {
  console.log(`Processing ${connection.provider} connection: ${connection.email}`);

  // Fetch user's last email scan date for incremental scanning
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_email_scan_date')
    .eq('id', user.id)
    .single();
  
  const lastScanDate = profile?.last_email_scan_date 
    ? new Date(profile.last_email_scan_date) 
    : null;

  // Get access token (decrypt if encrypted)
  let accessToken = connection.access_token;
  if (connection.tokens_encrypted) {
    if (connection.access_token_encrypted) {
      // Bytea column is populated (Outlook-style)
      const encryptedBase64 = btoa(String.fromCharCode(...connection.access_token_encrypted));
      accessToken = await decrypt(encryptedBase64);
    } else {
      // Only text column has encrypted data (Gmail-style)
      accessToken = await decrypt(connection.access_token);
    }
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);
  
  if (now >= expiresAt) {
    console.log('Access token expired, refreshing...');
    
    let refreshToken = connection.refresh_token;
    if (connection.tokens_encrypted) {
      if (connection.refresh_token_encrypted) {
        // Bytea column is populated (Outlook-style)
        const encryptedBase64 = btoa(String.fromCharCode(...connection.refresh_token_encrypted));
        refreshToken = await decrypt(encryptedBase64);
      } else {
        // Only text column has encrypted data (Gmail-style)
        refreshToken = connection.refresh_token; // Already encrypted base64
      }
    }

    const provider = getEmailProvider(connection.provider as ProviderType);
    const tokenData = await provider.refreshToken(
      refreshToken, 
      user.id, 
      connection.tokens_encrypted || false
    );
    
    // Update connection with new tokens
    const updateData: any = {
      token_expires_at: tokenData.expires_at,
    };

    if (connection.tokens_encrypted) {
      const encryptedAccessToken = await decrypt(tokenData.access_token);
      updateData.access_token_encrypted = Uint8Array.from(atob(encryptedAccessToken), c => c.charCodeAt(0));
    } else {
      updateData.access_token = tokenData.access_token;
    }

    await supabase
      .from('email_connections')
      .update(updateData)
      .eq('id', connection.id);
    
    accessToken = tokenData.access_token;
    console.log('Token refreshed successfully');
  }

  // Get email provider and fetch messages
  const provider = getEmailProvider(connection.provider as ProviderType);
  
  const filters: any = { maxResults };
  // Deep/full scan ignores last_email_scan_date so we can dig back across history
  if (after || (lastScanDate && !fullScan)) {
    filters.after = after || (lastScanDate ? lastScanDate.toISOString() : undefined);
  }
  if (fullScan) {
    console.log(`🔍 Full scan requested — ignoring last_email_scan_date cutoff`);
  }
  if (query) {
    filters.query = query;
  }

  const messages = await provider.getMessages(accessToken, filters);
  console.log(`Fetched ${messages.length} messages`);

  // Extract unique domains AND classify subjects per domain (intelligence layer)
  const emailDomains = new Set<string>();
  const domainSignals = new Map<string, ServiceSignals>();
  for (const message of messages) {
    const emailMatch = message.from.match(/<(.+?)>/) || message.from.match(/([^\s<>]+@[^\s<>]+)/);
    if (emailMatch) {
      const email = emailMatch[1] || emailMatch[0];
      const domain = email.split('@')[1]?.toLowerCase();
      if (domain) {
        emailDomains.add(domain);
        // Aggregate per-domain signals from subject classification
        const classification = classifySubject(message.subject);
        const messageDate = message.date ? new Date(message.date).toISOString() : new Date().toISOString();
        const sigs = domainSignals.get(domain) ?? emptySignals();
        addSignal(sigs, classification, messageDate, message.subject ?? '');
        domainSignals.set(domain, sigs);
      }
    }
  }

  console.log(`Found ${emailDomains.size} unique domains`);

  // Query full service catalog (small table) and match with subdomain support
  // for parity with scan-email. e.g. order-update.amazon.com -> amazon.com.
  const { data: catalog } = await supabase
    .from('service_catalog')
    .select('id, domain, name');

  const matchedServices: Array<{ id: string; domain: string; name: string }> = [];
  const serviceSenderDomains = new Map<string, Set<string>>(); // service_id -> raw sender domains
  const matchedSenderDomains = new Set<string>();

  for (const senderDomain of emailDomains) {
    const service = catalog?.find((s: any) => {
      const cd = (s.domain || '').toLowerCase();
      return cd === senderDomain || senderDomain.endsWith('.' + cd);
    });
    if (service) {
      matchedSenderDomains.add(senderDomain);
      if (!serviceSenderDomains.has(service.id)) {
        matchedServices.push({ id: service.id, domain: service.domain, name: service.name });
        serviceSenderDomains.set(service.id, new Set());
      }
      serviceSenderDomains.get(service.id)!.add(senderDomain);
    }
  }

  console.log(`Matched ${matchedServices.length} services from catalog`);

  const unmatchedDomains = Array.from(emailDomains).filter(d => !matchedSenderDomains.has(d));

  // Update or insert user_services
  let newServicesCount = 0;
  let reappearedServicesCount = 0;

  if (matchedServices.length > 0) {
    for (const service of matchedServices) {
      const { data: existingService } = await supabase
        .from('user_services')
        .select('discovered_at, reappeared_at')
        .eq('user_id', user.id)
        .eq('service_id', service.id)
        .maybeSingle();

      if (!existingService) {
        await supabase.from('user_services').insert({
          user_id: user.id,
          service_id: service.id,
          discovered_from_connection_id: connection.id,
          first_seen_date: new Date().toISOString()
        });
        newServicesCount++;
      } else {
        await supabase
          .from('user_services')
          .update({
            last_scanned_at: new Date().toISOString(),
            reappeared_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('service_id', service.id);
        reappearedServicesCount++;
      }
    }
  }

  // === SIGNAL ENRICHMENT (intelligence layer) ===
  // Merge per-sender-domain signals into the catalog service they matched.
  if (matchedServices.length > 0) {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    for (const service of matchedServices) {
      const senderDomains = serviceSenderDomains.get(service.id);
      if (!senderDomains) continue;

      const merged = emptySignals();
      for (const sd of senderDomains) {
        const sigs = domainSignals.get(sd);
        if (!sigs) continue;
        merged.signup_count      += sigs.signup_count;
        merged.transaction_count += sigs.transaction_count;
        merged.security_count    += sigs.security_count;
        merged.newsletter_count  += sigs.newsletter_count;
        merged.policy_count      += sigs.policy_count;
        merged.shipping_count    += sigs.shipping_count;
        merged.social_count      += sigs.social_count;
        merged.unknown_count     += sigs.unknown_count;
        merged.total             += sigs.total;
        const pickLatest = (a?: string, b?: string) => (!a ? b : !b ? a : (a > b ? a : b));
        const lt = pickLatest(merged.last_transaction_at, sigs.last_transaction_at);
        if (lt === sigs.last_transaction_at && sigs.last_transaction_at) {
          merged.last_transaction_at = sigs.last_transaction_at;
          merged.transaction_sample = sigs.transaction_sample;
        } else if (lt) merged.last_transaction_at = lt;
        const ls = pickLatest(merged.last_security_at, sigs.last_security_at);
        if (ls === sigs.last_security_at && sigs.last_security_at) {
          merged.last_security_at = sigs.last_security_at;
          merged.security_sample = sigs.security_sample;
        } else if (ls) merged.last_security_at = ls;
        const lsg = pickLatest(merged.last_signup_at, sigs.last_signup_at);
        if (lsg === sigs.last_signup_at && sigs.last_signup_at) {
          merged.last_signup_at = sigs.last_signup_at;
          merged.signup_sample = sigs.signup_sample;
        } else if (lsg) merged.last_signup_at = lsg;
        merged.last_activity_at = pickLatest(merged.last_activity_at, sigs.last_activity_at);
      }

      if (merged.total === 0) continue;
      const profile = computeProfile(merged);
      const { error: sigErr } = await supabaseAdmin.rpc('upsert_service_signals', {
        p_user_id: user.id,
        p_service_id: service.id,
        p_signals: merged as unknown as Record<string, unknown>,
        p_confidence: profile.confidence,
        p_activity_status: profile.activity_status,
        p_cleanup_priority: profile.cleanup_priority,
        p_last_transaction_at: merged.last_transaction_at ?? null,
        p_last_security_at: merged.last_security_at ?? null,
        p_last_activity_at: merged.last_activity_at ?? null,
      });
      if (sigErr) console.error(`Failed to upsert signals for ${service.name}:`, sigErr.message);
    }
  }

  if (unmatchedDomains.length > 0) {
    for (const domain of unmatchedDomains) {
      const emailFrom = messages.find(m => m.from.toLowerCase().includes(domain))?.from || '';
      
      await supabase
        .from('unmatched_domains')
        .upsert({
          user_id: user.id,
          domain,
          email_from: emailFrom,
          occurrence_count: 1
        }, {
          onConflict: 'user_id,domain'
        });
    }
  }

  // Update last scan date in profile
  await supabase
    .from('profiles')
    .update({ last_email_scan_date: new Date().toISOString() })
    .eq('id', user.id);

  return {
    newServices: newServicesCount,
    reappearedServices: reappearedServicesCount,
    messagesScanned: messages.length,
    unmatchedDomains: unmatchedDomains.length
  };
}
