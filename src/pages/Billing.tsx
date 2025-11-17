import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Billing() {
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    fetchSubscription();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  }

  async function fetchSubscription() {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;
      
      setSubscriptionData(data);
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

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

  const isPro = subscriptionData?.tier === 'pro';

  return (
    <div className="container max-w-4xl py-8">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-6"
      >
        ← Back to Dashboard
      </Button>

      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>

        {subscriptionData?.status === 'past_due' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your payment failed. Please update your payment method to continue using Pro features.
            </AlertDescription>
          </Alert>
        )}

        <Card className={isPro ? 'border-accent/30 bg-gradient-to-br from-card to-accent/5' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {isPro ? 'Pro Plan' : 'Free Plan'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {isPro 
                    ? 'Unlimited deletion requests and advanced features'
                    : '3 deletion requests per month'}
                </CardDescription>
              </div>
              {isPro && (
                <Badge className="bg-accent text-accent-foreground">
                  Active
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isPro ? (
              <>
                {subscriptionData?.subscription_end && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border border-border">
                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Current Period</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Renews on {new Date(subscriptionData.subscription_end).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border border-border">
                  <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Billing Management</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Update payment method, view invoices, and manage your subscription
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  size="lg"
                  className="w-full"
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening Portal...
                    </>
                  ) : (
                    'Manage in Stripe Portal'
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <span className="text-sm text-foreground">Deletion Requests This Month</span>
                    <Badge variant={subscriptionData?.remaining_deletions === 0 ? "destructive" : "secondary"}>
                      {subscriptionData?.remaining_deletions || 0}/3 remaining
                    </Badge>
                  </div>
                </div>

                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro for unlimited deletions and advanced features
                  </p>
                  <Button
                    onClick={() => navigate('/subscribe')}
                    size="lg"
                    className="w-full"
                  >
                    Upgrade to Pro
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
