import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import OpenAI from "https://esm.sh/openai@4.20.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Broker patterns for URL construction
const brokerPatterns = [
  {
    slug: "spokeo",
    name: "Spokeo",
    urlTemplate: "https://www.spokeo.com/search?q={firstName}+{lastName}+{city}+{state}",
    optOutUrl: "https://www.spokeo.com/optout",
    difficulty: "medium",
  },
  {
    slug: "whitepages",
    name: "Whitepages",
    urlTemplate: "https://www.whitepages.com/name/{firstName}-{lastName}/{city}-{state}",
    optOutUrl: "https://www.whitepages.com/suppression-requests",
    difficulty: "medium",
  },
  {
    slug: "truepeoplesearch",
    name: "TruePeopleSearch",
    urlTemplate: "https://www.truepeoplesearch.com/results?name={firstName}%20{lastName}&citystatezip={city}%20{state}",
    optOutUrl: "https://www.truepeoplesearch.com/removal",
    difficulty: "easy",
  },
  {
    slug: "fastpeoplesearch",
    name: "FastPeopleSearch",
    urlTemplate: "https://www.fastpeoplesearch.com/name/{firstName}-{lastName}_{city}-{state}",
    optOutUrl: "https://www.fastpeoplesearch.com/removal",
    difficulty: "easy",
  },
  {
    slug: "thatsthem",
    name: "That'sThem",
    urlTemplate: "https://thatsthem.com/name/{firstName}-{lastName}/{city}-{state}",
    optOutUrl: "https://thatsthem.com/optout",
    difficulty: "easy",
  },
  {
    slug: "beenverified",
    name: "BeenVerified",
    urlTemplate: "https://www.beenverified.com/people/{firstName}-{lastName}/{city}-{state}",
    optOutUrl: "https://www.beenverified.com/f/optout/search",
    difficulty: "hard",
  },
  {
    slug: "radaris",
    name: "Radaris",
    urlTemplate: "https://radaris.com/p/{firstName}/{lastName}/{city}-{state}",
    optOutUrl: "https://radaris.com/control/privacy",
    difficulty: "hard",
  },
  {
    slug: "nuwber",
    name: "Nuwber",
    urlTemplate: "https://nuwber.com/search?name={firstName}%20{lastName}&city={city}&state={state}",
    optOutUrl: "https://nuwber.com/removal/link",
    difficulty: "medium",
  },
];

interface ScanParams {
  firstName: string;
  lastName: string;
  email?: string;
  city?: string;
  state?: string;
}

interface ExtractionResult {
  found: boolean;
  confidence: "high" | "medium" | "low";
  data_exposed: string[];
  snippet: string;
  evidence: string; // Actual text excerpt from page proving the match
  profile_url: string | null;
}

interface BlockCheckResult {
  blocked: boolean;
  reason: string;
}

// Priority 1: Blocking Detection - Detect if Browserless returned a blocked/useless page
function isBlockedPage(html: string): BlockCheckResult {
  const lowerHtml = html.toLowerCase();
  
  // Check for common blocking patterns
  if (html.length < 2000) {
    return { blocked: true, reason: "Page too short - likely blocked or error page" };
  }
  if (lowerHtml.includes("captcha") || lowerHtml.includes("recaptcha") || lowerHtml.includes("hcaptcha")) {
    return { blocked: true, reason: "CAPTCHA detected" };
  }
  if (lowerHtml.includes("access denied") || lowerHtml.includes("403 forbidden")) {
    return { blocked: true, reason: "Access denied" };
  }
  if (lowerHtml.includes("please enable javascript") || lowerHtml.includes("javascript is required")) {
    return { blocked: true, reason: "JavaScript rendering failed" };
  }
  if (lowerHtml.includes("unusual traffic") || lowerHtml.includes("rate limit") || lowerHtml.includes("too many requests")) {
    return { blocked: true, reason: "Rate limited" };
  }
  if (lowerHtml.includes("blocked") && lowerHtml.includes("security")) {
    return { blocked: true, reason: "Security block detected" };
  }
  if (lowerHtml.includes("verify you are human") || lowerHtml.includes("are you a robot")) {
    return { blocked: true, reason: "Bot detection triggered" };
  }
  
  return { blocked: false, reason: "" };
}

