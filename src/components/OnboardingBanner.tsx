import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Sparkles, Zap, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface OnboardingBannerProps {
  remainingDeletions?: number;
}

export function OnboardingBanner({ remainingDeletions: propRemainingDeletions }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [remainingDeletions, setRemainingDeletions] = useState(propRemainingDeletions || 3);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has already dismissed the onboarding
    const hasSeenOnboarding = localStorage.getItem("onboarding_dismissed");
    if (hasSeenOnboarding === "true") {
      setDismissed(true);
      return;
    }

    // Fetch subscription data to get actual remaining deletions
    const fetchSubscription = async () => {
      try {
        const { data } = await supabase.functions.invoke("check-subscription");
        if (data?.remaining_deletions !== undefined) {
          setRemainingDeletions(data.remaining_deletions);
        }
        // Auto-dismiss for Pro users since they don't need this banner
        if (data?.tier === "pro") {
          localStorage.setItem("onboarding_dismissed", "true");
          setDismissed(true);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      }
    };

    fetchSubscription();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("onboarding_dismissed", "true");
    setDismissed(true);
  };

  const handleUpgrade = () => {
    navigate("/subscribe");
    handleDismiss();
  };

  if (dismissed) return null;

  return (
    <Card className="relative border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      <CardContent className="relative pt-6 pb-5 px-6">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                Welcome to Your Privacy Dashboard! 🎉
              </h3>
              <p className="text-sm text-muted-foreground">
                You have <span className="font-semibold text-primary">{remainingDeletions} free deletion requests</span> this month to get started.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Quick Start</p>
                  <p className="text-xs text-muted-foreground">Scan your email to discover accounts</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Legal Protection</p>
                  <p className="text-xs text-muted-foreground">GDPR/CCPA compliant requests</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Save Time</p>
                  <p className="text-xs text-muted-foreground">Automated deletion emails</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro - Unlimited Deletions
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
              >
                Got it, thanks!
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              💡 <strong>Pro Tip:</strong> Connect your email to automatically discover all your accounts. 
              You can always upgrade to Pro ($9.99/mo) for unlimited deletions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}