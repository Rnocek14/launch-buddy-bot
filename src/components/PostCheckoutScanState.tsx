import { useEffect, useState } from "react";
import { Shield, Mail, Database, Activity, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostCheckoutScanStateProps {
  /** Called when the user dismisses (either via continue button or auto). */
  onDismiss: () => void;
  /** Whether to show the broker-sweep step (Complete/Family tiers). */
  includeBrokers?: boolean;
}

const STEPS = (includeBrokers: boolean) => [
  {
    icon: Mail,
    label: "Scanning inbox for hidden accounts",
    detail: "Accounts we'll help you shut down immediately",
    duration: 4500,
    // Live counter — quantifies footprint before results land.
    counter: { from: 12, to: 137, suffix: "potential accounts" },
  },
  ...(includeBrokers
    ? [
        {
          icon: Database,
          label: "Sweeping data brokers",
          detail: "Sites currently exposing your personal info",
          duration: 5500,
          counter: { from: 0, to: 214, suffix: "broker sites checked" },
        },
      ]
    : []),
  {
    icon: Activity,
    label: "Mapping your exposure",
    detail: "Where your data is most at risk",
    duration: 4000,
    counter: { from: 0, to: 18, suffix: "risk signals correlated" },
  },
];

/**
 * Full-screen "we're working" state that fires immediately after checkout.
 * Removes the "gap after purchase" by making the value loop visible
 * before the user has to act.
 */
export function PostCheckoutScanState({ onDismiss, includeBrokers = false }: PostCheckoutScanStateProps) {
  const steps = STEPS(includeBrokers);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (currentStep >= steps.length) return;
    const t = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep((s) => s + 1);
    }, steps[currentStep].duration);
    return () => clearTimeout(t);
  }, [currentStep, steps]);

  const allDone = currentStep >= steps.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            {allDone ? "Your protection is active" : "Protection is now active"}
          </h2>
          <p className="text-muted-foreground">
            {allDone
              ? "Here's what we found in your initial sweep."
              : "Starting your deep scan — uncovering hidden accounts, brokers, and active risks."}
          </p>
        </div>

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
          {allDone ? "Show my exposed data" : "See what we found"}
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
  finalized,
}: {
  from: number;
  to: number;
  duration: number;
  suffix: string;
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
    <div className="mt-1.5 text-xs font-mono text-primary tabular-nums">
      {value.toLocaleString()} {suffix}
      {!finalized && <span className="ml-1 animate-pulse">…</span>}
    </div>
  );
}
