import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactFinding {
  contact_type: 'email' | 'form' | 'phone' | 'other';
  value: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

// Helper: Extract privacy policy URLs from HTML
function extractPrivacyLinksFromHTML(html: string, baseDomain: string): string[] {
  const urls: string[] = [];
  
  // Look for <link rel="privacy-policy"> or similar
  const linkRegex = /<link[^>]*rel=["']privacy[-_]?policy["'][^>]*href=["']([^"']+)["']/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  
  // Look for <a> tags with privacy-related text
  const anchorRegex = /<a[^>]*href=["']([^"']*(?:privacy|legal|terms)[^"']*)["'][^>]*>([^<]*(?:privacy|data\s+protection)[^<]*)<\/a>/gi;
  while ((match = anchorRegex.exec(html)) !== null) {
    if (!match[1].includes('mailto:') && !match[1].includes('javascript:')) {
      urls.push(match[1]);
    }
  }
  
  // Resolve relative URLs
  return urls.map(url => {
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `https://${baseDomain}${url}`;
    return `https://${baseDomain}/${url}`;
  });
}

// Phase 1: Simple fetch with enhanced URL discovery
async function trySimpleFetch(urlsToTry: string[], domain: string): Promise<{ content: string; url: string } | null> {
  for (const url of urlsToTry) {
    console.log(`[Phase 1] Trying simple fetch: ${url}`);
    
    try {
      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PrivacyContactBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000) // 15s timeout
      });

      if (pageResponse.ok) {
        const html = await pageResponse.text();
        
        // If this is the homepage or a generic page, try to extract privacy policy links
        if (url.includes(domain) && !url.match(/privacy|legal|terms/i)) {
          console.log(`[Phase 1] Parsing homepage for privacy links...`);
          const extractedUrls = extractPrivacyLinksFromHTML(html, domain);
          if (extractedUrls.length > 0) {
            console.log(`[Phase 1] Found ${extractedUrls.length} privacy links in HTML, trying them...`);
            // Recursively try the extracted URLs
            for (const extractedUrl of extractedUrls.slice(0, 3)) { // Try top 3
              const result = await trySimpleFetch([extractedUrl], domain);
              if (result) return result;
            }
          }
        }
        
        // Strip HTML for AI processing
        const content = html
          .replace(/<script[^>]*>.*?<\/script>/gis, '')
          .replace(/<style[^>]*>.*?<\/style>/gis, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000);
        
        if (content.length > 200) { // Ensure we got meaningful content
          console.log(`[Phase 1] Successfully fetched from: ${url} (${content.length} chars)`);
          return { content, url };
        } else {
          console.warn(`[Phase 1] Content too short from ${url}, trying next...`);
        }
      } else {
        console.warn(`[Phase 1] Failed: ${url} - Status ${pageResponse.status}`);
      }
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.warn(`[Phase 1] Error fetching ${url}:`, errorMsg);
    }
  }
  
  return null;
}

