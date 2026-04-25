import { Loader2, Mail, Globe, ShieldAlert, CheckCircle2, Clock } from "lucide-react";

type StepState = "pending" | "running" | "done" | "skipped";

interface Step {
  key: "inbox" | "broker" | "breach";
  label: string;
  state: StepState;
  detail?: string;
}

interface Props {
  /** Inbox scan currently running. */
  inboxScanning: boolean;
  /** Broker scan in motion (started, may still be resolving). */
  brokerScanning: boolean;
  /** True once at least one inbox result has landed. */
  inboxHasResults: boolean;
  /** True once at least one broker result has landed. */
  brokerHasResults: boolean;
  /** Risk/breach score has been computed. */
  breachComplete: boolean;
  /** Whether broker scan applies to this tier — otherwise the row reads as N/A. */
  brokerEnabled: boolean;
}

/**
 * Unified post-checkout progress stack. Frames inbox + broker + breach as a
 * single "Scanning your digital footprint…" pipeline so the user sees ONE
 * coherent system instead of three separate tools doing their own thing.
 *
 * Hides itself once nothing is running and nothing has reported back yet.
 */
export function PostCheckoutScanProgressStrip({
  inboxScanning,
  brokerScanning,
  inboxHasResults,
  brokerHasResults,
  breachComplete,
  brokerEnabled,
}: Props) {
  const inboxState: StepState = inboxScanning
    ? "running"
    : inboxHasResults
      ? "done"
      : "pending";

  const brokerState: StepState = !brokerEnabled
    ? "skipped"
    : brokerScanning && !brokerHasResults
      ? "running"
      : brokerHasResults
        ? "done"
        : "pending";

  const breachState: StepState = breachComplete ? "done" : "running";

  const steps: Step[] = [
    {
      key: "inbox",
      label: "Inbox connected",
      state: inboxState,
      detail:
        inboxState === "running" ? "Reading sender + subject only" :
        inboxState === "done" ? "Hidden accounts surfaced" :
        "Waiting on Gmail connection",
    },
    {
      key: "broker",
      label: "Broker scan",
      state: brokerState,
      detail:
        brokerState === "running" ? "Querying 18+ data broker sites" :
        brokerState === "done" ? "Listings detected" :
        brokerState === "skipped" ? "Included on the Complete plan" :
        "Waiting on your name + ZIP",
    },
    {
      key: "breach",
      label: "Breach + risk check",
      state: breachState,
      detail:
        breachState === "running" ? "Cross-checking public breach data" :
        "Risk score computed",
    },
  ];

  const anyActivity = steps.some((s) => s.state === "running" || s.state === "done");
  if (!anyActivity) return null;

  const runningCount = steps.filter((s) => s.state === "running").length;

  return (
    <div className="mb-6 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/10">
        {runningCount > 0 ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        )}
        <h3 className="text-sm font-semibold">
          {runningCount > 0 ? "Scanning your digital footprint…" : "Footprint scan complete"}
        </h3>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {runningCount > 0 ? "Results stream in below" : "All sources checked"}
        </span>
      </div>

      <ol className="divide-y divide-border/50">
        {steps.map((step) => (
          <li key={step.key} className="flex items-center gap-3 px-4 py-2.5">
            <StepIcon state={step.state} kind={step.key} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${step.state === "skipped" ? "text-muted-foreground" : "text-foreground"}`}>
                {step.label}
              </p>
              {step.detail && (
                <p className="text-[11px] text-muted-foreground truncate">{step.detail}</p>
              )}
            </div>
            <StepStatusLabel state={step.state} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepIcon({ state, kind }: { state: StepState; kind: Step["key"] }) {
  if (state === "running") {
    return (
      <div className="relative flex items-center justify-center h-7 w-7 rounded-full bg-primary/10">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
      </div>
    );
  }
  if (state === "done") {
    return (
      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/15">
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      </div>
    );
  }
  if (state === "skipped") {
    return (
      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted">
        {kind === "broker" ? <Globe className="h-3.5 w-3.5 text-muted-foreground" /> :
         kind === "inbox" ? <Mail className="h-3.5 w-3.5 text-muted-foreground" /> :
         <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
    );
  }
  // pending
  return (
    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted">
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}

function StepStatusLabel({ state }: { state: StepState }) {
  const map = {
    running: { text: "Running", cls: "text-primary" },
    done: { text: "Done", cls: "text-emerald-600" },
    pending: { text: "Waiting", cls: "text-muted-foreground" },
    skipped: { text: "Upgrade required", cls: "text-amber-600" },
  } as const;
  const { text, cls } = map[state];
  return <span className={`text-[11px] font-medium ${cls}`}>{text}</span>;
}
