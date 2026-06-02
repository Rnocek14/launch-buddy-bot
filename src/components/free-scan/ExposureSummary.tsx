import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight, Loader2, AlertTriangle, Database, Building2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { IcebergEstimate } from "@/lib/icebergEstimate";
import { STRIPE_PRICES } from "@/config/pricing";
import { startCheckout } from "@/lib/checkout";
import { useToast } from "@/hooks/use-toast";

interface BrokerFindings {
  confirmedCount: number;
  possibleCount: number;
}

interface ExposureSummaryProps {
  email: string;
  breachCount: number;
  estimate: IcebergEstimate;
  /** Real findings from the live broker check. When present, the summary
   *  switches from estimates to confirmed reality. */
  brokerFindings?: BrokerFindings | null;
}

/**
 * The dominant, single-decision results header.
 * Leads with the exposure count, explains what it means and what we remove,
 * then offers ONE primary action. Everything else on the page is secondary.
 */
export function ExposureSummary({ email, breachCount, estimate, brokerFindings }: ExposureSummaryProps) {
  const hasReality = !!brokerFindings && (brokerFindings.confirmedCount + brokerFindings.possibleCount) > 0;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    setLoading(true);
    const result = await startCheckout({
      priceId: STRIPE_PRICES.COMPLETE_ANNUAL.id,
      email,
      source: "iceberg_panel",
      tier: "complete",
    });
    if (result.status === "error") {
      toast({
        title: "Couldn't start checkout",
        description: result.message,
        variant: "destructive",
      });
      setLoading(false);
    } else if (result.status === "needs_email") {
      toast({
        title: "Email needed",
        description: "We need your email to start checkout.",
        variant: "destructive",
      });
      setLoading(false);
    }
    // "redirecting" -> browser navigates away
  };

  return (
    <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-b from-background to-primary/5">
      <CardContent className="p-0">
        {/* Headline */}
        <div className="px-6 pt-8 pb-6 text-center border-b border-border">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 mb-4">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-xs font-semibold uppercase tracking-wide text-destructive">
              Exposure detected
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            {hasReality ? "We found your information online" : "We found your exposure"}
          </h2>
          <p className="text-muted-foreground">
            Here's what's exposed for <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        {/* The three numbers — confirmed reality after the broker check, estimates before */}
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border">
          {hasReality ? (
            <>
              <StatBlock
                icon={CheckCircle2}
                value={brokerFindings!.confirmedCount}
                label="confirmed listings"
                sub="people-search sites listing you"
              />
              <StatBlock
                icon={AlertTriangle}
                value={brokerFindings!.possibleCount}
                label="possible matches"
                sub="likely you — needs review"
              />
              <StatBlock
                icon={Database}
                value={breachCount}
                label="known breaches"
                sub="from public breach databases"
              />
            </>
          ) : (
            <>
              <StatBlock
                icon={AlertTriangle}
                value={breachCount}
                label="known breaches"
                sub="from public breach databases"
              />
              <StatBlock
                icon={Database}
                value={`~${estimate.brokerSites}`}
                label="likely data broker records"
                sub="people-search & marketing sites"
              />
              <StatBlock
                icon={Building2}
                value={`~${estimate.hiddenAccounts}`}
                label="companies likely holding your info"
                sub="accounts, signups & senders"
              />
            </>
          )}
        </div>

        {/* What this means + what we remove */}
        <div className="px-6 py-6 space-y-5">
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">What this means</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your personal information may be accessible through people-search sites,
                marketing databases, and breached records — exposing your name, address,
                phone number, and more.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">We can remove it</p>
              <p className="text-sm text-muted-foreground mt-1">
                We'll identify and remove your information from major data brokers,
                clean up exposed accounts, and continuously monitor for new exposure —
                saving you dozens of hours of manual opt-outs.
              </p>
            </div>
          </div>
        </div>

        {/* The single dominant action */}
        <div className="px-6 pb-8 space-y-3">
          <Button
            size="lg"
            onClick={handleRemove}
            disabled={loading}
            className="w-full gap-2 cta-shimmer h-16 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Opening secure checkout…
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Remove My Information — {STRIPE_PRICES.COMPLETE_ANNUAL.displayPrice}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Account auto-created after payment · 30-day refund · cancel anytime
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground pt-1">
            <Link to="/auth?intent=signup" className="underline hover:text-foreground">
              Or create a free account first
            </Link>
            <span>·</span>
            <Link to="/pricing" className="underline hover:text-foreground">
              Compare plans
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatBlock({
  icon: Icon,
  value,
  label,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  sub: string;
}) {
  return (
    <div className="px-5 py-6 text-center">
      <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}
