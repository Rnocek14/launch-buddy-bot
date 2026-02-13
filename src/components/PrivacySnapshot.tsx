import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail,
  ShieldAlert,
  UserSearch,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import { getBrokerResultState, brokerResultPriority, type BrokerResultState } from "@/lib/brokerResultState";
import { formatDistanceToNow } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TopBroker {
  name: string;
  status: string;
}

interface SnapshotData {
  accounts: {
    count: number;
    new_since_last_scan: number;
    last_scan: string | null;
  };
  brokers: {
    status: string | null;
    found: number;
    exposed_result_count: number;
    total_checked: number;
    last_scan: string | null;
    scan_started: string | null;
    top_brokers: TopBroker[];
  };
  breaches: {
    total: number;
    critical: number;
    high: number;
    last_scan: string | null;
  };
  overall_risk: string;
}

interface InlineBroker {
  id: string;
  broker_name: string;
  opt_out_url: string | null;
  broker_website: string;
  state: BrokerResultState;
  extracted_data: {
    addresses?: string[];
    phone_numbers?: string[];
    relatives?: string[];
  } | null;
  opt_out_started_at: string | null;
  opted_out_at: string | null;
}

type Severity = "danger" | "warn" | "ok" | "empty" | "running";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDataTypes(b: InlineBroker) {
  const types: { icon: typeof MapPin; label: string }[] = [];
  if (b.extracted_data?.addresses?.length) types.push({ icon: MapPin, label: "Address" });
  if (b.extracted_data?.phone_numbers?.length) types.push({ icon: Phone, label: "Phone" });
  if (b.extracted_data?.relatives?.length) types.push({ icon: Users, label: "Relatives" });
  return types;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PrivacySnapshot() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SnapshotData | null>(null);
  const [brokerExpanded, setBrokerExpanded] = useState(false);
  const [inlineBrokers, setInlineBrokers] = useState<InlineBroker[]>([]);
  const [brokersLoading, setBrokersLoading] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    loadSnapshot();
  }, []);

  // Auto-expand when there are actionable broker results
  useEffect(() => {
    if (data && data.brokers.found > 0) {
      setBrokerExpanded(true);
    }
  }, [data]);

  async function loadSnapshot() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data: snapshot, error } = await supabase.rpc(
        "get_privacy_snapshot" as any,
        { p_user_id: session.user.id }
      );

      if (error) {
        console.error("Error loading privacy snapshot:", error);
        return;
      }

      setData(snapshot as unknown as SnapshotData);
    } catch (err) {
      console.error("Error loading privacy snapshot:", err);
    } finally {
      setLoading(false);
    }
  }

  // Load inline broker details when expanded
  const loadBrokerDetails = useCallback(async () => {
    if (inlineBrokers.length > 0) return; // already loaded
    setBrokersLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Get latest scan timestamp
      const { data: scanData } = await supabase
        .from("broker_scans")
        .select("completed_at, created_at")
        .eq("user_id", session.user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (scanData) {
        setLastCheckedAt(scanData.completed_at ?? scanData.created_at);
      }

      const { data: results } = await supabase
        .from("broker_scan_results")
        .select(`
          id, status, status_v2, confidence, extracted_data, opted_out_at, opt_out_started_at,
          data_brokers!broker_scan_results_broker_id_fkey (
            name, slug, website, opt_out_url
          )
        `)
        .eq("user_id", session.user.id)
        .order("confidence", { ascending: false });

      if (results) {
        const mapped: InlineBroker[] = results.map((r: any) => ({
          id: r.id,
          broker_name: r.data_brokers?.name || "Unknown",
          opt_out_url: r.data_brokers?.opt_out_url,
          broker_website: r.data_brokers?.website || "",
          state: getBrokerResultState({
            status: r.status,
            status_v2: r.status_v2,
            opted_out_at: r.opted_out_at,
            opt_out_started_at: r.opt_out_started_at,
          }),
          extracted_data: r.extracted_data,
          opt_out_started_at: r.opt_out_started_at,
          opted_out_at: r.opted_out_at,
        }));
        mapped.sort((a, b) => brokerResultPriority(a.state) - brokerResultPriority(b.state));
        setInlineBrokers(mapped);
      }
    } catch (err) {
      console.error("Error loading broker details:", err);
    } finally {
      setBrokersLoading(false);
    }
  }, [inlineBrokers.length]);

  useEffect(() => {
    if (brokerExpanded && inlineBrokers.length === 0) {
      loadBrokerDetails();
    }
  }, [brokerExpanded, loadBrokerDetails]);

  // Handle removal click
  const handleRemoveClick = async (broker: InlineBroker) => {
    if (broker.opt_out_url) {
      window.open(broker.opt_out_url, "_blank", "noopener,noreferrer");
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (!broker.opt_out_started_at && !broker.opted_out_at) {
        await supabase
          .from("broker_scan_results")
          .update({ opt_out_started_at: new Date().toISOString() } as any)
          .eq("id", broker.id)
          .eq("user_id", session.user.id)
          .is("opt_out_started_at", null)
          .is("opted_out_at", null);
      }

      setInlineBrokers((prev) =>
        prev.map((b) =>
          b.id === broker.id
            ? { ...b, opt_out_started_at: new Date().toISOString(), state: "removal_started" as BrokerResultState }
            : b
        )
      );
    } catch {
      // non-critical
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 rounded-lg bg-muted animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 h-[160px]" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatDate = (d: string | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // --- Risk badge ---
  const riskConfig: Record<string, { label: string; className: string; Icon: typeof Shield }> = {
    high: {
      label: "High Risk",
      className: "bg-destructive/10 text-destructive border-destructive/30",
      Icon: AlertTriangle,
    },
    moderate: {
      label: "Moderate Risk",
      className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      Icon: AlertTriangle,
    },
    low: {
      label: "Low Risk",
      className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
      Icon: CheckCircle,
    },
    pending: {
      label: "Scan In Progress",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      Icon: Loader2,
    },
  };
  const risk = riskConfig[data.overall_risk] || riskConfig.low;

  // --- Broker severity ---
  const brokerSeverity: Severity = (() => {
    const s = data.brokers.status;
    if (!s) return "empty";
    if (s === "running" || s === "pending") return "running";
    if (data.brokers.found > 0) return "danger";
    return "ok";
  })();

  // --- Format top brokers ---
  const formatTopBrokers = () => {
    const brokers = data.brokers.top_brokers || [];
    if (brokers.length === 0) return null;
    const shown = brokers.slice(0, 3).map((b) => {
      const label =
        b.status === "possible_match" ? "possible"
        : b.status === "found" ? "exposed"
        : "unverified";
      return `${b.name} (${label})`;
    });
    const remaining = Math.max(0, data.brokers.exposed_result_count - shown.length);
    if (remaining > 0) shown.push(`+${remaining} more`);
    return shown.join(", ");
  };

  // --- Tile data ---
  const accountsDetails = (() => {
    if (data.accounts.count === 0 && !data.accounts.last_scan)
      return "Connect your email to discover accounts";
    if (data.accounts.count === 0)
      return "No accounts discovered yet";
    if (data.accounts.new_since_last_scan > 0)
      return `${data.accounts.new_since_last_scan} new since last scan`;
    return "Services discovered from your inbox scan";
  })();

  const brokerDetails = (() => {
    if (brokerSeverity === "running") return "Scan in progress…";
    if (data.brokers.found > 0) return formatTopBrokers() || "Exposures found — view full results";
    if (data.brokers.last_scan) return `No broker listings found across ${data.brokers.total_checked} checked`;
    return "Check if your info appears on data broker sites";
  })();

  const brokerActionLabel = (() => {
    if (brokerSeverity === "running") return "View progress";
    if (data.brokers.last_scan) {
      return data.brokers.found > 0 ? "Remove my data" : "View results";
    }
    return "Run check";
  })();

  const breachesSeverity: Severity = (() => {
    if (!data.breaches.last_scan) return "empty";
    if (data.breaches.critical > 0 || data.breaches.high > 0) return "danger";
    if (data.breaches.total > 0) return "warn";
    return "ok";
  })();

  // Non-broker tiles (accounts + breaches)
  const sideTiles = [
    {
      key: "accounts",
      icon: Mail,
      title: "Online Accounts",
      metric: data.accounts.count,
      metricLabel: data.accounts.count === 1 ? "account found" : "accounts found",
      severity: (data.accounts.count > 30 ? "warn" : data.accounts.count > 0 ? "ok" : "empty") as Severity,
      lastScan: formatDate(data.accounts.last_scan),
      details: accountsDetails,
      action: () =>
        data.accounts.count > 0
          ? document.getElementById("services-grid")?.scrollIntoView({ behavior: "smooth" })
          : navigate("/settings"),
      actionLabel: data.accounts.count > 0 ? "View accounts" : "Connect email",
    },
    {
      key: "breaches",
      icon: ShieldAlert,
      title: "Data Breaches",
      metric: data.breaches.total,
      metricLabel: data.breaches.total === 1 ? "exposure found" : "exposures found",
      severity: breachesSeverity,
      lastScan: formatDate(data.breaches.last_scan),
      details:
        data.breaches.total > 0
          ? `${data.breaches.critical + data.breaches.high} high severity`
          : data.breaches.last_scan
            ? "No breaches detected"
            : "Check if your email appeared in known data leaks",
      action: () => navigate("/exposure-scan"),
      actionLabel: data.breaches.last_scan
        ? data.breaches.total > 0
          ? "View exposures"
          : "View results"
        : "Run check",
    },
  ];

  const severityStyles: Record<Severity, {
    border: string;
    iconBg: string;
    iconColor: string;
    metricColor: string;
  }> = {
    danger: {
      border: "border-destructive/30",
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      metricColor: "text-destructive",
    },
    warn: {
      border: "border-amber-500/30",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
      metricColor: "text-amber-600 dark:text-amber-400",
    },
    ok: {
      border: "border-green-500/30",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600 dark:text-green-400",
      metricColor: "text-green-600 dark:text-green-400",
    },
    running: {
      border: "border-blue-500/30",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600 dark:text-blue-400",
      metricColor: "text-blue-600 dark:text-blue-400",
    },
    empty: {
      border: "border-border",
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      metricColor: "text-muted-foreground",
    },
  };

  const RiskIcon = risk.Icon;
  const brokerStyle = severityStyles[brokerSeverity];
  const isRunningBroker = brokerSeverity === "running";

  // Inline broker breakdown
  const actionNeeded = inlineBrokers.filter((b) => b.state === "found" || b.state === "possible");
  const removalStarted = inlineBrokers.filter((b) => b.state === "removal_started");
  const optedOut = inlineBrokers.filter((b) => b.state === "opted_out");

  return (
    <div className="space-y-4">
      {/* Overall Risk Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Privacy Snapshot
        </h2>
        <Badge
          variant="outline"
          className={`text-xs font-medium px-3 py-1 gap-1.5 ${risk.className}`}
        >
          <RiskIcon className={`w-3.5 h-3.5 ${data.overall_risk === "pending" ? "animate-spin" : ""}`} />
          {risk.label}
        </Badge>
      </div>

      {/* Broker Exposure — full-width expandable card */}
      <Card className={`transition-all ${brokerStyle.border}`}>
        <CardContent className="p-5 space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${brokerStyle.iconBg}`}>
                {isRunningBroker ? (
                  <Loader2 className={`w-5 h-5 ${brokerStyle.iconColor} animate-spin`} />
                ) : (
                  <UserSearch className={`w-5 h-5 ${brokerStyle.iconColor}`} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Broker Exposure</span>
                  {data.brokers.found > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {data.brokers.found} found
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {lastCheckedAt ? (
                    <span className="text-[11px] text-muted-foreground">
                      Checked {formatDistanceToNow(new Date(lastCheckedAt), { addSuffix: true })}
                    </span>
                  ) : data.brokers.last_scan ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {formatDate(data.brokers.last_scan)}
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Never scanned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {data.brokers.last_scan && data.brokers.found > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBrokerExpanded(!brokerExpanded)}
                  className="text-xs text-muted-foreground"
                >
                  {brokerExpanded ? "Collapse" : "Expand"}
                  {brokerExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 ml-1" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  )}
                </Button>
              )}
              <Button
                onClick={() => navigate("/broker-scan")}
                variant={brokerSeverity === "danger" ? "default" : "outline"}
                size="sm"
              >
                {brokerActionLabel}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>

          {/* Summary line */}
          {!brokerExpanded && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {brokerDetails}
            </p>
          )}

          {/* Expanded inline broker results */}
          {brokerExpanded && (
            <div className="space-y-3 pt-1 border-t border-border">
              {brokersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* No exposures */}
                  {actionNeeded.length === 0 && optedOut.length === 0 && inlineBrokers.length > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">No broker listings found</p>
                        <p className="text-xs text-muted-foreground">
                          Your info wasn't found on any of the brokers we checked.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* All opted out */}
                  {actionNeeded.length === 0 && optedOut.length > 0 && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">All removals requested</p>
                        <p className="text-xs text-muted-foreground">
                          Removal requested from {optedOut.length} broker{optedOut.length !== 1 ? "s" : ""}.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Actionable brokers */}
                  {actionNeeded.slice(0, 5).map((broker) => {
                    const isExposed = broker.state === "found";
                    const dataTypes = getDataTypes(broker);

                    return (
                      <div
                        key={broker.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          isExposed
                            ? "border-destructive/20 bg-destructive/5"
                            : "border-amber-500/20 bg-amber-500/5"
                        }`}
                      >
                        <div className={`p-1.5 rounded-md shrink-0 ${isExposed ? "bg-destructive/10" : "bg-amber-500/10"}`}>
                          {isExposed ? (
                            <ShieldAlert className="h-4 w-4 text-destructive" />
                          ) : (
                            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{broker.broker_name}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                isExposed
                                  ? "bg-destructive/10 text-destructive border-destructive/30"
                                  : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              }`}
                            >
                              {isExposed ? "Exposed" : "Possible"}
                            </Badge>
                          </div>
                          {dataTypes.length > 0 && (
                            <div className="flex items-center gap-2 mt-0.5">
                              {dataTypes.map(({ icon: Icon, label }) => (
                                <span key={label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Icon className="h-2.5 w-2.5" />
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {broker.opt_out_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 text-xs h-8"
                            onClick={() => handleRemoveClick(broker)}
                          >
                            {broker.state === "removal_started" ? "Continue removal" : "Remove"}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    );
                  })}

                  {/* Status summaries */}
                  {(removalStarted.length > 0 || optedOut.length > 0) && actionNeeded.length > 0 && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                      {removalStarted.length > 0 && (
                        <span>⏳ Removal started for {removalStarted.length}</span>
                      )}
                      {optedOut.length > 0 && (
                        <span>✓ Removed from {optedOut.length}</span>
                      )}
                    </div>
                  )}

                  {/* Link to full page */}
                  {actionNeeded.length > 5 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => navigate("/broker-scan")}
                      className="text-primary text-xs px-0"
                    >
                      View all {actionNeeded.length} broker results →
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account + Breach tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sideTiles.map((tile) => {
          const style = severityStyles[tile.severity];
          const TileIcon = tile.icon;
          const isRunning = tile.severity === "running";

          return (
            <Card
              key={tile.key}
              className={`transition-all hover:shadow-md ${style.border}`}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${style.iconBg}`}>
                      {isRunning ? (
                        <Loader2 className={`w-4 h-4 ${style.iconColor} animate-spin`} />
                      ) : (
                        <TileIcon className={`w-4 h-4 ${style.iconColor}`} />
                      )}
                    </div>
                    <span className="font-medium text-sm text-foreground">
                      {tile.title}
                    </span>
                  </div>
                  {tile.lastScan ? (
                    <Badge variant="secondary" className="text-[10px]">
                      {tile.lastScan}
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">Never scanned</span>
                  )}
                </div>

                <div>
                  {isRunning ? (
                    <span className={`text-sm font-medium ${style.metricColor}`}>
                      Scanning…
                    </span>
                  ) : (
                    <>
                      <span className={`text-2xl font-bold ${style.metricColor}`}>
                        {tile.metric}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1.5">
                        {tile.metricLabel}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {tile.details}
                </p>

                <Button
                  onClick={tile.action}
                  variant={tile.severity === "danger" ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                >
                  {tile.actionLabel}
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
