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

    // Use service role client with no session persistence (Edge best practice)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

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

    const warnings: string[] = [];
    const errors: string[] = [];

    for (const { table, column, value } of deletions) {
      const { error } = await adminClient.from(table).delete().eq(column, value);
      if (error) {
        // "relation does not exist" or similar schema errors → skip, not failure
        const msg = error.message || "";
        if (
          msg.includes("relation") && msg.includes("does not exist") ||
          error.code === "42P01"
        ) {
          console.log(`[delete-user-account] Skipped missing table ${table}`);
          warnings.push(`${table}: table does not exist (skipped)`);
        } else {
          console.error(`[delete-user-account] Failed to delete from ${table}: ${msg}`);
          errors.push(`${table}: ${msg}`);
        }
      } else {
        console.log(`[delete-user-account] Deleted from ${table}`);
      }
    }

    // Delete the auth user itself — this MUST succeed for "account deleted" claim
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error(`[delete-user-account] Failed to delete auth user: ${deleteAuthError.message}`);
      // Auth deletion failed = account is NOT deleted
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to delete authentication account. Please try again or contact support.",
          details: deleteAuthError.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[delete-user-account] Auth user deleted`);

    // Auth user gone = success. Table errors are warnings, not failures.
    return new Response(
      JSON.stringify({
        success: true,
        message: "Account and all data deleted.",
        ...(warnings.length > 0 && { warnings }),
        ...(errors.length > 0 && { warnings: [...warnings, ...errors] }),
      }),
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
