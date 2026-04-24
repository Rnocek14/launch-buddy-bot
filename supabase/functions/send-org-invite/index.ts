import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  inviteId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { inviteId } = await req.json() as InviteRequest;

    if (!inviteId) {
      throw new Error("inviteId is required");
    }

    // Fetch the invite with organization details
    const { data: invite, error: inviteError } = await supabase
      .from("organization_invites")
      .select(`
        *,
        organizations (name, slug)
      `)
      .eq("id", inviteId)
      .single();

    if (inviteError || !invite) {
      throw new Error("Invite not found");
    }

    // Get the inviter's email
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", invite.invited_by)
      .single();

    const orgName = invite.organizations?.name || "an organization";
    const inviterName = inviterProfile?.full_name || inviterProfile?.email || "A team member";
    const acceptUrl = `${supabaseUrl.replace('.supabase.co', '')}.lovable.app/organization?token=${invite.token}`;

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Footprint Finder <noreply@footprintfinder.com>",
        to: [invite.email],
        subject: `You're invited to join ${orgName} on Footprint Finder`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0;">Footprint Finder</h1>
            </div>
            
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; text-align: center; color: white; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0; font-size: 24px;">You're Invited! 🎉</h2>
              <p style="margin: 0; opacity: 0.9;">${inviterName} has invited you to join <strong>${orgName}</strong></p>
            </div>
            
            <p>Hello!</p>
            
            <p>You've been invited to join <strong>${orgName}</strong> on Footprint Finder as a <strong>${invite.role}</strong>.</p>
            
            <p>Footprint Finder helps organizations monitor and manage their team's digital footprint for better security and compliance.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" style="display: inline-block; background: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">This invitation will expire on ${new Date(invite.expires_at).toLocaleDateString()}.</p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              If you didn't expect this invitation, you can safely ignore this email.<br>
              © ${new Date().getFullYear()} Footprint Finder
            </p>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({ success: true, emailId: emailData.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending org invite:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
