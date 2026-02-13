import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate the calling user via their JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const userEmail = user.email;

    console.log(`[delete-user-account] Starting deletion for user ${userId}`);

    // Use service role client for all deletions (bypasses RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Canonical list of all user-data tables and their user key
    const deletions: { table: string; column: string; value: string }[] = [
      { table: "broker_scan_results", column: "user_id", value: userId },
      { table: "broker_scans", column: "user_id", value: userId },
      { table: "exposure_findings", column: "user_id", value: userId },
      { table: "exposure_scans", column: "user_id", value: userId },
      { table: "deletion_requests", column: "user_id", value: userId },
      { table: "email_subscriptions", column: "user_id", value: userId },
      { table: "email_connections", column: "user_id", value: userId },
      { table: "user_services", column: "user_id", value: userId },
      { table: "user_identifiers", column: "user_id", value: userId },
      { table: "challenge_participants", column: "user_id", value: userId },
      { table: "contact_discovery_failures", column: "user_id", value: userId },
      { table: "analytics_events", column: "user_id", value: userId },
      { table: "profiles", column: "id", value: userId },
    ];

    // Add email-keyed table
    if (userEmail) {
      deletions.push({ table: "email_preferences", column: "email", value: userEmail });
    }

    const errors: string[] = [];

    for (const { table, column, value } of deletions) {
      const { error } = await adminClient.from(table).delete().eq(column, value);
      if (error) {
        // Log but continue — don't let one missing table block the rest
        console.error(`[delete-user-account] Failed to delete from ${table}: ${error.message}`);
        errors.push(`${table}: ${error.message}`);
      } else {
        console.log(`[delete-user-account] Deleted from ${table}`);
      }
    }

    // Delete the auth user itself
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error(`[delete-user-account] Failed to delete auth user: ${deleteAuthError.message}`);
      errors.push(`auth.users: ${deleteAuthError.message}`);
    } else {
      console.log(`[delete-user-account] Auth user deleted`);
    }

    if (errors.length > 0) {
      // Partial success — some tables failed but auth user may be gone
      return new Response(
        JSON.stringify({
          success: false,
          partial: true,
          message: "Some deletions failed. Contact support if issues persist.",
          errors,
        }),
        {
          status: 207,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account and all data deleted." }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[delete-user-account] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
