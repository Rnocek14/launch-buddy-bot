import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ServiceData {
  name: string;
  category: string;
  discovered_at: string;
}

interface RiskFactors {
  totalAccounts: number;
  oldAccountsCount: number;
  sensitiveAccountsCount: number;
  unmatchedDomainsCount: number;
  avgAccountAge: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user's services
    const { data: services, error: servicesError } = await supabase
      .from('user_services')
      .select(`
        service_catalog (
          name,
          category
        ),
        discovered_at
      `);

    if (servicesError) throw servicesError;

    // Fetch unmatched domains count
    const { count: unmatchedCount } = await supabase
      .from('unmatched_domains')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const serviceData: ServiceData[] = services?.map((s: any) => ({
      name: s.service_catalog.name,
      category: s.service_catalog.category || 'Other',
      discovered_at: s.discovered_at,
    })) || [];

    // Calculate risk factors
    const now = new Date();
    const sensitiveCategories = ['Finance', 'Healthcare', 'Government', 'Insurance'];
    
    const accountAges = serviceData.map(s => {
      const discoveredDate = new Date(s.discovered_at);
      return (now.getTime() - discoveredDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    });

    const riskFactors: RiskFactors = {
      totalAccounts: serviceData.length,
      oldAccountsCount: accountAges.filter(age => age > 3).length,
      sensitiveAccountsCount: serviceData.filter(s => 
        sensitiveCategories.includes(s.category)
      ).length,
      unmatchedDomainsCount: unmatchedCount || 0,
      avgAccountAge: accountAges.length > 0 
        ? accountAges.reduce((a, b) => a + b, 0) / accountAges.length 
        : 0,
    };

    // Calculate risk score (0-100)
    let score = 0;
    
    // Base score from total accounts (0-30 points)
    score += Math.min(30, riskFactors.totalAccounts * 0.6);
    
    // Old accounts penalty (0-25 points)
    score += Math.min(25, riskFactors.oldAccountsCount * 2.5);
    
    // Sensitive accounts penalty (0-25 points)
    score += Math.min(25, riskFactors.sensitiveAccountsCount * 5);
    
    // Unmatched domains penalty (0-20 points)
    score += Math.min(20, riskFactors.unmatchedDomainsCount * 2);

    const riskScore = Math.min(100, Math.round(score));
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore < 25) riskLevel = 'low';
    else if (riskScore < 50) riskLevel = 'medium';
    else if (riskScore < 75) riskLevel = 'high';
    else riskLevel = 'critical';

    // Generate AI insights
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const aiPrompt = `You are a privacy and digital security expert. Analyze this user's digital footprint and provide 3 actionable insights.

Risk Score: ${riskScore}/100 (${riskLevel})
Total Accounts: ${riskFactors.totalAccounts}
Old Accounts (>3 years): ${riskFactors.oldAccountsCount}
Sensitive Accounts: ${riskFactors.sensitiveAccountsCount}
Unmatched/Unknown Services: ${riskFactors.unmatchedDomainsCount}
Average Account Age: ${riskFactors.avgAccountAge.toFixed(1)} years

Provide 3 specific, actionable insights in a conversational tone. Each insight should be 1-2 sentences. Focus on what matters most for this user.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a privacy expert providing brief, actionable insights about digital footprints.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI gateway error:', await aiResponse.text());
      throw new Error('Failed to generate insights');
    }

    const aiData = await aiResponse.json();
    const insights = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({
        riskScore,
        riskLevel,
        riskFactors,
        insights,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error calculating risk score:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
