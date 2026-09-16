import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValidationRequest {
  email: string;
  updateDatabase?: boolean;
  contactId?: string; // For privacy_contacts
  serviceId?: string; // For service_catalog
}

interface ValidationResult {
  email: string;
  isValid: boolean;
  mxRecords: string[];
  error?: string;
  hasValidFormat: boolean;
  hasMxRecords: boolean;
}

async function validateEmailMX(email: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    email,
    isValid: false,
    mxRecords: [],
    hasValidFormat: false,
    hasMxRecords: false,
  };

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    result.error = "Invalid email format";
    return result;
  }
  result.hasValidFormat = true;

  // Extract domain
  const domain = email.split("@")[1];
  if (!domain) {
    result.error = "Could not extract domain from email";
    return result;
  }

  try {
    // Try Google DNS-over-HTTPS first
    let dnsResponse = await fetch(
      `https://dns.google/resolve?name=${domain}&type=MX`,
      {
        headers: { 'Accept': 'application/dns-json' },
        signal: AbortSignal.timeout(10000),
      }
    );

    // Fallback to Cloudflare DNS if Google fails
    if (!dnsResponse.ok) {
      console.log(`Google DNS failed, trying Cloudflare DNS for ${domain}`);
      dnsResponse = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${domain}&type=MX`,
        {
          headers: { 'Accept': 'application/dns-json' },
          signal: AbortSignal.timeout(10000),
        }
      );
    }

    if (!dnsResponse.ok) {
      result.error = `DNS lookup failed with status ${dnsResponse.status}`;
      return result;
    }

    const dnsData = await dnsResponse.json();
    console.log(`DNS lookup for ${domain}:`, JSON.stringify(dnsData, null, 2));

    // Parse MX records from DNS-over-HTTPS response
    if (dnsData.Answer && dnsData.Answer.length > 0) {
      const mxRecords = dnsData.Answer
        .filter((record: any) => record.type === 15) // MX record type
        .map((record: any) => {
          // MX record format: "priority mailserver.domain.com."
          const parts = record.data.split(' ');
          return parts.length > 1 ? parts[1].replace(/\.$/, '') : record.data.replace(/\.$/, '');
        })
        .filter(Boolean);

      if (mxRecords.length > 0) {
        result.mxRecords = mxRecords;
        result.hasMxRecords = true;
        result.isValid = true;
      } else {
        result.error = "No MX records found for domain";
      }
    } else {
      result.error = "No MX records found for domain";
    }

  } catch (error: any) {
    console.error(`Error validating MX for ${email}:`, error);
    result.error = `DNS lookup failed: ${error.message}`;
  }

  return result;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("[validate-email-contact] Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing auth header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");

    // Initialize Supabase client with auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user — pass token explicitly for reliability
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("[validate-email-contact] getUser failed:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token", detail: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[validate-email-contact] Authenticated user: ${user.id}`);

    // Parse request body
    const body: ValidationRequest = await req.json();
    const { email, updateDatabase, contactId, serviceId } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing required field: email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---------------------------------------------------------------------------
    // SECURITY GATE — DO NOT DELETE THIS AS "UNUSED".
    //
    // The MX lookup below is read-only and harmless, so ANY authenticated user may
    // call this function to check an address. The DATABASE WRITES further down are a
    // different matter, and they are admin-only:
    //
    //   * service_catalog is a GLOBAL catalog shared by every tenant. One row is "the"
    //     privacy contact for a service for all users.
    //   * privacy_contacts is ALSO global — it has no user_id column (it is keyed on
    //     service_id) and its RLS policies are admin-only for select/insert/update/
    //     delete. There is no such thing as "my own" privacy_contacts row, so a
    //     non-admin verifying one is never a self-scoped write.
    //
    // send-deletion-request mails whichever address these rows hold, including the
    // requesting user's name, email and account identifiers, and CCs the user. So an
    // unauthenticated write here is a PII exfiltration primitive: point a major service
    // at your own inbox and collect other people's deletion requests. This was not
    // hypothetical — production had GitHub sitting on privacy@dropbox.com.
    //
    // A passing MX lookup proves only that the domain accepts mail. It does NOT prove
    // the address belongs to that company or is a privacy inbox, so it cannot stand in
    // for authorization.
    //
    // Non-admins who discover a contact are not stuck: manual_contact_submissions is
    // the reviewed path (ContactDiscoveryDialog -> ManualContactReview).
    // ---------------------------------------------------------------------------
    if (updateDatabase) {
      const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      // Fail closed — if we cannot positively prove the caller is an admin, we do not write.
      if (roleError || isAdmin !== true) {
        console.error(
          `[validate-email-contact] DENIED database write for non-admin user ${user.id} ` +
            `(email=${email}, serviceId=${serviceId ?? "none"}, contactId=${contactId ?? "none"}` +
            `, roleCheckError=${roleError?.message ?? "none"})`
        );
        return new Response(
          JSON.stringify({
            error: "Forbidden - admin role required to verify privacy contacts",
            detail:
              "Verifying a contact writes the shared service catalog. Re-send without " +
              "updateDatabase for a read-only MX check, or submit the contact via " +
              "manual_contact_submissions for admin review.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(
        `[validate-email-contact] Admin ${user.id} authorized for database write`
      );
    }

    console.log(`Validating email: ${email}`);

    // Perform MX validation
    const validationResult = await validateEmailMX(email);

    console.log("Validation result:", validationResult);

    // What the writes below ACTUALLY did. `databaseUpdated` used to be reported as
    // `updateDatabase && isValid` no matter what happened, while both update errors were
    // swallowed into console.error and a zero-row match (stale contactId, wrong serviceId)
    // was indistinguishable from a write. So the handler could answer 200 / "updated" having
    // changed nothing, and the callers — which toast "Contact Verified!" off
    // validation.isValid — claimed a verification that does not exist in the database. The
    // same silent-no-op failure the admin gate above refuses to make, so do not make it here.
    const writeErrors: string[] = [];
    let contactRowsWritten = 0;
    let catalogRowsWritten = 0;

    // Update database if requested.
    // Reaching here with updateDatabase set means the admin gate above passed.
    if (updateDatabase && validationResult.isValid) {
      // Use service-role client for these mutations. This bypasses RLS entirely, which
      // is exactly why the admin gate above has to exist — the gate is the ONLY thing
      // standing between an ordinary signed-up user and the shared catalog rows.
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, serviceRoleKey);

      if (contactId) {
        // Mark the discovered contact as MX-validated and verified
        // .select() so we can tell "row updated" from "no row matched that id".
        const { data: updatedContacts, error: updateError } = await adminClient
          .from("privacy_contacts")
          .update({
            mx_validated: true,
            verified: true,
            last_validated_at: new Date().toISOString(),
          })
          .eq("id", contactId)
          .select("id");

        if (updateError) {
          console.error("Error updating privacy_contacts:", updateError);
          writeErrors.push(`privacy_contacts: ${updateError.message}`);
        } else {
          contactRowsWritten = updatedContacts?.length ?? 0;
          if (contactRowsWritten === 0) {
            console.warn(
              `[validate-email-contact] No privacy_contacts row matched id ${contactId} — nothing was verified`
            );
          } else {
            console.log(`Updated privacy_contacts record: ${contactId}`);
          }
        }
      }

      if (serviceId) {
        // Update shared service_catalog with verified privacy email
        const { data: updatedServices, error: updateError } = await adminClient
          .from("service_catalog")
          .update({
            contact_verified: true,
            privacy_email: email,
          })
          .eq("id", serviceId)
          .select("id");

        if (updateError) {
          console.error("Error updating service_catalog:", updateError);
          writeErrors.push(`service_catalog: ${updateError.message}`);
        } else {
          catalogRowsWritten = updatedServices?.length ?? 0;
          if (catalogRowsWritten === 0) {
            console.warn(
              `[validate-email-contact] No service_catalog row matched id ${serviceId} — nothing was verified`
            );
          } else {
            console.log(`Updated service_catalog record: ${serviceId}`);
          }
        }
      }
    }

    // Both writes are still attempted exactly as before; only the answer changes. A write that
    // errored is reported as a failure rather than logged and dressed up as success.
    if (writeErrors.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Failed to record contact verification",
          details: writeErrors.join("; "),
          validation: validationResult,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        validation: validationResult,
        // The real outcome, not the request's intent.
        databaseUpdated: contactRowsWritten > 0 || catalogRowsWritten > 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in validate-email-contact function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to validate email",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
