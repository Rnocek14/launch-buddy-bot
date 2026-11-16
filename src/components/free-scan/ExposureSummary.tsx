import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, Database, Building2, Eye, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { IcebergEstimate } from "@/lib/icebergEstimate";
import { CompleteCheckoutButton } from "./CompleteCheckoutButton";

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
  /** When the breach lookup failed (e.g. HIBP unavailable), we must NOT
   *  render a confident "0 known breaches" — show an unknown state instead. */
  breachError?: string | null;
}

/**
 * The dominant, single-decision results header.
 * Leads with the exposure count, explains what it means and what we remove,
 * then offers ONE primary action. Everything else on the page is secondary.
 */
export function ExposureSummary({ email, breachCount, brokerFindings, breachError }: ExposureSummaryProps) {
  const hasReality = !!brokerFindings && (brokerFindings.confirmedCount + brokerFindings.possibleCount) > 0;
  // Confirmed breaches are real signal too. Only assert "Exposure detected" when
  // we actually found something — otherwise the red alarm over a screen of
  // ~estimates reads as manufactured to a skeptical privacy audience.
  const hasBreaches = !breachError && breachCount > 0;
  const hasRealSignal = hasReality || hasBreaches;

  // When the breach lookup failed we don't know the real count — never imply "clean".
  const breachValue: string | number = breachError ? "—" : breachCount;
  const breachSub = breachError
    ? "breach check unavailable — try again shortly"
    : "from public breach databases";

  return (
    <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-b from-background to-primary/5">
      <CardContent className="p-0">
        {/* Headline */}
        <div className="px-6 pt-8 pb-6 text-center border-b border-border">
          {hasRealSignal ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-concern/10 border border-concern/20 mb-4">
              <AlertTriangle className="w-3.5 h-3.5 text-concern" />
              <span className="text-xs font-semibold uppercase tracking-wide text-concern">
                Exposure detected
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border mb-4">
              <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Check status
              </span>
            </div>
          )}
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            {hasReality
              ? "We found your information online"
              : hasBreaches
                ? "We found your exposure"
                : "Your breach check results"}
          </h2>
          <p className="text-muted-foreground">
            {hasRealSignal ? (
              <>Here's what's exposed for <span className="font-medium text-foreground">{email}</span></>
            ) : (
              <>Results for <span className="font-medium text-foreground">{email}</span> — check people-search listings separately below</>
            )}
          </p>
        </div>

        {/* The three numbers — confirmed reality after the broker check, estimates before */}
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border">
          {hasReality ? (
            <>
              <StatBlock
                icon={CheckCircle2}
                value={brokerFindings?.confirmedCount ?? 0}
                label="confirmed listings"
                sub="people-search sites listing you"
              />
              <StatBlock
                icon={AlertTriangle}
                value={brokerFindings?.possibleCount ?? 0}
                label="possible matches"
                sub="likely you — needs review"
              />
              <StatBlock
                icon={Database}
                value={breachValue}
                label="known breaches"
                sub={breachSub}
              />
            </>
          ) : (
            <>
              <StatBlock
                icon={AlertTriangle}
                value={breachValue}
                label="known breaches"
                sub={breachSub}
              />
              <StatBlock
                icon={Database}
                value="—"
                label="broker listings"
                sub="requires your name and location"
              />
              <StatBlock
                icon={Building2}
                value="—"
                label="email accounts"
                sub="not checked without inbox permission"
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
              <p className="font-semibold text-sm">What a paid plan covers</p>
              <p className="text-sm text-muted-foreground mt-1">
                Company deletion requests, guided broker opt-outs, and monthly rechecks.
                Some sites require you to complete a form yourself. Past breach records
                cannot be erased by removing a broker listing.
              </p>
            </div>
          </div>
        </div>

        {/* The single dominant action */}
        <div className="px-6 pb-8 space-y-3">
          <CompleteCheckoutButton email={email} source="iceberg_panel" />
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
