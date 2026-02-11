import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail,
  ShieldAlert,
  ShieldCheck,
  UserSearch,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface SnapshotData {
  accounts: {
    count: number;
    lastScan: string | null;
  };
  brokers: {
    found: number;
    clean: number;
    total: number;
    lastScan: string | null;
    topBrokers: Array<{ name: string; hasExposure: boolean }>;
    status: string | null; // 'pending' | 'running' | 'completed' | null
  };
  breaches: {
    total: number;
    critical: number;
    high: number;
    lastScan: string | null;
  };
}

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
      if (!session) return;

      const userId = session.user.id;

      const [servicesRes, brokerScanRes, brokerResultsRes, exposureRes, profileRes] =
        await Promise.all([
          supabase
            .from("user_services")
            .select("service_id", { count: "exact", head: true })
            .eq("user_id", userId),
          supabase
            .from("broker_scans")
            .select("completed_at, found_count, clean_count, total_brokers, status")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("broker_scan_results")
            .select("broker_id, status_v2, data_brokers(name)")
            .eq("user_id", userId)
            .in("status_v2", ["exposed", "possible"])
            .order("confidence", { ascending: false })
            .limit(3),
          supabase
            .from("exposure_scans")
            .select("completed_at, total_findings, critical_findings, high_findings")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1),
          supabase
            .from("profiles")
            .select("last_email_scan_date")
            .eq("id", userId)
            .maybeSingle(),
        ]);

      const brokerScan = brokerScanRes.data?.[0];
      const exposureScan = exposureRes.data?.[0];

      setData({
        accounts: {
          count: servicesRes.count || 0,
          lastScan: profileRes.data?.last_email_scan_date || null,
        },
        brokers: {
          found: brokerScan?.found_count || 0,
          clean: brokerScan?.clean_count || 0,
          total: brokerScan?.total_brokers || 0,
          lastScan: brokerScan?.completed_at || null,
          topBrokers: (brokerResultsRes.data || []).map((r: any) => ({
            name: r.data_brokers?.name || "Unknown",
            hasExposure: true,
          })),
          status: brokerScan?.status || null,
        },
        breaches: {
          total: exposureScan?.total_findings || 0,
          critical: exposureScan?.critical_findings || 0,
          high: exposureScan?.high_findings || 0,
          lastScan: exposureScan?.completed_at || null,
        },
      });
    } catch (err) {
      console.error("Error loading privacy snapshot:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5 h-[160px]" />
          </Card>
        ))}
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

  const tiles = [
    {
      key: "accounts",
      icon: Mail,
      title: "Online Accounts",
      metric: data.accounts.count,
      metricLabel: data.accounts.count === 1 ? "account found" : "accounts found",
      severity: data.accounts.count > 30 ? "warn" : data.accounts.count > 0 ? "ok" : "empty",
      lastScan: formatDate(data.accounts.lastScan),
      details: data.accounts.count > 0
        ? "Services discovered from your inbox scan"
        : "Connect your email to discover accounts",
      action: () => (data.accounts.count > 0 ? document.getElementById("services-grid")?.scrollIntoView({ behavior: "smooth" }) : navigate("/settings")),
      actionLabel: data.accounts.count > 0 ? "View accounts" : "Connect email",
    },
    {
      key: "brokers",
      icon: UserSearch,
      title: "Broker Exposure",
      metric: data.brokers.found,
      metricLabel: data.brokers.found === 1 ? "broker has your data" : "brokers have your data",
      severity:
        !data.brokers.status || data.brokers.status === "pending"
          ? "empty"
          : data.brokers.found > 0
            ? "danger"
            : "ok",
      lastScan: formatDate(data.brokers.lastScan),
      details:
        data.brokers.found > 0
          ? data.brokers.topBrokers.map((b) => b.name).join(", ")
          : data.brokers.lastScan
            ? `Clean across ${data.brokers.total} brokers checked`
            : "Check if your info appears on data broker sites",
      action: () => navigate("/broker-scan"),
      actionLabel: data.brokers.lastScan
        ? data.brokers.found > 0
          ? "Remove my data"
          : "View results"
        : "Run check",
    },
    {
      key: "breaches",
      icon: ShieldAlert,
      title: "Data Breaches",
      metric: data.breaches.total,
      metricLabel: data.breaches.total === 1 ? "exposure found" : "exposures found",
      severity:
        !data.breaches.lastScan
          ? "empty"
          : data.breaches.critical > 0 || data.breaches.high > 0
            ? "danger"
            : data.breaches.total > 0
              ? "warn"
              : "ok",
      lastScan: formatDate(data.breaches.lastScan),
      details:
        data.breaches.total > 0
          ? `${data.breaches.critical + data.breaches.high} high severity`
          : data.breaches.lastScan
            ? "No breaches detected"
            : "Check if your email appeared in known data leaks",
      action: () => navigate("/exposure-scan"),
      actionLabel: data.breaches.lastScan
        ? data.breaches.total > 0
          ? "View exposures"
          : "View results"
        : "Run check",
    },
  ];

  const severityStyles = {
    danger: {
      border: "border-destructive/30",
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      metricColor: "text-destructive",
      Icon: AlertTriangle,
    },
    warn: {
      border: "border-amber-500/30",
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600 dark:text-amber-400",
      metricColor: "text-amber-600 dark:text-amber-400",
      Icon: AlertTriangle,
    },
    ok: {
      border: "border-green-500/30",
      iconBg: "bg-green-500/10",
      iconColor: "text-green-600 dark:text-green-400",
      metricColor: "text-green-600 dark:text-green-400",
      Icon: CheckCircle,
    },
    empty: {
      border: "border-border",
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      metricColor: "text-muted-foreground",
      Icon: null,
    },
  };

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        Privacy Snapshot
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map((tile) => {
          const style = severityStyles[tile.severity as keyof typeof severityStyles];
          const TileIcon = tile.icon;

          return (
            <Card
              key={tile.key}
              className={`transition-all hover:shadow-md ${style.border}`}
            >
              <CardContent className="p-5 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${style.iconBg}`}>
                      <TileIcon className={`w-4 h-4 ${style.iconColor}`} />
                    </div>
                    <span className="font-medium text-sm text-foreground">
                      {tile.title}
                    </span>
                  </div>
                  {tile.lastScan && (
                    <Badge variant="secondary" className="text-[10px]">
                      {tile.lastScan}
                    </Badge>
                  )}
                </div>

                {/* Metric */}
                <div>
                  <span className={`text-2xl font-bold ${style.metricColor}`}>
                    {tile.metric}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1.5">
                    {tile.metricLabel}
                  </span>
                </div>

                {/* Details */}
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {tile.details}
                </p>

                {/* Action */}
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
