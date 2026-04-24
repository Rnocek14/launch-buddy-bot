import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map Stripe price IDs to tiers
const PRICE_ID_TO_TIER: Record<string, string> = {
  // Legacy test prices (grandfathered users from sandbox era)
  "price_1SUqvlPwo7CiaABewIGGxC79": "pro",
  "price_1SUW44Pwo7CiaABeCXvND0Qj": "pro",
  "price_1Smd2JPwo7CiaABexEEYZMFn": "pro",
  "price_1Smd2KPwo7CiaABeBeqI5MAG": "pro",
  "price_1Smd2MPwo7CiaABemCv3b6Lj": "complete",
  "price_1Smd2NPwo7CiaABeyV6KFls0": "complete",
  "price_1TP42pPwo7CiaABejT1heX0l": "family",
  // LIVE prices (current Stripe account)
  "price_1TPSsbPqV14jS5m4p1Z7POVT": "pro",      // Pro Annual $79
  "price_1TPSsaPqV14jS5m4R73DhbOw": "pro",      // Pro Monthly $12.99
  "price_1TPSsePqV14jS5m42IQMTKiU": "complete", // Complete Annual $129
  "price_1TPSsdPqV14jS5m4vx0A5XZJ": "complete", // Complete Monthly $19.99
  "price_1TPSsfPqV14jS5m4vegF6HJi": "family",   // Family Annual $179
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Auth check first (before any Stripe requirements)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (userError || !user?.email) throw new Error(`Authentication error: ${userError?.message || 'Invalid token'}`);

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check for manual override FIRST - before requiring Stripe key
    // This allows override accounts to work even in environments without Stripe configured
    const { data: existingSub, error: existingSubErr } = await supabaseClient
      .from('subscriptions')
      .select('tier, manual_override, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle(); // ✅ Safe: doesn't throw on missing row

    // ✅ Fail closed on real DB errors - billing/auth gating requires certainty
    if (existingSubErr) {
      logStep("Error fetching existing subscription - failing closed", { error: existingSubErr });
      throw new Error(`Database error checking subscription: ${existingSubErr.message}`);
    }

    // ✅ Strict equality check - only true, not truthy
    if (existingSub?.manual_override === true) {
      logStep("Manual override active, using database tier", { 
        tier: existingSub.tier,
        userId: user.id 
      });
      return new Response(JSON.stringify({
        subscribed: existingSub.tier !== 'free',
        tier: existingSub.tier,
        subscription_end: existingSub.current_period_end,
        manual_override: true
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Only now require Stripe key (after override check)
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, ensuring free subscription exists");
      
      // ✅ FIX: Replace unsafe upsert with update-then-insert pattern
      // Try update first; never touch override accounts
      const { data: updatedRows, error: updateErr } = await supabaseClient
        .from('subscriptions')
        .update({
          tier: 'free',
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .neq('manual_override', true)
        .select('user_id'); // ✅ Lets us see if anything was updated

      if (updateErr) {
        logStep("Error updating free subscription", { error: updateErr });
      }

      // If no row exists (not just override blocking update), insert
      if (!updatedRows?.length && !existingSub) {
        const { error: insertErr } = await supabaseClient
          .from('subscriptions')
          .insert({
            user_id: user.id,
            tier: 'free',
            status: 'active',
            manual_override: false,
            updated_at: new Date().toISOString(),
          });

        if (insertErr) {
          logStep("Error inserting free subscription", { error: insertErr });
        }
      }

      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: 'free',
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let tier = 'free';
    let subscriptionEnd = null;
    let stripeSubscriptionId = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      stripeSubscriptionId = subscription.id;
      
      // Determine tier from price ID
      const priceId = subscription.items.data[0]?.price?.id;
      tier = PRICE_ID_TO_TIER[priceId] || 'pro'; // Default to pro for unknown prices
      
      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        endDate: subscriptionEnd,
        priceId,
        tier 
      });

      // ✅ Use UPDATE with .select() to verify rows updated
      const { data: updatedRows, error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          tier: tier,
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: stripeSubscriptionId,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: subscriptionEnd,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .neq('manual_override', true) // ✅ Never overwrite override accounts
        .select('user_id');

      if (updateError) {
        logStep("Error updating subscription", { error: updateError });
      }

      // ✅ Insert only if no rows updated AND no existing row
      if (!updatedRows?.length && !existingSub) {
        logStep("No row updated, inserting new subscription");
        const { error: insertError } = await supabaseClient
          .from('subscriptions')
          .insert({
            user_id: user.id,
            tier: tier,
            status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: stripeSubscriptionId,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: subscriptionEnd,
            manual_override: false // Explicit: new Stripe-synced accounts are not overridden
          });
        
        if (insertError) {
          logStep("Error inserting subscription", { error: insertError });
        }
      }
    } else {
      logStep("No active subscription found");
      
      // ✅ Use UPDATE with .select() to verify rows updated
      const { data: updatedRows, error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({
          tier: 'free',
          status: 'active',
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .neq('manual_override', true) // ✅ Never overwrite override accounts
        .select('user_id');

      if (updateError) {
        logStep("Error updating to free tier", { error: updateError });
      }
      
      // ✅ Insert only if no rows updated AND no existing row
      if (!updatedRows?.length && !existingSub) {
        logStep("No row updated, inserting free subscription");
        const { error: insertError } = await supabaseClient
          .from('subscriptions')
          .insert({
            user_id: user.id,
            tier: 'free',
            status: 'active',
            stripe_customer_id: customerId,
            manual_override: false
          });
        
        if (insertError) {
          logStep("Error inserting free subscription", { error: insertError });
        }
      }
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier: tier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
