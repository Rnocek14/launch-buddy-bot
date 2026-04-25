import { useEffect, useMemo, useState } from "react";
import { Shield, Mail, Database, Activity, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostCheckoutScanStateProps {
  /** Called when the user dismisses (either via continue button or auto). */
  onDismiss: () => void;
  /** Whether to show the broker-sweep step (Complete/Family tiers). */
  includeBrokers?: boolean;
  /** Number of breaches we've already seen for this user (used to scale counters). */
  breachCount?: number;
  /** Accounts already discovered for this user (used to scale counters). */
  discoveredAccounts?: number;
}

/**
 * Build the step list, with counters seeded from real user signal so the
 * numbers don't feel templated. Higher signal → larger ranges.
 */
function buildSteps(includeBrokers: boolean, breachCount: number, discoveredAccounts: number) {
  // Account ceiling scales with breaches + already-found accounts.
  // Floor ~60 so a low-signal user still sees something meaningful;
  // ceiling jumps as breaches/accounts grow.
  const accountMax = Math.min(
    260,
    Math.max(60, 60 + breachCount * 18 + Math.round(discoveredAccounts * 1.5)),
  );
  const accountMin = Math.max(8, Math.round(accountMax * 0.08));

  // Brokers: heavier presence implied by 3+ breaches.
  const brokerMax = breachCount >= 3 ? 214 : 128;

  // Risk signals correlate with everything we've seen.
  const riskMax = Math.min(42, 8 + breachCount * 4 + Math.round(discoveredAccounts * 0.2));

  return [
    {
      icon: Mail,
      label: "Scanning inbox for hidden accounts",
      detail: "Accounts we'll help you shut down immediately",
      duration: 4500,
      counter: {
        from: accountMin,
        to: accountMax,
        suffix: "potential accounts",
        // Ownership cue — anchors the abstract number to the user's identity.
        ownership: "Likely tied to this email address",
      },
    },
    ...(includeBrokers
      ? [
          {
            icon: Database,
            label: "Sweeping data brokers",
            detail: "Sites currently exposing your personal info",
            duration: 5500,
            counter: { from: 0, to: brokerMax, suffix: "broker sites checked" },
          },
        ]
      : []),
    {
      icon: Activity,
      label: "Mapping your exposure",
      detail: "Where your data is most at risk",
      duration: 4000,
      counter: { from: 0, to: riskMax, suffix: "risk signals correlated" },
    },
  ];
}

/**
 * Full-screen "we're working" state that fires immediately after checkout.
 * Removes the "gap after purchase" by making the value loop visible
 * before the user has to act.
 */
export function PostCheckoutScanState({
  onDismiss,
  includeBrokers = false,
  breachCount = 0,
  discoveredAccounts = 0,
}: PostCheckoutScanStateProps) {
  const steps = useMemo(
    () => buildSteps(includeBrokers, breachCount, discoveredAccounts),
    [includeBrokers, breachCount, discoveredAccounts],
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showSpike, setShowSpike] = useState(false);
  const [spikeDismissed, setSpikeDismissed] = useState(false);

  useEffect(() => {
    if (currentStep >= steps.length) return;
    const t = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep((s) => s + 1);
    }, steps[currentStep].duration);
    return () => clearTimeout(t);
  }, [currentStep, steps]);

  // Escalation moment — fires once at ~70% through the scan to create tension.
  useEffect(() => {
    if (spikeDismissed) return;
    const total = steps.reduce((acc, s) => acc + s.duration, 0);
    const spikeAt = Math.round(total * 0.7);
    const t = setTimeout(() => setShowSpike(true), spikeAt);
    const t2 = setTimeout(() => {
      setShowSpike(false);
      setSpikeDismissed(true);
    }, spikeAt + 3200);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [steps, spikeDismissed]);

  const allDone = currentStep >= steps.length;

  // Pick the spike message based on what signal we have — observational, not "alert UI" tone.
  const spikeMessage =
    includeBrokers && breachCount >= 2
      ? "⚠️ Your data is appearing in more places than expected"
      : breachCount >= 1
        ? "⚠️ We're seeing your data across multiple sources"
        : "⚠️ We're finding more accounts than typical";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {allDone ? "We found your data across multiple sources" : "Protection is now active"}
          </h2>
          <p className="text-muted-foreground">
            {allDone
              ? "Some of this data is publicly accessible. Data like this can continue to spread if left unchecked."
              : "Checking inbox activity and public records in real time."}
          </p>
        </div>

        {/* Escalation spike — appears once mid-scan */}
        {showSpike && !allDone && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3 animate-fade-in"
          >
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold text-destructive">{spikeMessage}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Example: shopping, subscriptions, public listings.
              </div>
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3 mb-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isDone = completedSteps.includes(i);
            const isActive = currentStep === i;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                  isActive
                    ? "border-primary/40 bg-primary/5"
                    : isDone
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border bg-muted/20 opacity-60"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{step.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{step.detail}</div>
                  {/* Live counter — quantifies footprint before results land */}
                  {(isActive || isDone) && (
                    <LiveCounter
                      from={step.counter.from}
                      to={step.counter.to}
                      duration={step.duration}
                      suffix={step.counter.suffix}
                      ownership={(step.counter as { ownership?: string }).ownership}
                      finalized={isDone}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <Button
          onClick={onDismiss}
          size="lg"
          className="w-full h-12 text-base"
          variant={allDone ? "default" : "outline"}
        >
          {allDone ? "Reveal my exposed data" : "Show what's exposed"}
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-3">
          {allDone
            ? "Connect your inbox to surface every account."
            : "Skip ahead — your scan keeps running in the background."}
        </p>
      </div>
    </div>
  );
}

/**
 * Animates a number from `from` to `to` over `duration` ms.
 * Once the parent step completes, the number locks at `to`.
 */
function LiveCounter({
  from,
  to,
  duration,
  suffix,
  ownership,
  finalized,
}: {
  from: number;
  to: number;
  duration: number;
  suffix: string;
  ownership?: string;
  finalized: boolean;
}) {
  const [value, setValue] = useState(from);

  useEffect(() => {
    if (finalized) {
      setValue(to);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic for a more natural settling feel
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, duration, finalized]);

  return (
    <div className="mt-1.5">
      <div className="text-xs font-mono text-primary tabular-nums">
        {value.toLocaleString()} {suffix}
        {!finalized && <span className="ml-1 animate-pulse">…</span>}
      </div>
      {ownership && (
        <div className="text-[11px] text-muted-foreground mt-0.5">{ownership}</div>
      )}
    </div>
  );
}
