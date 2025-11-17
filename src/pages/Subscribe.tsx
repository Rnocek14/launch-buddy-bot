import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PRICE_IDS = {
  monthly: "price_1SUW44Pwo7CiaABeCXvND0Qj",
  annual: "price_1SUW5jPwo7CiaABen9tzsoqw",
};

export default function Subscribe() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">(
    searchParams.get("plan") === "annual" ? "annual" : "monthly"
  );
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
      const priceId = PRICE_IDS[billingInterval];
      
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { priceId },
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
    "AI-powered contact discovery",
    "Priority deletion processing",
    "Monthly automatic rescans",
    "Export detailed reports",
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
          Unlimited deletions and advanced privacy features
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Pro Plan</CardTitle>
          <CardDescription>
            Take complete control of your digital footprint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={billingInterval} onValueChange={(v) => setBillingInterval(v as "monthly" | "annual")} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="annual">
                Annual
                <span className="ml-2 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                  Save $20
                </span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="monthly" className="mt-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold mb-2">$9.99</div>
                <div className="text-muted-foreground">per month</div>
              </div>
            </TabsContent>
            <TabsContent value="annual" className="mt-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold mb-2">$99</div>
                <div className="text-muted-foreground">
                  per year <span className="text-accent font-semibold">(Save $20)</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  $8.25/month billed annually
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <ul className="space-y-3 mb-6">
            {proFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Opening Checkout...
              </>
            ) : (
              <>Subscribe to Pro</>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center mt-4">
            Cancel anytime. No questions asked.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
