import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, Crown, Star, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  STRIPE_PRICES,
  PRO_FEATURES,
  COMPLETE_FEATURES,
  FAMILY_FEATURES,
  TRACKING_EVENTS,
  BillingInterval,
  SubscriptionTier
} from "@/config/pricing";
import { trackConversion, trackEvent } from "@/lib/analytics";
import { BillingToggle } from "@/components/BillingToggle";
import { Badge } from "@/components/ui/badge";
import { AnnualUpsellModal } from "@/components/AnnualUpsellModal";

type SelectableTier = "pro" | "complete" | "family";

export default function Subscribe() {
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const initialTier = (searchParams.get("tier") as SelectableTier) || "pro";
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    initialTier === "family" ? "year" : ((searchParams.get("interval") as BillingInterval) || "year")
  );
  const [selectedTier, setSelectedTier] = useState<SelectableTier>(initialTier);
  const [showUpsell, setShowUpsell] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const isFamily = selectedTier === "family";

  const getSelectedPrice = () => {
    if (selectedTier === "family") return STRIPE_PRICES.FAMILY_ANNUAL;
    if (selectedTier === "complete") {
      return billingInterval === "year"
        ? STRIPE_PRICES.COMPLETE_ANNUAL
        : STRIPE_PRICES.COMPLETE_MONTHLY;
    }
    return billingInterval === "year"
      ? STRIPE_PRICES.PRO_ANNUAL
      : STRIPE_PRICES.PRO_MONTHLY;
  };

  const selectedPrice = getSelectedPrice();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upgrade",
        variant: "destructive",
      });
      navigate(`/auth?intent=signup&redirect=${encodeURIComponent(`/subscribe?tier=${selectedTier}&interval=${billingInterval}`)}`);
    }
  };

  const handleSubscribeClick = () => {
    // Family is annual-only — skip upsell modal
    if (billingInterval === "month" && selectedTier !== "family") {
      const dismissed = sessionStorage.getItem(`upsell_dismissed_${selectedTier}`);
      if (!dismissed) {
        trackEvent("annual_upsell_shown", { tier: selectedTier });
        setShowUpsell(true);
        return;
      }
    }
    void runCheckout();
  };

  const handleSwitchToAnnual = () => {
    trackEvent("annual_upsell_accepted", { tier: selectedTier });
    setBillingInterval("year");
    setShowUpsell(false);
    // Defer checkout so price recomputes with annual price
    setTimeout(() => void runCheckout("year"), 50);
  };

  const handleContinueMonthly = () => {
    trackEvent("annual_upsell_dismissed", { tier: selectedTier });
    sessionStorage.setItem(`upsell_dismissed_${selectedTier}`, "1");
    setShowUpsell(false);
    void runCheckout();
  };

  const runCheckout = async (intervalOverride?: BillingInterval) => {
    setLoading(true);
    try {
      const interval = intervalOverride ?? billingInterval;
      const priceForCheckout = (() => {
        if (selectedTier === "family") return STRIPE_PRICES.FAMILY_ANNUAL;
        if (selectedTier === "complete") {
          return interval === "year" ? STRIPE_PRICES.COMPLETE_ANNUAL : STRIPE_PRICES.COMPLETE_MONTHLY;
        }
        return interval === "year" ? STRIPE_PRICES.PRO_ANNUAL : STRIPE_PRICES.PRO_MONTHLY;
      })();
      const { data: { user } } = await supabase.auth.getUser();
      
      // Track checkout initiation
      if (user) {
        trackConversion(
          selectedTier === "complete"
            ? TRACKING_EVENTS.UPGRADE_TO_COMPLETE
            : TRACKING_EVENTS.CHECKOUT_INITIATED,
          user.id,
          {
            priceId: priceForCheckout.id,
            amount: priceForCheckout.amount,
            interval,
            tier: selectedTier,
          }
        );
      }

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { priceId: priceForCheckout.id },
      });

      if (error) throw error;

      if (data?.url) {
        // Same-tab redirect avoids popup blockers (especially on mobile/Safari)
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error.message || "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = isFamily
    ? FAMILY_FEATURES
    : selectedTier === "complete"
      ? COMPLETE_FEATURES
      : PRO_FEATURES;
  const Icon = isFamily ? Users : selectedTier === "complete" ? Crown : Star;
  const tierLabel = isFamily ? "Family" : selectedTier === "complete" ? "Complete" : "Pro";
  const tierAccentClass = isFamily
    ? "text-primary"
    : selectedTier === "complete"
      ? "text-accent"
      : "text-primary";

  return (
    <div className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        ← Back
      </Button>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">
          Upgrade to {tierLabel}
        </h1>
        <p className="text-xl text-muted-foreground">
          {isFamily
            ? "Protect up to 5 family members with one subscription"
            : selectedTier === "complete"
              ? "Full privacy protection with data broker removal"
              : "Unlimited deletions + deep AI scanning"}
        </p>
      </div>

      {/* Tier Toggle */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <Button
          variant={selectedTier === "pro" ? "default" : "outline"}
          onClick={() => setSelectedTier("pro")}
          className="flex items-center gap-2"
        >
          <Star className="w-4 h-4" />
          Pro
        </Button>
        <Button
          variant={selectedTier === "complete" ? "default" : "outline"}
          onClick={() => setSelectedTier("complete")}
          className="flex items-center gap-2"
        >
          <Crown className="w-4 h-4" />
          Complete
        </Button>
        <Button
          variant={selectedTier === "family" ? "default" : "outline"}
          onClick={() => {
            setSelectedTier("family");
            setBillingInterval("year");
          }}
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Family
          <Badge className="ml-1 bg-primary/15 text-primary text-[10px] px-1.5 py-0">
            5 members
          </Badge>
        </Button>
      </div>

      {!isFamily && <BillingToggle value={billingInterval} onChange={setBillingInterval} />}
      {isFamily && (
        <p className="text-center text-sm text-muted-foreground mb-8">
          Family plan is billed annually. Cancel anytime.
        </p>
      )}

      <Card className={`max-w-2xl mx-auto shadow-lg ${
        isFamily
          ? "border-primary/30 bg-gradient-to-br from-card to-primary/5"
          : selectedTier === "complete"
            ? "border-accent/30 bg-gradient-to-br from-card to-accent/5"
            : "border-primary/20"
      }`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${tierAccentClass}`} />
              <span>{tierLabel} {isFamily ? "Annual" : billingInterval === "year" ? "Annual" : "Monthly"}</span>
            </div>
            {isFamily ? (
              <Badge className="bg-primary text-primary-foreground">Best for households</Badge>
            ) : selectedTier === "complete" ? (
              <Badge className="bg-accent text-accent-foreground">Best Value</Badge>
            ) : null}
          </CardTitle>
          <CardDescription>
            {isFamily
              ? "Same as Complete, but for the whole family"
              : selectedTier === "complete"
                ? "The complete privacy protection package"
                : "Take control of your digital footprint"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-8 p-6 bg-muted/30 rounded-lg relative">
            {isFamily ? (
              <>
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-md">
                  Just $35.80/member/year
                </Badge>
                <div className="text-6xl font-bold mb-2">$179</div>
                <div className="text-xl text-muted-foreground mb-3">per year, 5 members</div>
                <div className="text-sm text-primary font-medium">
                  Save $466 vs 5 individual Complete plans
                </div>
                <div className="text-xs text-muted-foreground line-through mt-1">
                  $645/year if bought separately
                </div>
              </>
            ) : (
              <>
                {billingInterval === "year" && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground shadow-md">
                    Save ${selectedTier === "complete" ? "111" : "77"}/year vs monthly
                  </Badge>
                )}
                {billingInterval === "year" ? (
                  <>
                    <div className="text-6xl font-bold mb-2">
                      ${selectedTier === "complete" ? "129" : "79"}
                    </div>
                    <div className="text-xl text-muted-foreground mb-3">per year</div>
                    <div className="text-sm text-accent font-medium">
                      Just ${selectedTier === "complete" ? "10.75" : "6.58"}/month, billed annually
                    </div>
                    <div className="text-xs text-muted-foreground line-through mt-1">
                      ${selectedTier === "complete" ? "239.88" : "155.88"}/year if billed monthly
                    </div>
                    {selectedTier === "complete" && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Same price as DeleteMe, but with email scanning included
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-6xl font-bold mb-2">
                      ${selectedTier === "complete" ? "19.99" : "12.99"}
                    </div>
                    <div className="text-xl text-muted-foreground mb-3">per month</div>
                    <button
                      onClick={() => setBillingInterval("year")}
                      className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors"
                    >
                      💰 Switch to annual & save ${selectedTier === "complete" ? "111" : "77"}/year
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-lg">Everything you get:</h3>
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubscribeClick}
            disabled={loading}
            size="lg"
            className={`w-full text-lg h-14 ${
              isFamily
                ? "bg-gradient-to-r from-primary to-accent"
                : selectedTier === "complete"
                  ? "bg-gradient-to-r from-accent to-primary"
                  : ""
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              `Subscribe to ${tierLabel} - ${selectedPrice.displayPrice}`
            )}
          </Button>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              ✓ Cancel anytime • ✓ 100% secure checkout via Stripe
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Comparison hint */}
      {selectedTier === "pro" && (
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Need data broker removal too?{" "}
            <button 
              onClick={() => setSelectedTier("complete")}
              className="text-primary underline font-medium"
            >
              Upgrade to Complete for $50 more/year
            </button>
          </p>
        </div>
      )}

      {!isFamily && (
        <AnnualUpsellModal
          open={showUpsell}
          onClose={() => setShowUpsell(false)}
          onSwitchToAnnual={handleSwitchToAnnual}
          onContinueMonthly={handleContinueMonthly}
          tier={selectedTier as "pro" | "complete"}
          loading={loading}
        />
      )}
    </div>
  );
}
