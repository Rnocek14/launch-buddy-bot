import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PRICE_ID = "price_1SUqvlPwo7CiaABewIGGxC79"; // $49/year

export default function Subscribe() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upgrade to Pro",
        variant: "destructive",
      });
      navigate("/auth?redirect=/subscribe");
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { priceId: PRICE_ID },
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, "_blank");
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

  const proFeatures = [
    "Unlimited deletion requests",
    "Deep AI Scan (finds 2-3× more accounts)",
    "Connect and scan up to 3 email addresses",
    "Complete inbox history analysis",
    "Priority deletion processing",
    "Monthly automatic rescans",
    "Priority email support",
  ];

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
        <h1 className="text-4xl font-bold mb-2">Upgrade to Pro</h1>
        <p className="text-xl text-muted-foreground">
          Unlimited deletions + complete privacy protection
        </p>
        <p className="text-sm text-accent mt-2 font-medium">
          ✨ Limited launch pricing — lock in $49/year forever
        </p>
      </div>

      <Card className="max-w-2xl mx-auto border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pro Annual</span>
            <span className="text-sm font-normal text-muted-foreground bg-accent/10 px-3 py-1 rounded-full">
              Limited Launch Price
            </span>
          </CardTitle>
          <CardDescription>
            Take complete control of your digital footprint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-8 p-6 bg-muted/30 rounded-lg">
            <div className="text-6xl font-bold mb-2">$49</div>
            <div className="text-xl text-muted-foreground mb-3">per year</div>
            <div className="text-sm text-accent font-medium">
              Just $4/month, billed annually
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              60% cheaper than DeleteMe ($129/year)
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-lg">Everything you need:</h3>
            {proFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            size="lg"
            className="w-full text-lg h-14"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Subscribe to Pro - $49/year"
            )}
          </Button>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              ✓ Cancel anytime • ✓ 100% secure checkout via Stripe
            </p>
            <p className="text-xs text-muted-foreground">
              Lock in this price forever — early adopters never pay more
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
