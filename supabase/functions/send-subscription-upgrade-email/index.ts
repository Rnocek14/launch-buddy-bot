import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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
    const { email, tier, billingDate } = await req.json();

    console.log("Sending subscription upgrade email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Footprint Finder <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Footprint Finder Pro! 🎉",
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
              .celebration {
                font-size: 48px;
                text-align: center;
                margin: 20px 0;
              }
              h1 {
                color: #1e1b4b;
                font-size: 28px;
                text-align: center;
                margin: 20px 0;
              }
              .highlight {
                background: linear-gradient(135deg, #1e1b4b, #a855f7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: bold;
              }
              .benefits {
                margin: 30px 0;
              }
              .benefit {
                background: #f9fafb;
                border-left: 4px solid #a855f7;
                padding: 15px;
                margin: 15px 0;
                border-radius: 4px;
              }
              .benefit-title {
                font-weight: 600;
                color: #1e1b4b;
                margin-bottom: 5px;
                display: flex;
                align-items: center;
              }
              .check {
                color: #10b981;
                margin-right: 8px;
                font-size: 20px;
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
                max-width: 250px;
              }
              .billing-info {
                background: #eff6ff;
                border: 1px solid #dbeafe;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
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
              
              <div class="celebration">🎉</div>
              
              <h1>Welcome to <span class="highlight">Pro</span>!</h1>
              
              <p style="text-align: center; font-size: 16px; color: #666; margin-bottom: 30px;">
                Thank you for upgrading! You now have access to all Pro features.
              </p>

              <div class="benefits">
                <div class="benefit">
                  <div class="benefit-title">
                    <span class="check">✓</span> Unlimited Deletion Requests
                  </div>
                  <div style="color: #666;">Send as many deletion requests as you need, without limits.</div>
                </div>
                
                <div class="benefit">
                  <div class="benefit-title">
                    <span class="check">✓</span> Priority Support
                  </div>
                  <div style="color: #666;">Get help faster with dedicated priority support.</div>
                </div>
                
                <div class="benefit">
                  <div class="benefit-title">
                    <span class="check">✓</span> Advanced Analytics
                  </div>
                  <div style="color: #666;">Track your digital footprint with detailed insights.</div>
                </div>
                
                <div class="benefit">
                  <div class="benefit-title">
                    <span class="check">✓</span> Bulk Actions
                  </div>
                  <div style="color: #666;">Process multiple services at once to save time.</div>
                </div>
              </div>

              <div class="billing-info">
                <strong style="color: #1e1b4b;">Billing Details</strong><br>
                <div style="margin-top: 10px; color: #666;">
                  Plan: <strong>${tier}</strong><br>
                  ${billingDate ? `Next billing date: <strong>${new Date(billingDate).toLocaleDateString()}</strong>` : ''}
                </div>
              </div>

              <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://app.footprintfinder.com'}/dashboard" class="cta-button">
                Go to Dashboard
              </a>

              <p style="text-align: center; color: #666; margin-top: 30px;">
                Need to manage your subscription? Visit your 
                <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://app.footprintfinder.com'}/billing" style="color: #a855f7;">billing settings</a>.
              </p>

              <div class="footer">
                <p>Questions? We're here to help!</p>
                <p style="margin-top: 10px;">
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://app.footprintfinder.com'}/help" style="color: #a855f7; text-decoration: none;">Contact Support</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Subscription upgrade email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-subscription-upgrade-email:", error);
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
