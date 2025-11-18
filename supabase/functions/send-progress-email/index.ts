import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProgressEmailRequest {
  email?: string; // Optional: send to specific email, otherwise send to all
  testMode?: boolean; // If true, only sends to the provided email
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

    const { email, testMode }: ProgressEmailRequest = await req.json();

    let emailsToSend: string[] = [];

    if (email) {
      // Send to specific email
      emailsToSend = [email];
    } else if (!testMode) {
      // Fetch all waitlist emails that haven't unsubscribed
      const { data: waitlist, error: waitlistError } = await supabase
        .from("waitlist")
        .select("email");

      if (waitlistError) {
        throw new Error(`Failed to fetch waitlist: ${waitlistError.message}`);
      }

      // Filter out unsubscribed users
      const { data: preferences, error: prefError } = await supabase
        .from("email_preferences")
        .select("email, unsubscribed")
        .eq("unsubscribed", true);

      if (prefError) {
        console.error("Failed to fetch preferences:", prefError);
      }

      const unsubscribedEmails = new Set(preferences?.map(p => p.email) || []);
      emailsToSend = waitlist
        ?.map((entry) => entry.email)
        .filter(email => !unsubscribedEmails.has(email)) || [];
    } else {
      throw new Error("Either provide an email or set testMode to false");
    }

    const results = [];

    for (const recipientEmail of emailsToSend) {
      // Get or create preference token for this email
      let token: string;
      const { data: existingPref } = await supabase
        .from("email_preferences")
        .select("token")
        .eq("email", recipientEmail)
        .single();

      if (existingPref) {
        token = existingPref.token;
      } else {
        // Create new preference record
        const { data: newPref, error: insertError } = await supabase
          .from("email_preferences")
          .insert({ email: recipientEmail })
          .select("token")
          .single();

        if (insertError || !newPref) {
          console.error(`Failed to create preferences for ${recipientEmail}:`, insertError);
          continue;
        }
        token = newPref.token;
      }

      const baseUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "";
      const preferencesUrl = `${baseUrl}/preferences?token=${token}`;
      const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${token}`;

      const emailResponse = await resend.emails.send({
        from: "Footprint Finder <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: "🔍 Here's What We're Building at Footprint Finder",
        html: `
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
                  font-size: 20px;
                }
                .header p {
                  margin: 0;
                  font-size: 14px;
                  opacity: 0.9;
                }
                .content {
                  padding: 0 20px;
                }
                h2 {
                  color: #667eea;
                  font-size: 18px;
                  margin-top: 30px;
                }
                .feature-list {
                  margin: 20px 0;
                }
                .feature-list li {
                  margin: 10px 0;
                  padding-left: 5px;
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
                .footer a {
                  color: #667eea;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Thank you for joining 500+ privacy-first users</h1>
                <p>We're building something that gives <em>you</em> control again.</p>
              </div>
              
              <div class="content">
                <p>Hi there,</p>
                
                <p>You signed up for Footprint Finder a week ago—and we wanted to say thank you.</p>
                
                <p>Our mission is simple:<br>
                <strong>Help you discover where your personal data lives online—and guide you in taking it back.</strong></p>
                
                <h2>Here's what we've built so far:</h2>
                <ul class="feature-list">
                  <li>✅ <strong>Email scanner</strong> that identifies services holding your data</li>
                  <li>✅ <strong>Privacy Score dashboard</strong> to measure digital exposure</li>
                  <li>✅ <strong>Pre-written GDPR/CCPA deletion templates</strong> for faster cleanup</li>
                  <li>✅ <strong>Live waitlist</strong> now over 500 strong (and growing!)</li>
                </ul>
                
                <h2>We're currently working on:</h2>
                <ul class="feature-list">
                  <li>🛠️ Step-by-step deletion guides</li>
                  <li>📥 Reverse image search for public photos</li>
                  <li>📊 Exportable footprint report</li>
                </ul>
                
                <p>You'll be the <strong>first to try</strong> all of this as we launch each feature.</p>
                
                <div class="cta">
                  <a href="#" class="cta-button">👉 See the Roadmap</a>
                </div>
                
                <p><strong>Thanks for being early.</strong> We believe privacy isn't dead—it just needs better tools.<br>
                You'll hear from us again when we launch the private beta (soon 👀).</p>
                
                <p>Stay safe,<br>
                <strong>— The Footprint Finder Team</strong></p>
              </div>
              
              <div class="footer">
                <p>You're receiving this because you joined our waitlist.</p>
                <p>Want fewer emails? <a href="${preferencesUrl}">Manage preferences</a> | <a href="${unsubscribeUrl}">Unsubscribe</a></p>
              </div>
            </body>
          </html>
        `,
      });

      results.push({
        email: recipientEmail,
        success: !emailResponse.error,
        error: emailResponse.error?.message,
      });

      console.log(`Progress email sent to ${recipientEmail}:`, emailResponse);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        details: results,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-progress-email function:", error);
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
