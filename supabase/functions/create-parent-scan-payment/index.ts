import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Hard-coded one-time Parent Protection Scan price.
const PARENT_SCAN_PRICE_ID = "price_1TPSshPqV14jS5m4e5KpiA6o";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Optional auth: if present, attach the customer email; otherwise guest checkout.
    let customerEmail: string | undefined;
    let supabaseUserId: string | undefined;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data } = await supabase.auth.getUser();
      if (data.user?.email) {
        customerEmail = data.user.email;
        supabaseUserId = data.user.id;
      }
    }

    // Optional: parent's email passed from the form, plus affiliate code from referral.
    let parentEmail: string | undefined;
    let affiliateCode: string | undefined;
    try {
      const body = await req.json();
      if (body?.parentEmail && typeof body.parentEmail === "string") {
        parentEmail = body.parentEmail.slice(0, 320);
      }
      if (body?.affiliateCode && typeof body.affiliateCode === "string"
          && /^[A-Z0-9]{4,16}$/.test(body.affiliateCode)) {
        const svc = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        const { data: aff } = await svc
          .from("affiliates")
          .select("code")
          .eq("code", body.affiliateCode)
          .eq("status", "approved")
          .maybeSingle();
        if (aff) affiliateCode = aff.code;
      }
    } catch {
      // No body — fine.
    }

    let customerId: string | undefined;
    if (customerEmail) {
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://footprintfinder.co";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [{ price: PARENT_SCAN_PRICE_ID, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/parents?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/parents?purchase=cancelled`,
      metadata: {
        product: "parent_protection_scan",
        supabase_user_id: supabaseUserId ?? "",
        parent_email: parentEmail ?? "",
        ...(affiliateCode ? { affiliate_code: affiliateCode } : {}),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[create-parent-scan-payment]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
