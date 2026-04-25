import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, Lock, AlertTriangle, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { IcebergEstimate } from "@/lib/icebergEstimate";

interface IcebergPanelProps {
  email: string;
  breachCount: number;
  estimate: IcebergEstimate;
}

export function IcebergPanel({ email, breachCount, estimate }: IcebergPanelProps) {
  return (
    <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-b from-background to-primary/5">
      <CardContent className="p-0">
        {/* Above water — what they saw */}
        <div className="p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              What we found above the surface
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{breachCount}</span>
            <span className="text-sm text-muted-foreground">
              public breach{breachCount === 1 ? "" : "es"} for {email}
            </span>
          </div>
        </div>

        {/* The waterline */}
        <div className="relative h-px bg-border">
          <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-3 py-0.5 rounded-full bg-background border border-border text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            ~ surface ~
          </div>
        </div>

        {/* Below water — the iceberg */}
        <div className="p-6 space-y-5 bg-gradient-to-b from-primary/5 to-primary/10">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              What we couldn't see without deeper access
            </span>
          </div>

          {/* Scan limitation disclosure — honest, specific, urgency-preserving */}
          <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>This check only looks at public breach data.</strong> It cannot see your accounts or data broker listings.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1.5">
              Full scan requires connecting your inbox.
            </p>
          </div>

          {/* Three concrete estimates */}
          <div className="grid sm:grid-cols-3 gap-3">
            <HiddenStat
              value={`~${estimate.hiddenAccounts}`}
              range={`${estimate.hiddenAccountsRange[0]}–${estimate.hiddenAccountsRange[1]}`}
              label="hidden accounts"
              sublabel="newsletters, signups, old subs"
            />
            <HiddenStat
              value={`~${estimate.brokerSites}`}
              range={`${estimate.brokerRange[0]}–${estimate.brokerRange[1]}`}
              label="data brokers"
              sublabel="publishing your address & phone"
            />
            <HiddenStat
              value={`~${estimate.trackingDomains}`}
              range={`tracking your inbox`}
              label="senders"
              sublabel="reaching this email weekly"
            />
          </div>

          {/* Locked placeholder cards — visceral */}
          <div className="space-y-2 pt-2">
            <p className="text-xs text-muted-foreground">
              Likely accounts we'd surface in a full scan:
            </p>
            <div className="grid sm:grid-cols-2 gap-2">
              {LOCKED_PLACEHOLDERS.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/60 border border-dashed border-border"
                >
                  <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="h-3 w-24 rounded bg-muted-foreground/20 mb-1.5" />
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Methodology footnote */}
          <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground border-t border-border/50">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            <p>
              Estimate based on {estimate.reasoning}.
              Actual numbers vary — only a real inbox + broker scan reveals the truth.
            </p>
          </div>

          {/* Two-button CTA */}
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <Link to="/auth?intent=signup" className="block">
              <Button size="lg" className="w-full gap-2 cta-shimmer">
                <Shield className="w-4 h-4" />
                Sign up free → see everything
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/subscribe?tier=pro&interval=year&autostart=1" className="block">
              <Button size="lg" variant="outline" className="w-full gap-2">
                Skip to Pro · $79/yr
              </Button>
            </Link>
          </div>

          {/* What happens after signup — clarity without slowing momentum */}
          <div className="pt-4 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              What happens after signup:
            </p>
            <ul className="space-y-1.5 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Connect your inbox to uncover hidden accounts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Scan data brokers exposing your information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>See everything tied to your email in one place</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">No card required for free scan</p>
          </div>

          {/* Free vs Pro clarification — one line, no decision paralysis */}
          <p className="text-[11px] text-center text-muted-foreground pt-2 border-t border-border/50">
            <span className="font-medium">Free:</span> see your accounts + run initial scans · 
            <span className="font-medium"> Pro:</span> continuous monitoring + automatic removals
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const LOCKED_PLACEHOLDERS = [
  "subscription · likely from newsletter activity",
  "shopping account · seen in receipts",
  "broker site · public listing detected",
  "newsletter · long-running sender",
  "social · dormant signup",
  "free trial · never canceled",
];

function HiddenStat({
  value,
  range,
  label,
  sublabel,
}: {
  value: string;
  range: string;
  label: string;
  sublabel: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-background/80 border border-border">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-primary">{value}</span>
        <span className="text-[10px] text-muted-foreground">({range})</span>
      </div>
      <div className="text-sm font-medium mt-0.5">{label}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</div>
    </div>
  );
}
