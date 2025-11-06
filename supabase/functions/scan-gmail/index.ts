import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScanRequest {
  accessToken: string;
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

    const { accessToken, scanType = 'quick', maxEmailsPerCategory } = await req.json() as ScanRequest;
    if (!accessToken) {
      throw new Error("Missing Gmail access token");
    }

    const emailLimit = scanType === 'quick' 
      ? 500 
      : (maxEmailsPerCategory || 5000); // Deep scan up to 5000 per category
    
    console.log(`Starting ${scanType} scan for user ${user.id} (${emailLimit} emails per category)`);

    // Fetch user's identifiers for intelligent matching
    const { data: userIdentifiers, error: identifierError } = await supabase
      .from("user_identifiers")
      .select("id, type, value")
      .eq("user_id", user.id);

    if (identifierError) {
      console.error("Error fetching user identifiers:", identifierError);
    }

    // Create lookup maps for fast identifier matching
    const emailIdentifiers = new Set<string>();
    const usernameIdentifiers = new Set<string>();
    const identifierMap = new Map<string, { id: string; type: string }>();

    if (userIdentifiers) {
      for (const identifier of userIdentifiers) {
        const normalizedValue = identifier.value.toLowerCase();
        identifierMap.set(normalizedValue, { id: identifier.id, type: identifier.type });
        
        if (identifier.type === 'email') {
          emailIdentifiers.add(normalizedValue);
        } else if (identifier.type === 'username') {
          usernameIdentifiers.add(normalizedValue);
        }
      }
      console.log(`Loaded ${userIdentifiers.length} identifiers for matching (${emailIdentifiers.size} emails, ${usernameIdentifiers.size} usernames)`);
    }

    // Define 5 category-based queries for comprehensive coverage
    const queries = {
      signup: 'subject:(welcome OR "thank you for signing up" OR "confirm your" OR "verify your email" OR "account created" OR registration OR "activate your account" OR "get started" OR "setup your account" OR "new account" OR "complete your profile" OR "verify your identity" OR "email verification")',
      financial: 'subject:(invoice OR receipt OR billing OR payment OR "statement" OR "your order" OR "purchase confirmation" OR "payment received" OR "subscription renewed")',
      commerce: 'subject:("shipped" OR "tracking" OR "delivery" OR "order confirmed" OR "your package" OR "out for delivery" OR "has been delivered")',
      security: 'subject:("password reset" OR "security alert" OR "suspicious activity" OR "login attempt" OR "verify your identity" OR "two-factor" OR "2FA" OR "unusual activity")',
      engagement: 'subject:("newsletter" OR "digest" OR "weekly update" OR "monthly roundup" OR "you have new" OR "notification" OR "reminder")'
    };

    // Fetch messages for all categories
    const allMessages = new Map<string, { msg: any; category: string }>();
    const categoryBreakdown: Record<string, number> = {
      signup: 0,
      financial: 0,
      commerce: 0,
      security: 0,
      engagement: 0
    };

    for (const [category, query] of Object.entries(queries)) {
      try {
        let pageToken: string | undefined = undefined;
        let categoryEmailCount = 0;
        
        // Pagination loop for deep scans
        do {
          const url: string = pageToken
            ? `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=500&pageToken=${pageToken}`
            : `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=500`;
          
          const messagesResponse: Response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (!messagesResponse.ok) {
          const errorText = await messagesResponse.text();
          let errorObj;
          try {
            errorObj = JSON.parse(errorText);
          } catch {
            errorObj = { error: errorText };
          }
          
          console.error(`Gmail API error for ${category}:`, errorObj);
          
          // Check for specific error types
          if (messagesResponse.status === 401) {
            throw new Error("Gmail access token is invalid or expired. Please reconnect your Google account.");
          } else if (messagesResponse.status === 403) {
            const errorMessage = errorObj.error?.message || errorText;
            if (errorMessage.includes("insufficient")) {
              throw new Error("Gmail access was not granted. Please sign in again and allow Gmail access when prompted.");
            }
            throw new Error(`Gmail access denied: ${errorMessage}`);
          }
          
            throw new Error(`Gmail API failed with status ${messagesResponse.status}: ${errorText}`);
          }

          const data: any = await messagesResponse.json();
          const { messages, nextPageToken }: { messages?: any[]; nextPageToken?: string } = data;
          
          if (messages && messages.length > 0) {
            console.log(`Found ${messages.length} ${category} emails (total: ${categoryEmailCount + messages.length})`);
            for (const msg of messages) {
              // Deduplicate by message ID - first category wins
              if (!allMessages.has(msg.id)) {
                allMessages.set(msg.id, { msg, category });
                categoryBreakdown[category]++;
              }
            }
            categoryEmailCount += messages.length;
          }

          // For quick scan, stop after first batch
          // For deep scan, continue until no more pages or hit limit
          pageToken = scanType === 'deep' && nextPageToken && categoryEmailCount < emailLimit
            ? nextPageToken
            : undefined;
            
        } while (pageToken);
        
        console.log(`Completed ${category} scan: ${categoryEmailCount} emails processed, ${categoryBreakdown[category]} unique accounts`);
      } catch (error) {
        console.error(`Error fetching ${category} emails:`, error);
        // Continue with other categories even if one fails
      }
    }

    if (allMessages.size === 0) {
      console.log("No messages found across all categories");
      return new Response(
        JSON.stringify({ 
          servicesFound: 0, 
          emailsScanned: 0,
          breakdown: categoryBreakdown,
          message: "No emails found in any category" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    console.log(`Found ${allMessages.size} unique emails across all categories`);

    // Fetch service catalog
    const { data: catalog, error: catalogError } = await supabase
      .from("service_catalog")
      .select("id, domain, name");

    if (catalogError) throw catalogError;

    const domainMap = new Map(catalog.map(s => [s.domain.toLowerCase(), s]));
    const discoveredServices = new Map<string, string | null>(); // service_id -> earliest first_seen_date
    const unmatchedDomains = new Map<string, string>(); // domain -> email
    const matchedViaIdentifier = new Map<string, number>(); // Track identifier matches for reporting
    const batchSize = 10;

    // Convert Map to array for batch processing
    const messageArray = Array.from(allMessages.values());

    // Process messages in batches
    for (let i = 0; i < messageArray.length; i += batchSize) {
      const batch = messageArray.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async ({ msg, category }: { msg: any; category: string }) => {
        try {
          const msgResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Cc`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!msgResponse.ok) return;

          const msgData = await msgResponse.json();
          const headers = msgData.payload?.headers || [];
          const fromHeader = headers.find((h: any) => h.name === "From");
          const toHeader = headers.find((h: any) => h.name === "To");
          const ccHeader = headers.find((h: any) => h.name === "Cc");
          const internalDate = msgData.internalDate; // Capture email received date
          
          if (!fromHeader) return;

          // Extract sender email from "Name <email@domain.com>" format
          const emailMatch = fromHeader.value.match(/<(.+?)>|([^\s<>]+@[^\s<>]+)/);
          if (!emailMatch) return;

          const senderEmail = (emailMatch[1] || emailMatch[2]).toLowerCase();
          const domain = senderEmail.split("@")[1];

          // Check if this email was sent to one of the user's identifiers
          let matchedIdentifier = false;
          const recipientFields = [toHeader?.value, ccHeader?.value].filter(Boolean);
          
          for (const field of recipientFields) {
            // Extract all emails from To/Cc fields
            const recipientMatches = field.matchAll(/<?([^\s<>]+@[^\s<>]+)>?/g);
            for (const match of recipientMatches) {
              const recipientEmail = match[1].toLowerCase();
              
              // Check if recipient matches any user identifier
              if (emailIdentifiers.has(recipientEmail)) {
                matchedIdentifier = true;
                matchedViaIdentifier.set(domain, (matchedViaIdentifier.get(domain) || 0) + 1);
                break;
              }
              
              // Also check username portion for username identifiers
              const recipientUsername = recipientEmail.split("@")[0];
              if (usernameIdentifiers.has(recipientUsername)) {
                matchedIdentifier = true;
                matchedViaIdentifier.set(domain, (matchedViaIdentifier.get(domain) || 0) + 1);
                break;
              }
            }
            if (matchedIdentifier) break;
          }

          // Match exact domain or base domain (e.g., mail.google.com -> google.com)
          const baseDomain = domain.split(".").slice(-2).join(".");
          
          const service = domainMap.get(domain) || domainMap.get(baseDomain);
          if (service) {
            const newDate = internalDate ? new Date(parseInt(internalDate)).toISOString() : null;
            const existingDate = discoveredServices.get(service.id);
            
            // Keep the earliest date (or set if first encounter)
            if (!existingDate || (newDate && newDate < existingDate)) {
              discoveredServices.set(service.id, newDate);
            }
          } else if (matchedIdentifier) {
            // If we matched an identifier but don't have the service in catalog,
            // this is likely a legitimate service - reduce unmatched count
            console.log(`Matched identifier for unknown service: ${domain}`);
          } else {
            // Only mark as unmatched if it wasn't sent to user's identifiers
            unmatchedDomains.set(domain, senderEmail);
          }
        } catch (err) {
          console.error(`Error processing message ${msg.id}:`, err);
        }
      }));
    }

    console.log(`Discovered ${discoveredServices.size} unique services`);

    // Upsert into user_services
    const servicesToInsert = Array.from(discoveredServices.entries()).map(([serviceId, firstSeenDate]) => ({
      user_id: user.id,
      service_id: serviceId,
      first_seen_date: firstSeenDate,
      last_scanned_at: new Date().toISOString()
    }));

    if (servicesToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("user_services")
        .upsert(servicesToInsert, { 
          onConflict: "user_id,service_id",
          ignoreDuplicates: false 
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
    }

    console.log(`Successfully saved ${discoveredServices.size} services for user ${user.id}`);

    // Save unmatched domains for user review
    if (unmatchedDomains.size > 0) {
      const domainsToInsert = Array.from(unmatchedDomains).map(([domain, emailFrom]) => ({
        user_id: user.id,
        domain,
        email_from: emailFrom
      }));

      const { error: domainError } = await supabase
        .from("unmatched_domains")
        .upsert(domainsToInsert, {
          onConflict: "user_id,domain",
          ignoreDuplicates: false
        });

      if (domainError) {
        console.error("Error saving unmatched domains:", domainError);
      } else {
        console.log(`Saved ${unmatchedDomains.size} unmatched domains`);
      }
    }

    const identifierMatchCount = Array.from(matchedViaIdentifier.values()).reduce((sum, count) => sum + count, 0);
    console.log(`Matched ${identifierMatchCount} emails via user identifiers across ${matchedViaIdentifier.size} domains`);

    return new Response(
      JSON.stringify({ 
        servicesFound: discoveredServices.size,
        emailsScanned: allMessages.size,
        unmatchedCount: unmatchedDomains.size,
        identifierMatches: identifierMatchCount,
        breakdown: categoryBreakdown,
        message: `Found ${discoveredServices.size} accounts from ${allMessages.size} emails across ${Object.keys(queries).length} categories. Matched ${identifierMatchCount} emails via your identifiers.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Scan error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
