import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

type OverallStatus = "operational" | "degraded" | "major_outage" | "unknown";

interface StatusSnapshot {
  as_of: string;
  overall: {
    status: OverallStatus;
    message: string;
  };
  t1: {
    pass_15m: number | null;
    p95_15m_ms: number | null;
    pass_24h: number | null;
    p95_24h_ms: number | null;
    precision_24h: number | null;
    cache_rate_24h: number | null;
  };
  t2: {
    pass_24h: number | null;
    p95_24h_ms: number | null;
    backlog: {
      queued: number;
      running: number;
      failed: number;
    };
  };
  quarantine: {
    active_domains: number;
  };
  golden: {
    g10_pass_rate: number | null;
    g10_median_ms: number | null;
    g25_pass_rate: number | null;
    g25_median_ms: number | null;
    last_run_at: string | null;
  };
  meta: {
    build_sha: string | null;
    build_ver: string | null;
  };
}

const pct = (v: number | null | undefined) =>
  v == null ? "—" : `${Math.round(v * 100)}%`;

const ms = (v: number | null | undefined) =>
  v == null ? "—" : `${Math.round(v)} ms`;

const badgeColor = (status: OverallStatus) => {
  switch (status) {
    case "operational":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "degraded":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "major_outage":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

const statusIcon = (status: OverallStatus) => {
  switch (status) {
    case "operational":
      return "🟢";
    case "degraded":
      return "🟡";
    case "major_outage":
      return "🔴";
    default:
      return "⚪";
  }
};

const statusLabel = (status: OverallStatus) => {
  switch (status) {
    case "operational":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "major_outage":
      return "Major Outage";
    default:
      return "Unknown";
  }
};

export default function Status() {
  const [snapshot, setSnapshot] = useState<StatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: rpcError } = await supabase.rpc(
          "public_status_snapshot"
        );

        if (rpcError) throw rpcError;
        if (!cancelled && data) setSnapshot(data as unknown as StatusSnapshot);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load status.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const overallStatus = snapshot?.overall.status ?? "unknown";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              System Status
            </h1>
            <p className="text-sm text-muted-foreground">
              Live health of our privacy contact discovery engine. No personal data is ever shown here.
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${badgeColor(
              overallStatus
            )}`}
          >
            <span>
              {statusIcon(overallStatus)} {statusLabel(overallStatus)}
            </span>
          </div>
        </header>

        {/* Loading / Error */}
        {loading && (
          <div className="text-sm text-muted-foreground">
            Loading latest status…
          </div>
        )}
        {error && (
          <div className="text-sm text-destructive">
            Failed to load status: {error}
          </div>
        )}

        {snapshot && (
          <>
            {/* Overall Message + Meta */}
            <section className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2 p-4 bg-card">
                <h2 className="text-sm font-medium text-foreground">
                  Overall Status
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {snapshot.overall.message || "Current health across all discovery tiers."}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Snapshot taken at{" "}
                  {new Date(snapshot.as_of).toLocaleString(undefined, {
                    hour12: false,
                  })}
                  .
                </p>
              </Card>
              <Card className="p-4 space-y-1 text-xs text-muted-foreground bg-card">
                <div>
                  <span className="font-medium text-foreground">
                    Build SHA:
                  </span>{" "}
                  {snapshot.meta.build_sha || "—"}
                </div>
                <div>
                  <span className="font-medium text-foreground">
                    Build version:
                  </span>{" "}
                  {snapshot.meta.build_ver || "—"}
                </div>
                {snapshot.golden.last_run_at && (
                  <div>
                    <span className="font-medium text-foreground">
                      Last Golden run:
                    </span>{" "}
                    {new Date(snapshot.golden.last_run_at).toLocaleString(
                      undefined,
                      { hour12: false }
                    )}
                  </div>
                )}
              </Card>
            </section>

            {/* T1 + T2 */}
            <section className="grid gap-4 md:grid-cols-2">
              {/* T1 */}
              <Card className="p-4 space-y-3 bg-card">
                <div>
                  <h2 className="text-sm font-medium text-foreground">
                    T1 — Fast Discovery
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    HTML-first engine for finding privacy policies and contact endpoints quickly.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Success rate (last 15 min)</div>
                    <div className="text-base text-foreground">
                      {pct(snapshot.t1.pass_15m)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      p95 latency (last 15 min)
                    </div>
                    <div className="text-base text-foreground">
                      {ms(snapshot.t1.p95_15m_ms)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Success rate (last 24 hours)</div>
                    <div className="text-base text-foreground">
                      {pct(snapshot.t1.pass_24h)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      p95 latency (last 24 hours)
                    </div>
                    <div className="text-base text-foreground">
                      {ms(snapshot.t1.p95_24h_ms)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      Precision@5 (last 24 hours)
                    </div>
                    <div className="text-base text-foreground">
                      {pct(snapshot.t1.precision_24h)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      Probe cache hit rate
                    </div>
                    <div className="text-base text-foreground">
                      {pct(snapshot.t1.cache_rate_24h)}
                    </div>
                  </div>
                </div>
              </Card>

              {/* T2 */}
              <Card className="p-4 space-y-3 bg-card">
                <div>
                  <h2 className="text-sm font-medium text-foreground">
                    T2 — Headless Retries
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Browser-based retries for JavaScript-heavy or bot-protected domains, bounded by strict timeouts and safety rails.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Success rate (last 24 hours)</div>
                    <div className="text-base text-foreground">
                      {pct(snapshot.t2.pass_24h)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">p95 latency (last 24 hours)</div>
                    <div className="text-base text-foreground">
                      {ms(snapshot.t2.p95_24h_ms)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Queued jobs</div>
                    <div className="text-base text-foreground">
                      {snapshot.t2.backlog.queued}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Running jobs</div>
                    <div className="text-base text-foreground">
                      {snapshot.t2.backlog.running}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Failed jobs</div>
                    <div className="text-base text-foreground">
                      {snapshot.t2.backlog.failed}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Tier-2 only runs when the fast path (T1) can't safely complete a lookup. It is tightly rate-limited, respects remote services, and never processes any personal user data.
                </p>
              </Card>
            </section>

            {/* Quarantine + Golden */}
            <section className="grid gap-4 md:grid-cols-2">
              {/* Quarantine */}
              <Card className="p-4 space-y-2 bg-card">
                <div>
                  <h2 className="text-sm font-medium text-foreground">
                    Quarantine
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Temporary pause for domains that repeatedly respond with bot protection or hard errors.
                  </p>
                </div>
                <p className="text-2xl font-semibold text-foreground">
                  {snapshot.quarantine.active_domains}
                </p>
                <p className="text-xs text-muted-foreground">
                  Quarantined domains are automatically retried after a cooldown window to protect both your requests and the remote service.
                </p>
              </Card>

              {/* Golden baselines */}
              <Card className="p-4 space-y-3 bg-card">
                <div>
                  <h2 className="text-sm font-medium text-foreground">
                    Golden Baselines
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fixed test suites run on every build against known tricky domains to catch regressions early.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Golden-10 pass</div>
                    <div className="text-base text-foreground">
                      {pct(snapshot.golden.g10_pass_rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      Golden-10 median
                    </div>
                    <div className="text-base text-foreground">
                      {ms(snapshot.golden.g10_median_ms)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Golden-25 pass</div>
                    <div className="text-base text-foreground">
                      {pct(snapshot.golden.g25_pass_rate)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">
                      Golden-25 median latency
                    </div>
                    <div className="text-base text-foreground">
                      {ms(snapshot.golden.g25_median_ms)}
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            {/* Footer note */}
            <footer className="pt-4 border-t border-border mt-4 text-xs text-muted-foreground">
              This page reflects the health of our automated discovery engine only. It never includes personal data, email content, or individual deletion requests.
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
