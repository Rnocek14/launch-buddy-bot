import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, AlertTriangle, Lock, ShieldCheck, Search, ArrowRight, RefreshCw } from "lucide-react";
import { BreachResults } from "@/components/free-scan/BreachResults";
import { WhatWeChecked } from "@/components/free-scan/WhatWeChecked";
import { ExposureSummary } from "@/components/free-scan/ExposureSummary";
import { LiveBrokerCheck } from "@/components/free-scan/LiveBrokerCheck";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { useSEO } from "@/hooks/useSEO";

interface BreachData {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  dataClasses: string[];
  isVerified: boolean;
  severity: "critical" | "high" | "medium" | "low";
}
interface ScanResults {
  breaches: BreachData[];
  breachCount: number;
  criticalCount: number;
  highCount: number;
  breachError: string | null;
}

const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function FreeScan() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResults | null>(null);
  const [error, setError] = useState("");

  useSEO({
    title: "Free Email Breach Check — Footprint Finder",
    description: "Check your email against known breach records for free. If the breach service is unavailable, we'll say so instead of making up results.",
    canonical: "https://footprintfinder.co/free-scan",
    ogType: "website",
  });

  const runScan = useCallback(async (rawEmail: string) => {
    const scanEmail = rawEmail.trim();
    if (!validEmail(scanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    setEmail(scanEmail);
    setIsScanning(true);
    setResults(null);
    setError("");
    const src = searchParams.get("src") || "direct";
    trackEvent("scan_started", { source: "free_scan", src });

    const empty = { breaches: [] as BreachData[], breachCount: 0, criticalCount: 0, highCount: 0 };
    let scan: ScanResults = { ...empty, breachError: "The breach service is unavailable right now. Please retry." };

    try {
      const timeout = { data: null, error: null, timedOut: true } as const;
      const response = await Promise.race([
        supabase.functions.invoke("free-breach-check", { body: { email: scanEmail } }),
        new Promise<typeof timeout>((resolve) => setTimeout(() => resolve(timeout), 12000)),
      ]);
      if ("timedOut" in response) {
        scan = { ...empty, breachError: "The breach service took too long to respond. Please try again." };
      } else if (response.error) {
        let message = "The breach database couldn't be reached. Please try again.";
        if (response.error instanceof FunctionsHttpError) {
          try {
            const details = await response.error.context.json();
            if (typeof details?.error === "string") message = details.error;
          } catch {
            // Keep the friendly fallback if a relay returned a non-JSON response.
          }
        }
        scan = { ...empty, breachError: message };
      } else if (response.data?.error) {
        scan = { ...empty, breachError: String(response.data.error) };
      } else if (Array.isArray(response.data?.breaches) && typeof response.data?.breachCount === "number") {
        scan = {
          breaches: response.data.breaches,
          breachCount: response.data.breachCount,
          criticalCount: response.data.criticalCount ?? 0,
          highCount: response.data.highCount ?? 0,
          breachError: null,
        };
      } else {
        scan = { ...empty, breachError: "The breach service returned an incomplete response. Please try again." };
      }
    } catch (err) {
      console.warn("Free breach check failed:", err);
      scan = { ...empty, breachError: "The breach check couldn't complete. Please try again." };
    } finally {
      setIsScanning(false);
    }

    setResults(scan);
    if (scan.breachError) {
      trackEvent("scan_failed", { source: "free_scan", src, stage: "breach_check" });
    } else {
      trackEvent("scan_completed", { source: "free_scan", src, breach_count: scan.breachCount });
    }
  }, [searchParams]);

  useEffect(() => {
    const fromUrl = searchParams.get("email")?.trim();
    if (fromUrl && validEmail(fromUrl)) runScan(fromUrl);
    // An email in the URL is only consumed when this screen first loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isScanning) void runScan(email);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-5 pb-20 pt-28 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="h-4 w-4" aria-hidden /> A free place to start</p>
            <h1 className="text-4xl font-normal tracking-tight text-foreground sm:text-5xl">Check your email for known breaches.</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              A straightforward breach lookup. No signup or inbox connection required, and no guessed exposure counts.
            </p>
          </div>

          {!results && !isScanning && (
            <Card className="mb-9 border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Mail className="h-5 w-5 text-primary" aria-hidden /> Email address</CardTitle>
                <CardDescription>We submit this address to our breach lookup provider to check known records. We don't read your inbox.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleScan} className="flex flex-col gap-3 sm:flex-row">
                  <Input type="email" aria-label="Email address" autoComplete="email" placeholder="you@example.com" value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="min-h-12 flex-1" required />
                  <Button className="min-h-12 gap-2" type="submit"><Search className="h-4 w-4" aria-hidden /> Check breaches</Button>
                </form>
                {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
                <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3.5 w-3.5" aria-hidden /> No password. No inbox access. No payment.</p>
              </CardContent>
            </Card>
          )}

          {isScanning && (
            <div role="status" aria-live="polite" className="py-16 text-center">
              <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden />
              <p className="text-base text-muted-foreground">Checking known breach records…</p>
            </div>
          )}

          {results && !isScanning && (
            <div className="space-y-8" aria-live="polite">
              <ExposureSummary email={email} breachCount={results.breachCount} breachError={results.breachError} />
              {results.breachError && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => void runScan(email)} className="gap-2"><RefreshCw className="h-4 w-4" aria-hidden /> Retry breach check</Button>
                  <p className="text-sm text-muted-foreground">You have not received an exposure result from this source yet.</p>
                </div>
              )}
              <section aria-label="Breach findings">
                <h2 className="mb-4 text-xl font-normal text-foreground">Breach details</h2>
                <BreachResults breaches={results.breaches} criticalCount={results.criticalCount} highCount={results.highCount} error={results.breachError} />
              </section>
              <section className="rounded-2xl border border-border bg-secondary/30 p-6 sm:p-8">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Go beyond breaches</p>
                <h2 className="text-2xl font-normal text-foreground">Find services you may have forgotten.</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">Breach records don't tell you which services still hold your data. Create a free account and optionally connect Gmail or Outlook with read-only metadata permission to start discovering them.</p>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <Button asChild><Link to="/auth?intent=signup" className="gap-2">Create a free account <ArrowRight className="h-4 w-4" aria-hidden /></Link></Button>
                  <Link to="/pricing" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary">Compare optional paid plans</Link>
                </div>
              </section>
              <section>
                <h2 className="mb-3 text-xl font-normal text-foreground">Optional: check public people-search listings</h2>
                <p className="mb-4 text-sm text-muted-foreground">This is a separate name-based search of supported sites, not part of the email breach result. Matches may require confirmation.</p>
                <LiveBrokerCheck email={email} />
              </section>
              <WhatWeChecked breachCount={results.breachCount} breachError={results.breachError} />
              <Button variant="ghost" onClick={() => { setResults(null); setEmail(""); }} className="gap-2"><RefreshCw className="h-4 w-4" aria-hidden /> Check another email</Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
