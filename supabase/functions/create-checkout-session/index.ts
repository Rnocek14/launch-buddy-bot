import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Detects the Stripe key mode from its prefix (never logs the key itself).
function stripeKeyMode(): "live" | "test" | "unknown" {
  const k = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  if (k.startsWith("sk_live_")) return "live";
  if (k.startsWith("sk_test_")) return "test";
  return "unknown";
}

// Turns Stripe "No such price" / resource_missing errors into an actionable message.
function friendlyStripeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string } | null)?.code;
  if (code === "resource_missing" || /no such (price|product|customer)/i.test(msg)) {
    const mode = stripeKeyMode();
    if (mode === "test") {
      return `Checkout failed: Stripe is in TEST mode but the app's price IDs are LIVE. Deploy a live-mode secret key (sk_live_...) and a matching live webhook secret. (Stripe: ${msg})`;
    }
    if (mode === "unknown") {
      return `Checkout failed: STRIPE_SECRET_KEY is missing or malformed. Set a live-mode secret key (sk_live_...) and a matching live webhook secret. (Stripe: ${msg})`;
    }
    return `Checkout failed: the configured price was not found in your Stripe LIVE account. Confirm the price IDs in src/config/pricing.ts exist and are active in the live dashboard. (Stripe: ${msg})`;
  }
  return msg;
}

interface CheckoutRequest {
  priceId: string;
  affiliateCode?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting checkout session creation");

    // Verify Stripe key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    console.log(`Creating checkout for user: ${user.id}, email: ${user.email}`);

    // Parse request body
    const { priceId, affiliateCode }: CheckoutRequest = await req.json();
    if (!priceId) {
      throw new Error("Missing required field: priceId");
    }

    console.log(`Using price ID: ${priceId}${affiliateCode ? `, affiliate: ${affiliateCode}` : ""}`);

    // Validate affiliate code if provided
    let validAffiliateCode: string | undefined;
    if (affiliateCode && /^[A-Z0-9]{4,16}$/.test(affiliateCode)) {
      const supabaseService = createClient(
        supabaseUrl,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      const { data: aff } = await supabaseService
        .from("affiliates")
        .select("code")
        .eq("code", affiliateCode)
        .eq("status", "approved")
        .maybeSingle();
      if (aff) validAffiliateCode = aff.code;
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      console.log(`Found existing customer: ${customerId}`);
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log(`Created new customer: ${customerId}`);
    }

    // Create checkout session
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard?upgrade=success`,
      cancel_url: `${origin}/pricing?upgrade=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        ...(validAffiliateCode ? { affiliate_code: validAffiliateCode } : {}),
      },
      subscription_data: validAffiliateCode
        ? { metadata: { affiliate_code: validAffiliateCode, supabase_user_id: user.id } }
        : { metadata: { supabase_user_id: user.id } },
    });

    console.log(`Checkout session created: ${session.id}`);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = friendlyStripeError(error);
    console.error("Error in create-checkout-session:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
