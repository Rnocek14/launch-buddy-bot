import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Calendar, AlertCircle, Crown, Star, Shield } from "lucide-react";
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

  const tier = subscriptionData?.tier || 'free';
  const isPro = tier === 'pro';
  const isComplete = tier === 'complete';
  const isPaid = isPro || isComplete;

  const getTierInfo = () => {
    if (isComplete) {
      return {
        name: 'Complete Plan',
        description: 'Unlimited deletion requests, data broker scanning, and priority support',
        icon: Crown,
        color: 'accent',
        price: '$129/year',
      };
    }
    if (isPro) {
      return {
        name: 'Pro Plan',
        description: 'Unlimited deletion requests and advanced features',
        icon: Star,
        color: 'primary',
        price: '$79/year',
      };
    }
    return {
      name: 'Free Plan',
      description: '3 deletion requests per month',
      icon: Shield,
      color: 'muted',
      price: 'Free',
    };
  };

  const tierInfo = getTierInfo();
  const Icon = tierInfo.icon;

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
              Your payment failed. Please update your payment method to continue using {isComplete ? 'Complete' : 'Pro'} features.
            </AlertDescription>
          </Alert>
        )}

        <Card className={isPaid ? (isComplete ? 'border-accent/30 bg-gradient-to-br from-card to-accent/5' : 'border-primary/30 bg-gradient-to-br from-card to-primary/5') : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isComplete ? 'bg-accent/10' : isPro ? 'bg-primary/10' : 'bg-muted'}`}>
                  <Icon className={`w-6 h-6 ${isComplete ? 'text-accent' : isPro ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {tierInfo.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {tierInfo.description}
                  </CardDescription>
                </div>
              </div>
              {isPaid && (
                <Badge className={isComplete ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}>
                  Active
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {isPaid ? (
              <>
                {subscriptionData?.subscription_end && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border border-border">
                    <Calendar className={`w-5 h-5 mt-0.5 ${isComplete ? 'text-accent' : 'text-primary'}`} />
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
                  <CreditCard className={`w-5 h-5 mt-0.5 ${isComplete ? 'text-accent' : 'text-primary'}`} />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Billing Management</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Update payment method, view invoices, and manage your subscription
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    size="lg"
                    className="flex-1"
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
                  
                  {isPro && !isComplete && (
                    <Button
                      onClick={() => navigate('/subscribe?tier=complete')}
                      size="lg"
                      className="bg-gradient-to-r from-accent to-primary"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Complete
                    </Button>
                  )}
                </div>
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
                    Upgrade for unlimited deletions and advanced features
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => navigate('/subscribe?tier=pro')}
                      size="lg"
                      variant="outline"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Pro - $79/year
                    </Button>
                    <Button
                      onClick={() => navigate('/subscribe?tier=complete')}
                      size="lg"
                      className="bg-gradient-to-r from-accent to-primary"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Complete - $129/year
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
