import { useEffect, useState } from "react";
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
}

export function BrokerExposureSection() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [brokers, setBrokers] = useState<ExposedBroker[]>([]);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    loadBrokerResults();
  }, []);

  async function loadBrokerResults() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      // Check subscription tier via edge function
      let tierValue = "free";
      try {
        const { data: subData } = await supabase.functions.invoke(
          "check-subscription"
        );
        tierValue = subData?.tier || "free";
      } catch {
        // fallback to free
      }
      setIsComplete(tierValue === "complete");

      // Get latest scan
      const { data: scanData } = await supabase
        .from("broker_scans")
        .select("id, status, completed_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!scanData || scanData.status !== "completed") {
        setScanCompleted(false);
        setLoading(false);
        return;
      }

      setScanCompleted(true);

      // Get all results with broker details — exposed + possible first
      const { data: results } = await supabase
        .from("broker_scan_results")
        .select(
          `
          id, status, status_v2, confidence, extracted_data, opted_out_at,
          data_brokers!broker_scan_results_broker_id_fkey (
            name, slug, website, opt_out_url, opt_out_difficulty
          )
        `
        )
        .eq("user_id", session.user.id)
        .order("confidence", { ascending: false });

      if (results) {
        const mapped: ExposedBroker[] = results.map((r: any) => ({
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
        }));

        // Sort: exposed first, then possible, then opted out
        const priority = (b: ExposedBroker) => {
          if (b.opted_out_at) return 3;
          if (b.status_v2 === "found" || b.status === "found") return 0;
          if (b.status_v2 === "possible_match") return 1;
          return 2;
        };
        mapped.sort((a, b) => priority(a) - priority(b));

        setBrokers(mapped);
      }
    } catch (err) {
      console.error("Error loading broker results:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Not on Complete plan — show upgrade CTA
  if (!isComplete) {
    return (
      <Card className="border-accent/20 bg-gradient-to-br from-card to-accent/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-accent/10 shrink-0">
              <UserSearch className="h-6 w-6 text-accent" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Data Broker Exposure</h3>
                <Badge className="bg-accent text-accent-foreground text-xs">
                  COMPLETE
                </Badge>
              </div>
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
    );
  }

  // Complete plan but no scan yet
  if (!scanCompleted) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <UserSearch className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-lg">Data Broker Exposure</h3>
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
    );
  }

  // Scan completed — show results inline
  const exposed = brokers.filter(
    (b) =>
      !b.opted_out_at &&
      (b.status_v2 === "found" || (!b.status_v2 && b.status === "found"))
  );
  const possible = brokers.filter(
    (b) => !b.opted_out_at && b.status_v2 === "possible_match"
  );
  const optedOut = brokers.filter((b) => !!b.opted_out_at);
  const actionNeeded = [...exposed, ...possible];

  const getDataTypes = (b: ExposedBroker) => {
    const types: { icon: typeof MapPin; label: string }[] = [];
    if (b.extracted_data?.addresses?.length)
      types.push({ icon: MapPin, label: "Address" });
    if (b.extracted_data?.phone_numbers?.length)
      types.push({ icon: Phone, label: "Phone" });
    if (b.extracted_data?.relatives?.length)
      types.push({ icon: Users, label: "Relatives" });
    return types;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Data Broker Exposure
          </h2>
          {actionNeeded.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {actionNeeded.length} require action
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/broker-scan")}
          className="text-xs text-muted-foreground"
        >
          Manage Broker Exposure
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {/* No exposures — great news */}
      {actionNeeded.length === 0 && optedOut.length === 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10 shrink-0">
              <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">No broker listings found</h3>
              <p className="text-sm text-muted-foreground">
                Great news — we didn't find your information on any of the
                brokers we checked.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All opted out */}
      {actionNeeded.length === 0 && optedOut.length > 0 && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10 shrink-0">
              <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
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
            const isExposed =
              broker.status_v2 === "found" ||
              (!broker.status_v2 && broker.status === "found");
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
                    {/* Status icon */}
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isExposed
                          ? "bg-destructive/10"
                          : "bg-amber-500/10"
                      }`}
                    >
                      {isExposed ? (
                        <ShieldAlert className="h-5 w-5 text-destructive" />
                      ) : (
                        <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      )}
                    </div>

                    {/* Broker info */}
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
                      {/* Data types found */}
                      {dataTypes.length > 0 && (
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
                      )}
                      {dataTypes.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {broker.broker_website}
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    {broker.opt_out_url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        asChild
                      >
                        <a
                          href={broker.opt_out_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Remove
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
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

          {/* Link to full view */}
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

      {/* Show opted-out count if there are some */}
      {optedOut.length > 0 && actionNeeded.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          ✓ Already removed from {optedOut.length} broker
          {optedOut.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
