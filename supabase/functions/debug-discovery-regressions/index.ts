import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authenticated admin caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tests = [
      {
        domain: "overstock.com",
        expectedContains: "Privacy-and-Security-Policy-ostk",
        mustNotContain: ["fencing", "screens", "/c/rugs"]
      },
    ];

    const results = [];

    for (const test of tests) {
      console.log(`[Regression Test] Testing ${test.domain}...`);
      const { data, error } = await supabase.functions.invoke('discover-privacy-contacts', {
        body: { serviceName: test.domain, domain: test.domain }
      });

      if (error) {
        results.push({
          domain: test.domain,
          passed: false,
          error: "discovery failed",
          expectedContains: test.expectedContains,
        });
        continue;
      }

      const contacts = data?.contacts || [];
      const formUrls = contacts.filter((c: any) => c.contact_type === 'form').map((c: any) => c.value);
      const emailContacts = contacts.filter((c: any) => c.contact_type === 'email').map((c: any) => c.value);
      const bestUrl = formUrls[0] || emailContacts[0] || '';
      const passed = bestUrl.includes(test.expectedContains) &&
                    !test.mustNotContain?.some(bad => bestUrl.toLowerCase().includes(bad.toLowerCase()));

      results.push({
        domain: test.domain,
        url: bestUrl,
        passed,
        expectedContains: test.expectedContains,
        mustNotContain: test.mustNotContain,
        allContacts: contacts.length,
      });
    }

    const allPassed = results.every(r => r.passed);
    return new Response(
      JSON.stringify({ success: allPassed, timestamp: new Date().toISOString(), results }, null, 2),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: allPassed ? 200 : 500,
      }
    );
  } catch (e) {
    console.error("Regression test error:", e);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
