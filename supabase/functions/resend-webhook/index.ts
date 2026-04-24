import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resendWebhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    click?: {
      link: string;
      ipAddress: string;
      userAgent: string;
    };
    open?: {
      ipAddress: string;
      userAgent: string;
    };
    bounce?: {
      bounceType: string;
    };
    complaint?: {
      complaintType: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify webhook signature if secret is configured
    if (resendWebhookSecret) {
      const payload = await req.text();
      const headers = Object.fromEntries(req.headers);
      
      const wh = new Webhook(resendWebhookSecret);
      try {
        wh.verify(payload, headers);
      } catch (error) {
        console.error("Webhook verification failed:", error);
        return new Response(
          JSON.stringify({ error: "Webhook verification failed" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
      
      // Parse the verified payload
      const event: ResendWebhookEvent = JSON.parse(payload);
      await processWebhookEvent(supabase, event);
    } else {
      // If no secret is configured, process without verification (development only)
      const event: ResendWebhookEvent = await req.json();
      await processWebhookEvent(supabase, event);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in resend-webhook function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function processWebhookEvent(
  supabase: any,
  event: ResendWebhookEvent
): Promise<void> {
  const { type, data } = event;
  
  // Map Resend event types to our event types
  const eventTypeMap: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.delivery_delayed": "delivery_delayed",
    "email.complained": "complained",
    "email.bounced": "bounced",
    "email.opened": "opened",
    "email.clicked": "clicked",
  };

  const eventType = eventTypeMap[type];
  if (!eventType) {
    console.log(`Ignoring unknown event type: ${type}`);
    return;
  }

  // Get the primary recipient
  const emailAddress = data.to[0] || "";

  // Build the analytics record
  const analyticsRecord: any = {
    email_id: data.email_id,
    email_address: emailAddress,
    event_type: eventType,
    email_subject: data.subject,
    metadata: { from: data.from, all_recipients: data.to },
  };

  // Add event-specific data
  if (eventType === "clicked" && data.click) {
    analyticsRecord.link_url = data.click.link;
    analyticsRecord.ip_address = data.click.ipAddress;
    analyticsRecord.user_agent = data.click.userAgent;
  } else if (eventType === "opened" && data.open) {
    analyticsRecord.ip_address = data.open.ipAddress;
    analyticsRecord.user_agent = data.open.userAgent;
  } else if (eventType === "bounced" && data.bounce) {
    analyticsRecord.metadata = {
      ...analyticsRecord.metadata,
      bounce_type: data.bounce.bounceType,
    };
  } else if (eventType === "complained" && data.complaint) {
    analyticsRecord.metadata = {
      ...analyticsRecord.metadata,
      complaint_type: data.complaint.complaintType,
    };
  }

  // Insert into database
  const { error } = await supabase
    .from("email_analytics")
    .insert(analyticsRecord);

  if (error) {
    console.error("Failed to insert analytics record:", error);
    throw error;
  }

  console.log(`Processed ${eventType} event for ${emailAddress}`);
}

serve(handler);
