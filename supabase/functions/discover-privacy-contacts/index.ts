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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication failed');
    }

    // Check if user is admin
    const { data: hasAdminRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { service_id, privacy_url } = await req.json();

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

    console.log(`Discovering privacy contacts for: ${service.name}`);

    // Determine URL to fetch
    const urlToFetch = privacy_url || service.privacy_form_url || `https://${service.domain}/privacy`;
    
    console.log(`Fetching privacy policy from: ${urlToFetch}`);

    // Fetch the privacy policy page
    let privacyContent = '';
    try {
      const pageResponse = await fetch(urlToFetch, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PrivacyContactBot/1.0)'
        }
      });

      if (!pageResponse.ok) {
        console.warn(`Failed to fetch ${urlToFetch}: ${pageResponse.status}`);
        privacyContent = `Unable to fetch privacy policy (HTTP ${pageResponse.status})`;
      } else {
        const html = await pageResponse.text();
        // Simple HTML stripping - just remove tags for AI processing
        privacyContent = html
          .replace(/<script[^>]*>.*?<\/script>/gis, '')
          .replace(/<style[^>]*>.*?<\/style>/gis, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .substring(0, 8000); // Limit content length
      }
    } catch (fetchError) {
      console.error(`Error fetching privacy policy:`, fetchError);
      privacyContent = 'Unable to fetch privacy policy due to network error';
    }

    // Call OpenAI with tool calling for structured extraction
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an expert at analyzing privacy policies and terms of service to extract contact methods for data deletion requests (GDPR, CCPA rights).

Your task is to identify the correct contact method(s) a user should use to request deletion of their personal data.

Look for:
- Email addresses (especially: privacy@, dpo@, gdpr@, ccpa@, legal@, or addresses explicitly mentioned for data rights)
- Web forms or URLs for submitting deletion requests
- Phone numbers for privacy inquiries
- Other contact methods

Evaluate confidence:
- HIGH: Explicitly states "for data deletion" or "GDPR/CCPA requests" or similar
- MEDIUM: Common privacy contact pattern (privacy@domain.com) or mentioned in privacy section
- LOW: Generic contact that might handle privacy requests

IMPORTANT: Validate that email addresses match the company domain (${service.domain})`;

    const userPrompt = `Company: ${service.name}
Domain: ${service.domain}
Privacy Policy Content:
${privacyContent}

Extract all relevant contact methods for data deletion requests.`;

    console.log('Calling OpenAI for contact extraction...');

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
                          enum: ['email', 'form', 'phone', 'other'],
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

    console.log(`Found ${findings.contacts.length} contact methods`);

    // Store findings in database
    const contactsToInsert = findings.contacts.map(contact => ({
      service_id: service_id,
      source_url: urlToFetch,
      contact_type: contact.contact_type,
      value: contact.value,
      confidence: contact.confidence,
      reasoning: contact.reasoning,
      verified: false,
      added_by: 'ai'
    }));

    const { data: insertedContacts, error: insertError } = await supabase
      .from('privacy_contacts')
      .insert(contactsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting contacts:', insertError);
      throw insertError;
    }

    console.log(`Successfully stored ${insertedContacts.length} privacy contacts`);

    return new Response(
      JSON.stringify({
        success: true,
        service: service.name,
        contacts_found: insertedContacts.length,
        contacts: insertedContacts
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in discover-privacy-contacts:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
