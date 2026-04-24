import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  user_email: string;
  user_name: string;
  service_name: string;
  request_id: string;
  recipient_email: string;
  notification_type: "confirmation" | "completed" | "failed";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify this is an internal request using service role key
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!authHeader || !authHeader.includes(serviceRoleKey || '')) {
      console.error('Unauthorized request to send-deletion-notification');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Internal function only' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: NotificationRequest = await req.json();
    const { 
      user_email, 
      user_name, 
      service_name, 
      request_id,
      recipient_email,
      notification_type = "confirmation" 
    } = body;

    console.log(`Sending ${notification_type} notification for ${service_name} to ${user_email}`);

    let subject: string;
    let html: string;

    switch (notification_type) {
      case "confirmation":
        subject = `✅ Deletion Request Sent to ${service_name}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 16px;">Request Sent Successfully</h1>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">
              Hi ${user_name},
            </p>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">
              Your data deletion request has been sent to <strong>${service_name}</strong>.
            </p>

            <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="color: #2d3748; font-size: 14px; margin: 0 0 8px 0;"><strong>What happens next?</strong></p>
              <ul style="color: #4a5568; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Your request was sent to: <code style="background: #edf2f7; padding: 2px 6px; border-radius: 3px;">${recipient_email}</code></li>
                <li>The service typically responds within 30 days</li>
                <li>You'll receive a copy of the email sent to the service</li>
                <li>Track your request status in your <a href="https://gqxkeezkajkiyjpnjgkx.supabase.co/deletion-requests" style="color: #3b82f6;">dashboard</a></li>
              </ul>
            </div>

            <p style="color: #718096; font-size: 14px; line-height: 1.5;">
              <strong>Request ID:</strong> <code style="background: #edf2f7; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${request_id}</code>
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />

            <p style="color: #a0aec0; font-size: 12px;">
              Footprint Finder helps you take control of your digital privacy.
            </p>
          </div>
        `;
        break;

      case "completed":
        subject = `✅ Deletion Confirmed for ${service_name}`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #059669; font-size: 24px; margin-bottom: 16px;">✅ Deletion Complete</h1>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">
              Hi ${user_name},
            </p>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">
              Great news! ${service_name} has confirmed your data deletion.
            </p>

            <div style="background: #d1fae5; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #059669;">
              <p style="color: #065f46; font-size: 14px; margin: 0;">
                Your personal data has been removed from their systems.
              </p>
            </div>

            <p style="color: #718096; font-size: 14px; line-height: 1.5;">
              <strong>Request ID:</strong> <code style="background: #edf2f7; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${request_id}</code>
            </p>
          </div>
        `;
        break;

      case "failed":
        subject = `⚠️ Action Required: ${service_name} Deletion Request`;
        html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">Action May Be Required</h1>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">
              Hi ${user_name},
            </p>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.5;">
              There was an issue processing your deletion request with ${service_name}.
            </p>

            <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #dc2626;">
              <p style="color: #991b1b; font-size: 14px; margin: 0 0 8px 0;"><strong>What to do:</strong></p>
              <ul style="color: #7f1d1d; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li>Check your dashboard for more details</li>
                <li>You may need to verify your identity with the service</li>
                <li>Some services require manual deletion through their website</li>
              </ul>
            </div>

            <p style="color: #718096; font-size: 14px; line-height: 1.5;">
              <strong>Request ID:</strong> <code style="background: #edf2f7; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${request_id}</code>
            </p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown notification type: ${notification_type}`);
    }

    const emailResponse = await resend.emails.send({
      from: "Footprint Finder <onboarding@resend.dev>",
      to: [user_email],
      subject: subject,
      html: html,
    });

    if (!emailResponse.data?.id) {
      console.error("Failed to send notification email:", emailResponse.error);
      throw new Error("Failed to send notification email");
    }

    console.log(`Notification email sent successfully. ID: ${emailResponse.data.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        email_id: emailResponse.data.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-deletion-notification function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send notification",
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
