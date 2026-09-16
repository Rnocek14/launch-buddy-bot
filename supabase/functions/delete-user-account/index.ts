import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

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
    const requestRef = crypto.randomUUID().slice(0, 8);

    console.log(`[delete-user-account] ref=${requestRef} Starting deletion for user ${userId}`);

    // Use service role client with no session persistence (Edge best practice)
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Canonical list of all user-data tables and their user key.
    //
    // Ordered children-before-parents so an explicit delete never trips a
    // foreign key from a row we have not removed yet.
    //
    // Tables are listed even when their FK already cascades: the cascade is a
    // backstop, and an explicit delete is what makes this list auditable
    // against the schema. To re-derive it, grep the migrations for every
    // public table carrying a user-owned uuid column.
    const deletions: { table: string; column: string; value: string }[] = [
      // Email subscription tree: audit rows reference email_subscriptions.
      // email_connections is NOT here — user_services.discovered_from_connection_id
      // points at it with no ON DELETE action, so it has to wait until
      // user_services is gone. See the note further down.
      { table: "unsubscribe_audit_log", column: "user_id", value: userId },
      { table: "email_subscriptions", column: "user_id", value: userId },

      // Broker scans: results reference scans.
      { table: "broker_scan_results", column: "user_id", value: userId },
      { table: "broker_scans", column: "user_id", value: userId },

      // Exposure monitoring: findings reference scans.
      { table: "exposure_findings", column: "user_id", value: userId },
      { table: "exposure_scans", column: "user_id", value: userId },
      { table: "seen_findings", column: "user_id", value: userId },
      { table: "exposure_alerts", column: "user_id", value: userId },

      // Deletion requests reference user_identifiers, so they go first.
      { table: "deletion_requests", column: "user_id", value: userId },
      { table: "service_action_log", column: "user_id", value: userId },
      { table: "service_submissions", column: "user_id", value: userId },
      { table: "unmatched_domains", column: "user_id", value: userId },
      { table: "user_services", column: "user_id", value: userId },
      { table: "user_identifiers", column: "user_id", value: userId },

      // Mailbox OAuth tokens. This MUST come after user_services:
      // user_services.discovered_from_connection_id references
      // email_connections(id) with no ON DELETE clause (NO ACTION), and
      // scan-email / scan-all-emails / scheduled-rescan populate it on every
      // service they discover. Deleting connections first therefore raised
      // 23503 for every user who has ever connected a mailbox — the most
      // common account there is. The accompanying migration also relaxes that
      // FK to SET NULL, but the order is what makes this sweep correct even
      // against a database where the migration has not run yet.
      { table: "email_connections", column: "user_id", value: userId },

      { table: "challenge_participants", column: "user_id", value: userId },
      { table: "contact_discovery_failures", column: "user_id", value: userId },
      { table: "manual_contact_submissions", column: "submitted_by", value: userId },

      // Referrals: conversions reference referral_codes.
      { table: "referral_conversions", column: "referred_user_id", value: userId },
      { table: "referral_codes", column: "user_id", value: userId },
      { table: "risk_score_history", column: "user_id", value: userId },

      // Shared result pages live on public, unauthenticated URLs — the single
      // most visible thing an erasure request expects to see taken down.
      { table: "public_results", column: "user_id", value: userId },
      // Each row's `query` is the user's own name/location, so these are
      // personal data despite being an API audit log. Per-day SERP spend is
      // tracked separately in serp_usage_daily and is unaffected.
      { table: "serp_requests_log", column: "user_id", value: userId },

      { table: "oauth_states", column: "user_id", value: userId },
      { table: "organization_members", column: "user_id", value: userId },
      { table: "user_roles", column: "user_id", value: userId },
      { table: "user_authorizations", column: "user_id", value: userId },
      { table: "subscriptions", column: "user_id", value: userId },
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
        const msg = error.message || "";
        // A table this build knows about but the target database does not is a
        // warning, not a failed erasure. PostgREST 12 reports that as PGRST205
        // ("Could not find the table 'public.x' in the schema cache") and never
        // as Postgres' 42P01, so matching only 42P01/"relation does not exist"
        // would classify an absent table as an error — and now that `status`
        // is derived from `errors`, that would tell every user their data
        // survived when there was no table to hold it. 42P01 is kept for
        // older PostgREST and for errors raised inside a function.
        const isMissingTable =
          error.code === "42P01" ||
          error.code === "PGRST205" ||
          error.code === "PGRST106" ||
          (msg.includes("relation") && msg.includes("does not exist")) ||
          (msg.includes("Could not find the table") && msg.includes("schema cache"));

        if (isMissingTable) {
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
      return new Response(
        JSON.stringify({
          success: false,
          status: "failed",
          error: "Failed to delete authentication account. Please try again or contact support.",
          details: deleteAuthError.message,
          request_ref: requestRef,
          warnings,
          errors,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[delete-user-account] ref=${requestRef} Auth user deleted`);

    // `success` deliberately stays tied to "the auth account is gone", not to
    // "every table was clean". The caller signs the user out and navigates away
    // on success; flipping this to false on a partial cleanup would strand them
    // in a live session whose auth user no longer exists, and tell them nothing
    // was deleted when in fact their login is already destroyed.
    //
    // `status` is the honest discriminator, and `message` now follows it rather
    // than claiming a clean sweep unconditionally.
    const partial = errors.length > 0;

    if (partial) {
      console.error(
        `[delete-user-account] ref=${requestRef} PARTIAL DELETION — ${errors.length} table(s) failed: ${errors.join("; ")}`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: partial ? "partial" : "deleted",
        message: partial
          ? `Account deleted, but ${errors.length} data store(s) could not be cleared and need manual cleanup. Quote ref ${requestRef} to support.`
          : "Account and all data deleted.",
        // Present only on a partial sweep, so a caller that surfaces `error`
        // has accurate text to show instead of inventing reassurance.
        ...(partial
          ? { error: "Some data could not be deleted and has been flagged for manual cleanup." }
          : {}),
        request_ref: requestRef,
        warnings,
        errors,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[delete-user-account] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
