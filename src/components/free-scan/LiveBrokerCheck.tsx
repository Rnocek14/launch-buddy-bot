import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Loader2, CheckCircle2, AlertTriangle, Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

import { Link } from "react-router-dom";

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

// Broker profile URLs come from search results; allow only safe HTTPS URLs on
// the listed broker's actual host. Never navigate to arbitrary search links.
function safeListingUrl(url: string | null, brokerDomain: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const expectedHost = brokerDomain.toLowerCase().replace(/^www\./, "");
    const host = parsed.hostname.toLowerCase();
    return parsed.protocol === "https:" && (host === expectedHost || host.endsWith(`.${expectedHost}`))
      ? parsed.href : null;
  } catch {
    return null;
  }
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export function LiveBrokerCheck({ email, onResults }: LiveBrokerCheckProps) {
  // Optional, separate from the email-only breach check.
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
                ? `Found ${exposedCount} possible profile match${exposedCount === 1 ? "" : "es"}`
                : degraded
                  ? "We couldn't finish checking every site"
                  : "No confirmed listings on the sites we checked"}
            </h3>
            {exposedCount > 0 ? (
              <p className="text-sm text-muted-foreground mt-1">
                {found.length > 0 && <span className="text-foreground font-medium">{found.length} higher-confidence match{found.length === 1 ? "" : "es"}</span>}
                {found.length > 0 && possible.length > 0 && " · "}
                {possible.length > 0 && <span>{possible.length} possible match{possible.length === 1 ? "" : "es"}</span>}
              </p>
            ) : degraded ? (
              <p className="text-sm text-muted-foreground mt-1">
                The checked sites returned inconclusive results. We cannot determine whether your information is listed.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                No likely matches were returned by the sites checked. Results are not a guarantee of absence.
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
                  {r.status === "found" && <span className="text-red-600 dark:text-red-400">Likely match — verify</span>}
                  {r.status === "possible_match" && <span className="text-amber-600 dark:text-amber-400">Possible match</span>}
                  {r.status === "not_found" && <span className="text-muted-foreground">Not found</span>}
                  {r.status === "unknown" && <span className="text-muted-foreground">Inconclusive</span>}
                </span>
                {safeListingUrl(r.profileUrl, r.domain) && (
                  <a
                    href={safeListingUrl(r.profileUrl, r.domain)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-primary underline underline-offset-4 hover:text-accent"
                  >
                    Review listing
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-border bg-secondary/30 px-6 py-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {exposedCount > 0
                ? "Review the sites shown above to confirm a match is yours. Listings are not removed by this search. Complete includes supported broker scanning and guided opt-out steps."
                : degraded
                  ? "The search was incomplete. Try again later or follow our free opt-out guides; no absence of listings has been established."
                  : "This limited search returned no matching profiles. You can still review our free privacy guides or connect an inbox to discover service accounts."}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild><Link to="/auth?intent=signup">Create free account</Link></Button>
              <Link to="/remove-from" className="text-sm text-primary underline underline-offset-4">Free broker opt-out guides</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---- Form view (shown by default — the personalized reveal is the hero) ----
  return (
    <Card className="border-2 border-primary/30">
      <CardContent className="p-6">
        <h3 className="text-xl font-normal mb-1">Search a few public listings</h3>
        <p className="text-sm text-muted-foreground mb-5">
          Enter your name for a separate search of a few public people-search sites. Results may be incomplete or may refer to someone else. Your name and location are sent to our search providers.
        </p>
        <form onSubmit={runCheck} className="space-y-3">
          <Input
            placeholder="Full name (e.g. Jane Smith)"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
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
