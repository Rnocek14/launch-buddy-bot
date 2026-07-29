import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, ArrowRight } from "lucide-react";
import { startCheckout, type CheckoutSource } from "@/lib/checkout";
import { STRIPE_PRICES } from "@/config/pricing";
import { useToast } from "@/hooks/use-toast";

type Interval = "annual" | "monthly";

// Annual is the value anchor. Monthly is the low-commitment rung for
// price-sensitive visitors — the SAME Complete tier (broker removal included),
// just a smaller upfront ask than $129/yr. We never downgrade this CTA to Pro,
// which does NOT include broker scanning.
const ANNUAL = STRIPE_PRICES.COMPLETE_ANNUAL;
const MONTHLY = STRIPE_PRICES.COMPLETE_MONTHLY;

// $129/yr vs $19.99/mo * 12 = $239.88/yr → ~46% saved on annual.
const ANNUAL_SAVINGS_PCT = Math.round((1 - ANNUAL.amount / (MONTHLY.amount * 12)) * 100);

interface Props {
  email: string;
  source: CheckoutSource;
  label?: string;
  className?: string;
}

export function CompleteCheckoutButton({ email, source, label = "Remove My Information", className }: Props) {
  const { toast } = useToast();
  const [interval, setInterval] = useState<Interval>("annual");
  const [loading, setLoading] = useState(false);

  const price = interval === "annual" ? ANNUAL : MONTHLY;

  const handle = async () => {
    setLoading(true);
    // startCheckout emits `checkout_initiated` (with priceId, which distinguishes
    // annual vs monthly) — no separate event needed here.
    const res = await startCheckout({ priceId: price.id, email, source, tier: "complete" });
    if (res.status === "error") {
      toast({ title: "Couldn't start checkout", description: res.message, variant: "destructive" });
      setLoading(false);
    } else if (res.status === "needs_email") {
      toast({ title: "Email needed", description: "We need your email to start checkout.", variant: "destructive" });
      setLoading(false);
    }
    // "redirecting" -> browser navigates away
  };

  const pill = (value: Interval, top: string, bottom: string, badge?: string) => {
    const active = interval === value;
    return (
      <button
        type="button"
        onClick={() => setInterval(value)}
        aria-pressed={active}
        className={`flex-1 rounded-lg border px-3 py-2.5 text-left transition-colors ${
          active
            ? "border-primary bg-primary/10"
            : "border-border bg-background hover:border-primary/40"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{top}</span>
          {badge && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded px-1.5 py-0.5">
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">{bottom}</div>
      </button>
    );
  };

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      <div className="flex gap-2">
        {pill("annual", ANNUAL.displayPrice, `${ANNUAL.monthlyEquivalent} billed yearly`, `Save ${ANNUAL_SAVINGS_PCT}%`)}
        {pill("monthly", MONTHLY.displayPrice, "billed monthly · cancel anytime")}
      </div>
      <Button
        size="lg"
        onClick={handle}
        disabled={loading}
        className="w-full gap-2 cta-shimmer h-14 text-base"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Opening secure checkout…
          </>
        ) : (
          <>
            <Shield className="w-5 h-5" />
            {label} — {price.displayPrice}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
      <p className="text-[11px] text-center text-muted-foreground">
        Complete plan · broker removal included · account auto-created after payment · 30-day refund · cancel anytime
      </p>
    </div>
  );
}
