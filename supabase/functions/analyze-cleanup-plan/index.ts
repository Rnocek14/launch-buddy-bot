import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Service {
  id: string;
  name: string;
  category: string;
  discovered_at: string;
  last_scanned_at?: string;
}

interface CleanupTier {
  priority: 'high' | 'medium' | 'low';
  services: Service[];
  reasoning: string;
  risk_level: string;
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

    // Fetch user's services
    const { data: userServices, error: servicesError } = await supabase
      .from('user_services')
      .select(`
        service_id,
        discovered_at,
        last_scanned_at,
        service_catalog (
          id,
          name,
          category
        )
      `)
      .eq('user_id', user.id);

    if (servicesError) throw servicesError;

    const services: Service[] = (userServices || []).map((us: any) => ({
      id: us.service_catalog.id,
      name: us.service_catalog.name,
      category: us.service_catalog.category || 'Other',
      discovered_at: us.discovered_at,
      last_scanned_at: us.last_scanned_at,
    }));

    if (services.length === 0) {
      return new Response(
        JSON.stringify({ 
          tiers: [],
          summary: "No services found to analyze. Start by scanning your Gmail inbox to discover connected accounts."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare data for GPT-5 analysis
    const servicesData = services.map(s => {
      const ageInDays = Math.floor(
        (Date.now() - new Date(s.discovered_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        name: s.name,
        category: s.category,
        age_days: ageInDays,
        age_years: (ageInDays / 365).toFixed(1),
      };
    });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are a privacy and data cleanup advisor. Analyze user's connected accounts and categorize them into cleanup priority tiers.

For each service, consider:
1. Account age (older = higher priority for cleanup)
2. Category risk (finance, health, social = higher sensitivity)
3. Likelihood of being inactive/forgotten
4. Data retention concerns

Return JSON with this structure:
{
  "summary": "Brief 2-3 sentence overview of findings",
  "tiers": [
    {
      "priority": "high",
      "services": ["ServiceName1", "ServiceName2"],
      "reasoning": "Why these should be deleted first (1-2 sentences)",
      "risk_level": "High/Medium/Low"
    }
  ]
}

Prioritize:
- HIGH: Old accounts (3+ years), sensitive categories, likely inactive
- MEDIUM: Moderate age (1-3 years), non-critical services
- LOW: Recent accounts (<1 year), actively used services

Be concise and actionable.`;

    const userPrompt = `Analyze these ${services.length} connected accounts and recommend a cleanup plan:

${JSON.stringify(servicesData, null, 2)}`;

    console.log('Calling GPT-5 for cleanup analysis...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 1500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysisResult = JSON.parse(aiResponse.choices[0].message.content);

    // Map service names back to full service objects
    const enrichedTiers = analysisResult.tiers.map((tier: any) => {
      const tierServices = tier.services
        .map((serviceName: string) => 
          services.find(s => s.name === serviceName)
        )
        .filter((s: Service | undefined) => s !== undefined);

      return {
        priority: tier.priority,
        services: tierServices,
        reasoning: tier.reasoning,
        risk_level: tier.risk_level,
      };
    });

    console.log(`Analysis complete: ${enrichedTiers.length} tiers generated`);

    return new Response(
      JSON.stringify({
        summary: analysisResult.summary,
        tiers: enrichedTiers,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in analyze-cleanup-plan:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
