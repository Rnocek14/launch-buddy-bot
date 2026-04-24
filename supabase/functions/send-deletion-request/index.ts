import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    let identifierValue = account_identifier;

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

      selectedIdentifier = identifierData;
      identifierValue = identifierData.value;
      console.log(`Using identifier: ${identifierData.type} - ${identifierData.value}`);
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
    const personalizedBody = String(template.body_template || "")
      .replace(/\{\{user_full_name\}\}/g, sanitizeForEmail(profile.full_name || "User"))
      .replace(/\{\{full_name\}\}/g, sanitizeForEmail(profile.full_name || "User"))
      .replace(/\{\{user_email\}\}/g, sanitizeForEmail(profile.email || user.email || ""))
      .replace(/\{\{email\}\}/g, sanitizeForEmail(profile.email || user.email || ""))
      .replace(
        /\{\{account_identifier\}\}/g,
        sanitizeForEmail(identifierValue || profile.email || user.email || ""),
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
        from: "Footprint Finder <onboarding@resend.dev>",
        to: [recipientEmail],
        cc: [profile.email || user.email!],
        subject,
        text: personalizedBody,
        reply_to: profile.email || user.email!,
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

        return jsonResponse(
          {
            error: "Unable to send deletion request. Please try again or contact support.",
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
          user_email: profile.email || user.email,
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
