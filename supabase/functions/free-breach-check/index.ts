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
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { email } = await req.json().catch(() => ({}));

    if (typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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

    try {
      // Cap upstream latency. The client separately caps the entire function
      // request, so neither an upstream stall nor a lost response hangs the UI.
      const response = await fetch(hibpUrl, {
        headers: {
          "hibp-api-key": hibpApiKey,
          "User-Agent": "Deleteist-FreeScan",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(8500),
      });

      if (response.status === 200) {
        const payload = await response.json();
        if (!Array.isArray(payload)) {
          console.error("HIBP returned unexpected success payload");
          throw new Error("Invalid breach provider payload");
        }
        breaches = payload as HIBPBreach[];
      } else if (response.status === 404) {
        // HIBP documents 404 as "no breached account matches", not an error.
        breaches = [];
      } else {
        // A provider outage, invalid key, or rate limit must never be
        // converted into "0 known breaches" or a fabricated estimate.
        const retryAfter = response.headers.get("retry-after");
        console.error("HIBP request failed", {
          status: response.status,
          hasRetryAfter: Boolean(retryAfter),
        });
        const friendly = response.status === 429
          ? "Breach database rate limit reached. Please try again shortly."
          : response.status === 401 || response.status === 403
            ? "Breach check configuration requires attention. Please try again later."
            : "Breach database temporarily unavailable. Please try again later.";
        return new Response(JSON.stringify({ error: friendly, checked: false }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (err) {
      console.error("HIBP lookup failed:", err instanceof Error ? err.name : "unknown_error");
      return new Response(JSON.stringify({
        error: "Breach database unavailable. No results were verified. Please try again.",
        checked: false,
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
        checked: true,
        breaches: classified,
        breachCount: classified.length,
        criticalCount: classified.filter((b) => b.severity === "critical").length,
        highCount: classified.filter((b) => b.severity === "high").length,
        error: null,
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
