import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeletionRequestBody {
  service_id: string;
  account_identifier?: string;
  template_type?: string;
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

    // Parse request body
    const body: DeletionRequestBody = await req.json();
    const { service_id, account_identifier, template_type = "deletion" } = body;

    if (!service_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: service_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
    const jurisdiction = authorization.jurisdiction || "Global";
    console.log(`Fetching template for jurisdiction: ${jurisdiction}`);

    const { data: templates, error: templateError } = await supabase
      .from("request_templates")
      .select("*")
      .eq("template_type", template_type)
      .eq("is_active", true)
      .or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.Global`)
      .order("jurisdiction", { ascending: false }); // Prioritize specific jurisdiction over Global

    if (templateError || !templates || templates.length === 0) {
      console.error("No templates found:", templateError);
      return new Response(
        JSON.stringify({ error: "No suitable template found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = templates[0];
    console.log(`Using template: ${template.name}`);

    // Personalize the email template
    const signature = authorization.signature_data?.text || profile.full_name || "Authorized User";
    const personalizedBody = template.body_template
      .replace(/\{\{full_name\}\}/g, profile.full_name || "User")
      .replace(/\{\{email\}\}/g, profile.email || user.email || "")
      .replace(/\{\{account_identifier\}\}/g, account_identifier || profile.email || user.email || "")
      .replace(/\{\{jurisdiction\}\}/g, jurisdiction)
      .replace(/\{\{signature\}\}/g, signature);

    const subject = template.subject_template || `Data Deletion Request - ${service.name}`;

    // Determine recipient email
    const recipientEmail = service.privacy_email || service.domain;
    if (!recipientEmail) {
      console.error("No contact email found for service");
      return new Response(
        JSON.stringify({ error: "Service does not have a contact email configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email to: ${recipientEmail}`);

    // Send email via Resend
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
          error: "Failed to send deletion request email",
          details: emailResponse.error 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Email sent successfully. ID: ${emailResponse.data.id}`);

    // Log deletion request to database
    const { data: deletionRequest, error: insertError } = await supabase
      .from("deletion_requests")
      .insert({
        user_id: user.id,
        service_id: service_id,
        service_name: service.name,
        request_type: template_type,
        method: "email",
        request_body: {
          to: recipientEmail,
          subject: subject,
          body: personalizedBody,
          template_id: template.id,
          account_identifier: account_identifier,
        },
        status: "sent",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to log deletion request:", insertError);
      // Email was sent, so we continue but log the error
    }

    console.log(`Deletion request logged. ID: ${deletionRequest?.id}`);

    // Send confirmation email notification
    try {
      await supabase.functions.invoke("send-deletion-notification", {
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
        email_id: emailResponse.data.id,
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
        error: "Internal server error",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
