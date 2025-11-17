import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEmailProvider } from "../_shared/email-providers/factory.ts";
import { ProviderType } from "../_shared/email-providers/types.ts";
import { decrypt } from "../_shared/encryption.ts";

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
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get parameters from request
    const { connectionId, maxResults = 100, after, query } = await req.json().catch(() => ({}));

    console.log(`Scanning email for user: ${user.id}, connectionId: ${connectionId || 'primary'}`);

    // Get the email connection
    let connectionQuery = supabase
      .from('email_connections')
      .select('*')
      .eq('user_id', user.id);

    if (connectionId) {
      connectionQuery = connectionQuery.eq('id', connectionId);
    } else {
      // Get primary connection or first available
      const { data: connections } = await supabase
        .from('email_connections')
        .select('*')
        .eq('user_id', user.id);
      
      const connection = connections?.find(c => c.is_primary) || connections?.[0];
      if (!connection) {
        throw new Error('No email connections found');
      }
      
      return await processConnection(connection, user, maxResults, after, query, supabase);
    }

    const { data: connection, error: connectionError } = await connectionQuery.maybeSingle();

    if (connectionError || !connection) {
      throw new Error('Email connection not found');
    }

    return await processConnection(connection, user, maxResults, after, query, supabase);
  } catch (error) {
    console.error('Error scanning email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function processConnection(connection: any, user: any, maxResults: number, after: any, query: any, supabase: any) {
  console.log(`Using ${connection.provider} connection: ${connection.email}`);

  // Fetch user's last email scan date for incremental scanning
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_email_scan_date')
    .eq('id', user.id)
    .single();
  
  const lastScanDate = profile?.last_email_scan_date 
    ? new Date(profile.last_email_scan_date) 
    : null;

  console.log(`Last scan date: ${lastScanDate ? lastScanDate.toISOString() : 'never (full scan)'}`);

  // Get access token (decrypt if encrypted)
  let accessToken = connection.access_token;
  if (connection.tokens_encrypted && connection.access_token_encrypted) {
    const encryptedBase64 = btoa(String.fromCharCode(...connection.access_token_encrypted));
    accessToken = await decrypt(encryptedBase64);
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);
  
  if (now >= expiresAt) {
    console.log('Access token expired, refreshing...');
    
    // Get the provider
    const provider = getEmailProvider(connection.provider as ProviderType);
    
    // Refresh token
    let refreshToken = connection.refresh_token;
    if (connection.tokens_encrypted && connection.refresh_token_encrypted) {
      const encryptedBase64 = btoa(String.fromCharCode(...connection.refresh_token_encrypted));
      refreshToken = encryptedBase64;
    }

    const tokenData = await provider.refreshToken(
      refreshToken,
      user.id,
      connection.tokens_encrypted || false
    );

    // Update connection with new token
    const { error: updateError } = await supabase
      .from('email_connections')
      .update({
        access_token: tokenData.access_token,
        token_expires_at: tokenData.expires_at,
      })
      .eq('id', connection.id);

    if (updateError) {
      console.error('Error updating token:', updateError);
    }

    accessToken = tokenData.access_token;
  }

  // Get the provider and scan messages
  const provider = getEmailProvider(connection.provider as ProviderType);
  
  // Use incremental scanning if we have a last scan date
  // The 'after' parameter is a timestamp that the provider will use to filter messages
  const scanAfter = lastScanDate || after;
  
  const messages = await provider.getMessages(accessToken, {
    maxResults,
    after: scanAfter,
    query,
  });

  console.log(`Fetched ${messages.length} messages ${scanAfter ? `since ${new Date(scanAfter).toISOString()}` : '(full scan)'}`);

  // Process messages to discover services
  const emailDomains = new Map<string, { from: string; count: number }>();
  
  for (const message of messages) {
    if (!message.from) continue;
    
    // Extract domain from email
    const emailMatch = message.from.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (!emailMatch) continue;
    
    const domain = emailMatch[1].toLowerCase();
    
    if (emailDomains.has(domain)) {
      const existing = emailDomains.get(domain)!;
      existing.count++;
    } else {
      emailDomains.set(domain, { from: message.from, count: 1 });
    }
  }

  console.log(`Discovered ${emailDomains.size} unique domains`);

  // Use service role client for catalog queries
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Match domains against service catalog
  const { data: catalogServices, error: catalogError } = await supabaseAdmin
    .from('service_catalog')
    .select('id, name, domain, category, logo_url, homepage_url');

  if (catalogError) {
    console.error('Error fetching service catalog:', catalogError);
    throw catalogError;
  }

  const matchedServices: any[] = [];
  const unmatchedDomains: any[] = [];
  
  for (const [domain, info] of emailDomains.entries()) {
    const service = catalogServices?.find(s => 
      s.domain.toLowerCase() === domain ||
      domain.includes(s.domain.toLowerCase()) ||
      s.domain.toLowerCase().includes(domain)
    );

    if (service) {
      matchedServices.push({
        service_id: service.id,
        domain: service.domain,
        name: service.name,
      });
    } else {
      unmatchedDomains.push({
        domain,
        email_from: info.from,
        occurrence_count: info.count,
      });
    }
  }

  console.log(`Matched ${matchedServices.length} services, ${unmatchedDomains.length} unmatched`);

  // Check for reappearances - services that were deleted but are still sending emails
  const { data: existingServices } = await supabase
    .from('user_services')
    .select('service_id, deletion_requested_at')
    .eq('user_id', user.id)
    .in('service_id', matchedServices.map(m => m.service_id));

  const reappearedServiceIds = new Set<string>();
  existingServices?.forEach((existing: any) => {
    if (existing.deletion_requested_at) {
      reappearedServiceIds.add(existing.service_id);
    }
  });

  // Insert matched services into user_services
  // Use two-step approach to preserve discovered_at on existing services
  let servicesAdded = 0;
  let servicesReappeared = 0;
  
  for (const match of matchedServices) {
    const isReappeared = reappearedServiceIds.has(match.service_id);
    
    // Step 1: Insert with ignoreDuplicates to preserve discovered_at
    await supabase
      .from('user_services')
      .upsert({
        user_id: user.id,
        service_id: match.service_id,
        discovered_from_connection_id: connection.id,
        discovered_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,service_id',
        ignoreDuplicates: true, // Don't overwrite existing records
      });

    // Step 2: Update last_scanned_at and reappeared_at on all (new and existing)
    const { error: updateError } = await supabase
      .from('user_services')
      .update({
        last_scanned_at: new Date().toISOString(),
        ...(isReappeared && { reappeared_at: new Date().toISOString() }),
      })
      .eq('user_id', user.id)
      .eq('service_id', match.service_id);

    if (!updateError) {
      servicesAdded++;
      if (isReappeared) {
        servicesReappeared++;
        console.log(`Service ${match.name} reappeared after deletion request`);
      }
    } else {
      console.error('Error updating service:', updateError);
    }
  }

  // Update last_email_scan_date in profiles
  await supabase
    .from('profiles')
    .update({ last_email_scan_date: new Date().toISOString() })
    .eq('id', user.id);

  // Insert unmatched domains
  for (const unmatched of unmatchedDomains) {
    await supabase
      .from('unmatched_domains')
      .upsert({
        user_id: user.id,
        domain: unmatched.domain,
        email_from: unmatched.email_from,
        occurrence_count: unmatched.occurrence_count,
      }, {
        onConflict: 'user_id,domain',
        ignoreDuplicates: false,
      });
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      servicesFound: servicesAdded,
      servicesReappeared,
      emailsScanned: messages.length,
      unmatchedCount: unmatchedDomains.length,
      message: `Scanned ${messages.length} emails and discovered ${servicesAdded} services${servicesReappeared > 0 ? ` (${servicesReappeared} reappeared after deletion)` : ''}`,
      provider: connection.provider,
      email: connection.email,
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}
