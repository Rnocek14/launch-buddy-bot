import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  ArrowRight,
  Loader2,
  MapPin,
  Phone,
  Users,
  Crown,
  ExternalLink,
  UserSearch,
} from "lucide-react";
import { getBrokerResultState, brokerResultPriority, type BrokerResultState } from "@/lib/brokerResultState";
import { formatDistanceToNow } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExposedBroker {
  id: string;
  broker_name: string;
  broker_slug: string;
  broker_website: string;
  opt_out_url: string | null;
  opt_out_difficulty: string | null;
  status: string;
  status_v2: string;
  confidence: number | null;
  extracted_data: {
    addresses?: string[];
    phone_numbers?: string[];
    relatives?: string[];
  } | null;
  opted_out_at: string | null;
  opt_out_started_at: string | null;
  state: BrokerResultState; // derived
  is_new: boolean; // discovered/updated since last alert
}

// ---------------------------------------------------------------------------
// Sub-components for consistent layout
// ---------------------------------------------------------------------------

function SectionHeader({ badge, cta, lastChecked }: { badge?: React.ReactNode; cta?: React.ReactNode; lastChecked?: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Data Broker Exposure
        </h2>
        {badge}
        {lastChecked && (
          <span className="text-[10px] text-muted-foreground/60">
            Checked {formatDistanceToNow(new Date(lastChecked), { addSuffix: true })}
          </span>
        )}
      </div>
      {cta}
    </div>
  );
}

