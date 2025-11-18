import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusEmailRequest {
  applicationId: string;
  status: "approved" | "rejected";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin role first
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAuth
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      console.error("Admin check failed:", roleError);
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Now use service role for the actual operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { applicationId, status }: StatusEmailRequest = await req.json();

    if (!applicationId || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Fetch application details
    const { data: application, error: fetchError } = await supabase
      .from("alpha_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      throw new Error("Application not found");
    }

    // Prepare email content based on status
    const subject = status === "approved"
      ? "🎉 Your Alpha Access Has Been Approved!"
      : "Alpha Access Application Update";

    const emailHtml = status === "approved"
      ? getApprovedEmailHtml(application.full_name)
      : getRejectedEmailHtml(application.full_name);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Footprint Finder <onboarding@resend.dev>",
      to: [application.email],
      subject,
      html: emailHtml,
    });

    if (emailResponse.error) {
      throw emailResponse.error;
    }

    console.log(`Status email sent to ${application.email}:`, emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-alpha-status-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function getApprovedEmailHtml(fullName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .header p {
            margin: 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 0 20px;
          }
          h2 {
            color: #667eea;
            font-size: 20px;
            margin-top: 30px;
          }
          .steps {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .steps ol {
            margin: 10px 0;
            padding-left: 20px;
          }
          .steps li {
            margin: 10px 0;
          }
          .cta {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            transition: background 0.3s;
          }
          .cta-button:hover {
            background: #764ba2;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to Footprint Finder Alpha!</h1>
          <p>Your application has been approved</p>
        </div>
        
        <div class="content">
          <p>Hi ${fullName},</p>
          
          <p>Great news! Your application for alpha access to Footprint Finder has been <strong>approved</strong>.</p>
          
          <p>You're now part of an exclusive group helping shape the future of digital privacy tools.</p>
          
          <h2>What's Next?</h2>
          <div class="steps">
            <ol>
              <li><strong>Check your inbox</strong> for your alpha access credentials (coming soon)</li>
              <li><strong>Join our alpha testers community</strong> for updates and feedback</li>
              <li><strong>Start testing</strong> features as we roll them out</li>
              <li><strong>Share your feedback</strong> to help us improve</li>
            </ol>
          </div>
          
          <h2>What to Expect</h2>
          <p>As an alpha tester, you'll get:</p>
          <ul>
            <li>✅ Early access to all new features</li>
            <li>🎯 Direct line to our product team</li>
            <li>💬 Exclusive community access</li>
            <li>🚀 Lifetime priority support</li>
          </ul>
          
          <div class="cta">
            <a href="#" class="cta-button">Access Alpha Dashboard</a>
          </div>
          
          <p>We're thrilled to have you onboard. Your feedback will directly shape Footprint Finder's development.</p>
          
          <p>If you have any questions, just reply to this email.</p>
          
          <p>Stay safe,<br>
          <strong>— The Footprint Finder Team</strong></p>
        </div>
        
        <div class="footer">
          <p>You're receiving this because your alpha access application was approved.</p>
        </div>
      </body>
    </html>
  `;
}

function getRejectedEmailHtml(fullName: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 30px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .content {
            padding: 0 20px;
          }
          .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .cta {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Alpha Access Application Update</h1>
        </div>
        
        <div class="content">
          <p>Hi ${fullName},</p>
          
          <p>Thank you for your interest in becoming an alpha tester for Footprint Finder.</p>
          
          <p>After careful review, we've decided not to move forward with your application at this time. We received an overwhelming number of applications and had to make some difficult choices based on our current testing priorities.</p>
          
          <div class="info-box">
            <strong>This isn't the end!</strong> We'll be opening up beta access soon, and you'll automatically be on the list. You'll also still receive all our waitlist updates about the public launch.
          </div>
          
          <p>We truly appreciate your enthusiasm for privacy tools and your willingness to help us build something better.</p>
          
          <div class="cta">
            <a href="#" class="cta-button">Join Our Waitlist</a>
          </div>
          
          <p>Thank you for your understanding and continued support.</p>
          
          <p>Stay safe,<br>
          <strong>— The Footprint Finder Team</strong></p>
        </div>
        
        <div class="footer">
          <p>You're receiving this because you applied for alpha access.</p>
        </div>
      </body>
    </html>
  `;
}

serve(handler);
