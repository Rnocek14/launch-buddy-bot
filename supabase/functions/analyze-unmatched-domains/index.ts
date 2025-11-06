import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  domains: Array<{ domain: string; email_from: string; occurrence_count: number }>;
}

interface DomainSuggestion {
  domain: string;
  suggested_name: string;
  category: string;
  confidence: string;
  reasoning: string;
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

    const { domains } = await req.json() as AnalyzeRequest;
    if (!domains || domains.length === 0) {
      throw new Error("No domains provided");
    }

    console.log(`Analyzing ${domains.length} unmatched domains for user ${user.id}`);

    // Get existing service catalog for context
    const { data: catalog, error: catalogError } = await supabase
      .from("service_catalog")
      .select("name, domain, category");

    if (catalogError) throw catalogError;

    const categories = [...new Set(catalog.map(s => s.category))].filter(Boolean);

    // Prepare AI prompt
    const systemPrompt = `You are an expert at identifying online services and companies from email domains. 
Your task is to analyze email domains and suggest:
1. The likely service/company name
2. The appropriate category from this list: ${categories.join(", ")}
3. Your confidence level (high, medium, low)
4. Brief reasoning for your suggestion

Be specific and accurate. If a domain is clearly spam, promotional, or not a real service, mark it with low confidence.`;

    const userPrompt = `Analyze these email domains and suggest service names and categories:

${domains.map(d => `- ${d.domain} (from: ${d.email_from}, seen ${d.occurrence_count} times)`).join("\n")}

Return suggestions for each domain.`;

    // Call Lovable AI Gateway with tool calling for structured output
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_domain_matches",
              description: "Return categorization suggestions for unmatched email domains",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        domain: { type: "string" },
                        suggested_name: { type: "string" },
                        category: { type: "string" },
                        confidence: { type: "string", enum: ["high", "medium", "low"] },
                        reasoning: { type: "string" }
                      },
                      required: ["domain", "suggested_name", "category", "confidence", "reasoning"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_domain_matches" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error("Rate limits exceeded. Please try again later.");
      }
      if (aiResponse.status === 402) {
        throw new Error("Payment required. Please add credits to your Lovable AI workspace.");
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiData, null, 2));

    // Extract structured output from tool call
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const suggestions: DomainSuggestion[] = JSON.parse(toolCall.function.arguments).suggestions;

    console.log(`Generated ${suggestions.length} suggestions`);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Analysis error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