// Phase 2: Browserless.io fallback for JavaScript-heavy sites
async function tryBrowserlessFetch(urlsToTry: string[], browserlessApiKey: string): Promise<{ content: string; url: string } | null> {
  console.log('[Phase 2] Falling back to Browserless.io for JavaScript rendering...');
  
  for (const url of urlsToTry) {
    console.log(`[Phase 2] Trying Browserless: ${url}`);
    
    try {
      const response = await fetch(`https://production-sfo.browserless.io/content?token=${browserlessApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          url: url,
          waitForTimeout: 3000,
        }),
        signal: AbortSignal.timeout(45000) // 45s timeout for Browserless
      });

      if (response.ok) {
        const html = await response.text();
        
        // Strip HTML for AI processing
        const content = html
          .replace(/<script[^>]*>.*?<\/script>/gis, '')
          .replace(/<style[^>]*>.*?<\/style>/gis, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000);
        
        if (content.length > 200) {
          console.log(`[Phase 2] Successfully fetched via Browserless: ${url} (${content.length} chars)`);
          return { content, url };
        }
      } else {
        console.warn(`[Phase 2] Browserless failed for ${url}: ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Phase 2] Browserless error for ${url}:`, errorMsg);
    }
  }
  
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Declare variables outside try block for access in catch block
  let service_id: string | null = null;
  let user: any = null;
  let urlsToTry: string[] = [];
  let supabase: any = null;

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: authenticatedUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !authenticatedUser) {
      throw new Error('Authentication failed');
    }
    user = authenticatedUser;

    const requestBody = await req.json();
    service_id = requestBody.service_id;
    const privacy_url = requestBody.privacy_url;

    if (!service_id) {
      throw new Error('service_id is required');
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('service_catalog')
      .select('*')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      throw new Error('Service not found');
    }

    console.log(`=== Discovering privacy contacts for: ${service.name} (${service.domain}) ===`);

    // Build comprehensive URL list with Phase 1 enhancements
    urlsToTry = privacy_url 
      ? [privacy_url]
      : [
          // Explicit privacy form URL from catalog
          service.privacy_form_url,
          
          // .well-known standard (RFC 8615)
          `https://${service.domain}/.well-known/privacy-policy.txt`,
          `https://www.${service.domain}/.well-known/privacy-policy.txt`,
          
          // Common privacy policy paths
          `https://${service.domain}/privacy`,
          `https://${service.domain}/privacy-policy`,
          `https://${service.domain}/privacy-notice`,
          `https://${service.domain}/privacypolicy`,
          
          // Legal section paths
          `https://${service.domain}/legal/privacy`,
          `https://${service.domain}/legal/privacy-policy`,
          
          // Help/Support section paths
          `https://${service.domain}/help/privacy`,
          `https://${service.domain}/support/privacy`,
          
          // With www subdomain
          `https://www.${service.domain}/privacy`,
          `https://www.${service.domain}/privacy-policy`,
          `https://www.${service.domain}/legal/privacy`,
          
          // Try homepage for link extraction
          `https://${service.domain}`,
          `https://www.${service.domain}`,
        ].filter(Boolean);

    console.log(`Prepared ${urlsToTry.length} URLs to try`);

    // Phase 1: Try simple fetch with enhanced URL discovery
    let result = await trySimpleFetch(urlsToTry, service.domain);
    let methodUsed = 'simple_fetch';
    
    // Phase 2: If Phase 1 failed, try Browserless.io
    if (!result) {
      const browserlessApiKey = Deno.env.get('BROWSERLESS_API_KEY');
      if (browserlessApiKey) {
        console.log('[Strategy] Phase 1 failed, attempting Phase 2 with Browserless...');
        result = await tryBrowserlessFetch(urlsToTry.slice(0, 5), browserlessApiKey); // Try top 5 URLs only
        if (result) methodUsed = 'browserless';
      } else {
        console.warn('[Strategy] BROWSERLESS_API_KEY not configured, skipping Phase 2');
      }
    }

    // If both phases failed, return error
    if (!result) {
      throw new Error(`Unable to find privacy policy. Tried ${urlsToTry.length} URL(s) with both simple and JavaScript rendering. Please provide a direct URL to the privacy policy.`);
    }

    const { content: privacyContent, url: successUrl } = result;

    // Call OpenAI with tool calling for structured extraction
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an AI assistant specializing in analyzing privacy policies to extract contact information for data deletion requests (GDPR, CCPA, etc.).

Analyze the following privacy policy and extract ALL contact methods that could be used for data deletion requests.

CRITICAL RULES - NEVER VIOLATE:
1. Do NOT return the company homepage (e.g., "www.domain.com", "domain.com", "https://domain.com/")
2. Do NOT return the privacy policy URL itself - you're analyzing it, not returning it as a contact
3. Do NOT return generic "Contact Us" pages unless they explicitly have a privacy/deletion form
4. Only return email addresses that:
   - Match the service domain (${service.domain}) OR
   - Are explicitly privacy-related (privacy@, dpo@, gdpr@, ccpa@, data-protection@)
5. Only return forms that have specific paths for privacy/deletion (not just /contact or /contact-us)
6. If confidence is "low", do not return the contact at all

EXAMPLES OF WHAT NOT TO RETURN:
❌ www.example.com (homepage)
❌ https://example.com/privacy-policy (the policy itself)
❌ https://example.com/contact (generic contact page)
❌ info@example.com (unless explicitly mentioned for privacy requests)

EXAMPLES OF WHAT TO RETURN:
✅ privacy@example.com
✅ dpo@example.com
✅ https://example.com/privacy/delete-data
✅ https://example.com/dsar-request

For each contact method found, provide:
1. contact_type: 'email', 'form', or 'phone' (NO 'other' type)
2. value: The actual contact (email address, form URL, phone number)
3. confidence: 'high' or 'medium' (do NOT return 'low' confidence contacts)
4. reasoning: Specific explanation citing where in the policy this was found

Guidelines:
- Email addresses with 'privacy', 'dpo', 'data-protection', 'gdpr' terms are HIGH confidence
- Forms with specific privacy/deletion paths are HIGH confidence
- Generic support emails that are explicitly mentioned for privacy are MEDIUM confidence
- Phone numbers should be international format if possible

Extract ONLY actionable contact methods for data deletion requests.`;

    const userPrompt = `Company: ${service.name}
Domain: ${service.domain}
Privacy Policy Content:
${privacyContent}

Extract all relevant contact methods for data deletion requests.`;

    console.log('Calling OpenAI for contact extraction...');

    // Helper function to validate URLs
    async function validateContactUrl(url: string): Promise<boolean> {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
          redirect: 'follow',
        });
        return response.ok;
      } catch (error) {
        console.log(`[URL Validation] Failed for ${url}:`, error);
        return false;
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'save_privacy_contacts',
              description: 'Save discovered privacy contact methods',
              parameters: {
                type: 'object',
                properties: {
                  contacts: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                         contact_type: {
                          type: 'string',
                          enum: ['email', 'form', 'phone'],
                          description: 'Type of contact method'
                        },
                        value: {
                          type: 'string',
                          description: 'The actual contact value (email address, URL, phone number, etc.)'
                        },
                        confidence: {
                          type: 'string',
                          enum: ['high', 'medium', 'low'],
                          description: 'Confidence level that this is the correct contact method'
                        },
                        reasoning: {
                          type: 'string',
                          description: 'Explanation of why this contact was identified and confidence level'
                        }
                      },
                      required: ['contact_type', 'value', 'confidence', 'reasoning']
                    }
                  }
                },
                required: ['contacts']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'save_privacy_contacts' } },
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices[0].message.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call response from AI');
    }

    const findings: { contacts: ContactFinding[] } = JSON.parse(toolCall.function.arguments);

    console.log(`Found ${findings.contacts.length} contact methods from AI`);

    // Filter out invalid contacts BEFORE storing
    const validContacts = findings.contacts.filter(contact => {
      // Rule 1: Reject low confidence
      if (contact.confidence === 'low') {
        console.log(`[Filter] Rejected low confidence: ${contact.value}`);
        return false;
      }
      
      // Rule 2: Reject homepage URLs (domain only, no path or just "/")
      if (contact.contact_type === 'form') {
        try {
          const url = new URL(contact.value.startsWith('http') ? contact.value : `https://${contact.value}`);
          const isHomepage = url.pathname === '/' || url.pathname === '';
          if (isHomepage) {
            console.log(`[Filter] Rejected homepage URL: ${contact.value}`);
            return false;
          }
          
          // Reject privacy policy URLs themselves
          if (url.pathname.match(/privacy[-_]?(policy|notice)/i) && !url.pathname.match(/delete|deletion|request|dsar/i)) {
            console.log(`[Filter] Rejected privacy policy URL: ${contact.value}`);
            return false;
          }
          
          // Reject generic contact pages without specific privacy paths
          if (url.pathname.match(/^\/contact[-_]?us?\/?$/i) && !url.pathname.match(/privacy|deletion|gdpr|ccpa|dsar/i)) {
            console.log(`[Filter] Rejected generic contact page: ${contact.value}`);
            return false;
          }
        } catch (e) {
          console.log(`[Filter] Invalid URL format: ${contact.value}`);
          return false;
        }
      }
      
      // Rule 3: Validate email format and domain
      if (contact.contact_type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact.value)) {
          console.log(`[Filter] Invalid email format: ${contact.value}`);
          return false;
        }
        
        // Check if email domain matches service domain
        const emailDomain = contact.value.split('@')[1].toLowerCase();
        const serviceDomain = service.domain.toLowerCase().replace('www.', '');
        const isPrivacyEmail = ['privacy', 'dpo', 'gdpr', 'ccpa', 'data-protection'].some(prefix => 
          contact.value.toLowerCase().startsWith(prefix + '@')
        );
        
        if (!emailDomain.includes(serviceDomain) && !isPrivacyEmail) {
          console.log(`[Filter] Email domain mismatch: ${contact.value} vs ${serviceDomain}`);
          return false;
        }
      }
      
      return true;
    });

    console.log(`[Filter] ${findings.contacts.length} → ${validContacts.length} after filtering`);
    
    // If all contacts were filtered out, log this as a failure
    if (findings.contacts.length > 0 && validContacts.length === 0) {
      try {
        await supabase
          .from('contact_discovery_failures')
          .insert({
            service_id: service_id,
            user_id: user.id,
            failure_type: 'all_filtered',
            error_message: `AI found ${findings.contacts.length} contacts but all were filtered out as low quality`,
            urls_tried: urlsToTry,
          });
        console.log('[Failure Log] All contacts filtered - logged for review');
      } catch (logError) {
        console.error('[Failure Log] Failed to log filtering issue:', logError);
      }
    }

    // Validate URLs for form contacts
    for (const contact of validContacts) {
      if (contact.contact_type === 'form' && contact.value) {
        console.log(`[URL Validation] Checking form URL: ${contact.value}`);
        const isValid = await validateContactUrl(contact.value);
        
        if (!isValid) {
          console.warn(`[URL Validation] Invalid form URL detected: ${contact.value}`);
          // Reduce confidence for invalid URLs
          if (contact.confidence === 'high') contact.confidence = 'medium';
          else if (contact.confidence === 'medium') contact.confidence = 'low';
          
          contact.reasoning = `${contact.reasoning} (Note: URL validation failed - this form may not be accessible)`;
        } else {
          console.log(`[URL Validation] ✓ Valid form URL: ${contact.value}`);
        }
      }
    }

    // Check for existing contacts to avoid duplicates
    const { data: existingContacts } = await supabase
      .from('privacy_contacts')
      .select('contact_type, value')
      .eq('service_id', service_id);

    const existingSet = new Set(
      (existingContacts || []).map((c: any) => `${c.contact_type}:${c.value.toLowerCase()}`)
    );

    const contactsToInsert = validContacts
      .filter(contact => {
        const key = `${contact.contact_type}:${contact.value.toLowerCase()}`;
        if (existingSet.has(key)) {
          console.log(`[Dedup] Skipping duplicate: ${contact.value}`);
          return false;
        }
        return true;
      })
      .map(contact => ({
        service_id: service_id,
        contact_type: contact.contact_type,
        value: contact.value,
        confidence: contact.confidence,
        reasoning: contact.reasoning,
        verified: false,
        added_by: 'ai',
        source_url: successUrl,
      }));

    console.log(`[Dedup] ${validContacts.length} → ${contactsToInsert.length} after deduplication`);

    // Store findings in database
    const { data: insertedContacts, error: insertError } = await supabase
      .from('privacy_contacts')
      .insert(contactsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting contacts:', insertError);
      throw insertError;
    }

    console.log(`✅ Successfully stored ${insertedContacts.length} privacy contacts`);

    return new Response(
      JSON.stringify({
        success: true,
        service: service.name,
        contacts_found: insertedContacts.length,
        contacts: insertedContacts,
        method_used: methodUsed
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('❌ Error in discover-privacy-contacts:', error);
    
    // Determine failure type
    let failureType = 'ai_error';
    const isNotFound = error.message?.includes('Unable to find privacy policy');
    const isFetchError = error.message?.includes('Failed to fetch') || error.message?.includes('http2 error');
    
    if (isNotFound) {
      failureType = 'no_policy_found';
    } else if (isFetchError) {
      failureType = 'fetch_failed';
    }
    
    // Log failure to database for admin review
    try {
      const failureData: any = {
        service_id: service_id,
        user_id: user.id,
        failure_type: failureType,
        error_message: error.message || 'Unknown error',
        urls_tried: urlsToTry,
      };

      // Add HTTP status codes if available
      if (error.statusCodes) {
        failureData.http_status_codes = error.statusCodes;
      }

      await supabase
        .from('contact_discovery_failures')
        .insert(failureData);
      
      console.log('[Failure Log] Logged to admin dashboard');
    } catch (logError) {
      console.error('[Failure Log] Failed to log error:', logError);
    }
    
    // Return different status codes based on error type
    const status = isNotFound ? 404 : 500;
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Internal server error',
        error_type: isNotFound ? 'privacy_policy_not_found' : 'internal_error'
      }),
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
