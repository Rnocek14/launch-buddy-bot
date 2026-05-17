import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Zap, TrendingUp, Shield, Crown, Loader2 } from "lucide-react";
import { STRIPE_PRICES } from "@/config/pricing";
import { startCheckout } from "@/lib/checkout";
import { QuickCheckoutEmailDialog } from "./QuickCheckoutEmailDialog";
import { useToast } from "@/hooks/use-toast";

interface TierUpgradePromptProps {
  remainingDeletions: number;
  currentTier: string;
}

export function TierUpgradePrompt({ remainingDeletions, currentTier }: TierUpgradePromptProps) {
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    const result = await startCheckout({
      priceId: STRIPE_PRICES.PRO_ANNUAL.id,
      source: "tier_upgrade_prompt",
      tier: "pro",
    });
    if (result.status === "needs_email") {
      setEmailDialogOpen(true);
    } else if (result.status === "error") {
      toast({
        title: "Couldn't start checkout",
        description: result.message,
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  // Only show for free tier users who are low on deletions
  if (currentTier !== 'free' || remainingDeletions > 1 || dismissed) {
    return null;
  }

  const isOutOfDeletions = remainingDeletions === 0;
  const isLastDeletion = remainingDeletions === 1;

  const getMessage = () => {
    if (isOutOfDeletions) {
      return {
        title: "You've used all your free deletions",
        subtitle: "Upgrade to Pro for unlimited deletion requests and keep cleaning up your digital footprint.",
        urgency: "high"
      };
    }
    if (isLastDeletion) {
      return {
        title: "1 deletion left this month",
        subtitle: "Running low? Upgrade to Pro for unlimited deletions and never worry about limits again.",
        urgency: "medium"
      };
    }
    return null;
  };

  const message = getMessage();
  if (!message) return null;

  const isHighUrgency = message.urgency === "high";

  return (
    <Card className={`mb-6 border-2 overflow-hidden ${
      isHighUrgency 
        ? 'border-destructive/50 bg-gradient-to-r from-destructive/5 via-destructive/10 to-primary/5' 
        : 'border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5'
    }`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              isHighUrgency ? 'bg-destructive/10' : 'bg-primary/10'
            }`}>
              {isHighUrgency ? (
                <Shield className="w-6 h-6 text-destructive" />
              ) : (
                <TrendingUp className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-lg ${
                isHighUrgency ? 'text-destructive' : 'text-foreground'
              }`}>
                {message.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {message.subtitle}
              </p>
              
              {/* Benefits list */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                  Unlimited deletions
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  3 email accounts
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  Monthly rescans
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2 shrink-0">
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={() => navigate('/subscribe?tier=pro')}
                size="sm"
                className={`${
                  isHighUrgency 
                    ? 'bg-destructive hover:bg-destructive/90' 
                    : 'bg-gradient-to-r from-primary to-accent hover:opacity-90'
                } text-primary-foreground`}
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
              <span className="text-xs text-muted-foreground">
                Just $79/year ($6.58/mo)
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2 -mt-1"
              onClick={() => setDismissed(true)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
