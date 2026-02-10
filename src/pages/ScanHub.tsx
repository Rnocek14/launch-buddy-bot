import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Shield, UserSearch, CheckCircle, ArrowRight, Loader2, RefreshCw } from "lucide-react";

interface ScanCardData {
  lastRun: string | null;
  metric: number;
  error: boolean;
}

interface ScanStatus {
  inbox: ScanCardData;
  peopleSearch: ScanCardData;
  breach: ScanCardData;
}

const EMPTY: ScanCardData = { lastRun: null, metric: 0, error: false };
const ERRORED: ScanCardData = { lastRun: null, metric: 0, error: true };

export default function ScanHub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ScanStatus>({
    inbox: EMPTY,
    peopleSearch: EMPTY,
    breach: EMPTY,
  });

  const loadStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const [servicesRes, brokerRes, exposureRes, profileRes] = await Promise.allSettled([
        supabase
          .from("user_services")
          .select("service_id", { count: "exact", head: true })
          .eq("user_id", session.user.id),
        supabase
          .from("broker_scans")
          .select("completed_at, found_count")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("exposure_scans")
          .select("completed_at, total_findings")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("profiles")
          .select("last_email_scan_date")
          .eq("id", session.user.id)
          .maybeSingle(),
      ]);

      const sData = servicesRes.status === "fulfilled" ? servicesRes.value : null;
      const bData = brokerRes.status === "fulfilled" ? brokerRes.value : null;
      const eData = exposureRes.status === "fulfilled" ? exposureRes.value : null;
      const pData = profileRes.status === "fulfilled" ? profileRes.value : null;

      setStatus({
        inbox: sData && pData
          ? { lastRun: pData.data?.last_email_scan_date || null, metric: sData.count || 0, error: false }
          : ERRORED,
        peopleSearch: bData
          ? { lastRun: bData.data?.[0]?.completed_at || null, metric: bData.data?.[0]?.found_count || 0, error: false }
          : ERRORED,
        breach: eData
          ? { lastRun: eData.data?.[0]?.completed_at || null, metric: eData.data?.[0]?.total_findings || 0, error: false }
          : ERRORED,
      });
    } catch (err) {
      console.error("Error loading scan status:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const scans = [
    {
      icon: Mail,
      title: "Inbox Scan",
      description: "Find services linked to your email — signups, subscriptions, and old accounts.",
      statusText: status.inbox.lastRun
        ? `${status.inbox.metric} accounts found`
        : null,
      lastRun: formatDate(status.inbox.lastRun),
      action: () => navigate("/dashboard"),
      actionLabel: status.inbox.lastRun ? "View Results" : "Start Scan",
      done: !!status.inbox.lastRun,
      error: status.inbox.error,
    },
    {
      icon: UserSearch,
      title: "People Search Check",
      description: "See if your name and address appear on data broker websites like Spokeo or Whitepages.",
      statusText: status.peopleSearch.lastRun
        ? `Found on ${status.peopleSearch.metric} site${status.peopleSearch.metric !== 1 ? "s" : ""}`
        : null,
      lastRun: formatDate(status.peopleSearch.lastRun),
      action: () => navigate("/broker-scan"),
      actionLabel: status.peopleSearch.lastRun ? "View Results" : "Run Check",
      done: !!status.peopleSearch.lastRun,
      error: status.peopleSearch.error,
    },
    {
      icon: Shield,
      title: "Breach Check",
      description: "Check if your email appeared in any known data leaks or security breaches.",
      statusText: status.breach.lastRun
        ? `${status.breach.metric} exposure${status.breach.metric !== 1 ? "s" : ""} found`
        : null,
      lastRun: formatDate(status.breach.lastRun),
      action: () => navigate("/exposure-scan"),
      actionLabel: status.breach.lastRun ? "View Results" : "Run Check",
      done: !!status.breach.lastRun,
      error: status.breach.error,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Your Privacy Scans</h1>
          <p className="text-muted-foreground mt-2">
            Run these checks to understand where your personal data is exposed.
          </p>
        </div>

        <div className="space-y-4">
          {scans.map((scan) => (
            <Card
              key={scan.title}
              className={`transition-all hover:shadow-md ${
                scan.error
                  ? "border-destructive/30"
                  : scan.done
                    ? "border-border"
                    : "border-primary/30 shadow-sm"
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      scan.error
                        ? "bg-destructive/10 text-destructive"
                        : scan.done
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-primary/10 text-primary"
                    }`}
                  >
                    {scan.error ? (
                      <RefreshCw className="w-6 h-6" />
                    ) : scan.done ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <scan.icon className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg text-foreground">{scan.title}</h3>
                      {scan.lastRun && (
                        <Badge variant="secondary" className="text-xs">
                          Last: {scan.lastRun}
                        </Badge>
                      )}
                    </div>
                    {scan.error ? (
                      <p className="text-sm text-muted-foreground">
                        Couldn't load this right now.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {scan.description}
                        </p>
                        {scan.statusText && (
                          <p className="text-sm font-medium text-foreground">{scan.statusText}</p>
                        )}
                      </>
                    )}
                  </div>

                  {scan.error ? (
                    <Button
                      onClick={loadStatus}
                      variant="outline"
                      size="lg"
                      className="shrink-0 self-center min-h-[44px]"
                    >
                      Try again
                    </Button>
                  ) : (
                    <Button
                      onClick={scan.action}
                      variant={scan.done ? "outline" : "default"}
                      size="lg"
                      className="shrink-0 self-center min-h-[44px]"
                    >
                      {scan.actionLabel}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Tip:</strong> Start with the Inbox Scan — it usually finds 20-50+ accounts you forgot about.
          </p>
        </div>
      </div>

      <MobileBottomNav
        selectedCount={0}
        onClear={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
}
