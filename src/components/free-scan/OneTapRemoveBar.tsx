import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startCheckout } from "@/lib/checkout";
import { STRIPE_PRICES } from "@/config/pricing";
import { useToast } from "@/hooks/use-toast";

interface Props {
  email: string;
  confirmedCount: number;
  breachCount: number;
}

/**
 * Sticky one-tap checkout bar on free-scan results. Email is already known,
 * so one tap goes straight to Stripe Checkout (Link / Apple Pay / Google Pay).
 * Urgency comes only from the user's own real findings, never generic fear.
 */
export function OneTapRemoveBar({ email, confirmedCount, breachCount }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const price = STRIPE_PRICES.COMPLETE_ANNUAL;

  const headline =
    confirmedCount > 0
      ? `${confirmedCount} live listing${confirmedCount === 1 ? "" : "s"} showing your info today`
      : breachCount > 0
        ? `Your email is in ${breachCount} known breach${breachCount === 1 ? "" : "es"}`
        : "Start removing your data today";

  const go = async () => {
    setLoading(true);
    const res = await startCheckout({ priceId: price.id, email, source: "free_scan_upgrade_cta", tier: "complete" });
    if (res.status !== "redirecting") {
      toast({ title: "Couldn't open checkout", description: res.status === "error" ? res.message : "Enter your email first.", variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur safe-area-pb">
      <div className="max-w-4xl mx-auto px-4 pt-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{headline}</p>
          <p className="font-mono text-[11px] text-muted-foreground">$129/yr · 30-day refund · cancel anytime</p>
        </div>
        <Button onClick={go} disabled={loading} className="h-12 px-5 rounded-none bg-accent hover:bg-accent/90 text-accent-foreground shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Get help →"}
        </Button>
      </div>
    </div>
  );
}
