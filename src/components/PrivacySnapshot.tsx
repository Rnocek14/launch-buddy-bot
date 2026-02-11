import { useEffect, useState } from "react";
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
} from "lucide-react";

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

type Severity = "danger" | "warn" | "ok" | "empty" | "running";

export function PrivacySnapshot() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SnapshotData | null>(null);

  useEffect(() => {
    loadSnapshot();
  }, []);

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

  const tiles = [
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
      key: "brokers",
      icon: UserSearch,
      title: "Broker Exposure",
      metric: data.brokers.found,
      metricLabel: data.brokers.found === 1 ? "broker has your data" : "brokers have your data",
      severity: brokerSeverity,
      lastScan: formatDate(data.brokers.last_scan) || (brokerSeverity === "running" ? `In progress${data.brokers.scan_started ? ` • started ${formatDate(data.brokers.scan_started)}` : ""}` : null),
      details: brokerDetails,
      action: () => navigate("/broker-scan"),
      actionLabel: brokerActionLabel,
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

      {/* Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map((tile) => {
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
