import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingServices?: number;
  title?: string;
  description?: string;
  context?: 'deletions' | 'email-connections' | 'broker-scanning';
  currentTier?: 'free' | 'pro';
}

export function UpgradeModal({ 
  open, 
  onOpenChange, 
  remainingServices,
  title,
  description,
  context = 'deletions',
  currentTier = 'free'
}: UpgradeModalProps) {
  const navigate = useNavigate();

  // Determine the target tier based on context
  const targetTier = context === 'broker-scanning' ? 'complete' : 'pro';
  const isUpgradeToComplete = targetTier === 'complete' || currentTier === 'pro';

  const handleUpgrade = () => {
    navigate(`/subscribe?tier=${isUpgradeToComplete ? 'complete' : 'pro'}`);
    onOpenChange(false);
  };

  const proFeatures = [
    "Unlimited deletion requests",
    "Deep AI Scan (finds 2-3× more accounts)",
    "Connect and scan up to 3 email addresses",
    "Complete inbox history analysis",
    "Monthly automatic rescans",
  ];

  const completeFeatures = [
    "Everything in Pro, plus:",
    "Data Broker Scanning (20+ sites)",
    "Guided opt-out instructions",
    "Connect up to 5 email addresses",
    "Priority email support",
  ];

  const features = isUpgradeToComplete ? completeFeatures : proFeatures;
  const Icon = isUpgradeToComplete ? Crown : Star;
  const tierName = isUpgradeToComplete ? "Complete" : "Pro";
  const tierPrice = isUpgradeToComplete ? "$129/year" : "$79/year";
  const monthlyPrice = isUpgradeToComplete ? "$10.75/month" : "$6.58/month";

  const getDefaultTitle = () => {
    if (context === 'broker-scanning') return "Unlock Data Broker Scanning";
    if (context === 'email-connections') return "Connect Multiple Email Accounts";
    return "Great Progress!";
  };

  const getDefaultDescription = () => {
    if (context === 'broker-scanning') {
      return currentTier === 'pro'
        ? "Upgrade from Pro to Complete to scan 20+ data broker sites and get guided opt-out instructions."
        : "Upgrade to Complete to scan 20+ data broker sites and remove your personal information.";
    }
    if (context === 'email-connections') {
      return "Upgrade to Pro to connect up to 3 email addresses and scan them all simultaneously.";
    }
    return "You've successfully deleted 3 accounts! Want to delete more?";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${isUpgradeToComplete ? 'bg-accent/10' : 'bg-primary/10'}`}>
              <Icon className={`w-6 h-6 ${isUpgradeToComplete ? 'text-accent' : 'text-primary'}`} />
            </div>
            <DialogTitle className="text-2xl">{title || getDefaultTitle()}</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {description || getDefaultDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {remainingServices && remainingServices > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold mb-1">
                You have {remainingServices} accounts remaining
              </p>
              <p className="text-sm text-muted-foreground">
                {tierName} users can delete them all with unlimited deletion requests
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="font-semibold">Upgrade to {tierName} for:</p>
            <ul className="space-y-2">
              {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={`p-4 border rounded-lg ${isUpgradeToComplete ? 'bg-accent/5 border-accent/20' : 'bg-primary/5 border-primary/20'}`}>
            <div className="text-center">
              <div className="text-2xl font-bold">{tierPrice}</div>
              <div className="text-sm text-muted-foreground">Just {monthlyPrice}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={handleUpgrade} size="lg" className={`w-full ${isUpgradeToComplete ? 'bg-gradient-to-r from-accent to-primary' : ''}`}>
            Upgrade to {tierName}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/pricing")}
            className="w-full"
          >
            View Pricing Details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
