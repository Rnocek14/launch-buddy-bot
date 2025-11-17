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
    const { email, attemptCount, nextRetry } = await req.json();

    console.log("Sending payment failed email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Footprint Finder <onboarding@resend.dev>",
      to: [email],
      subject: "Action Required: Payment Failed",
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
              .alert-icon {
                font-size: 48px;
                text-align: center;
                margin: 20px 0;
              }
              h1 {
                color: #dc2626;
                font-size: 24px;
                margin: 20px 0;
                text-align: center;
              }
              .alert-box {
                background: #fef2f2;
                border: 2px solid #fecaca;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .alert-box strong {
                color: #991b1b;
              }
              .info-box {
                background: #eff6ff;
                border: 1px solid #dbeafe;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .steps {
                margin: 20px 0;
              }
              .step {
                padding: 15px;
                margin: 10px 0;
                background: #f9fafb;
                border-left: 4px solid #a855f7;
                border-radius: 4px;
              }
              .step-number {
                display: inline-block;
                background: #a855f7;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                text-align: center;
                line-height: 24px;
                margin-right: 10px;
                font-weight: bold;
              }
              .cta-button {
                display: inline-block;
                background: #dc2626;
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
              
              <div class="alert-icon">⚠️</div>
              
              <h1>Payment Failed</h1>
              
              <p style="text-align: center; color: #666;">
                We were unable to process your payment for Footprint Finder Pro.
              </p>

              <div class="alert-box">
                <strong>Action Required</strong><br><br>
                Please update your payment method to continue enjoying Pro features.
                ${nextRetry ? `We'll automatically retry on <strong>${new Date(nextRetry).toLocaleDateString()}</strong>.` : ''}
              </div>

              <div class="steps">
                <div class="step">
                  <span class="step-number">1</span>
                  <strong>Check your payment method</strong><br>
                  <span style="color: #666;">Verify your card details, expiration date, and billing address.</span>
                </div>
                
                <div class="step">
                  <span class="step-number">2</span>
                  <strong>Update payment information</strong><br>
                  <span style="color: #666;">Click the button below to update your payment method securely.</span>
                </div>
                
                <div class="step">
                  <span class="step-number">3</span>
                  <strong>Contact your bank if needed</strong><br>
                  <span style="color: #666;">Sometimes banks decline legitimate charges. Contact them to approve the payment.</span>
                </div>
              </div>

              <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://app.footprintfinder.com'}/billing" class="cta-button">
                Update Payment Method
              </a>

              <div class="info-box">
                <strong>What happens if payment isn't updated?</strong><br><br>
                If we can't process payment after several attempts, your account will be downgraded to the Free plan. 
                You'll lose access to unlimited deletion requests and other Pro features.
              </div>

              <div class="footer">
                <p>Having trouble? We're here to help!</p>
                <p style="margin-top: 10px;">
                  <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app') || 'https://app.footprintfinder.com'}/help" style="color: #a855f7; text-decoration: none;">Contact Support</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Payment failed email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-payment-failed-email:", error);
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
