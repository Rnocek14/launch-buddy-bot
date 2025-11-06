import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UsernameSuggestion {
  value: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract local part from email
    const localPart = email.split('@')[0];
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a username suggestion assistant. Given an email address, suggest 3-5 unique usernames based on the email's local part.

Rules:
- Generate creative but professional username variations
- Consider: removing dots, removing numbers, adding numbers, abbreviations
- Assign confidence levels (high/medium/low) based on how common/professional the username is
- High confidence: Simple, clean usernames without special characters
- Medium confidence: Usernames with minor modifications like numbers at end
- Low confidence: More creative variations

Format your response EXACTLY as a JSON array with this structure:
[
  {
    "value": "username_here",
    "confidence": "high|medium|low",
    "reasoning": "Brief explanation"
  }
]`;

    const userPrompt = `Email: ${email}

Generate 3-5 username suggestions from this email address.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI service unavailable');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let suggestions: UsernameSuggestion[];
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                       content.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      suggestions = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback: generate basic suggestions from email
      suggestions = generateFallbackSuggestions(localPart);
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in suggest-usernames:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateFallbackSuggestions(localPart: string): UsernameSuggestion[] {
  const clean = localPart.replace(/[^a-zA-Z0-9]/g, '');
  const parts = localPart.split(/[._-]/);
  
  const suggestions: UsernameSuggestion[] = [
    {
      value: clean.toLowerCase(),
      confidence: 'high',
      reasoning: 'Email username without special characters'
    }
  ];

  if (parts.length >= 2) {
    const initials = parts.map(p => p[0]).join('').toLowerCase();
    suggestions.push({
      value: initials,
      confidence: 'medium',
      reasoning: 'Initials from email parts'
    });

    suggestions.push({
      value: parts[0].toLowerCase(),
      confidence: 'high',
      reasoning: 'First part of email'
    });
  }

  if (clean.length > 8) {
    suggestions.push({
      value: clean.substring(0, 8).toLowerCase(),
      confidence: 'medium',
      reasoning: 'Shortened version'
    });
  }

  return suggestions.slice(0, 5);
}
