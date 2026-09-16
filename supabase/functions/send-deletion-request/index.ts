import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { RESEND_FROM, isResendTestSender, resendSenderDomain } from "../_shared/resend.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeletionRequestBody {
  service_id: string;
  identifier_id?: string;
  account_identifier?: string;
  template_type?: string;
  preview_only?: boolean;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Sanitize user input to prevent template injection
function sanitizeForEmail(text: string) {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .substring(0, 500);
}

// Addresses are stored as typed. Compare them the way every real mail provider treats
// them so a capitalisation difference cannot turn a user's own address into an
// "unverified third party".
function normalizeIdentifier(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isEuJurisdiction(jurisdiction: string) {
  return jurisdiction.includes("EU") || jurisdiction === "GDPR";
}

function isUsDeletionJurisdiction(jurisdiction: string) {
  return ["US-CA", "CCPA", "US", "California"].includes(jurisdiction);
}

function getTemplateTypeForJurisdiction(jurisdiction: string) {
  if (isEuJurisdiction(jurisdiction)) return "gdpr";
  if (isUsDeletionJurisdiction(jurisdiction)) return "ccpa";
  return "general_deletion";
}

function getAllowedTemplateJurisdictions(jurisdiction: string) {
  if (isEuJurisdiction(jurisdiction)) return ["EU", "GLOBAL", "OTHER"];
  if (isUsDeletionJurisdiction(jurisdiction)) return ["US", "GLOBAL", "OTHER"];
  return ["OTHER", "GLOBAL"];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return jsonResponse({ error: "Unauthorized - missing auth header" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const token = authHeader.replace("Bearer ", "");
    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error("User authentication failed:", userError);
      return jsonResponse({ error: "Unauthorized - invalid token" }, 401);
    }

    const user = {
      id: userData.user.id,
      email: userData.user.email ?? null,
    };

    console.log(`Processing deletion request for user: ${user.id}`);

    // The address on the access token is the only identity Supabase has actually
    // established. profiles.email is a mirror row the user can rewrite at will -- the
    // "Users can update their own profile" policy carries no column restriction -- so it
    // must never be what we assert to a third party, reply to, or CC. Trusting it would
    // hand someone the same impersonation the identifier check below closes, without
    // their ever touching user_identifiers.
    const authEmail = user.email;

    if (!authEmail) {
      console.error(`User ${user.id} has no email address on their account`);
      return jsonResponse(
        {
          error:
            "Your account doesn't have an email address on file, so we can't send a deletion request on your behalf or receive the reply. Add an email address to your account and try again.",
          error_code: "NO_ACCOUNT_EMAIL",
        },
        403,
      );
    }

    /**
     * A value is provably the caller's when it IS the address they authenticated with.
     * That comes from the verified access token, so it is the one thing in this request
     * the caller cannot fabricate.
     */
    const isCallerOwnEmail = (value: string | null | undefined) =>
      normalizeIdentifier(value) === normalizeIdentifier(authEmail);

    const { data: authData, error: authError } = await supabase.rpc("is_authorized_agent", {
      user_uuid: user.id,
    });

    if (authError || !authData) {
      console.error("Authorization check failed:", authError);
      return jsonResponse(
        {
          error: "User is not an authorized agent. Please complete the authorization wizard first.",
          requiresAuthorization: true,
        },
        403,
      );
    }

    const body: DeletionRequestBody = await req.json();
    const {
      service_id,
      identifier_id,
      account_identifier,
      template_type,
      preview_only = false,
    } = body;

    if (!service_id) {
      return jsonResponse({ error: "Missing required field: service_id" }, 400);
    }

    const { data: remainingDeletions, error: tierError } = await supabase.rpc(
      "get_remaining_deletions",
      { p_user_id: user.id },
    );

    if (tierError) {
      console.error("Error checking subscription tier:", tierError);
      return jsonResponse({ error: "Failed to verify subscription status" }, 500);
    }

    if (!preview_only && remainingDeletions !== null && remainingDeletions <= 0) {
      console.log(`User ${user.id} has reached their free deletion limit`);
      return jsonResponse(
        {
          error: "You've used all 3 free deletion requests this month. Upgrade to Pro for unlimited deletions.",
          limitReached: true,
          remainingDeletions: 0,
        },
        403,
      );
    }

    console.log(
      `User ${user.id} has ${remainingDeletions === null ? "unlimited" : remainingDeletions} deletions remaining`,
    );

    const { data: gmailConnection } = await supabase
      .from("email_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .eq("is_primary", true)
      .single();

    // Gmail send scope removed for Google verification (CASA-free path).
    // All deletion emails now go through Resend with the user's email as reply-to.
    const useGmail = false;
    console.log(`User ${user.id} Gmail connection detected: ${!!gmailConnection}, but routing via Resend.`);

    let selectedIdentifier: any = null;
    let identifierValue: string | null = null;

    // THE GATE. Whatever lands in identifierValue is mailed to a real company, from our
    // domain, as a formal demand naming the person it identifies. Owning the row proves
    // nothing about the value: user_identifiers is filled straight from a free-text form
    // and `verified` defaults to false, so an unchecked value lets this product be aimed
    // at a third party -- type a stranger's email and we send a legal demand about them.
    //
    // A value is usable only when it is either
    //   provably the caller's -- it equals the address on their access token -- or
    //   already trusted    -- the stored row carries verified = true.
    //
    // Both entry points run the same gate. The raw `account_identifier` string has to be
    // gated too: leaving it open would be the same attack with one less step, since the
    // caller could simply omit identifier_id.
    if (identifier_id) {
      const { data: identifierData, error: identifierError } = await supabase
        .from("user_identifiers")
        .select("*")
        .eq("id", identifier_id)
        .eq("user_id", user.id)
        .single();

      if (identifierError || !identifierData) {
        console.error("Identifier not found or unauthorized:", identifierError);
        return jsonResponse({ error: "Invalid or unauthorized identifier" }, 400);
      }

      const provablyOwn = isCallerOwnEmail(identifierData.value);

      if (!identifierData.verified && !provablyOwn) {
        console.warn(
          `Refusing unverified identifier ${identifierData.id} (type ${identifierData.type}) for user ${user.id}`,
        );
        return jsonResponse(
          {
            error:
              `We only send requests that name an identifier we can confirm belongs to you, because the request goes to another company under your name. ` +
              `"${identifierData.value}" isn't confirmed, so we can't use it. Use your account email (${authEmail}) instead — pick it from the list, or add it in Settings if it isn't there. ` +
              `It's the only identifier we can confirm today.`,
            error_code: "IDENTIFIER_NOT_VERIFIED",
            requiresVerifiedIdentifier: true,
            identifierId: identifierData.id,
            // Same field name as the free-text branch, so the dialog only has to learn one.
            suggestedIdentifier: authEmail,
          },
          403,
        );
      }

      // It is demonstrably theirs, so record that. Keeps the Settings badge honest and
      // means the address still works here after they change the email on their account.
      // Best-effort: this is bookkeeping, and failing it must not block a request we have
      // already established is legitimate.
      if (!identifierData.verified) {
        const { error: verifyError } = await supabase
          .from("user_identifiers")
          .update({ verified: true })
          .eq("id", identifierData.id)
          .eq("user_id", user.id);

        if (verifyError) {
          console.error("Failed to record identifier verification (non-critical):", verifyError);
        }
      }

      selectedIdentifier = identifierData;
      identifierValue = identifierData.value;
      console.log(`Using identifier: ${identifierData.type} - ${identifierData.value}`);
    } else if (account_identifier?.trim()) {
      const candidate = account_identifier.trim();

      if (isCallerOwnEmail(candidate)) {
        identifierValue = candidate;
        console.log(`Using supplied account identifier (matches account email) for user ${user.id}`);
      } else {
        // Not their account address, so it is only usable if it is one of their own rows
        // that already carries verified = true. Matched by value against the stored rows
        // rather than taken on trust, and the letter then carries the STORED value, not
        // the caller's spelling of it.
        const { data: verifiedIdentifiers, error: verifiedLookupError } = await supabase
          .from("user_identifiers")
          .select("*")
          .eq("user_id", user.id)
          .eq("verified", true);

        if (verifiedLookupError) {
          console.error("Verified identifier lookup failed:", verifiedLookupError);
          return jsonResponse({ error: "Unable to check your saved identifiers" }, 500);
        }

        const match = (verifiedIdentifiers || []).find(
          (row: any) => normalizeIdentifier(row.value) === normalizeIdentifier(candidate),
        );

        if (!match) {
          console.warn(`Refusing unconfirmed account_identifier for user ${user.id}`);
          // Do NOT tell them to clear the box. This branch is only reachable from the
          // free-text field, which DeletionRequestDialog renders only when the user has no
          // saved identifiers -- and that dialog disables "Review & Send" while both the
          // box and the dropdown are empty. "Leave it empty and we'll use your account
          // email" is true of this function but impossible in the UI, so it would strand
          // the user on the one screen where this refusal actually fires. Name the value
          // that does work and hand it back in a field the dialog can prefill from.
          return jsonResponse(
            {
              error:
                `We only send requests that name an identifier we can confirm belongs to you, because the request goes to another company under your name. ` +
                `We can't confirm "${candidate}", so we can't put it in the letter. Type your account email (${authEmail}) in that box instead — it's the only identifier we can confirm today.`,
              error_code: "IDENTIFIER_NOT_VERIFIED",
              requiresVerifiedIdentifier: true,
              suggestedIdentifier: authEmail,
            },
            403,
          );
        }

        selectedIdentifier = match;
        identifierValue = match.value;
        console.log(`Using supplied account identifier (matched verified ${match.type}) for user ${user.id}`);
      }
    }

    const { data: service, error: serviceError } = await supabase
      .from("service_catalog")
      .select("*")
      .eq("id", service_id)
      .single();

    if (serviceError || !service) {
      console.error("Service not found:", serviceError);
      return jsonResponse({ error: "Service not found" }, 404);
    }

    const { data: authorization, error: authzError } = await supabase
      .from("user_authorizations")
      .select("*")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (authzError || !authorization) {
      console.error("Authorization record not found:", authzError);
      return jsonResponse({ error: "Authorization details not found" }, 404);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return jsonResponse({ error: "User profile not found" }, 404);
    }

    const jurisdiction = authorization.jurisdiction || "GLOBAL";
    const resolvedTemplateType =
      template_type && template_type !== "auto"
        ? template_type
        : getTemplateTypeForJurisdiction(jurisdiction);
    const allowedJurisdictions = getAllowedTemplateJurisdictions(jurisdiction);

    console.log(
      `Fetching template for jurisdiction: ${jurisdiction}, template_type: ${resolvedTemplateType}`,
    );

    let template: any = null;

    const { data: typedTemplates, error: templateError } = await supabase
      .from("request_templates")
      .select("*")
      .eq("is_active", true)
      .eq("template_type", resolvedTemplateType)
      .in("jurisdiction", allowedJurisdictions);

    if (templateError) {
      console.error("Template lookup failed:", templateError);
      return jsonResponse({ error: "Unable to load deletion template" }, 500);
    }

    if (typedTemplates && typedTemplates.length > 0) {
      for (const targetJurisdiction of allowedJurisdictions) {
        const match = typedTemplates.find((candidate) => candidate.jurisdiction === targetJurisdiction);
        if (match) {
          template = match;
          break;
        }
      }

      template = template || typedTemplates[0];
    }

    if (!template) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("request_templates")
        .select("*")
        .eq("is_active", true)
        .eq("template_type", "general_deletion")
        .limit(1);

      if (fallbackError) {
        console.error("Fallback template lookup failed:", fallbackError);
        return jsonResponse({ error: "Unable to load deletion template" }, 500);
      }

      template = fallback?.[0] || null;
    }

    if (!template) {
      console.error("No suitable template found");
      return jsonResponse({ error: "No suitable template found" }, 404);
    }

    console.log(`Using template: ${template.name}`);

    const signature = sanitizeForEmail(
      authorization.signature_data?.text || profile.full_name || "Authorized User",
    );
    const sanitizedServiceName = sanitizeForEmail(service.name);
    // Every address the letter asserts comes from authEmail, never profile.email: the
    // profile row is user-writable, so reading it here would put an address of the
    // caller's choosing into a demand we send under our own domain. The empty-identifier
    // fallback is the account email for the same reason.
    const personalizedBody = String(template.body_template || "")
      .replace(/\{\{user_full_name\}\}/g, sanitizeForEmail(profile.full_name || "User"))
      .replace(/\{\{full_name\}\}/g, sanitizeForEmail(profile.full_name || "User"))
      .replace(/\{\{user_email\}\}/g, sanitizeForEmail(authEmail))
      .replace(/\{\{email\}\}/g, sanitizeForEmail(authEmail))
      .replace(
        /\{\{account_identifier\}\}/g,
        sanitizeForEmail(identifierValue || authEmail),
      )
      .replace(/\{\{jurisdiction\}\}/g, sanitizeForEmail(jurisdiction))
      .replace(/\{\{signature\}\}/g, signature)
      .replace(/\{\{service_name\}\}/g, sanitizedServiceName);

    const subject = String(template.subject_template || `Data Deletion Request - ${service.name}`).replace(
      /\{\{service_name\}\}/g,
      sanitizedServiceName,
    );

    console.log(`Selecting best contact for service: ${service.name}`);

    const { data: verifiedContact } = await supabase
      .from("privacy_contacts")
      .select("*")
      .eq("service_id", service_id)
      .eq("contact_type", "email")
      .eq("verified", true)
      .order("confidence", { ascending: false })
      .limit(1)
      .maybeSingle();

    let recipientEmail: string | null = null;
    let contactSource = "none";

    if (verifiedContact) {
      recipientEmail = verifiedContact.value;
      contactSource = "verified_privacy_contacts";
      console.log(`Using verified contact from privacy_contacts: ${recipientEmail}`);
    } else if (service.privacy_email && service.contact_verified) {
      recipientEmail = service.privacy_email;
      contactSource = "verified_catalog";
      console.log(`Using verified catalog email: ${recipientEmail}`);
    } else if (service.privacy_form_url) {
      console.log("Service has form URL but form submission not implemented yet");
      return jsonResponse(
        {
          error:
            "This service requires manual form submission for deletion requests. Form-based deletion is coming soon.",
          contactMethod: "form",
          formUrl: service.privacy_form_url,
          serviceName: service.name,
        },
        400,
      );
    }

    if (!recipientEmail) {
      console.error(`No verified contact found for service: ${service.name}`);
      return jsonResponse(
        {
          error:
            "This service does not have a verified contact email. We're working to verify contact information for all services.",
          needsVerification: true,
          serviceName: service.name,
          serviceId: service_id,
        },
        400,
      );
    }

    if (preview_only) {
      return jsonResponse({
        success: true,
        preview: true,
        subject,
        body: personalizedBody,
        recipient: recipientEmail,
        service_name: service.name,
        template_id: template.id,
        contact_source: contactSource,
      });
    }

    console.log(`Sending email to: ${recipientEmail} (source: ${contactSource})`);

    let emailSent = false;
    let emailId = null;

    if (useGmail) {
      console.log("Attempting to send via user's connected email (Gmail)...");
      try {
        const gmailResponse = await fetch(`${supabaseUrl}/functions/v1/send-via-email`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: recipientEmail,
            subject,
            body: personalizedBody,
            connectionId: gmailConnection?.id,
          }),
        });

        if (gmailResponse.ok) {
          const gmailData = await gmailResponse.json();
          emailSent = true;
          emailId = gmailData.messageId || gmailData.id || `gmail-${Date.now()}`;
          console.log("Email sent via user's Gmail successfully:", emailId);
        } else {
          let gmailErrorBody: Record<string, unknown> | null = null;
          let gmailErrorText = "";

          try {
            gmailErrorBody = await gmailResponse.json();
            gmailErrorText = JSON.stringify(gmailErrorBody);
          } catch {
            gmailErrorText = await gmailResponse.text();
          }

          if (
            gmailErrorBody?.reconnectRequired === true ||
            gmailErrorBody?.error_code === "GMAIL_RECONNECT_REQUIRED"
          ) {
            return jsonResponse(
              {
                error:
                  (typeof gmailErrorBody.error === "string" && gmailErrorBody.error) ||
                  "Your connected Gmail account needs to be reconnected before we can send deletion requests.",
                error_code: "GMAIL_RECONNECT_REQUIRED",
                reconnectRequired: true,
              },
              400,
            );
          }

          console.error("Gmail send failed, falling back to Resend:", gmailErrorText);
        }
      } catch (error) {
        console.error("Gmail send error, falling back to Resend:", error);
      }
    }

    if (!emailSent) {
      console.log("Sending via Resend...");
      const emailResponse = await resend.emails.send({
        from: RESEND_FROM,
        to: [recipientEmail],
        cc: [authEmail],
        subject,
        text: personalizedBody,
        reply_to: authEmail,
      });

      if (!emailResponse.data?.id) {
        console.error("Failed to send email:", emailResponse.error);

        const resendMessage = typeof emailResponse.error?.message === "string"
          ? emailResponse.error.message
          : "";

        if (useGmail) {
          return jsonResponse(
            {
              error: resendMessage.includes("testing emails")
                ? "Your connected Gmail account needs to be reconnected before we can send deletion requests. Please reconnect Gmail in Settings, then try again."
                : "We couldn't send from your connected Gmail account, and backup sending is unavailable right now. Please reconnect Gmail in Settings and try again.",
              error_code: "GMAIL_RECONNECT_REQUIRED",
              reconnectRequired: true,
            },
            400,
          );
        }

        // Resend is in testing mode (no verified domain) — surface this clearly
        // so it doesn't masquerade as a generic 500.
        if (
          isResendTestSender() ||
          resendMessage.includes("testing emails") ||
          resendMessage.includes("verify a domain")
        ) {
          return jsonResponse(
            {
              error: `Email sending is not configured for delivery to third parties. The sender domain "${resendSenderDomain()}" must be verified at resend.com/domains and set via the RESEND_FROM / RESEND_FROM_DOMAIN secret before deletion requests can be sent.`,
              error_code: "RESEND_DOMAIN_NOT_VERIFIED",
              details: resendMessage,
            },
            503,
          );
        }

        return jsonResponse(
          {
            error: resendMessage || "Unable to send deletion request. Please try again or contact support.",
            error_code: "EMAIL_SEND_FAILED",
          },
          500,
        );
      }

      emailId = emailResponse.data.id;
      console.log("Email sent via Resend successfully:", emailId);
    }

    console.log(`Email sent successfully. ID: ${emailId}`);

    const insertData: any = {
      user_id: user.id,
      service_id,
      service_name: service.name,
      request_type: "email_sent",
      method: useGmail ? "gmail" : "resend",
      request_body: {
        to: recipientEmail,
        subject,
        body: personalizedBody,
        template_id: template.id,
        account_identifier: identifierValue,
      },
      status: "sent",
    };

    if (selectedIdentifier) {
      insertData.identifier_used_id = selectedIdentifier.id;
      insertData.identifier_used_value = selectedIdentifier.value;
      insertData.identifier_used_type = selectedIdentifier.type;
    }

    const { data: deletionRequest, error: insertError } = await supabase
      .from("deletion_requests")
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error("Failed to log deletion request:", insertError);
    }

    console.log(`Deletion request logged. ID: ${deletionRequest?.id}`);

    const { error: incrementError } = await supabase.rpc("increment_deletion_count", {
      p_user_id: user.id,
    });

    if (incrementError) {
      console.error("Error incrementing deletion count:", incrementError);
    } else {
      console.log(`Deletion count incremented for user ${user.id}`);
    }

    try {
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      await supabase.functions.invoke("send-deletion-notification", {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: {
          user_email: authEmail,
          user_name: profile.full_name || "User",
          service_name: service.name,
          request_id: deletionRequest?.id || "unknown",
          recipient_email: recipientEmail,
          notification_type: "confirmation",
        },
      });
      console.log("Confirmation email notification sent");
    } catch (notifError) {
      console.error("Failed to send notification email (non-critical):", notifError);
    }

    return jsonResponse({
      success: true,
      message: "Deletion request sent successfully",
      request_id: deletionRequest?.id,
      email_id: emailId,
      service_name: service.name,
      recipient: recipientEmail,
    });
  } catch (error: any) {
    console.error("Error in send-deletion-request function:", error);
    return jsonResponse(
      {
        error: error?.message || "Unable to process deletion request. Please try again or contact support.",
        error_code: "REQUEST_PROCESSING_FAILED",
      },
      500,
    );
  }
};

serve(handler);