function SectionIcon({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-3 rounded-xl shrink-0 ${className}`}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Data type icons
// ---------------------------------------------------------------------------

function getDataTypes(b: ExposedBroker) {
  const types: { icon: typeof MapPin; label: string }[] = [];
  if (b.extracted_data?.addresses?.length) types.push({ icon: MapPin, label: "Address" });
  if (b.extracted_data?.phone_numbers?.length) types.push({ icon: Phone, label: "Phone" });
  if (b.extracted_data?.relatives?.length) types.push({ icon: Users, label: "Relatives" });
  return types;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BrokerExposureSection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [brokers, setBrokers] = useState<ExposedBroker[]>([]);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  // Subscribe to auth state so we re-load when the user logs in after mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionReady(!!session);
      // Clear stale data on sign-out
      if (!session) {
        setBrokers([]);
        setScanCompleted(false);
        setIsComplete(false);
        setLastCheckedAt(null);
        setLoading(false);
      }
    });
    // Also check immediately
    supabase.auth.getSession().then(({ data: { session } }) => setSessionReady(!!session));
    return () => subscription.unsubscribe();
  }, []);

  // Re-load data whenever session becomes ready
  useEffect(() => {
    if (sessionReady) {
      loadBrokerResults();
    }
  }, [sessionReady]);

  const loadBrokerResults = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Entitlements via server-authoritative edge function
      let tierValue = "free";
      try {
        const { data: subData } = await supabase.functions.invoke("check-subscription");
        tierValue = subData?.tier || "free";
      } catch {
        // fallback
      }
      setIsComplete(tierValue === "complete");

      // Get latest scan
      const { data: scanData } = await supabase
        .from("broker_scans")
        .select("id, status, completed_at, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!scanData || scanData.status !== "completed") {
        setScanCompleted(false);
        return;
      }

      setScanCompleted(true);
      setLastCheckedAt(scanData.completed_at ?? scanData.created_at);

      // Get the last alert timestamp — anything updated after this is "new"
      const { data: lastAlert } = await supabase
        .from("exposure_alerts")
        .select("sent_at")
        .eq("user_id", session.user.id)
        .order("sent_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const lastAlertTs = lastAlert?.sent_at ? new Date(lastAlert.sent_at).getTime() : 0;

      // Get results — filter by user only (schema has no scan_id FK on results)
      const { data: results } = await supabase
        .from("broker_scan_results")
        .select(`
          id, status, status_v2, confidence, extracted_data, opted_out_at, opt_out_started_at, updated_at,
          data_brokers!broker_scan_results_broker_id_fkey (
            name, slug, website, opt_out_url, opt_out_difficulty
          )
        `)
        .eq("user_id", session.user.id)
        .order("confidence", { ascending: false });

      if (results) {
        const mapped: ExposedBroker[] = results.map((r: any) => {
          const state = getBrokerResultState({
            status: r.status,
            status_v2: r.status_v2,
            opted_out_at: r.opted_out_at,
            opt_out_started_at: r.opt_out_started_at,
          });
          const updatedTs = r.updated_at ? new Date(r.updated_at).getTime() : 0;
          const isExposureState = state === "found" || state === "possible";
          return {
            id: r.id,
            broker_name: r.data_brokers?.name || "Unknown",
            broker_slug: r.data_brokers?.slug || "",
            broker_website: r.data_brokers?.website || "",
            opt_out_url: r.data_brokers?.opt_out_url,
            opt_out_difficulty: r.data_brokers?.opt_out_difficulty,
            status: r.status,
            status_v2: r.status_v2,
            confidence: r.confidence,
            extracted_data: r.extracted_data,
            opted_out_at: r.opted_out_at,
            opt_out_started_at: r.opt_out_started_at,
            state,
            is_new: isExposureState && updatedTs > lastAlertTs && lastAlertTs > 0,
          };
        });

        mapped.sort((a, b) => brokerResultPriority(a.state) - brokerResultPriority(b.state));
        setBrokers(mapped);
      }
    } catch (err) {
      console.error("Error loading broker results:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Handle "Started removal" tracking
  // -----------------------------------------------------------------------
  const handleRemoveClick = async (broker: ExposedBroker) => {
    // Open the opt-out URL
    if (broker.opt_out_url) {
      window.open(broker.opt_out_url, "_blank", "noopener,noreferrer");
    }

    // Optimistically mark removal started in the DB (NOT opted_out_at — that's for confirmed removal)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Only set opt_out_started_at if not already started and not already confirmed
      if (!broker.opt_out_started_at && !broker.opted_out_at) {
        await supabase
          .from("broker_scan_results")
          .update({ opt_out_started_at: new Date().toISOString() } as any)
          .eq("id", broker.id)
          .eq("user_id", session.user.id)
          .is("opt_out_started_at", null)
          .is("opted_out_at", null);
      }

      // Update local state
      setBrokers((prev) =>
        prev.map((b) =>
          b.id === broker.id ? { ...b, opt_out_started_at: new Date().toISOString(), state: "removal_started" as BrokerResultState } : b
        )
      );
    } catch {
      // non-critical
    }
  };

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-3">
        <SectionHeader />
        <Card>
          <CardContent className="p-6 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Not on Complete plan — upgrade CTA (consistent layout)
  // -----------------------------------------------------------------------
  if (!isComplete) {
    return (
      <div className="space-y-3">
        <SectionHeader
          badge={
            <Badge className="bg-accent text-accent-foreground text-xs">COMPLETE</Badge>
          }
        />
        <Card className="border-accent/20 bg-gradient-to-br from-card to-accent/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <SectionIcon className="bg-accent/10">
                <UserSearch className="h-6 w-6 text-accent" />
              </SectionIcon>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Check if data brokers like Spokeo or Whitepages are publicly
                  listing your name, address, and phone number.
                </p>
              </div>
              <Button
                onClick={() => navigate("/subscribe?tier=complete")}
                className="bg-gradient-to-r from-accent to-primary shrink-0"
              >
                <Crown className="h-4 w-4 mr-2" />
                Unlock
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Complete plan but no scan yet
  // -----------------------------------------------------------------------
  if (!scanCompleted) {
    return (
      <div className="space-y-3">
        <SectionHeader />
        <Card className="border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <SectionIcon className="bg-primary/10">
                <UserSearch className="h-6 w-6 text-primary" />
              </SectionIcon>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-muted-foreground">
                  You haven't run a broker check yet. See if your personal
                  information is listed on 20+ data broker sites.
                </p>
              </div>
              <Button onClick={() => navigate("/broker-scan")} className="shrink-0">
                Run Check
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Scan completed — show results inline
  // -----------------------------------------------------------------------
  const actionNeeded = brokers.filter((b) => b.state === "found" || b.state === "possible");
  const optedOut = brokers.filter((b) => b.state === "opted_out");
  const removalStarted = brokers.filter((b) => b.state === "removal_started");

  return (
    <div className="space-y-3">
      <SectionHeader
        lastChecked={lastCheckedAt}
        badge={
          actionNeeded.length > 0 ? (
            <Badge variant="destructive" className="text-xs">
              {actionNeeded.length} require action
            </Badge>
          ) : undefined
        }
        cta={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/broker-scan")}
            className="text-xs text-muted-foreground"
          >
            Manage Broker Exposure
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        }
      />

      {/* No exposures — great news */}
      {actionNeeded.length === 0 && optedOut.length === 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-5 flex items-center gap-4">
            <SectionIcon className="bg-green-500/10">
              <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </SectionIcon>
            <div className="flex-1">
              <h3 className="font-semibold">No broker listings found</h3>
              <p className="text-sm text-muted-foreground">
                Great news — we didn't find your information on any of the brokers we checked.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All opted out */}
      {actionNeeded.length === 0 && optedOut.length > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-5 flex items-center gap-4">
            <SectionIcon className="bg-green-500/10">
              <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </SectionIcon>
            <div className="flex-1">
              <h3 className="font-semibold">All removals requested</h3>
              <p className="text-sm text-muted-foreground">
                You've requested removal from all {optedOut.length} broker
                {optedOut.length !== 1 ? "s" : ""} where your data was found.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exposed brokers — inline cards */}
      {actionNeeded.length > 0 && (
        <div className="space-y-3">
          {actionNeeded.map((broker) => {
            const isExposed = broker.state === "found";
            const dataTypes = getDataTypes(broker);

            return (
              <Card
                key={broker.id}
                className={`transition-all hover:shadow-md ${
                  isExposed
                    ? "border-destructive/30 bg-destructive/5"
                    : "border-amber-500/30 bg-amber-500/5"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isExposed ? "bg-destructive/10" : "bg-amber-500/10"
                      }`}
                    >
                      {isExposed ? (
                        <ShieldAlert className="h-5 w-5 text-destructive" />
                      ) : (
                        <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{broker.broker_name}</h4>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isExposed
                              ? "bg-destructive/10 text-destructive border-destructive/30"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                          }`}
                        >
                          {isExposed ? "Exposed" : "Possible"}
                        </Badge>
                      </div>
                      {dataTypes.length > 0 ? (
                        <div className="flex items-center gap-3 mt-1">
                          {dataTypes.map(({ icon: Icon, label }) => (
                            <span
                              key={label}
                              className="flex items-center gap-1 text-xs text-muted-foreground"
                            >
                              <Icon className="h-3 w-3" />
                              {label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-1">
                          {broker.broker_website}
                        </p>
                      )}
                    </div>

                    {/* Action — Remove / Continue removal */}
                    {broker.opt_out_url ? (
                      <div className="shrink-0 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveClick(broker)}
                        >
                          {broker.state === "removal_started" ? "Continue" : "Remove"}
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {broker.state === "removal_started" ? "Removal started" : "Opens opt-out page"}
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => navigate("/broker-scan")}
                      >
                        View Details
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="text-center pt-1">
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate("/broker-scan")}
              className="text-primary"
            >
              View all broker results & opt-out guides →
            </Button>
          </div>
        </div>
      )}

      {/* Removal started count */}
      {removalStarted.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          ⏳ Removal started for {removalStarted.length} broker
          {removalStarted.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Opted-out count */}
      {optedOut.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          ✓ Confirmed removed from {optedOut.length} broker
          {optedOut.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
