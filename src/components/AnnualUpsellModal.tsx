import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

interface AnnualUpsellModalProps {
  open: boolean;
  onClose: () => void;
  onSwitchToAnnual: () => void;
  onContinueMonthly: () => void;
  tier: "pro" | "complete";
  loading?: boolean;
}

export function AnnualUpsellModal({
  open,
  onClose,
  onSwitchToAnnual,
  onContinueMonthly,
  tier,
  loading,
}: AnnualUpsellModalProps) {
  const monthlyPrice = tier === "complete" ? 19.99 : 12.99;
  const annualPrice = tier === "complete" ? 129 : 79;
  const annualMonthly = tier === "complete" ? 10.75 : 6.58;
  const yearlySavings = Math.round((monthlyPrice * 12) - annualPrice);
  const monthlyTotal = (monthlyPrice * 12).toFixed(2);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mx-auto mb-2">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <DialogTitle className="text-2xl text-center">
            Wait — save ${yearlySavings}/year
          </DialogTitle>
          <DialogDescription className="text-center">
            Switch to annual billing and lock in the lowest price.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onContinueMonthly}
              disabled={loading}
              className="rounded-lg border border-border p-4 text-left hover:border-muted-foreground/40 transition-colors"
            >
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Monthly</div>
              <div className="text-2xl font-bold">${monthlyPrice}</div>
              <div className="text-xs text-muted-foreground mt-1">per month</div>
              <div className="text-xs text-muted-foreground line-through mt-2">${monthlyTotal}/yr</div>
            </button>

            <button
              onClick={onSwitchToAnnual}
              disabled={loading}
              className="relative rounded-lg border-2 border-accent bg-accent/5 p-4 text-left hover:bg-accent/10 transition-colors"
            >
              <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px]">
                Save ${yearlySavings}
              </Badge>
              <div className="text-xs uppercase tracking-wide text-accent font-semibold mb-1">Annual</div>
              <div className="text-2xl font-bold">${annualPrice}</div>
              <div className="text-xs text-muted-foreground mt-1">per year</div>
              <div className="text-xs text-accent font-medium mt-2">Just ${annualMonthly}/mo</div>
            </button>
          </div>

          <div className="space-y-2 text-sm pt-2">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Same features, lower per-month cost</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Cancel anytime — no penalty</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <span>Price locked for 12 months</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={onSwitchToAnnual}
            disabled={loading}
            size="lg"
            className="w-full bg-gradient-to-r from-accent to-primary"
          >
            Switch to annual & save ${yearlySavings}
          </Button>
          <Button
            onClick={onContinueMonthly}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            No thanks, continue with monthly
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
