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

interface ScoredLink {
  url: string;
  score: number;
  linkText: string;
  location: 'footer' | 'header' | 'body';
}

interface StructuredError {
  error_code: string;
  error_type: 'no_policy_found' | 'fetch_failed' | 'bot_protection' | 'invalid_content' | 'ai_error' | 'validation_failed';
  message: string;
  suggested_action: 'manual_entry' | 'try_again_later' | 'contact_support' | 'provide_url';
  details?: any;
}

// Enhanced: Score and extract privacy policy URLs from HTML
function extractAndScorePrivacyLinks(html: string, baseDomain: string): ScoredLink[] {
  const scoredLinks: ScoredLink[] = [];
  
  // Define privacy-related keywords with weights
  const highPriorityKeywords = ['privacy-policy', 'privacy policy', 'privacypolicy', 'data-request', 'dsar', 'delete-data'];
  const mediumPriorityKeywords = ['privacy', 'gdpr', 'ccpa', 'data-protection', 'personal-data', 'privacy-notice'];
  const lowPriorityKeywords = ['legal', 'terms', 'about', 'help'];
  
  // Extract footer HTML for higher scoring
  const footerRegex = /<footer[^>]*>(.*?)<\/footer>/gis;
  const footerMatch = footerRegex.exec(html);
  const footerHtml = footerMatch ? footerMatch[1] : '';
  
  // Extract all <a> tags
  const allAnchorsRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  
  while ((match = allAnchorsRegex.exec(html)) !== null) {
    let href = match[1];
    const linkText = match[2].replace(/<[^>]+>/g, '').trim(); // Strip HTML tags from link text
    
    // Skip non-HTTP links
    if (href.includes('mailto:') || href.includes('javascript:') || href.includes('tel:')) {
      continue;
    }
    
    // Normalize URL
    if (href.startsWith('http')) {
      // Already absolute
    } else if (href.startsWith('//')) {
      href = `https:${href}`;
    } else if (href.startsWith('/')) {
      href = `https://${baseDomain}${href}`;
    } else if (href.startsWith('#')) {
      continue; // Skip anchor links
    } else {
      href = `https://${baseDomain}/${href}`;
    }
    
    // Filter out fragments without paths
    try {
      const urlObj = new URL(href);
      if (urlObj.pathname === '/' && urlObj.search === '' && urlObj.hash) {
        continue; // Skip pure fragment links
      }
    } catch {
      continue; // Invalid URL
    }
    
    // Calculate score
    let score = 0;
    const combined = (href + ' ' + linkText).toLowerCase();
    
    // High priority keywords (15 points each)
    highPriorityKeywords.forEach(keyword => {
      if (combined.includes(keyword)) score += 15;
    });
    
    // Medium priority keywords (10 points each)
    mediumPriorityKeywords.forEach(keyword => {
      if (combined.includes(keyword)) score += 10;
    });
    
    // Low priority keywords (5 points each)
    lowPriorityKeywords.forEach(keyword => {
      if (combined.includes(keyword)) score += 5;
    });
    
    // Location bonus
    const isInFooter = footerHtml.includes(match[0]);
    const location = isInFooter ? 'footer' : 'body';
    if (isInFooter) score += 10; // Footer links get bonus
    
    // Exact match bonus
    if (linkText.toLowerCase() === 'privacy policy' || linkText.toLowerCase() === 'privacy') {
      score += 20;
    }
    
    // Penalize if URL is too generic
    const urlPath = href.split('?')[0];
    if (urlPath.endsWith('/') || urlPath === `https://${baseDomain}`) {
      score -= 10; // Penalize homepage
    }
    
    // Only include links with positive score
    if (score > 0) {
      scoredLinks.push({ url: href, score, linkText, location });
    }
  }
  
  // Sort by score descending
  scoredLinks.sort((a, b) => b.score - a.score);
  
  // Deduplicate
  const seen = new Set<string>();
  const uniqueLinks = scoredLinks.filter(link => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });
  
  return uniqueLinks;
}

// Helper: Validate URL returns 200
async function quickValidateUrl(url: string): Promise<{ valid: boolean; status?: number }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PrivacyContactBot/1.0)',
      }
    });
    return { valid: response.ok, status: response.status };
  } catch (error) {
    return { valid: false };
  }
}

