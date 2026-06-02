import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Loader2, CheckCircle2, AlertTriangle, Shield, ArrowRight, Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { startCheckout } from "@/lib/checkout";
import { STRIPE_PRICES } from "@/config/pricing";
import { useToast } from "@/hooks/use-toast";

type BrokerStatus = "found" | "possible_match" | "not_found" | "unknown";

interface BrokerResult {
  slug: string;
  name: string;
  domain: string;
  status: BrokerStatus;
  confidence: number | null;
  profileUrl: string | null;
}

interface LiveBrokerCheckProps {
  email: string;
  /** Reports confirmed/possible counts up so the top summary can reflect reality. */
  onResults?: (findings: { confirmedCount: number; possibleCount: number }) => void;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export function LiveBrokerCheck({ email, onResults }: LiveBrokerCheckProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [results, setResults] = useState<BrokerResult[] | null>(null);
  const [error, setError] = useState("");

  const runCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const parts = fullName.trim().split(/\s+/);
    if (parts.length < 2) {
      setError("Please enter your first and last name.");
      return;
    }
    setError("");
    setLoading(true);
    trackEvent("broker_check_started", { source: "free_scan" });

    const firstName = parts[0];
    const lastName = parts.slice(1).join(" ");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("free-broker-check", {
        body: { firstName, lastName, city: city.trim(), state },
      });
      if (fnError || !data?.results) {
        throw new Error(fnError?.message || "Check failed");
      }
      const brokerResults = data.results as BrokerResult[];
      setResults(brokerResults);
      const confirmedCount = brokerResults.filter((r) => r.status === "found").length;
      const possibleCount = brokerResults.filter((r) => r.status === "possible_match").length;
      onResults?.({ confirmedCount, possibleCount });
      trackEvent("broker_check_completed", {
        source: "free_scan",
        found_count: data.foundCount,
        possible_count: data.possibleCount,
      });
    } catch (err: any) {
      console.error("free-broker-check error", err);
      setError("We couldn't complete the check right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setCheckoutLoading(true);
    const res = await startCheckout({
      priceId: STRIPE_PRICES.COMPLETE_ANNUAL.id,
      email,
      source: "broker_exposure",
      tier: "complete",
    });
    if (res.status === "error") {
      toast({ title: "Couldn't start checkout", description: res.message, variant: "destructive" });
      setCheckoutLoading(false);
    } else if (res.status === "needs_email") {
      toast({ title: "Email needed", description: "We need your email to start checkout.", variant: "destructive" });
      setCheckoutLoading(false);
    }
  };

  // ---- Results view ----
  if (results) {
    const found = results.filter((r) => r.status === "found");
    const possible = results.filter((r) => r.status === "possible_match");
    const exposedCount = found.length + possible.length;

    return (
      <Card className="overflow-hidden border-2 border-primary/30">
        <CardContent className="p-0">
          <div className="px-6 pt-6 pb-5 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                People-search sites checked
              </span>
            </div>
            <h3 className="text-2xl font-bold">
              {exposedCount > 0
                ? `We found you on ${exposedCount} site${exposedCount === 1 ? "" : "s"}`
                : "No confirmed listings on the sites we checked"}
            </h3>
            {exposedCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {found.length > 0 && <span className="text-foreground font-medium">{found.length} confirmed</span>}
                {found.length > 0 && possible.length > 0 && " · "}
                {possible.length > 0 && <span>{possible.length} possible match{possible.length === 1 ? "" : "es"}</span>}
              </p>
            )}
          </div>

          <div className="divide-y divide-border">
            {results.map((r) => (
              <div key={r.slug} className="flex items-center gap-3 px-6 py-3.5">
                {r.status === "found" && <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />}
                {r.status === "possible_match" && <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />}
                {(r.status === "not_found" || r.status === "unknown") && (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{r.domain}</span>
                </div>
                <span className="text-xs font-medium">
                  {r.status === "found" && <span className="text-red-600 dark:text-red-400">Listed</span>}
                  {r.status === "possible_match" && <span className="text-amber-600 dark:text-amber-400">Possible match</span>}
                  {r.status === "not_found" && <span className="text-muted-foreground">Not found</span>}
                  {r.status === "unknown" && <span className="text-muted-foreground">Inconclusive</span>}
                </span>
              </div>
            ))}
          </div>

          {exposedCount > 0 && (
            <div className="px-6 py-6 bg-gradient-to-b from-primary/5 to-primary/10 border-t border-border space-y-3">
              <p className="text-sm text-muted-foreground">
                These are just {results.length} of 200+ sites. Your full plan scans and removes you from all of them —
                plus continuous monitoring so you don't reappear.
              </p>
              <Button
                size="lg"
                onClick={handleRemove}
                disabled={checkoutLoading}
                className="w-full gap-2 cta-shimmer h-14 text-base"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Opening secure checkout…
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Remove My Information — {STRIPE_PRICES.COMPLETE_ANNUAL.displayPrice}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Account auto-created after payment · 30-day refund · cancel anytime
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ---- CTA / form view ----
  if (!expanded) {
    return (
      <Card className="border-2 border-primary/30 bg-gradient-to-b from-background to-primary/5">
        <CardContent className="p-6 text-center">
          <Search className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-1">Find exactly which sites list you</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
            We'll check the top people-search sites for your real listings. Takes about 10 seconds.
          </p>
          <Button size="lg" onClick={() => setExpanded(true)} className="gap-2">
            <Search className="w-4 h-4" />
            Check My Listings
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/30">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-1">Check which sites list you</h3>
        <p className="text-sm text-muted-foreground mb-5">
          We only use this to search public people-search sites. We don't store it.
        </p>
        <form onSubmit={runCheck} className="space-y-3">
          <Input
            placeholder="Full name (e.g. Jane Smith)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="City (optional)" value={city} onChange={(e) => setCity(e.target.value)} />
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">State (optional)</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-full gap-2 h-12">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Checking people-search sites…
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Check My Listings
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
