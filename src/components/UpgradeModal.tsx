import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  remainingServices?: number;
}

export function UpgradeModal({ open, onOpenChange, remainingServices }: UpgradeModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate("/subscribe");
    onOpenChange(false);
  };

  const proFeatures = [
    "Unlimited deletion requests",
    "AI-powered contact discovery",
    "Priority deletion processing",
    "Monthly automatic rescans",
    "Priority email support",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <DialogTitle className="text-2xl">Great Progress!</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            You've successfully deleted 3 accounts!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {remainingServices && remainingServices > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-semibold mb-1">
                You have {remainingServices} accounts remaining
              </p>
              <p className="text-sm text-muted-foreground">
                Estimated manual cleanup time: ~{Math.ceil(remainingServices * 0.25)} hours
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="font-semibold">Upgrade to Pro to:</p>
            <ul className="space-y-2">
              {proFeatures.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">$9.99/month</div>
              <div className="text-sm text-muted-foreground">or $99/year (save $20)</div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button onClick={handleUpgrade} size="lg" className="w-full">
            Upgrade to Pro
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
