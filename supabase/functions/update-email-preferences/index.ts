import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePreferencesRequest {
  token: string;
  unsubscribed?: boolean;
  email_frequency?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { token, unsubscribed, email_frequency }: UpdatePreferencesRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify token exists
    const { data: preference, error: fetchError } = await supabase
      .from("email_preferences")
      .select("*")
      .eq("token", token)
      .single();

    if (fetchError || !preference) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Build update object
    const updates: any = {};
    if (typeof unsubscribed === "boolean") {
      updates.unsubscribed = unsubscribed;
    }
    if (email_frequency && ["weekly", "monthly", "never"].includes(email_frequency)) {
      updates.email_frequency = email_frequency;
    }

    // Update preferences
    const { data, error: updateError } = await supabase
      .from("email_preferences")
      .update(updates)
      .eq("token", token)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log(`Preferences updated for ${preference.email}:`, updates);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in update-email-preferences function:", error);
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
