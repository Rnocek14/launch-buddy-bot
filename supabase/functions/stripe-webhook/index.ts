import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.79.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Stripe price IDs to tiers
const PRICE_ID_TO_TIER: Record<string, string> = {
  // Legacy/sandbox prices (grandfathered users)
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

// Stripe API 2025-08-27.basil moved current_period_start/end onto subscription
// items. Read from the item first, fall back to the legacy top-level field, and
// guard against undefined so new Date(undefined * 1000) never throws RangeError.
const subPeriodISO = (
  sub: any,
  field: "current_period_start" | "current_period_end",
): string | null => {
  const ts = sub?.items?.data?.[0]?.[field] ?? sub?.[field];
  return typeof ts === "number" ? new Date(ts * 1000).toISOString() : null;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Stripe webhook received");

    // Verify Stripe key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No stripe-signature header found");
      return new Response(
        JSON.stringify({ error: "No signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get raw body for signature verification
    const body = await req.text();
    
    // Verify webhook signature (required)
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`Verified webhook event: ${event.type}`);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase with service role key for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Helper: log an affiliate conversion when a Stripe object carries affiliate_code metadata
    async function logAffiliateConversion(opts: {
      affiliateCode: string;
      conversionType: "subscription" | "one_time_purchase";
      amountCents: number;
      referredUserId?: string | null;
      stripePaymentIntentId?: string | null;
      metadata?: Record<string, unknown>;
    }) {
      try {
        const { data: aff } = await supabase
          .from("affiliates")
          .select("id, commission_rate, total_clicks, total_signups, total_conversions, total_earnings_cents")
          .eq("code", opts.affiliateCode)
          .eq("status", "approved")
          .maybeSingle();
        if (!aff) {
          console.warn(`[AFFILIATE] code not found or not approved: ${opts.affiliateCode}`);
          return;
        }
        const rate = Number(aff.commission_rate) || 0.4;
        const commissionCents = Math.round(opts.amountCents * rate);

        // Idempotency: skip if we already logged this payment_intent
        if (opts.stripePaymentIntentId) {
          const { data: existing } = await supabase
            .from("affiliate_conversions")
            .select("id")
            .eq("stripe_payment_intent_id", opts.stripePaymentIntentId)
            .maybeSingle();
          if (existing) {
            console.log(`[AFFILIATE] conversion already logged for ${opts.stripePaymentIntentId}`);
            return;
          }
        }

        const { error: insertErr } = await supabase.from("affiliate_conversions").insert({
          affiliate_id: aff.id,
          affiliate_code: opts.affiliateCode,
          referred_user_id: opts.referredUserId ?? null,
          conversion_type: opts.conversionType,
          amount_cents: opts.amountCents,
          commission_cents: commissionCents,
          stripe_payment_intent_id: opts.stripePaymentIntentId ?? null,
          metadata: opts.metadata ?? {},
        });
        if (insertErr) {
          console.error("[AFFILIATE] insert failed:", insertErr);
          return;
        }

        // Increment affiliate totals
        await supabase
          .from("affiliates")
          .update({
            total_conversions: (aff.total_conversions || 0) + 1,
            total_earnings_cents: (aff.total_earnings_cents || 0) + commissionCents,
          })
          .eq("id", aff.id);

        console.log(`[AFFILIATE] +$${(commissionCents / 100).toFixed(2)} for ${opts.affiliateCode}`);
      } catch (err) {
        console.error("[AFFILIATE] log error:", err);
      }
    }

    // Helper: resolve the Supabase user behind a checkout session, creating one if the
    // buyer checked out as a guest. Same "pay first, account later" contract as
    // finalize-payment: a paying customer's account is created confirmed, with no password,
    // and they get in via the magic link the success page requests.
    //
    // profiles is consulted before auth.admin.listUsers because listUsers only reads the
    // first page (200 users) — past that it silently misses an existing account and the
    // createUser below fails on the duplicate email, stranding the purchase with no user_id.
    async function resolveOrCreateUser(
      email: string,
      stripeCustomerId: string | null,
      source: string,
    ): Promise<string | null> {
      if (!email) return null;
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .limit(1)
          .maybeSingle();
        if (profile?.id) return profile.id as string;

        const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
        const match = list?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
        if (match) return match.id;

        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true, // skip verification — they already paid
          user_metadata: { source, stripe_customer_id: stripeCustomerId },
        });
        if (createErr || !created?.user) {
          console.error(`[PARENT-SCAN] createUser failed for ${email}:`, createErr);
          return null;
        }
        console.log(`[PARENT-SCAN] created user ${created.user.id} for ${email}`);
        return created.user.id;
      } catch (err) {
        console.error(`[PARENT-SCAN] user resolution failed for ${email}:`, err);
        return null;
      }
    }

    // Helper: record the one-time Parent Protection Scan entitlement.
    //
    // Idempotency is not optional here: Stripe redelivers checkout.session.completed until
    // it gets a 2xx, and the dashboard can replay it by hand. The insert is therefore an
    // ON CONFLICT DO NOTHING on the checkout session id (supabase-js spells that
    // upsert + ignoreDuplicates), so a redelivery neither creates a second entitlement nor
    // resets an already-consumed one back to 'paid'. PostgREST returns only rows it actually
    // inserted, so an empty array is the signal that this delivery was a duplicate.
    async function recordParentScanOrder(session: Stripe.Checkout.Session) {
      try {
        const purchaserEmail = (session.customer_details?.email ?? "").toLowerCase().trim();
        const scanTargetEmail = ((session.metadata?.parent_email as string | undefined) ?? "")
          .toLowerCase()
          .trim();

        let userId = (session.metadata?.supabase_user_id as string | undefined) || null;
        if (!userId) {
          userId = await resolveOrCreateUser(
            purchaserEmail,
            (session.customer as string | null) ?? null,
            "parent_scan_purchase",
          );
        }

        // Record the money even if we could not resolve a user: an order row with a null
        // user_id is a support-reconcilable record, whereas a dropped webhook is invisible.
        const { data: inserted, error: insertErr } = await supabase
          .from("parent_scan_orders")
          .upsert(
            {
              stripe_checkout_session_id: session.id,
              stripe_payment_intent_id: (session.payment_intent as string | null) ?? null,
              stripe_customer_id: (session.customer as string | null) ?? null,
              user_id: userId,
              purchaser_email: purchaserEmail || null,
              scan_target_email: scanTargetEmail || null,
              affiliate_code: (session.metadata?.affiliate_code as string | undefined) ?? null,
              amount_cents: session.amount_total ?? 0,
              currency: session.currency ?? null,
              status: "paid",
              metadata: {
                product: session.metadata?.product ?? null,
                payment_status: session.payment_status,
              },
            },
            { onConflict: "stripe_checkout_session_id", ignoreDuplicates: true },
          )
          .select("id");

        if (insertErr) {
          console.error("[PARENT-SCAN] order insert failed:", insertErr);
          return;
        }

        if (!inserted || inserted.length === 0) {
          console.log(`[PARENT-SCAN] order already recorded for session ${session.id} (redelivery)`);
          // A later delivery may resolve a user the first one could not (e.g. the buyer
          // signed up in between). Backfilling user_id is safe — it never touches status,
          // so it cannot re-grant a consumed entitlement.
          if (userId) {
            await supabase
              .from("parent_scan_orders")
              .update({ user_id: userId })
              .eq("stripe_checkout_session_id", session.id)
              .is("user_id", null);
          }
          return;
        }

        console.log(
          `[PARENT-SCAN] entitlement recorded for session ${session.id} (user: ${userId ?? "unresolved"})`,
        );

        // Same canonical `purchase` event the subscription branch emits, so this SKU shows
        // up in paid-conversion analytics. Only on a first delivery — a redelivery returned
        // above — so replays cannot inflate revenue.
        try {
          const { error: analyticsError } = await supabase.from("analytics_events").insert({
            user_id: userId,
            event: "purchase",
            properties: {
              tier: "parent_scan",
              product: "parent_protection_scan",
              one_time: true,
              amount: session.amount_total != null ? session.amount_total / 100 : null,
              currency: session.currency,
              sessionId: session.id,
            },
          });
          if (analyticsError) {
            console.error("[ANALYTICS] parent scan purchase insert failed:", analyticsError);
          }
        } catch (err) {
          console.error("[ANALYTICS] parent scan purchase event error:", err);
        }
      } catch (err) {
        console.error("[PARENT-SCAN] order handling error:", err);
      }
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout completed for session: ${session.id}`);

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          ) as any;

          // Resolve user id — either from metadata (auth'd checkout) or by email (guest checkout)
          let userId = session.metadata?.supabase_user_id as string | undefined;
          const guestEmail = (
            session.customer_details?.email ||
            (session.metadata?.guest_email as string | undefined) ||
            ""
          ).toLowerCase().trim();

          if (!userId && guestEmail) {
            try {
              const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
              const match = list?.users?.find((u) => (u.email ?? "").toLowerCase() === guestEmail);
              if (match) {
                userId = match.id;
              } else {
                const { data: created, error: createErr } = await supabase.auth.admin.createUser({
                  email: guestEmail,
                  email_confirm: true,
                  user_metadata: {
                    source: "stripe_webhook_guest",
                    stripe_customer_id: session.customer as string,
                  },
                });
                if (createErr) {
                  console.error("Failed to create guest user:", createErr);
                } else {
                  userId = created.user?.id;
                  console.log(`Created user ${userId} from webhook for ${guestEmail}`);
                }
              }
            } catch (err) {
              console.error("Guest user resolution failed:", err);
            }
          }

          if (!userId) {
            console.error("No supabase_user_id and could not resolve from email");
            break;
          }

          // Determine tier from price ID
          const priceId = subscription.items.data[0]?.price?.id;
          const tier = PRICE_ID_TO_TIER[priceId] || "pro";
          const tierName = tier === "complete" ? "Complete" : "Pro";

          console.log(`Subscription tier determined: ${tier} from price: ${priceId}`);

          // Create or update subscription record
          const { error: upsertError } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              tier: tier,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              status: subscription.status,
              current_period_start: subPeriodISO(subscription, "current_period_start"),
              current_period_end: subPeriodISO(subscription, "current_period_end"),
              deletion_count_this_period: 0,
            }, {
              onConflict: "user_id"
            });

          if (upsertError) {
            console.error("Error upserting subscription:", upsertError);
          } else {
            console.log(`Subscription created/updated for user: ${userId} with tier: ${tier}`);

            // Record the canonical `purchase` event — the authoritative paid-conversion
            // signal, fired for BOTH authenticated and guest checkout. Previously this
            // was only console.logged, so paid conversion was uncomputable. This is the
            // denominator every funnel experiment measures against.
            try {
              const interval = subscription.items.data[0]?.price?.recurring?.interval ?? null;
              const amount = session.amount_total != null ? session.amount_total / 100 : null;
              const { error: analyticsError } = await supabase
                .from("analytics_events")
                .insert({
                  user_id: userId,
                  event: "purchase",
                  properties: {
                    tier,
                    amount,
                    currency: session.currency,
                    interval,
                    priceId,
                    subscriptionId: subscription.id,
                    customerId: session.customer,
                    source:
                      (session.metadata?.checkout_source as string | undefined) ??
                      (session.metadata?.source as string | undefined) ??
                      null,
                  },
                });
              if (analyticsError) {
                console.error("[ANALYTICS] purchase insert failed:", analyticsError);
              }
            } catch (err) {
              console.error("[ANALYTICS] purchase event error:", err);
            }

            // Send upgrade email
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", userId)
              .single();
              
            if (profile?.email) {
              console.log(`Sending upgrade email to: ${profile.email}`);
              const { error: emailError } = await supabase.functions.invoke(
                "send-subscription-upgrade-email",
                {
                  body: { 
                    email: profile.email, 
                    tier: tierName,
                    billingDate: subPeriodISO(subscription, "current_period_end")
                  }
                }
              );
              
              if (emailError) {
                console.error("Error sending upgrade email:", emailError);
              } else {
                console.log("Upgrade email sent successfully");
              }
            }
          }

          // Affiliate conversion (subscription)
          const affiliateCode = session.metadata?.affiliate_code || subscription.metadata?.affiliate_code;
          if (affiliateCode && session.amount_total) {
            await logAffiliateConversion({
              affiliateCode,
              conversionType: "subscription",
              amountCents: session.amount_total,
              referredUserId: userId,
              stripePaymentIntentId: session.payment_intent as string | null,
              metadata: { tier, price_id: priceId, subscription_id: subscription.id },
            });
          }
        }

        // One-time payments (e.g. parent scan)
        if (session.mode === "payment") {
          // create-parent-scan-payment stamps metadata.product = "parent_protection_scan"
          // on the session it creates; that marker is the only thing separating this SKU
          // from any future one-time product, so branch on it rather than on the amount.
          if (session.metadata?.product === "parent_protection_scan") {
            // "paid" is the card path; "no_payment_required" is a 100%-off coupon, which is
            // still a completed order. An "unpaid" session means an async method (e.g. bank
            // debit) that settles later on checkout.session.async_payment_succeeded — an
            // event this function does not handle, so say so loudly rather than granting an
            // entitlement for money that has not arrived.
            if (
              session.payment_status === "paid" ||
              session.payment_status === "no_payment_required"
            ) {
              await recordParentScanOrder(session);
            } else {
              console.warn(
                `[PARENT-SCAN] session ${session.id} completed with payment_status=${session.payment_status}; no entitlement recorded (async settlement is not handled)`,
              );
            }
          }

          const affiliateCode = session.metadata?.affiliate_code;
          if (affiliateCode && session.amount_total) {
            await logAffiliateConversion({
              affiliateCode,
              conversionType: "one_time_purchase",
              amountCents: session.amount_total,
              referredUserId: session.metadata?.supabase_user_id || null,
              stripePaymentIntentId: session.payment_intent as string | null,
              metadata: { product: session.metadata?.product || "unknown" },
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        console.log(`Subscription updated: ${subscription.id}`);

        // Determine tier from price ID
        const priceId = subscription.items.data[0]?.price?.id;
        const tier = PRICE_ID_TO_TIER[priceId] || "pro";

        // Find user by stripe subscription ID
        const { data: existingSubscription, error: fetchError } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (fetchError || !existingSubscription) {
          console.error("Subscription not found in database:", fetchError);
          break;
        }

        // Update subscription status and tier
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            tier: tier,
            status: subscription.status,
            current_period_start: subPeriodISO(subscription, "current_period_start"),
            current_period_end: subPeriodISO(subscription, "current_period_end"),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
        } else {
          console.log(`Subscription ${subscription.id} updated to tier: ${tier}, status: ${subscription.status}`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription deleted: ${subscription.id}`);

        // Get user info before downgrading
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        // Downgrade to free tier
        const { error: downgradeError } = await supabase
          .from("subscriptions")
          .update({
            tier: "free",
            status: "cancelled",
            stripe_subscription_id: null,
          })
          .eq("stripe_subscription_id", subscription.id);

        if (downgradeError) {
          console.error("Error downgrading subscription:", downgradeError);
        } else {
          console.log(`User downgraded to free tier for subscription: ${subscription.id}`);
          
          // Send cancellation email
          if (existingSub?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", existingSub.user_id)
              .single();
              
            if (profile?.email) {
              console.log(`Sending cancellation email to: ${profile.email}`);
              const { error: emailError } = await supabase.functions.invoke(
                "send-subscription-cancelled-email",
                {
                  body: { email: profile.email }
                }
              );
              
              if (emailError) {
                console.error("Error sending cancellation email:", emailError);
              } else {
                console.log("Cancellation email sent successfully");
              }
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        console.log(`Payment failed for invoice: ${invoice.id}`);

        if (invoice.subscription) {
          // Get user info
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", invoice.subscription as string)
            .single();

          // Mark subscription as past_due
          const { error: updateError } = await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
            })
            .eq("stripe_subscription_id", invoice.subscription as string);

          if (updateError) {
            console.error("Error updating subscription to past_due:", updateError);
          } else {
            console.log(`Subscription marked as past_due: ${invoice.subscription}`);
            
            // Send payment failed email
            if (existingSub?.user_id) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", existingSub.user_id)
                .single();
                
              if (profile?.email) {
                console.log(`Sending payment failed email to: ${profile.email}`);
                const { error: emailError } = await supabase.functions.invoke(
                  "send-payment-failed-email",
                  {
                    body: { 
                      email: profile.email,
                      attemptCount: invoice.attempt_count,
                      nextRetry: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toISOString() : null
                    }
                  }
                );
                
                if (emailError) {
                  console.error("Error sending payment failed email:", emailError);
                } else {
                  console.log("Payment failed email sent successfully");
                }
              }
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in stripe-webhook:", errorMessage);
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