// Phase 1: Enhanced fetch with smart link discovery and scoring
async function trySimpleFetch(urlsToTry: string[], domain: string): Promise<{ content: string; url: string; discoveredUrls?: string[] } | null> {
  const attemptedUrls: string[] = [];
  const failedUrls: Map<string, number> = new Map();
  
  for (const url of urlsToTry) {
    console.log(`[Phase 1] Trying simple fetch: ${url}`);
    attemptedUrls.push(url);
    
    try {
      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(15000)
      });

      if (pageResponse.ok) {
        const html = await pageResponse.text();
        
        // If this is the homepage or a generic page, extract and score privacy links
        if (url.includes(domain) && !url.match(/privacy|legal|terms|dsar|data-request/i)) {
          console.log(`[Phase 1] Analyzing page for privacy links: ${url}`);
          const scoredLinks = extractAndScorePrivacyLinks(html, domain);
          
          if (scoredLinks.length > 0) {
            console.log(`[Phase 1] Found ${scoredLinks.length} scored privacy links:`);
            scoredLinks.slice(0, 5).forEach(link => {
              console.log(`  - [Score: ${link.score}] ${link.url} (${link.linkText})`);
            });
            
            // Try top 5 scored links
            for (const link of scoredLinks.slice(0, 5)) {
              // Quick validate before trying
              const validation = await quickValidateUrl(link.url);
              if (!validation.valid) {
                console.log(`[Phase 1] Skipping invalid URL (${validation.status}): ${link.url}`);
                failedUrls.set(link.url, validation.status || 0);
                continue;
              }
              
              console.log(`[Phase 1] Trying validated URL: ${link.url}`);
              const result = await trySimpleFetch([link.url], domain);
              if (result) {
                result.discoveredUrls = scoredLinks.slice(0, 10).map(l => l.url);
                return result;
              }
            }
          } else {
            console.log(`[Phase 1] No privacy-related links found in HTML`);
          }
        }
        
        // Strip HTML for AI processing
        const content = html
          .replace(/<script[^>]*>.*?<\/script>/gis, '')
          .replace(/<style[^>]*>.*?<\/style>/gis, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&[a-z]+;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 8000);
        
        // Check content quality
        if (content.length > 200) {
          // Verify it's actually privacy policy content
          const privacyIndicators = ['privacy', 'personal data', 'information we collect', 'gdpr', 'ccpa', 'data protection'];
          const hasPrivacyContent = privacyIndicators.some(indicator => 
            content.toLowerCase().includes(indicator)
          );
          
          if (hasPrivacyContent) {
            console.log(`[Phase 1] ✓ Successfully fetched privacy content from: ${url} (${content.length} chars)`);
            return { content, url, discoveredUrls: attemptedUrls };
          } else {
            console.warn(`[Phase 1] Content doesn't appear to be a privacy policy: ${url}`);
          }
        } else {
          console.warn(`[Phase 1] Content too short from ${url} (${content.length} chars)`);
        }
      } else {
        console.warn(`[Phase 1] HTTP ${pageResponse.status}: ${url}`);
        failedUrls.set(url, pageResponse.status);
      }
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.warn(`[Phase 1] Error fetching ${url}: ${errorMsg}`);
      failedUrls.set(url, 0);
    }
  }
  
  // Log failed URLs summary
  if (failedUrls.size > 0) {
    console.log(`[Phase 1] Failed URLs summary:`, Object.fromEntries(failedUrls));
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
          
          // Try homepage FIRST for link extraction (moved up for better discovery)
          `https://www.${service.domain}`,
          `https://${service.domain}`,
          
          // .well-known standard (RFC 8615)
          `https://${service.domain}/.well-known/privacy-policy.txt`,
          `https://www.${service.domain}/.well-known/privacy-policy.txt`,
          
          // Common privacy policy paths
          `https://${service.domain}/privacy`,
          `https://www.${service.domain}/privacy`,
          `https://${service.domain}/privacy-policy`,
          `https://www.${service.domain}/privacy-policy`,
          `https://${service.domain}/privacy-notice`,
          `https://${service.domain}/privacypolicy`,
          `https://www.${service.domain}/privacypolicy`,
          
          // Legal section paths
          `https://${service.domain}/legal/privacy`,
          `https://www.${service.domain}/legal/privacy`,
          `https://${service.domain}/legal/privacy-policy`,
          `https://www.${service.domain}/legal/privacy-policy`,
          `https://${service.domain}/legal`,
          `https://www.${service.domain}/legal`,
          
          // CCPA/GDPR specific paths
          `https://${service.domain}/ccpa`,
          `https://www.${service.domain}/ccpa`,
          `https://${service.domain}/gdpr`,
          `https://www.${service.domain}/gdpr`,
          `https://${service.domain}/privacy-rights`,
          `https://www.${service.domain}/privacy-rights`,
          `https://${service.domain}/your-privacy-rights`,
          `https://www.${service.domain}/your-privacy-rights`,
          
          // Help/Support section paths
          `https://${service.domain}/help/privacy`,
          `https://www.${service.domain}/help/privacy`,
          `https://${service.domain}/support/privacy`,
          `https://www.${service.domain}/support/privacy`,
          
          // About section
          `https://${service.domain}/about/privacy`,
          `https://www.${service.domain}/about/privacy`,
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
    
    // Create structured error
    const structuredError: StructuredError = {
      error_code: 'DISCOVERY_FAILED',
      error_type: 'ai_error',
      message: error.message || 'Unknown error occurred',
      suggested_action: 'contact_support'
    };
    
    // Determine specific error type and action
    if (error.message?.includes('Unable to find privacy policy')) {
      structuredError.error_type = 'no_policy_found';
      structuredError.error_code = 'POLICY_NOT_FOUND';
      structuredError.suggested_action = 'provide_url';
      structuredError.message = 'Could not find privacy policy on the website. Please provide the direct URL to the privacy policy page.';
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('http2 error')) {
      structuredError.error_type = 'fetch_failed';
      structuredError.error_code = 'NETWORK_ERROR';
      structuredError.suggested_action = 'try_again_later';
      structuredError.message = 'Network error while fetching the page. The website may be down or blocking our requests.';
    } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
      structuredError.error_type = 'fetch_failed';
      structuredError.error_code = 'TIMEOUT';
      structuredError.suggested_action = 'try_again_later';
      structuredError.message = 'Request timed out. The website is taking too long to respond.';
    } else if (error.message?.includes('OpenAI')) {
      structuredError.error_type = 'ai_error';
      structuredError.error_code = 'AI_PROCESSING_ERROR';
      structuredError.suggested_action = 'try_again_later';
      structuredError.message = 'AI analysis failed. Please try again in a moment.';
    } else if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
      structuredError.error_type = 'bot_protection';
      structuredError.error_code = 'ACCESS_DENIED';
      structuredError.suggested_action = 'manual_entry';
      structuredError.message = 'Website is blocking automated access. Please manually find and enter the privacy contact information.';
    } else if (error.message?.includes('404')) {
      structuredError.error_type = 'no_policy_found';
      structuredError.error_code = 'PAGE_NOT_FOUND';
      structuredError.suggested_action = 'provide_url';
      structuredError.message = 'The privacy policy page was not found (404). Please verify the URL and try again.';
    }
    
    // Log failure to database for admin review
    try {
      const failureData: any = {
        service_id: service_id,
        user_id: user?.id,
        failure_type: structuredError.error_type,
        error_message: structuredError.message,
        urls_tried: urlsToTry,
        error_code: structuredError.error_code,
        suggested_action: structuredError.suggested_action,
      };

      // Add HTTP status codes if available
      if (error.statusCodes) {
        failureData.http_status_codes = error.statusCodes;
      }

      if (supabase) {
        await supabase
          .from('contact_discovery_failures')
          .insert(failureData);
        
        console.log('[Failure Log] Structured error logged to admin dashboard');
      }
    } catch (logError) {
      console.error('[Failure Log] Failed to log error:', logError);
    }
    
    // Return appropriate status code
    const statusMap: Record<StructuredError['error_type'], number> = {
      no_policy_found: 404,
      fetch_failed: 503,
      bot_protection: 403,
      invalid_content: 422,
      ai_error: 500,
      validation_failed: 400
    };
    
    const status = statusMap[structuredError.error_type] || 500;
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: structuredError.message,
        error_code: structuredError.error_code,
        error_type: structuredError.error_type,
        suggested_action: structuredError.suggested_action,
        details: {
          urls_attempted: urlsToTry.length,
          service_domain: supabase ? service_id : null
        }
      }),
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
