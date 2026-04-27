// Resolves a Stripe Checkout session, ensures a Supabase user exists for the
// purchaser's email, and returns a magic link the success page can redirect to.
// This enables "pay first, account later" — no signup before checkout.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const { sessionId } = (await req.json()) as { sessionId?: string };
    if (!sessionId || !/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) {
      return new Response(
        JSON.stringify({ error: "Invalid sessionId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid" && session.status !== "complete") {
      return new Response(
        JSON.stringify({ error: "Payment not complete", status: session.payment_status }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email =
      session.customer_details?.email?.toLowerCase().trim() ||
      (session.metadata?.guest_email ?? "").toLowerCase().trim();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "No email on session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Ensure user exists. If not, create one (no password — they'll set it via magic link).
    let userId: string | null = null;
    try {
      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const match = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
      if (match) userId = match.id;
    } catch (err) {
      console.warn("[payment-success] listUsers warn:", err);
    }

    if (!userId) {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true, // skip email verification — they're a paying customer
        user_metadata: {
          source: "post_payment",
          stripe_customer_id: session.customer as string,
        },
      });
      if (createErr || !created.user) {
        console.error("[payment-success] createUser failed:", createErr);
        return new Response(
          JSON.stringify({ error: "Could not provision account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      userId = created.user.id;
      console.log(`[payment-success] created user ${userId} for ${email}`);
    }

    // Backfill subscription row immediately (webhook will do the same — idempotent upsert).
    if (session.subscription) {
      try {
        const sub = (await stripe.subscriptions.retrieve(session.subscription as string)) as any;
        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            tier: "pro", // webhook will refine via PRICE_ID_TO_TIER map
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: sub.id,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            deletion_count_this_period: 0,
          },
          { onConflict: "user_id" }
        );
      } catch (err) {
        console.warn("[payment-success] subscription backfill warn:", err);
      }
    }

    // Generate a magic link they can be redirected to immediately.
    const origin = req.headers.get("origin") || "https://footprintfinder.co";
    const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${origin}/dashboard?welcome=1&upgrade=success`,
      },
    });

    if (linkErr || !linkData?.properties?.action_link) {
      console.error("[payment-success] magic link error:", linkErr);
      return new Response(
        JSON.stringify({ error: "Could not generate sign-in link", email }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        email,
        userId,
        magicLink: linkData.properties.action_link,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[payment-success] error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
