import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Crown, AlertCircle, Sparkles, RefreshCw, Loader2, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { TierUpgradePrompt } from "./TierUpgradePrompt";

interface SubscriptionData {
  tier: string;
  status: string;
  remainingDeletions: number | null; // null means unlimited
}

export function SubscriptionStatusCard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    tier: 'free',
    status: 'active',
    remainingDeletions: 3
  });

  useEffect(() => {
    fetchSubscriptionStatus();
    
    // Auto-refresh every minute
    const interval = setInterval(() => {
      fetchSubscriptionStatus(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const fetchSubscriptionStatus = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call check-subscription edge function for real-time Stripe data
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('Error checking subscription:', error);
        if (!silent) {
          toast({
            title: "Connection Error",
            description: "Unable to check subscription status",
            variant: "destructive"
          });
        }
        // Fallback to local database
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('tier, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!subscription) {
          setSubscriptionData({
            tier: 'free',
            status: 'active',
            remainingDeletions: 3
          });
        } else {
          const { data: remaining } = await supabase
            .rpc('get_remaining_deletions', { p_user_id: user.id });
          
          setSubscriptionData({
            tier: subscription.tier,
            status: subscription.status,
            remainingDeletions: remaining
          });
        }
      } else {
        setSubscriptionData({
          tier: data.tier,
          status: 'active',
          remainingDeletions: data.remaining_deletions
        });
        
        if (refreshing && !silent) {
          const tierName = data.tier === 'complete' ? 'Complete' : data.tier === 'pro' ? 'Pro' : 'Free';
          toast({
            title: "Status Updated",
            description: `${tierName} subscription active`,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPro = subscriptionData.tier === 'pro';
  const isComplete = subscriptionData.tier === 'complete';
  const isPaid = isPro || isComplete;
  const isLowOnDeletions = subscriptionData.remainingDeletions !== null && subscriptionData.remainingDeletions <= 1;
  const isOutOfDeletions = subscriptionData.remainingDeletions === 0;

  const getCardStyle = () => {
    if (isComplete) return 'border-accent/30 bg-gradient-to-br from-card to-accent/5';
    if (isPro) return 'border-primary/30 bg-gradient-to-br from-card to-primary/5';
    if (isOutOfDeletions) return 'border-destructive/30';
    if (isLowOnDeletions) return 'border-yellow-500/30';
    return 'border-border';
  };

  const getIcon = () => {
    if (isComplete) return <Crown className="w-6 h-6 text-accent" />;
    if (isPro) return <Star className="w-6 h-6 text-primary" />;
    if (isOutOfDeletions) return <AlertCircle className="w-6 h-6 text-destructive" />;
    return <Shield className="w-6 h-6 text-muted-foreground" />;
  };

  const getTierName = () => {
    if (isComplete) return 'Complete Plan';
    if (isPro) return 'Pro Plan';
    return 'Free Plan';
  };

  const getTierDescription = () => {
    if (isComplete) return 'Unlimited deletions + data broker scanning';
    if (isPro) return 'Unlimited deletion requests + monthly rescans';
    if (subscriptionData.remainingDeletions === null) return 'Unlimited deletions';
    if (isOutOfDeletions) {
      return (
        <span className="text-destructive font-medium">
          No deletions remaining this month • <button onClick={() => navigate('/subscribe?tier=pro')} className="underline text-primary font-semibold">Upgrade to Pro for $79/year</button>
        </span>
      );
    }
    return (
      <span className={isLowOnDeletions ? 'text-yellow-600 dark:text-yellow-500 font-medium' : ''}>
        {subscriptionData.remainingDeletions} of 3 deletion requests remaining this month
      </span>
    );
  };

  return (
    <>
      {/* Prominent upgrade prompt for users approaching limits */}
      <TierUpgradePrompt 
        remainingDeletions={subscriptionData.remainingDeletions ?? 0} 
        currentTier={subscriptionData.tier} 
      />
      
      <Card className={`mb-8 border-2 ${getCardStyle()}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPaid ? (isComplete ? 'bg-accent/10' : 'bg-primary/10') : 'bg-muted'}`}>
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">
                  {getTierName()}
                </h3>
                {isPaid && (
                  <Badge className={isComplete ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {getTierDescription()}
              </p>
            </div>
          </div>
          <div>
            {isPaid ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fetchSubscriptionStatus()}
                  variant="ghost"
                  size="sm"
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  onClick={() => navigate('/billing')}
                  variant="outline"
                  size="sm"
                >
                  Manage Subscription
                </Button>
                {isPro && !isComplete && (
                  <Button
                    onClick={() => navigate('/subscribe?tier=complete')}
                    size="sm"
                    className="bg-gradient-to-r from-accent to-primary text-primary-foreground"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Get Complete
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <Button
                  onClick={() => navigate('/subscribe?tier=pro')}
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                  size="sm"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
                <p className="text-xs text-muted-foreground">
                  From $79/year
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
