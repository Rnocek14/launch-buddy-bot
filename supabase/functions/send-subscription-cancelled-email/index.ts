import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    console.log("Sending subscription cancelled email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Footprint Finder <onboarding@resend.dev>",
      to: [email],
      subject: "Your Pro subscription has been cancelled",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background: #f9fafb;
              }
              .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .header {
                text-align: center;
                padding-bottom: 30px;
                border-bottom: 2px solid #f0f0f0;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #1e1b4b;
              }
              h1 {
                color: #1e1b4b;
                font-size: 24px;
                margin: 30px 0 20px 0;
              }
              .info-box {
                background: #fffbeb;
                border: 1px solid #fde68a;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .info-box strong {
                color: #92400e;
              }
              .feature-list {
                margin: 20px 0;
              }
              .feature-item {
                padding: 10px 0;
                border-bottom: 1px solid #f0f0f0;
              }
              .feature-item:last-child {
                border-bottom: none;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #1e1b4b, #a855f7);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px auto;
                display: block;
                text-align: center;
                max-width: 200px;
              }
              .secondary-button {
                display: inline-block;
                background: white;
                color: #1e1b4b;
                border: 2px solid #1e1b4b;
                padding: 12px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 10px auto;
                display: block;
                text-align: center;
                max-width: 200px;
              }
              .footer {
                text-align: center;
                padding-top: 30px;
                border-top: 2px solid #f0f0f0;
                color: #666;
                font-size: 14px;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🔒 Footprint Finder</div>
              </div>
              
              <h1>Your Pro subscription has been cancelled</h1>
              
              <p>We're sorry to see you go! Your Pro subscription has been cancelled and you've been moved to our Free plan.</p>

              <div class="info-box">
                <strong>What happens now?</strong><br><br>
                You'll continue to have access to Footprint Finder with our Free plan features:
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>3 deletion requests per month</li>
                  <li>Email scanning and discovery</li>
                  <li>Service catalog access</li>
                  <li>Basic support</li>
                </ul>
              </div>

              <p style="margin-top: 30px;"><strong>We'd love to hear from you</strong></p>
              <p style="color: #666;">
                Your feedback helps us improve. Would you mind sharing why you cancelled? 
                It only takes a minute and helps us serve you better.
              </p>

              <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://app.footprintfinder.com'}/help" class="secondary-button">
                Share Feedback
              </a>

              <p style="margin-top: 40px; text-align: center; color: #666;">
                Changed your mind? You can resubscribe anytime.
              </p>

              <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://app.footprintfinder.com'}/billing" class="cta-button">
                Resubscribe to Pro
              </a>

              <div class="footer">
                <p>Need help? We're here for you.</p>
                <p style="margin-top: 10px;">
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://app.footprintfinder.com'}/help" style="color: #a855f7; text-decoration: none;">Contact Support</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Subscription cancelled email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-subscription-cancelled-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
