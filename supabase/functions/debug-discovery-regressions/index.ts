import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const tests = [
      {
        domain: "overstock.com",
        expectedContains: "Privacy-and-Security-Policy-ostk",
        mustNotContain: ["fencing", "screens", "/c/rugs"]
      },
      // Add more regression tests here as needed
    ];

    const results = [];

    for (const test of tests) {
      console.log(`[Regression Test] Testing ${test.domain}...`);
      
      // Call the discover-privacy-contacts function
      const { data, error } = await supabase.functions.invoke('discover-privacy-contacts', {
        body: { 
          serviceName: test.domain,
          domain: test.domain 
        }
      });

      if (error) {
        results.push({
          domain: test.domain,
          passed: false,
          error: error.message,
          expectedContains: test.expectedContains,
        });
        continue;
      }

      // Check the discovered contacts
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

      console.log(`[Regression Test] ${test.domain}: ${passed ? 'PASS' : 'FAIL'} - URL: ${bestUrl}`);
    }

    const allPassed = results.every(r => r.passed);

    return new Response(
      JSON.stringify({
        success: allPassed,
        timestamp: new Date().toISOString(),
        results,
      }, null, 2),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: allPassed ? 200 : 500,
      }
    );
  } catch (e) {
    console.error("Regression test error:", e);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: e instanceof Error ? e.message : "Unknown error" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
