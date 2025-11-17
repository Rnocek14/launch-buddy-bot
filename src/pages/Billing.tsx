import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Subscription {
  tier: string;
  status: string;
  current_period_end: string | null;
  deletion_count_this_period: number;
}

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth?redirect=/billing");
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("tier, status, current_period_end, deletion_count_this_period")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error loading subscription:", error);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session");

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isFree = !subscription || subscription.tier === "free";
  const isPro = subscription?.tier === "pro";
  const isPastDue = subscription?.status === "past_due";

  return (
    <div className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        ← Back to Dashboard
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {isPastDue && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your payment failed. Please update your payment method to continue using Pro features.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your active subscription details</CardDescription>
              </div>
              <Badge variant={isPro ? "default" : "secondary"}>
                {isPro ? "Pro" : "Free"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {isPro ? "Pro Plan - $9.99/month" : "Free Plan"}
                </span>
              </div>

              {subscription?.current_period_end && isPro && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Next billing date: {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t">
                {isPro ? (
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Manage Subscription"
                    )}
                  </Button>
                ) : (
                  <Button onClick={() => navigate("/subscribe")}>
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Usage This Period</CardTitle>
            <CardDescription>
              {isFree 
                ? "Track your free deletion requests" 
                : "Unlimited deletion requests"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isFree ? (
              <div>
                <div className="text-3xl font-bold mb-2">
                  {subscription?.deletion_count_this_period || 0} / 3
                </div>
                <p className="text-sm text-muted-foreground">
                  Free deletions used this month
                </p>
                {(subscription?.deletion_count_this_period || 0) >= 3 && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You've reached your free limit. Upgrade to Pro for unlimited deletions.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div>
                <div className="text-3xl font-bold mb-2">
                  {subscription?.deletion_count_this_period || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Deletions processed this month
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
