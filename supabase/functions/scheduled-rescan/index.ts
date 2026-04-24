import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { getEmailProvider } from "../_shared/email-providers/factory.ts";
import { ProviderType } from "../_shared/email-providers/types.ts";
import { decrypt } from "../_shared/encryption.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RescanResult {
  userId: string;
  email: string;
  success: boolean;
  newServices?: number;
  reappearedServices?: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('[SCHEDULED-RESCAN] Starting automated monthly rescan');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    }

    // Use service role for admin access
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Find Pro users who haven't been auto-rescanned in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: proSubscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('tier', 'pro')
      .eq('status', 'active');

    if (subError) {
      throw new Error(`Failed to fetch Pro subscriptions: ${subError.message}`);
    }

    if (!proSubscriptions || proSubscriptions.length === 0) {
      console.log('[SCHEDULED-RESCAN] No active Pro users found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No Pro users to rescan',
          usersProcessed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const proUserIds = proSubscriptions.map(s => s.user_id);
    console.log(`[SCHEDULED-RESCAN] Found ${proUserIds.length} Pro users`);

    // Get profiles that haven't been rescanned recently
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, last_auto_rescan_at')
      .in('id', proUserIds)
      .or(`last_auto_rescan_at.is.null,last_auto_rescan_at.lt.${thirtyDaysAgo.toISOString()}`);

    if (profileError) {
      throw new Error(`Failed to fetch profiles: ${profileError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log('[SCHEDULED-RESCAN] All Pro users have been rescanned recently');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All Pro users were rescanned within the last 30 days',
          usersProcessed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[SCHEDULED-RESCAN] ${profiles.length} Pro users due for rescan`);

    const results: RescanResult[] = [];

    // Process each user
    for (const profile of profiles) {
      console.log(`[SCHEDULED-RESCAN] Processing user: ${profile.id}`);
      
      try {
        const result = await rescanUser(profile.id, supabase);
        results.push({
          userId: profile.id,
          email: profile.email || 'unknown',
          success: true,
          newServices: result.totalNew,
          reappearedServices: result.totalReappeared,
        });

        // Update last_auto_rescan_at
        await supabase
          .from('profiles')
          .update({ last_auto_rescan_at: new Date().toISOString() })
          .eq('id', profile.id);

        console.log(`[SCHEDULED-RESCAN] User ${profile.id}: ${result.totalNew} new, ${result.totalReappeared} reappeared`);

        // Fire-and-forget: alert function will diff and only send if something is new
        try {
          await supabase.functions.invoke('send-exposure-alert', {
            body: { userId: profile.id, triggerSource: 'scheduled_rescan' },
          });
        } catch (alertErr) {
          console.error(`[SCHEDULED-RESCAN] Alert dispatch failed for ${profile.id}:`, alertErr);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[SCHEDULED-RESCAN] Error processing user ${profile.id}:`, errorMsg);
        results.push({
          userId: profile.id,
          email: profile.email || 'unknown',
          success: false,
          error: errorMsg,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalNew = results.reduce((acc, r) => acc + (r.newServices || 0), 0);
    const totalReappeared = results.reduce((acc, r) => acc + (r.reappearedServices || 0), 0);

    const duration = Date.now() - startTime;
    console.log(`[SCHEDULED-RESCAN] Completed in ${duration}ms. Success: ${successCount}, Failed: ${failCount}`);

    // Log analytics event
    await supabase.from('analytics_events').insert({
      event: 'scheduled_rescan_completed',
      properties: {
        users_processed: profiles.length,
        success_count: successCount,
        fail_count: failCount,
        total_new_services: totalNew,
        total_reappeared: totalReappeared,
        duration_ms: duration,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        usersProcessed: profiles.length,
        successCount,
        failCount,
        totalNewServices: totalNew,
        totalReappeared,
        durationMs: duration,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SCHEDULED-RESCAN] Fatal error:', errorMsg);
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function rescanUser(userId: string, supabase: any): Promise<{ totalNew: number; totalReappeared: number }> {
  // Get user's email connections (up to 3 for Pro)
  const { data: connections, error: connError } = await supabase
    .from('email_connections')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .limit(3);

  if (connError) {
    throw new Error(`Failed to fetch connections: ${connError.message}`);
  }

  if (!connections || connections.length === 0) {
    console.log(`[SCHEDULED-RESCAN] User ${userId} has no email connections`);
    return { totalNew: 0, totalReappeared: 0 };
  }

  let totalNew = 0;
  let totalReappeared = 0;

  for (const connection of connections) {
    try {
      const result = await processConnection(connection, userId, supabase);
      totalNew += result.newServices;
      totalReappeared += result.reappearedServices;
    } catch (error) {
      console.error(`[SCHEDULED-RESCAN] Error processing connection ${connection.email}:`, error);
      // Continue with other connections
    }
  }

  return { totalNew, totalReappeared };
}

async function processConnection(
  connection: any, 
  userId: string, 
  supabase: any
): Promise<{ newServices: number; reappearedServices: number; messagesScanned: number }> {
  console.log(`[SCHEDULED-RESCAN] Processing ${connection.provider} connection: ${connection.email}`);

  // Fetch user's last email scan date for incremental scanning
  const { data: profile } = await supabase
    .from('profiles')
    .select('last_email_scan_date')
    .eq('id', userId)
    .single();

  const lastScanDate = profile?.last_email_scan_date
    ? new Date(profile.last_email_scan_date)
    : null;

  // Get access token (decrypt if encrypted)
  let accessToken = connection.access_token;
  if (connection.tokens_encrypted) {
    if (connection.access_token_encrypted) {
      const encryptedBase64 = btoa(String.fromCharCode(...connection.access_token_encrypted));
      accessToken = await decrypt(encryptedBase64);
    } else {
      accessToken = await decrypt(connection.access_token);
    }
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);

  if (now >= expiresAt) {
    console.log(`[SCHEDULED-RESCAN] Access token expired for ${connection.email}, refreshing...`);

    let refreshToken = connection.refresh_token;
    if (connection.tokens_encrypted) {
      if (connection.refresh_token_encrypted) {
        const encryptedBase64 = btoa(String.fromCharCode(...connection.refresh_token_encrypted));
        refreshToken = await decrypt(encryptedBase64);
      } else {
        refreshToken = connection.refresh_token;
      }
    }

    const provider = getEmailProvider(connection.provider as ProviderType);
    const tokenData = await provider.refreshToken(
      refreshToken,
      userId,
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
    console.log(`[SCHEDULED-RESCAN] Token refreshed for ${connection.email}`);
  }

  // Get email provider and fetch messages
  const provider = getEmailProvider(connection.provider as ProviderType);

  const filters: any = { maxResults: 200 }; // Scan more messages for automated rescan
  if (lastScanDate) {
    filters.after = lastScanDate.toISOString();
  }

  const messages = await provider.getMessages(accessToken, filters);
  console.log(`[SCHEDULED-RESCAN] Fetched ${messages.length} messages for ${connection.email}`);

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

  console.log(`[SCHEDULED-RESCAN] Found ${emailDomains.size} unique domains`);

  // Query service catalog for matching domains
  const { data: matchedServices } = await supabase
    .from('service_catalog')
    .select('id, domain, name')
    .in('domain', Array.from(emailDomains));

  console.log(`[SCHEDULED-RESCAN] Matched ${matchedServices?.length || 0} services from catalog`);

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
        .eq('user_id', userId)
        .eq('service_id', service.id)
        .maybeSingle();

      if (!existingService) {
        await supabase.from('user_services').insert({
          user_id: userId,
          service_id: service.id,
          discovered_from_connection_id: connection.id,
          first_seen_date: new Date().toISOString(),
        });
        newServicesCount++;
      } else {
        await supabase
          .from('user_services')
          .update({
            last_scanned_at: new Date().toISOString(),
            reappeared_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
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
        .upsert(
          {
            user_id: userId,
            domain,
            email_from: emailFrom,
            occurrence_count: 1,
          },
          { onConflict: 'user_id,domain' }
        );
    }
  }

  // Update last scan date in profile
  await supabase
    .from('profiles')
    .update({ last_email_scan_date: new Date().toISOString() })
    .eq('id', userId);

  return {
    newServices: newServicesCount,
    reappearedServices: reappearedServicesCount,
    messagesScanned: messages.length,
  };
}
