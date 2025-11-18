import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

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
    
    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event: Stripe.Event;

    if (webhookSecret) {
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
    } else {
      // For testing without webhook secret
      console.warn("STRIPE_WEBHOOK_SECRET not set, skipping signature verification");
      event = JSON.parse(body);
    }

    // Initialize Supabase with service role key for database operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`Checkout completed for session: ${session.id}`);

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const userId = session.metadata?.supabase_user_id;
          if (!userId) {
            console.error("No supabase_user_id in session metadata");
            break;
          }

          // Create or update subscription record
          const { error: upsertError } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              tier: "pro",
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              deletion_count_this_period: 0,
            }, {
              onConflict: "user_id"
            });

          if (upsertError) {
            console.error("Error upserting subscription:", upsertError);
          } else {
            console.log(`Subscription created/updated for user: ${userId}`);
            
            // Track successful upgrade to Pro
            console.log('[ANALYTICS]', {
              event: 'upgrade_to_pro',
              userId,
              properties: {
                subscriptionId: subscription.id,
                customerId: session.customer,
                priceId: subscription.items.data[0]?.price.id,
                amount: session.amount_total ? session.amount_total / 100 : 0,
                currency: session.currency,
                timestamp: new Date().toISOString(),
              }
            });
            
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
                    tier: "Pro",
                    billingDate: new Date(subscription.current_period_end * 1000).toISOString()
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
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription updated: ${subscription.id}`);

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

        // Update subscription status
        const { error: updateError } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
        } else {
          console.log(`Subscription ${subscription.id} status updated to: ${subscription.status}`);
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
        const invoice = event.data.object as Stripe.Invoice;
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
