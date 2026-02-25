import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter (per isolate)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max requests per window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(email: string): boolean {
  const key = email.toLowerCase().trim();
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

interface HIBPBreach {
  Name: string;
  Title: string;
  Domain: string;
  BreachDate: string;
  Description: string;
  DataClasses: string[];
  IsVerified: boolean;
  IsSensitive: boolean;
  LogoPath: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (isRateLimited(email)) {
      return new Response(
        JSON.stringify({ error: "Rate limited. Try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hibpApiKey = Deno.env.get("HIBP_API_KEY");
    if (!hibpApiKey) {
      console.error("HIBP_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Breach check service unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hibpUrl = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;

    let breaches: HIBPBreach[] = [];
    let hibpError: string | null = null;

    try {
      const response = await fetch(hibpUrl, {
        headers: {
          "hibp-api-key": hibpApiKey,
          "User-Agent": "Deleteist-FreeScan",
        },
      });

      if (response.status === 200) {
        breaches = await response.json();
      } else if (response.status === 404) {
        breaches = [];
      } else if (response.status === 429) {
        hibpError = "Breach database is busy. Please try again in a moment.";
      } else {
        const text = await response.text();
        console.error(`HIBP error ${response.status}:`, text);
        hibpError = "Could not check breaches right now";
      }
    } catch (err) {
      console.error("HIBP fetch error:", err);
      hibpError = "Breach check failed";
    }

    // Classify breaches by severity
    const classified = breaches.map((b) => {
      const dc = b.DataClasses.map((d) => d.toLowerCase());
      let severity: "critical" | "high" | "medium" | "low" = "medium";

      if (dc.some((d) => ["passwords", "credit cards", "ssn", "financial data"].includes(d))) {
        severity = "critical";
      } else if (dc.some((d) => ["phone numbers", "physical addresses", "bank account numbers"].includes(d))) {
        severity = "high";
      } else if (dc.some((d) => ["email addresses", "names", "dates of birth"].includes(d))) {
        severity = "medium";
      } else {
        severity = "low";
      }

      return {
        name: b.Name,
        title: b.Title,
        domain: b.Domain,
        breachDate: b.BreachDate,
        dataClasses: b.DataClasses,
        isVerified: b.IsVerified,
        severity,
      };
    });

    return new Response(
      JSON.stringify({
        breaches: classified,
        breachCount: classified.length,
        criticalCount: classified.filter((b) => b.severity === "critical").length,
        highCount: classified.filter((b) => b.severity === "high").length,
        error: hibpError,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("free-breach-check error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
