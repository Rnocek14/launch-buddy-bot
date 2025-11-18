import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
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
}

// Sanitize user input to prevent template injection
function sanitizeForEmail(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\r\n]+/g, ' ') // Remove newlines that could manipulate email content
    .trim()
    .substring(0, 500); // Limit length to reasonable size
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
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing auth header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing deletion request for user: ${user.id}`);

    // Check if user is authorized agent
    const { data: authData, error: authError } = await supabase.rpc(
      "is_authorized_agent",
      { user_uuid: user.id }
    );

    if (authError || !authData) {
      console.error("Authorization check failed:", authError);
      return new Response(
        JSON.stringify({ 
          error: "User is not an authorized agent. Please complete the authorization wizard first.",
          requiresAuthorization: true
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription tier and deletion limits
    const { data: remainingDeletions, error: tierError } = await supabase.rpc(
      "get_remaining_deletions",
      { p_user_id: user.id }
    );

    if (tierError) {
      console.error("Error checking subscription tier:", tierError);
      return new Response(
        JSON.stringify({ error: "Failed to verify subscription status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If remainingDeletions is not null and is 0, user has hit their limit
    if (remainingDeletions !== null && remainingDeletions <= 0) {
      console.log(`User ${user.id} has reached their free deletion limit`);
      return new Response(
        JSON.stringify({ 
          error: "You've used all 3 free deletion requests this month. Upgrade to Pro for unlimited deletions.",
          limitReached: true,
          remainingDeletions: 0
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user.id} has ${remainingDeletions === null ? 'unlimited' : remainingDeletions} deletions remaining`);

    // Check if user has Gmail connected
    const { data: gmailConnection } = await supabase
      .from("email_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .eq("is_primary", true)
      .single();

    const useGmail = !!gmailConnection;
    console.log(`User ${user.id} Gmail connection status:`, useGmail);

    // Parse request body
    const body: DeletionRequestBody = await req.json();
    const { service_id, identifier_id, account_identifier, template_type = "global" } = body;

    if (!service_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: service_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch identifier if provided
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
        return new Response(
          JSON.stringify({ error: "Invalid or unauthorized identifier" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      selectedIdentifier = identifierData;
      identifierValue = identifierData.value;
      console.log(`Using identifier: ${identifierData.type} - ${identifierData.value}`);
    }

    console.log(`Fetching service details for: ${service_id}`);

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from("service_catalog")
      .select("*")
      .eq("id", service_id)
      .single();

    if (serviceError || !service) {
      console.error("Service not found:", serviceError);
      return new Response(
        JSON.stringify({ error: "Service not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user authorization details
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
      return new Response(
        JSON.stringify({ error: "Authorization details not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get appropriate template based on jurisdiction
    const jurisdiction = authorization.jurisdiction || "GLOBAL";
    console.log(`Fetching template for jurisdiction: ${jurisdiction}, template_type: ${template_type}`);

    // Map jurisdiction to template lookup
    let templateQuery = supabase
      .from("request_templates")
      .select("*")
      .eq("is_active", true);

    // If template_type is provided, use it; otherwise select based on jurisdiction
    if (template_type !== "auto") {
      templateQuery = templateQuery.eq("template_type", template_type);
    } else {
      // Auto-select template based on jurisdiction
      if (jurisdiction.includes("EU") || jurisdiction === "GDPR") {
        templateQuery = templateQuery.eq("template_type", "gdpr");
      } else if (jurisdiction === "US-CA" || jurisdiction === "CCPA") {
        templateQuery = templateQuery.eq("template_type", "ccpa");
      } else {
        templateQuery = templateQuery.eq("template_type", "global");
      }
    }

    const { data: templates, error: templateError } = await templateQuery
      .or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.GLOBAL`)
      .order("jurisdiction", { ascending: false }); // Prioritize specific jurisdiction over GLOBAL

    if (templateError || !templates || templates.length === 0) {
      console.error("No templates found:", templateError);
      return new Response(
        JSON.stringify({ error: "No suitable template found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = templates[0];
    console.log(`Using template: ${template.name}`);

    // Personalize the email template with sanitized user inputs
    const signature = sanitizeForEmail(authorization.signature_data?.text || profile.full_name || "Authorized User");
    const personalizedBody = template.body_template
      .replace(/\{\{user_full_name\}\}/g, sanitizeForEmail(profile.full_name || "User"))
      .replace(/\{\{full_name\}\}/g, sanitizeForEmail(profile.full_name || "User"))
      .replace(/\{\{user_email\}\}/g, sanitizeForEmail(profile.email || user.email || ""))
      .replace(/\{\{email\}\}/g, sanitizeForEmail(profile.email || user.email || ""))
      .replace(/\{\{account_identifier\}\}/g, sanitizeForEmail(identifierValue || profile.email || user.email || ""))
      .replace(/\{\{jurisdiction\}\}/g, sanitizeForEmail(jurisdiction))
      .replace(/\{\{signature\}\}/g, signature);

    const subject = template.subject_template || `Data Deletion Request - ${service.name}`;

    // PHASE 1: Strict contact validation - Block unverified sends
    console.log(`Selecting best contact for service: ${service.name}`);
    
    // Priority 1: Verified email from privacy_contacts table
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
    } 
    // Priority 2: Service catalog privacy_email (only if contact_verified=true)
    else if (service.privacy_email && service.contact_verified) {
      recipientEmail = service.privacy_email;
      contactSource = "verified_catalog";
      console.log(`Using verified catalog email: ${recipientEmail}`);
    }
    // Priority 3: Privacy form URL (different flow - not implemented in Phase 1)
    else if (service.privacy_form_url) {
      console.log("Service has form URL but form submission not implemented yet");
      return new Response(
        JSON.stringify({ 
          error: "This service requires manual form submission for deletion requests. Form-based deletion is coming soon.",
          contactMethod: "form",
          formUrl: service.privacy_form_url,
          serviceName: service.name
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // BLOCK: No verified contact available
    if (!recipientEmail) {
      console.error(`No verified contact found for service: ${service.name}`);
      return new Response(
        JSON.stringify({ 
          error: "This service does not have a verified contact email. We're working to verify contact information for all services.",
          needsVerification: true,
          serviceName: service.name,
          serviceId: service_id
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email to: ${recipientEmail} (source: ${contactSource})`);

    // Send email via Gmail if connected, otherwise use Resend
    let emailSent = false;
    let emailId = null;

    if (useGmail) {
      console.log("Attempting to send via Gmail...");
      try {
        const gmailResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-via-gmail`,
          {
            method: "POST",
            headers: {
              "Authorization": authHeader,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: recipientEmail,
              subject: subject,
              body: personalizedBody,
            }),
          }
        );

        if (gmailResponse.ok) {
          const gmailData = await gmailResponse.json();
          emailSent = true;
          emailId = gmailData.messageId;
          console.log("Email sent via Gmail successfully:", emailId);
        } else {
          const error = await gmailResponse.text();
          console.error("Gmail send failed, falling back to Resend:", error);
        }
      } catch (error) {
        console.error("Gmail send error, falling back to Resend:", error);
      }
    }

    // Fallback to Resend if Gmail failed or not connected
    if (!emailSent) {
      console.log("Sending via Resend...");
      const emailResponse = await resend.emails.send({
        from: "Footprint Finder <onboarding@resend.dev>",
        to: [recipientEmail],
        cc: [profile.email || user.email!],
        subject: subject,
        text: personalizedBody,
        reply_to: profile.email || user.email!,
      });

      if (!emailResponse.data?.id) {
        console.error("Failed to send email:", emailResponse.error);
        return new Response(
          JSON.stringify({ 
            error: "Unable to send deletion request. Please try again or contact support.",
            error_code: "EMAIL_SEND_FAILED"
          }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      emailId = emailResponse.data.id;
      console.log("Email sent via Resend successfully:", emailId);
    }

    console.log(`Email sent successfully. ID: ${emailId}`);

    // Log deletion request to database
    const insertData: any = {
      user_id: user.id,
      service_id: service_id,
      service_name: service.name,
      request_type: "email_sent",
      method: useGmail ? "gmail" : "resend",
      request_body: {
        to: recipientEmail,
        subject: subject,
        body: personalizedBody,
        template_id: template.id,
        account_identifier: identifierValue,
      },
      status: "sent",
    };

    // Add identifier tracking if used
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
      // Email was sent, so we continue but log the error
    }

    console.log(`Deletion request logged. ID: ${deletionRequest?.id}`);

    // Increment deletion count for usage tracking
    const { error: incrementError } = await supabase.rpc(
      "increment_deletion_count",
      { p_user_id: user.id }
    );

    if (incrementError) {
      console.error("Error incrementing deletion count:", incrementError);
      // Non-critical, continue
    } else {
      console.log(`Deletion count incremented for user ${user.id}`);
    }

    // Send confirmation email notification
    try {
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
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
      // Continue even if notification fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Deletion request sent successfully",
        request_id: deletionRequest?.id,
        email_id: emailId,
        service_name: service.name,
        recipient: recipientEmail,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-deletion-request function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Unable to process deletion request. Please try again or contact support.",
        error_code: "REQUEST_PROCESSING_FAILED"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
