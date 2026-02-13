import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-email-secret",
};

const emailSchema = z.object({
  email: z.string().email().max(255),
});

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify internal secret - this endpoint should only be called from database triggers
    const expectedSecret = Deno.env.get("EMAIL_SECRET");
    const receivedSecret = req.headers.get("x-email-secret");

    if (!expectedSecret || receivedSecret !== expectedSecret) {
      console.error("Invalid or missing email secret");
      return new Response(
        JSON.stringify({ error: "Forbidden: Invalid secret" }),
        { 
          status: 403, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Validate and parse request body
    const body = await req.json();
    const { email } = emailSchema.parse(body);

    // Lazy-create email_preferences row so token exists for unsubscribe
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: existingPref } = await supabase
      .from("email_preferences")
      .select("token")
      .eq("email", email)
      .maybeSingle();

    let token: string;
    if (existingPref) {
      token = existingPref.token;
    } else {
      // Idempotent upsert to avoid race conditions
      const { data: newPref } = await supabase
        .from("email_preferences")
        .upsert({ email }, { onConflict: "email" })
        .select("token")
        .single();
      token = newPref?.token || "";
    }

    const appBaseUrl = Deno.env.get("APP_BASE_URL") || "https://launch-buddy-bot.lovable.app";
    const unsubscribeUrl = `${appBaseUrl}/unsubscribe?token=${token}`;
    const preferencesUrl = `${appBaseUrl}/preferences?token=${token}`;

    console.log("Sending welcome email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Footprint Finder <onboarding@resend.dev>",
      to: [email],
      subject: "You're on the waitlist! 🔒",
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
              }
              .header {
                text-align: center;
                padding: 30px 0;
                border-bottom: 2px solid #f0f0f0;
              }
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #1e1b4b;
              }
              .content {
                padding: 30px 0;
              }
              h1 {
                color: #1e1b4b;
                font-size: 28px;
                margin-bottom: 20px;
              }
              .highlight {
                background: linear-gradient(135deg, #1e1b4b, #a855f7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: bold;
              }
              .feature-box {
                background: #f9fafb;
                border-left: 4px solid #a855f7;
                padding: 15px;
                margin: 20px 0;
              }
              .feature-title {
                font-weight: 600;
                color: #1e1b4b;
                margin-bottom: 5px;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #1e1b4b, #a855f7);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
              }
              .footer {
                text-align: center;
                padding: 30px 0;
                border-top: 2px solid #f0f0f0;
                color: #666;
                font-size: 14px;
              }
              .privacy-badge {
                display: inline-block;
                background: #ecfdf5;
                color: #065f46;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 13px;
                margin: 5px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">🔒 Footprint Finder</div>
            </div>
            
            <div class="content">
              <h1>Welcome to the Privacy Revolution!</h1>
              
              <p>You're officially on the waitlist for <span class="highlight">Footprint Finder</span> — the smartest way to discover and delete your digital footprint.</p>
              
              <p>Here's what you can expect when we launch:</p>
              
              <div class="feature-box">
                <div class="feature-title">🔍 Smart Discovery</div>
                <p style="margin: 5px 0; color: #666;">Scan your Gmail and browser history to find every service you've ever signed up for. No more guessing where your data lives.</p>
              </div>
              
              <div class="feature-box">
                <div class="feature-title">📋 Guided Deletion</div>
                <p style="margin: 5px 0; color: #666;">Get service-specific templates and step-by-step guides to request account deletions in minutes, not hours.</p>
              </div>
              
              <div class="feature-box">
                <div class="feature-title">📊 Progress Dashboard</div>
                <p style="margin: 5px 0; color: #666;">Track your cleanup journey with visual insights. See what's done, what's pending, and celebrate your progress.</p>
              </div>
              
              <p style="margin-top: 30px;">We're building this with <strong>privacy-first principles</strong>:</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <span class="privacy-badge">✓ Secure Server-Side Scanning</span>
                <span class="privacy-badge">✓ Read-Only OAuth Access</span>
                <span class="privacy-badge">✓ No Email Content Stored</span>
              </div>
              
              <p>Your email content is never stored. We only read metadata (headers, sender info) via secure OAuth, and you can revoke access at any time.</p>
              
              <p style="margin-top: 30px;"><strong>What's next?</strong></p>
              <ul>
                <li>We'll keep you updated with sneak peeks and launch timing</li>
                <li>You'll get early access before the public launch</li>
                <li>We'll share privacy tips and digital cleanup guides along the way</li>
              </ul>
              
              <p>Thank you for trusting us with your privacy journey. Together, we're taking control back.</p>
              
              <p style="margin-top: 30px;">
                — The Footprint Finder Team
              </p>
            </div>
            
            <div class="footer">
              <p>You're receiving this because you joined the Footprint Finder waitlist.</p>
              <p style="margin-top: 10px;">
                <a href="${preferencesUrl}" style="color: #667eea; text-decoration: none;">Manage preferences</a> | 
                <a href="${unsubscribeUrl}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
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
