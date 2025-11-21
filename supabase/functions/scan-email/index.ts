import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getEmailProvider } from "../_shared/email-providers/factory.ts";
import { ProviderType } from "../_shared/email-providers/types.ts";
import { decrypt, encrypt } from "../_shared/encryption.ts";
import { detectTokenEncryption, validateTokenState } from "../_shared/token-validator.ts";

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

async function getDecryptedToken(
  token: string,
  markedAsEncrypted: boolean,
  provider: 'gmail' | 'outlook'
): Promise<string> {
  // Use smart detection to determine actual token state
  const detection = detectTokenEncryption(token, provider);
  
  console.log(`Token detection: ${detection.reason}, confidence: ${detection.confidence}`);

  if (detection.isEncrypted) {
    try {
      const decrypted = await decrypt(token);
      console.log('Token decrypted successfully');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed despite detection:', error);
      throw new Error('Token is encrypted but decryption failed - connection needs reset');
    }
  }

  // Token is plain text
  if (markedAsEncrypted) {
    console.warn('⚠️ Token marked as encrypted but detected as plain - FLAG MISMATCH');
  }
  
  return token;
}

async function repairTokenState(
  connectionId: string,
  connection: any,
  supabase: any
): Promise<void> {
  console.log(`🔧 Attempting automatic token state repair for connection ${connectionId}`);
  
  try {
    // Decrypt the tokens (they're encrypted but mislabeled as plain)
    const decryptedAccess = await decrypt(connection.access_token);
    const decryptedRefresh = await decrypt(connection.refresh_token);
    
    console.log('✅ Successfully decrypted mislabeled tokens');

    // Re-encrypt them properly
    const reencryptedAccess = await encrypt(decryptedAccess);
    const reencryptedRefresh = await encrypt(decryptedRefresh);

    // Update database with correct flag
    const { error: updateError } = await supabase
      .from('email_connections')
      .update({
        access_token: reencryptedAccess,
        refresh_token: reencryptedRefresh,
        tokens_encrypted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Token state repaired successfully - database updated');
  } catch (error) {
    console.error('❌ Token repair failed:', error);
    
    // Mark connection as needing manual reconnection
    await supabase
      .from('email_connections')
      .update({
        tokens_encrypted: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId);
    
    throw new Error('Token state corrupted beyond automatic repair - reconnection required');
  }
}

async function processConnection(connection: any, user: any, maxResults: number, after: any, query: any, supabase: any) {
  console.log(`Using ${connection.provider} connection: ${connection.email}`);

  // === LAYER 2: SMART TOKEN VALIDATION ===
  let tokenRepairStatus = 'none';
  let tokenIssues: string[] = [];
  
  const validation = validateTokenState(connection);
  
  if (!validation.isValid) {
    tokenIssues = validation.issues;
    console.warn('⚠️ Token state validation FAILED:', {
      connectionId: connection.id,
      email: connection.email,
      issues: validation.issues,
      recommendedAction: validation.recommendedAction
    });

    // If we detect encrypted tokens mislabeled as plain, attempt auto-repair
    if (validation.recommendedAction === 'decrypt_and_reencrypt') {
      try {
        await repairTokenState(connection.id, connection, supabase);
        tokenRepairStatus = 'repaired';
        
        // Reload connection after repair
        const { data: repairedConnection } = await supabase
          .from('email_connections')
          .select('*')
          .eq('id', connection.id)
          .single();
        
        if (repairedConnection) {
          connection = repairedConnection;
          console.log('✅ Using repaired connection for scan');
        }
      } catch (repairError) {
        tokenRepairStatus = 'failed';
        console.error('❌ Auto-repair failed, proceeding with caution:', repairError);
      }
    }
  } else {
    console.log('✅ Token state validation passed');
  }

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

  // Get access token using smart decryption
  let accessToken: string;
  try {
    accessToken = await getDecryptedToken(
      connection.access_token,
      connection.tokens_encrypted,
      connection.provider
    );
  } catch (error) {
    console.error('Failed to get access token:', error);
    throw new Error('Unable to access email account - please reconnect your Gmail account');
  }

  // Check if token is expired
  const now = new Date();
  const expiresAt = new Date(connection.token_expires_at);
  
  if (now >= expiresAt) {
    console.log('Access token expired, refreshing...');
    
    // Get the provider
    const provider = getEmailProvider(connection.provider as ProviderType);
    
    // Get refresh token with smart decryption
    let refreshToken: string;
    try {
      refreshToken = await getDecryptedToken(
        connection.refresh_token,
        connection.tokens_encrypted,
        connection.provider
      );
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      throw new Error('Unable to refresh access - please reconnect your Gmail account');
    }

    // BUG FIX: Always pass the already-decrypted token to provider
    // The provider will handle re-encryption if needed
    const tokenData = await provider.refreshToken(
      refreshToken,  // Already decrypted above
      user.id,
      false  // Tell provider token is NOT encrypted (we already decrypted it)
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
  const scanAfter = lastScanDate || after;
  
  const messages = await provider.getMessages(accessToken, {
    maxResults,
    after: scanAfter,
    query,
  });

  console.log(`Fetched ${messages.length} messages ${scanAfter ? `since ${new Date(scanAfter).toISOString()}` : '(full scan)'}`);

  // BUG FIX: If incremental scan returns 0, try a small full scan
  if (messages.length === 0 && scanAfter) {
    console.log('⚠️ Incremental scan returned 0 messages, trying full scan with limit 50...');
    const fullScanMessages = await provider.getMessages(accessToken, {
      maxResults: 50,
      query,
    });
    console.log(`Full scan returned ${fullScanMessages.length} messages`);
    messages.push(...fullScanMessages);
  }

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

  // Check for reappearances
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

  // Insert matched services
  let servicesAdded = 0;
  let servicesReappeared = 0;
  
  for (const match of matchedServices) {
    const isReappeared = reappearedServiceIds.has(match.service_id);
    
    await supabase
      .from('user_services')
      .upsert({
        user_id: user.id,
        service_id: match.service_id,
        discovered_from_connection_id: connection.id,
        discovered_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,service_id',
        ignoreDuplicates: true,
      });

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
    }
  }

  // Update last scan date
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
      tokenRepairStatus,
      tokenIssues: tokenIssues.length > 0 ? tokenIssues : undefined,
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}
