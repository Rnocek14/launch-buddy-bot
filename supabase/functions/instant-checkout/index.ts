// Guest-friendly Stripe checkout — no auth required.
// Accepts an email + priceId, returns a Stripe Checkout URL.
// Account creation happens AFTER payment via the webhook + /payment-success magic link.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InstantCheckoutRequest {
  email: string;
  priceId: string;
  affiliateCode?: string;
  source?: string; // e.g. "free_scan", "iceberg_panel" — for analytics
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRICE_RE = /^price_[A-Za-z0-9]+$/;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const body = (await req.json()) as InstantCheckoutRequest;
    const email = (body.email || "").toLowerCase().trim();
    const priceId = (body.priceId || "").trim();

    if (!EMAIL_RE.test(email)) {
      return new Response(
        JSON.stringify({ error: "Valid email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!PRICE_RE.test(priceId)) {
      return new Response(
        JSON.stringify({ error: "Invalid priceId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[instant-checkout] start email=${email} price=${priceId} src=${body.source ?? "n/a"}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Validate affiliate code (optional)
    let validAffiliateCode: string | undefined;
    if (body.affiliateCode && /^[A-Z0-9]{4,16}$/.test(body.affiliateCode)) {
      const { data: aff } = await supabaseService
        .from("affiliates")
        .select("code")
        .eq("code", body.affiliateCode)
        .eq("status", "approved")
        .maybeSingle();
      if (aff) validAffiliateCode = aff.code;
    }

    // Try to find existing Supabase user by email — if they're already a user,
    // we attach their existing user_id to metadata so the webhook can link the sub.
    // If not, the webhook will create one post-payment.
    let existingUserId: string | null = null;
    try {
      const { data: list } = await supabaseService.auth.admin.listUsers({ page: 1, perPage: 200 });
      const match = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
      if (match) existingUserId = match.id;
    } catch (err) {
      console.warn("[instant-checkout] listUsers failed, continuing as guest", err);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Reuse existing customer if one exists for this email
    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: existingUserId ? { supabase_user_id: existingUserId } : {},
      });
      customerId = customer.id;
    }

    const origin = req.headers.get("origin") || "https://footprintfinder.co";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      // Pass session_id so the success page can resolve the user + magic link.
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/free-scan?checkout=cancelled`,
      // Allow promotion codes (optional but easy)
      allow_promotion_codes: true,
      // Stripe Link is enabled by default on Checkout — speeds up returning buyers to ~1 tap.
      // Apple/Google Pay show automatically when configured in the Stripe dashboard.
      metadata: {
        ...(existingUserId ? { supabase_user_id: existingUserId } : {}),
        guest_email: email,
        source: body.source ?? "instant_checkout",
        ...(validAffiliateCode ? { affiliate_code: validAffiliateCode } : {}),
      },
      subscription_data: {
        metadata: {
          ...(existingUserId ? { supabase_user_id: existingUserId } : {}),
          guest_email: email,
          ...(validAffiliateCode ? { affiliate_code: validAffiliateCode } : {}),
        },
      },
    });

    console.log(`[instant-checkout] session=${session.id} userExisted=${!!existingUserId}`);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[instant-checkout] error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
