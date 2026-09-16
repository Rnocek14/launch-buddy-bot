import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Loader2, CheckCircle2, AlertTriangle, Building2, ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { CompleteCheckoutButton } from "./CompleteCheckoutButton";
import { persistScanIdentity } from "@/lib/checkout";
import { AUTO_SCAN_BROKER_COUNT } from "@/config/brokers";

type BrokerStatus = "found" | "possible_match" | "not_found" | "unknown";

interface BrokerResult {
  slug: string;
  name: string;
  domain: string;
  status: BrokerStatus;
  confidence: number | null;
  profileUrl: string | null;
  /** Personal-data signals the scorer found, e.g. ['street address','phone number']. */
  evidence?: string[];
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
  // The personalized broker reveal is the strongest conversion moment, so the
  // form shows by default — no intermediate "Check My Listings" click to bury it.
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BrokerResult[] | null>(null);
  const [degraded, setDegraded] = useState(false);
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
      // Carry the identity across checkout. Without this the paid scan re-asks for
      // the same three fields, or runs against the buyer's email local-part.
      persistScanIdentity({ fullName: fullName.trim(), city: city.trim(), state });
      setResults(brokerResults);
      setDegraded(Boolean(data.degraded));
      const confirmedCount = brokerResults.filter((r) => r.status === "found").length;
      const possibleCount = brokerResults.filter((r) => r.status === "possible_match").length;
      onResults?.({ confirmedCount, possibleCount });
      trackEvent("broker_check_completed", {
        source: "free_scan",
        found_count: data.foundCount,
        possible_count: data.possibleCount,
        degraded: Boolean(data.degraded),
      });
    } catch (err: any) {
      console.error("free-broker-check error", err);
      setError("We couldn't complete the check right now. Please try again in a moment.");
    } finally {
      setLoading(false);
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
                : degraded
                  ? "We couldn't finish checking every site"
                  : "No confirmed listings on the sites we checked"}
            </h3>
            {exposedCount > 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                {found.length > 0 && <span className="text-foreground font-medium">{found.length} confirmed</span>}
                {found.length > 0 && possible.length > 0 && " · "}
                {possible.length > 0 && <span>{possible.length} possible match{possible.length === 1 ? "" : "es"}</span>}
              </p>
            ) : degraded ? (
              <p className="text-sm text-muted-foreground mt-1">
                A few sites were inconclusive just now — that isn't an all-clear. Your estimated exposure still stands.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                New listings appear all the time, so this can change week to week.
              </p>
            )}
          </div>

          <div className="divide-y divide-border">
            {results.map((r) => (
              <div key={r.slug} className="flex items-start gap-3 px-6 py-3.5">
                {r.status === "found" && <CheckCircle2 className="w-5 h-5 mt-0.5 text-red-600 dark:text-red-400 shrink-0" />}
                {r.status === "possible_match" && <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-500 shrink-0" />}
                {(r.status === "not_found" || r.status === "unknown") && (
                  <div className="w-5 h-5 mt-0.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{r.domain}</span>

                  {/* The evidence is the product. The scorer already knows this page
                      publishes the visitor's address or phone; saying so plainly is both
                      more honest and more persuasive than a grey "Listed" label. */}
                  {r.evidence && r.evidence.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.evidence.map((e) => (
                        <span
                          key={e}
                          className="text-[11px] font-medium rounded px-1.5 py-0.5 bg-red-500/10 text-red-700 dark:text-red-300"
                        >
                          {e}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* A link the visitor can open is the single most convincing thing on
                      this page. It was fetched, passed to the browser and never rendered. */}
                  {r.profileUrl && (
                    <a
                      href={r.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      onClick={() => trackEvent("broker_profile_opened", { broker: r.slug, status: r.status })}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      See the listing
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <span className="text-xs font-medium shrink-0">
                  {r.status === "found" && <span className="text-red-600 dark:text-red-400">Listed</span>}
                  {r.status === "possible_match" && <span className="text-amber-600 dark:text-amber-400">Possible match</span>}
                  {r.status === "not_found" && <span className="text-muted-foreground">Not found</span>}
                  {r.status === "unknown" && <span className="text-muted-foreground">Inconclusive</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Always show a next step — a service failure or a clean scan must never
              dead-end the highest-intent user with no way forward. */}
          <div className="px-6 py-6 bg-gradient-to-b from-primary/5 to-primary/10 border-t border-border space-y-3">
              <p className="text-sm text-muted-foreground">
                {/* We do not submit broker opt-outs for the user. RemediationSection
                    opens each broker's opt-out page and the user confirms when it is
                    done, so this copy promises a guided removal, never an automatic
                    one. Nothing here may say "we remove you". */}
                {exposedCount > 0
                  ? `These are just ${results.length} of the ${AUTO_SCAN_BROKER_COUNT} sites we check. Your full plan scans all of them and walks you through a one-click opt-out for every listing we find.`
                  : degraded
                    ? `We couldn't fully check these ${results.length} public sites right now — people-search sites list most US adults, so this isn't an all-clear. Your full plan scans all ${AUTO_SCAN_BROKER_COUNT} sites and gives you a guided opt-out for whatever turns up.`
                    : `Good news — no confirmed listings on these ${results.length} sites today. But new listings appear constantly. Your full plan checks all ${AUTO_SCAN_BROKER_COUNT} sites whenever you re-run it, with a guided opt-out for anything new.`}
              </p>
              <CompleteCheckoutButton email={email} source="broker_exposure" />
            </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Form view (shown by default — the personalized reveal is the hero) ----
  return (
    <Card className="border-2 border-primary/30">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-1">See exactly which sites list you</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Enter your name and we'll check the top people-search sites for your real listings — about 10 seconds. We only use this to search; we don't store it.
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