async function fetchWithBrowserless(url: string, browserlessToken: string): Promise<string> {
  // Use current production endpoint. The legacy `chrome.browserless.io` host
  // returns 400 against the new API. `production-sfo.browserless.io` is the
  // documented v2 host.
  const browserlessUrl = `https://production-sfo.browserless.io/content?token=${browserlessToken}`;

  const response = await fetch(browserlessUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      // `waitFor` (number) is no longer accepted on /content — must be a
      // selector or function. Use `gotoOptions.timeout` + `waitUntil` instead.
      gotoOptions: {
        waitUntil: "networkidle2",
        timeout: 30000,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Browserless error: ${response.status}${body ? ` — ${body.substring(0, 200)}` : ""}`);
  }

  return response.text();
}

async function extractWithOpenAI(
  openai: OpenAI,
  html: string,
  searchParams: ScanParams,
  brokerName: string
): Promise<ExtractionResult> {
  // Truncate HTML to avoid token limits
  const truncatedHtml = html.substring(0, 15000);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 600,
    messages: [
      {
        role: "system",
        content: `You are an expert at analyzing data broker search results pages to determine if a specific person's information is exposed. 

Analyze the HTML and return a JSON object with:
- found: boolean - true ONLY if you found a profile clearly matching the searched person
- confidence: "high" | "medium" | "low" - how confident are you this is the right person
- data_exposed: array of exposed data types like "name", "phone", "address", "email", "age", "relatives", "employer"
- snippet: brief summary (max 100 chars) showing what was found
- evidence: EXACT text excerpt from the HTML that proves the match (max 300 chars). Copy the actual text from the page. If no match found, return empty string.
- profile_url: direct URL to the person's profile if visible in the HTML, otherwise null

CRITICAL RULES:
1. ONLY return found=true if you can provide specific evidence text copied from the page
2. The evidence field MUST contain actual text from the HTML, not a summary
3. If the page shows "no results" or doesn't contain the person's name, return found=false
4. Be conservative - when in doubt, return found=false with low confidence`,
      },
      {
        role: "user",
        content: `Broker: ${brokerName}
Searching for: ${searchParams.firstName} ${searchParams.lastName}${searchParams.city ? `, ${searchParams.city}` : ""}${searchParams.state ? `, ${searchParams.state}` : ""}

Page HTML (truncated):
${truncatedHtml}

Return ONLY valid JSON, no explanation.`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  
  try {
    const parsed = JSON.parse(content) as ExtractionResult;
    // Ensure evidence field exists
    return {
      ...parsed,
      evidence: parsed.evidence || "",
    };
  } catch {
    return {
      found: false,
      confidence: "low",
      data_exposed: [],
      snippet: "Unable to parse results",
      evidence: "",
      profile_url: null,
    };
  }
}

function buildBrokerUrl(template: string, params: ScanParams): string {
  return template
    .replace("{firstName}", encodeURIComponent(params.firstName))
    .replace("{lastName}", encodeURIComponent(params.lastName))
    .replace("{city}", encodeURIComponent(params.city || ""))
    .replace("{state}", encodeURIComponent(params.state || ""));
}

function getSeverity(dataExposed: string[]): "critical" | "high" | "medium" | "low" {
  const criticalTypes = ["ssn", "financial", "password"];
  const highTypes = ["phone", "address", "relatives"];
  const mediumTypes = ["email", "employer", "age"];

  if (dataExposed.some((d) => criticalTypes.includes(d.toLowerCase()))) return "critical";
  if (dataExposed.some((d) => highTypes.includes(d.toLowerCase()))) return "high";
  if (dataExposed.some((d) => mediumTypes.includes(d.toLowerCase()))) return "medium";
  return "low";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const browserlessToken = Deno.env.get("BROWSERLESS_API_KEY");

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!browserlessToken) {
      return new Response(
        JSON.stringify({ error: "BROWSERLESS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiKey });

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { firstName, lastName, email, city, state, scanId } = body as ScanParams & { scanId?: string };

    if (!firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: "firstName and lastName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create or get scan record
    let currentScanId = scanId;
    if (!currentScanId) {
      const { data: newScan, error: scanError } = await supabase
        .from("exposure_scans")
        .insert({
          user_id: user.id,
          status: "scanning",
          search_params: { firstName, lastName, email, city, state },
          sources_to_scan: brokerPatterns.map((b) => b.slug),
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (scanError) {
        console.error("Error creating scan:", scanError);
        return new Response(
          JSON.stringify({ error: "Failed to create scan record" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      currentScanId = newScan.id;
    }

    const searchParams: ScanParams = { firstName, lastName, email, city, state };
    const results: any[] = [];
    const completedSources: string[] = [];
    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    // Scan each broker
    for (const broker of brokerPatterns) {
      try {
        const url = buildBrokerUrl(broker.urlTemplate, searchParams);
        
        // Priority 3: Debug Logging
        console.log(`[SCAN] ${broker.name}`);
        console.log(`  URL: ${url}`);
        
        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        const html = await fetchWithBrowserless(url, browserlessToken);
        
        // Debug: Log HTML stats
        console.log(`  HTML length: ${html.length}`);
        console.log(`  HTML preview: ${html.substring(0, 200).replace(/\s+/g, ' ').trim()}`);
        
        // Priority 1: Check for blocking before OpenAI extraction
        const blockCheck = isBlockedPage(html);
        console.log(`  Blocked: ${blockCheck.blocked}${blockCheck.blocked ? ` (${blockCheck.reason})` : ''}`);
        
        if (blockCheck.blocked) {
          // Skip OpenAI extraction for blocked pages
          console.warn(`  ⚠️ Skipping OpenAI extraction - page blocked`);
          completedSources.push(broker.slug);
          results.push({
            broker: broker.name,
            found: false,
            blocked: true,
            blockReason: blockCheck.reason,
          });
          
          // Update scan progress
          await supabase
            .from("exposure_scans")
            .update({
              sources_completed: completedSources,
            })
            .eq("id", currentScanId);
          
          continue;
        }
        
        const extraction = await extractWithOpenAI(openai, html, searchParams, broker.name);
        
        // Trust gate: found=true requires evidence
        if (extraction.found && !extraction.evidence?.trim()) {
          console.warn(`  ⚠️ Downgrading to found=false - no evidence provided`);
          extraction.found = false;
          extraction.confidence = "low";
        }
        
        // Debug: Log extraction results
        console.log(`  Found: ${extraction.found}, Confidence: ${extraction.confidence}`);
        if (extraction.evidence) {
          console.log(`  Evidence: ${extraction.evidence.substring(0, 100)}...`);
        }

        if (extraction.found) {
          const severity = getSeverity(extraction.data_exposed);
          
          // Insert finding
          const { error: findingError } = await supabase
            .from("exposure_findings")
            .insert({
              user_id: user.id,
              scan_id: currentScanId,
              source_type: "data_broker",
              source_name: broker.name,
              url: extraction.profile_url || url,
              severity,
              status: "found",
              data_types_found: extraction.data_exposed,
              snippet: extraction.snippet,
              evidence: extraction.evidence || null,
              removal_url: broker.optOutUrl,
              removal_difficulty: broker.difficulty,
            });

          if (findingError) {
            console.error(`Error saving finding for ${broker.name}:`, findingError);
          }

          // Update counts
          if (severity === "critical") criticalCount++;
          else if (severity === "high") highCount++;
          else if (severity === "medium") mediumCount++;
          else lowCount++;

          results.push({
            broker: broker.name,
            found: true,
            severity,
            data_exposed: extraction.data_exposed,
            snippet: extraction.snippet,
            evidence: extraction.evidence,
            profile_url: extraction.profile_url,
            removal_url: broker.optOutUrl,
          });
        } else {
          results.push({
            broker: broker.name,
            found: false,
          });
        }

        completedSources.push(broker.slug);

        // Update scan progress
        await supabase
          .from("exposure_scans")
          .update({
            sources_completed: completedSources,
            critical_findings: criticalCount,
            high_findings: highCount,
            medium_findings: mediumCount,
            low_findings: lowCount,
            total_findings: criticalCount + highCount + mediumCount + lowCount,
          })
          .eq("id", currentScanId);

      } catch (error) {
        console.error(`[ERROR] ${broker.name}:`, error);
        completedSources.push(broker.slug);
        results.push({
          broker: broker.name,
          found: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Mark scan as complete
    await supabase
      .from("exposure_scans")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        sources_completed: completedSources,
      })
      .eq("id", currentScanId);

    return new Response(
      JSON.stringify({
        success: true,
        scanId: currentScanId,
        totalScanned: brokerPatterns.length,
        findings: {
          critical: criticalCount,
          high: highCount,
          medium: mediumCount,
          low: lowCount,
          total: criticalCount + highCount + mediumCount + lowCount,
        },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scan error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
