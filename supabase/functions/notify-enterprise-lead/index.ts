import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnterpriseLeadRequest {
  name: string;
  email: string;
  company: string;
  employees?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const leadData: EnterpriseLeadRequest = await req.json();
    console.log("Received enterprise lead:", { email: leadData.email, company: leadData.company });

    // Validate required fields
    if (!leadData.name || !leadData.email || !leadData.company) {
      return new Response(
        JSON.stringify({ error: "Name, email, and company are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Save lead to database
    const { data: lead, error: dbError } = await supabase
      .from("enterprise_leads")
      .insert({
        name: leadData.name,
        email: leadData.email,
        company: leadData.company,
        employees: leadData.employees || null,
        message: leadData.message || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save lead" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Lead saved to database:", lead.id);

    // Send notification email to sales team
    const emailResponse = await resend.emails.send({
      from: "Footprint Finder <notifications@footprintfinder.com>",
      to: ["enterprise@footprintfinder.com"],
      subject: `🏢 New Enterprise Lead: ${leadData.company}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">New Enterprise Lead</h1>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Contact Details</h2>
            <p><strong>Name:</strong> ${leadData.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${leadData.email}">${leadData.email}</a></p>
            <p><strong>Company:</strong> ${leadData.company}</p>
            <p><strong>Employees:</strong> ${leadData.employees || "Not specified"}</p>
          </div>
          
          ${leadData.message ? `
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Message</h3>
            <p style="white-space: pre-wrap;">${leadData.message}</p>
          </div>
          ` : ""}
          
          <p style="color: #6b7280; font-size: 14px;">
            This lead was submitted via the enterprise page contact form.
            <br>Lead ID: ${lead.id}
          </p>
        </div>
      `,
    });

    console.log("Notification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, leadId: lead.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notify-enterprise-lead:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
