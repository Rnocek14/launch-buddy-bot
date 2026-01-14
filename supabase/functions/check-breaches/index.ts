import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BreachInfo {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  Description: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsFabricated: boolean;
  IsSensitive: boolean;
  IsRetired: boolean;
  IsSpamList: boolean;
  LogoPath: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const hibpApiKey = Deno.env.get("HIBP_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

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
    const { email, scanId } = body as { email: string; scanId?: string };

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check HaveIBeenPwned API
    const headers: Record<string, string> = {
      "User-Agent": "LaunchBuddyBot-PrivacyScanner",
    };

    // HIBP requires an API key for the breachedaccount endpoint
    if (hibpApiKey) {
      headers["hibp-api-key"] = hibpApiKey;
    }

    const hibpUrl = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;
    
    let breaches: BreachInfo[] = [];
    let hibpError = null;

    try {
      const response = await fetch(hibpUrl, { headers });
      
      if (response.status === 200) {
        breaches = await response.json();
      } else if (response.status === 404) {
        // No breaches found - this is good!
        breaches = [];
      } else if (response.status === 401) {
        hibpError = "HIBP API key required for this endpoint";
      } else if (response.status === 429) {
        hibpError = "Rate limited - please try again later";
      } else {
        hibpError = `HIBP API error: ${response.status}`;
      }
    } catch (error) {
      console.error("HIBP fetch error:", error);
      hibpError = "Failed to check breaches";
    }

    // Store findings if we have a scan ID
    if (scanId && breaches.length > 0) {
      for (const breach of breaches) {
        // Determine severity based on data classes
        let severity: "critical" | "high" | "medium" | "low" = "medium";
        const dataClasses = breach.DataClasses.map((d) => d.toLowerCase());
        
        if (dataClasses.some((d) => ["passwords", "credit cards", "ssn", "financial data"].includes(d))) {
          severity = "critical";
        } else if (dataClasses.some((d) => ["phone numbers", "physical addresses", "bank account numbers"].includes(d))) {
          severity = "high";
        } else if (dataClasses.some((d) => ["email addresses", "names", "dates of birth"].includes(d))) {
          severity = "medium";
        } else {
          severity = "low";
        }

        await supabase.from("exposure_findings").insert({
          user_id: user.id,
          scan_id: scanId,
          source_type: "breach",
          source_name: breach.Title,
          url: `https://haveibeenpwned.com/breach/${breach.Name}`,
          severity,
          status: "found",
          data_types_found: breach.DataClasses,
          snippet: `Breached on ${breach.BreachDate}: ${breach.DataClasses.slice(0, 3).join(", ")}${breach.DataClasses.length > 3 ? "..." : ""}`,
          title: `${breach.Title} Data Breach`,
        });
      }

      // Update scan with breach counts
      const criticalBreaches = breaches.filter((b) => 
        b.DataClasses.some((d) => ["Passwords", "Credit cards", "SSN", "Financial data"].includes(d))
      ).length;

      const { data: currentScan } = await supabase
        .from("exposure_scans")
        .select("critical_findings, high_findings, medium_findings, low_findings, total_findings")
        .eq("id", scanId)
        .single();

      if (currentScan) {
        await supabase.from("exposure_scans").update({
          critical_findings: (currentScan.critical_findings || 0) + criticalBreaches,
          total_findings: (currentScan.total_findings || 0) + breaches.length,
        }).eq("id", scanId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        breachesFound: breaches.length,
        breaches: breaches.map((b) => ({
          name: b.Name,
          title: b.Title,
          domain: b.Domain,
          breachDate: b.BreachDate,
          dataClasses: b.DataClasses,
          description: b.Description.substring(0, 200),
          isVerified: b.IsVerified,
          isSensitive: b.IsSensitive,
        })),
        error: hibpError,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Breach check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
