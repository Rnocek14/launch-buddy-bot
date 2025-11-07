import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValidationRequest {
  email: string;
  updateDatabase?: boolean;
  contactId?: string; // For privacy_contacts
  serviceId?: string; // For service_catalog
}

interface ValidationResult {
  email: string;
  isValid: boolean;
  mxRecords: string[];
  error?: string;
  hasValidFormat: boolean;
  hasMxRecords: boolean;
}

async function validateEmailMX(email: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    email,
    isValid: false,
    mxRecords: [],
    hasValidFormat: false,
    hasMxRecords: false,
  };

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    result.error = "Invalid email format";
    return result;
  }
  result.hasValidFormat = true;

  // Extract domain
  const domain = email.split("@")[1];
  if (!domain) {
    result.error = "Could not extract domain from email";
    return result;
  }

  try {
    // Resolve MX records using Deno's DNS API
    const command = new Deno.Command("nslookup", {
      args: ["-query=mx", domain],
      stdout: "piped",
      stderr: "piped",
    });

    const { stdout, stderr } = await command.output();
    const output = new TextDecoder().decode(stdout);
    const errorOutput = new TextDecoder().decode(stderr);

    console.log(`DNS lookup for ${domain}:`, output);

    // Parse MX records from output
    const mxLines = output
      .split("\n")
      .filter(line => line.includes("mail exchanger"))
      .map(line => {
        const match = line.match(/mail exchanger = (.+)/);
        return match ? match[1].trim().replace(/\.$/, "") : null;
      })
      .filter(Boolean) as string[];

    if (mxLines.length > 0) {
      result.mxRecords = mxLines;
      result.hasMxRecords = true;
      result.isValid = true;
    } else {
      result.error = "No MX records found for domain";
    }

  } catch (error: any) {
    console.error(`Error validating MX for ${email}:`, error);
    result.error = `DNS lookup failed: ${error.message}`;
  }

  return result;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing auth header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user and verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: ValidationRequest = await req.json();
    const { email, updateDatabase, contactId, serviceId } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing required field: email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Validating email: ${email}`);

    // Perform MX validation
    const validationResult = await validateEmailMX(email);

    console.log("Validation result:", validationResult);

    // Update database if requested
    if (updateDatabase && validationResult.isValid) {
      if (contactId) {
        // Update privacy_contacts table
        const { error: updateError } = await supabase
          .from("privacy_contacts")
          .update({
            mx_validated: true,
            last_validated_at: new Date().toISOString(),
          })
          .eq("id", contactId);

        if (updateError) {
          console.error("Error updating privacy_contacts:", updateError);
        } else {
          console.log(`Updated privacy_contacts record: ${contactId}`);
        }
      }

      if (serviceId) {
        // Update service_catalog table
        const { error: updateError } = await supabase
          .from("service_catalog")
          .update({
            contact_verified: true,
          })
          .eq("id", serviceId);

        if (updateError) {
          console.error("Error updating service_catalog:", updateError);
        } else {
          console.log(`Updated service_catalog record: ${serviceId}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        validation: validationResult,
        databaseUpdated: updateDatabase && validationResult.isValid,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in validate-email-contact function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to validate email",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
