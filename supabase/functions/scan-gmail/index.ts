import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decrypt } from "../_shared/encryption.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScanRequest {
  accessToken?: string;
  connectionId?: string;
  scanAll?: boolean;
  scanType?: 'quick' | 'deep';
  maxEmailsPerCategory?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const requestBody = await req.json() as ScanRequest;
    const { accessToken, connectionId, scanAll, scanType = 'quick', maxEmailsPerCategory } = requestBody;
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let connectionsToScan = [];
    
    if (scanAll) {
      const { data: connections, error: connError } = await supabaseAdmin
        .from("gmail_connections")
        .select("id, email, access_token, tokens_encrypted")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false });
      
      if (connError || !connections || connections.length === 0) {
        throw new Error("No Gmail accounts connected");
      }
      connectionsToScan = connections;
      console.log(`Scanning all ${connections.length} connected accounts`);
    } else if (connectionId) {
      const { data: connection, error: connError } = await supabaseAdmin
        .from("gmail_connections")
        .select("id, email, access_token, tokens_encrypted")
        .eq("user_id", user.id)
        .eq("id", connectionId)
        .single();
      
      if (connError || !connection) {
        throw new Error("Gmail connection not found");
      }
      connectionsToScan = [connection];
      console.log(`Scanning specific account: ${connection.email}`);
    } else if (accessToken) {
      connectionsToScan = [{ id: null, email: "legacy", access_token: accessToken, tokens_encrypted: false }];
      console.log("Using legacy access token");
    } else {
      const { data: connection, error: connError } = await supabaseAdmin
        .from("gmail_connections")
        .select("id, email, access_token, tokens_encrypted")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .single();
      
      if (connError || !connection) {
        throw new Error("No primary Gmail account found");
      }
      connectionsToScan = [connection];
      console.log(`Scanning primary account: ${connection.email}`);
    }

    const emailLimit = scanType === 'quick' ? 500 : (maxEmailsPerCategory || 5000);
    
    const allDiscoveredServices = new Map<string, { firstSeen: string | null; connectionId: string | null }>();
    let totalEmailsScanned = 0;
    const allUnmatchedDomains = new Map<string, string>();
    const categoryBreakdownTotal: Record<string, number> = { signup: 0, financial: 0, commerce: 0, security: 0, engagement: 0 };
    
    const { data: userIdentifiers } = await supabase
      .from("user_identifiers")
      .select("id, type, value")
      .eq("user_id", user.id);

    const emailIdentifiers = new Set<string>();
    const usernameIdentifiers = new Set<string>();
    
    if (userIdentifiers) {
      for (const identifier of userIdentifiers) {
        const normalizedValue = identifier.value.toLowerCase();
        if (identifier.type === 'email') emailIdentifiers.add(normalizedValue);
        else if (identifier.type === 'username') usernameIdentifiers.add(normalizedValue);
      }
    }

    const { data: serviceCatalog } = await supabase.from("service_catalog").select("id, domain, name");
    const domainMap = new Map<string, any>();
    if (serviceCatalog) {
      for (const service of serviceCatalog) {
        domainMap.set(service.domain.toLowerCase(), service);
      }
    }

    const queries = {
      signup: 'subject:(welcome OR "thank you for signing up" OR "confirm your" OR "verify your email" OR "account created" OR registration)',
      financial: 'subject:(invoice OR receipt OR billing OR payment OR "statement" OR "your order" OR "purchase confirmation")',
      commerce: 'subject:("shipped" OR "tracking" OR "delivery" OR "order confirmed" OR "your package")',
      security: 'subject:("password reset" OR "security alert" OR "suspicious activity" OR "login attempt" OR "two-factor")',
      engagement: 'subject:("newsletter" OR "digest" OR "weekly update" OR "monthly roundup" OR "you have new")'
    };

    for (const connection of connectionsToScan) {
      console.log(`\n=== Scanning account: ${connection.email} ===`);
      
      const scanAccessToken = connection.tokens_encrypted && connection.access_token
        ? await decrypt(connection.access_token)
        : connection.access_token;

      const accountMessages = new Map<string, { msg: any; category: string }>();
      const categoryBreakdown: Record<string, number> = { signup: 0, financial: 0, commerce: 0, security: 0, engagement: 0 };

      for (const [category, query] of Object.entries(queries)) {
        try {
          let pageToken: string | undefined = undefined;
          let categoryEmailCount = 0;
          
          do {
            const url: string = pageToken
              ? `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=500&pageToken=${pageToken}`
              : `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=500`;
            
            const messagesResponse: Response = await fetch(url, {
              headers: { Authorization: `Bearer ${scanAccessToken}` }
            });

            if (!messagesResponse.ok) {
              const errorText = await messagesResponse.text();
              if (messagesResponse.status === 401) {
                throw new Error("Gmail access token expired");
              }
              console.error(`Gmail API error (${category}):`, errorText);
              break;
            }

            const messagesData: any = await messagesResponse.json();
            const messages: any[] = messagesData.messages || [];
            
            for (const msg of messages) {
              if (!accountMessages.has(msg.id)) {
                accountMessages.set(msg.id, { msg, category });
                categoryBreakdown[category]++;
                categoryEmailCount++;
              }
            }
            
            if (categoryEmailCount >= emailLimit || !messagesData.nextPageToken) {
              break;
            }
            pageToken = messagesData.nextPageToken;
          } while (pageToken && categoryEmailCount < emailLimit);

          console.log(`${category}: ${categoryEmailCount} emails`);
        } catch (err) {
          console.error(`Error fetching ${category}:`, err);
        }
      }

      console.log(`Fetched ${accountMessages.size} unique messages from ${connection.email}`);
      totalEmailsScanned += accountMessages.size;

      for (const [key, value] of Object.entries(categoryBreakdown)) {
        categoryBreakdownTotal[key] += value;
      }

      const discoveredServices = new Map<string, string | null>();
      const unmatchedDomains = new Map<string, string>();

      const messageIds = Array.from(accountMessages.keys());
      const BATCH_SIZE = 100;
      
      for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
        const batch = messageIds.slice(i, i + BATCH_SIZE);
        
        await Promise.all(batch.map(async (messageId) => {
          try {
            const detailResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc`,
              { headers: { Authorization: `Bearer ${scanAccessToken}` } }
            );

            if (!detailResponse.ok) return;

            const detail = await detailResponse.json();
            const headers = detail.payload?.headers || [];
            const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
            const toHeader = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
            const ccHeader = headers.find((h: any) => h.name.toLowerCase() === 'cc')?.value || '';
            const internalDate = detail.internalDate;

            const emailMatch = fromHeader.match(/<([^>]+)>/) || fromHeader.match(/([^\s<>]+@[^\s<>]+)/);
            if (!emailMatch) return;

            const senderEmail = emailMatch[1].toLowerCase();
            const domain = senderEmail.split('@')[1];
            if (!domain) return;

            let matchedIdentifier = false;
            const recipientFields = [toHeader, ccHeader].filter(Boolean);
            
            for (const field of recipientFields) {
              const recipientMatches = field.matchAll(/<?([^\s<>]+@[^\s<>]+)>?/g);
              for (const match of recipientMatches) {
                const recipientEmail = match[1].toLowerCase();
                if (emailIdentifiers.has(recipientEmail)) {
                  matchedIdentifier = true;
                  break;
                }
                const recipientUsername = recipientEmail.split("@")[0];
                if (usernameIdentifiers.has(recipientUsername)) {
                  matchedIdentifier = true;
                  break;
                }
              }
              if (matchedIdentifier) break;
            }

            const baseDomain = domain.split(".").slice(-2).join(".");
            const service = domainMap.get(domain) || domainMap.get(baseDomain);
            
            if (service) {
              const newDate = internalDate ? new Date(parseInt(internalDate)).toISOString() : null;
              const existingDate = discoveredServices.get(service.id);
              if (!existingDate || (newDate && newDate < existingDate)) {
                discoveredServices.set(service.id, newDate);
              }
            } else if (!matchedIdentifier) {
              unmatchedDomains.set(domain, senderEmail);
            }
          } catch (err) {
            console.error(`Error processing message ${messageId}:`, err);
          }
        }));
      }

      console.log(`Discovered ${discoveredServices.size} services from ${connection.email}`);

      for (const [serviceId, firstSeen] of discoveredServices) {
        const existing = allDiscoveredServices.get(serviceId);
        if (!existing || (firstSeen && (!existing.firstSeen || firstSeen < existing.firstSeen))) {
          allDiscoveredServices.set(serviceId, { firstSeen, connectionId: connection.id });
        }
      }

      for (const [domain, email] of unmatchedDomains) {
        if (!allUnmatchedDomains.has(domain)) {
          allUnmatchedDomains.set(domain, email);
        }
      }
    }

    const servicesToInsert = Array.from(allDiscoveredServices.entries()).map(([serviceId, data]) => ({
      user_id: user.id,
      service_id: serviceId,
      first_seen_date: data.firstSeen,
      last_scanned_at: new Date().toISOString(),
      discovered_from_connection_id: data.connectionId
    }));

    if (servicesToInsert.length > 0) {
      await supabase
        .from("user_services")
        .upsert(servicesToInsert, { 
          onConflict: "user_id,service_id",
          ignoreDuplicates: false 
        });
    }

    if (allUnmatchedDomains.size > 0) {
      const domainsToInsert = Array.from(allUnmatchedDomains).map(([domain, emailFrom]) => ({
        user_id: user.id,
        domain,
        email_from: emailFrom
      }));

      await supabase
        .from("unmatched_domains")
        .upsert(domainsToInsert, {
          onConflict: "user_id,domain",
          ignoreDuplicates: false
        });
    }

    return new Response(
      JSON.stringify({ 
        servicesFound: allDiscoveredServices.size,
        emailsScanned: totalEmailsScanned,
        unmatchedCount: allUnmatchedDomains.size,
        accountsScanned: connectionsToScan.length,
        breakdown: categoryBreakdownTotal,
        message: `Found ${allDiscoveredServices.size} accounts from ${totalEmailsScanned} emails across ${connectionsToScan.length} Gmail account(s).`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Scan error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Scan failed", error_code: "SCAN_FAILED" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
