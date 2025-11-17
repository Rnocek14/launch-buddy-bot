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
    const { maxResults = 100, after, query } = await req.json().catch(() => ({}));

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
        const result = await processConnection(connection, user, maxResults, after, query, supabase);
        
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

async function processConnection(connection: any, user: any, maxResults: number, after: any, query: any, supabase: any) {
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
  if (connection.tokens_encrypted && connection.access_token_encrypted) {
    const encryptedBase64 = btoa(String.fromCharCode(...connection.access_token_encrypted));
    accessToken = await decrypt(encryptedBase64);
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);
  
  if (now >= expiresAt) {
    console.log('Access token expired, refreshing...');
    
    let refreshToken = connection.refresh_token;
    if (connection.tokens_encrypted && connection.refresh_token_encrypted) {
      const encryptedBase64 = btoa(String.fromCharCode(...connection.refresh_token_encrypted));
      refreshToken = await decrypt(encryptedBase64);
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
  if (after || lastScanDate) {
    filters.after = after || (lastScanDate ? lastScanDate.toISOString() : undefined);
  }
  if (query) {
    filters.query = query;
  }

  const messages = await provider.getMessages(accessToken, filters);
  console.log(`Fetched ${messages.length} messages`);

  // Extract unique domains from email senders
  const emailDomains = new Set<string>();
  for (const message of messages) {
    const emailMatch = message.from.match(/<(.+?)>/) || message.from.match(/([^\s<>]+@[^\s<>]+)/);
    if (emailMatch) {
      const email = emailMatch[1] || emailMatch[0];
      const domain = email.split('@')[1]?.toLowerCase();
      if (domain) {
        emailDomains.add(domain);
      }
    }
  }

  console.log(`Found ${emailDomains.size} unique domains`);

  // Query service catalog for matching domains
  const { data: matchedServices } = await supabase
    .from('service_catalog')
    .select('id, domain, name')
    .in('domain', Array.from(emailDomains));

  console.log(`Matched ${matchedServices?.length || 0} services from catalog`);

  const matchedDomains = new Set(matchedServices?.map((s: any) => s.domain) || []);
  const unmatchedDomains = Array.from(emailDomains).filter(d => !matchedDomains.has(d));

  // Update or insert user_services
  let newServicesCount = 0;
  let reappearedServicesCount = 0;

  if (matchedServices && matchedServices.length > 0) {
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

  // Insert unmatched domains
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
