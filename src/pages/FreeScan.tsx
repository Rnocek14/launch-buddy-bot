import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, AlertTriangle, Lock, Zap, Shield, Search, Eye } from "lucide-react";
import { BreachResults } from "@/components/free-scan/BreachResults";
import { WhatWeChecked } from "@/components/free-scan/WhatWeChecked";
import { UpgradeCTA } from "@/components/free-scan/UpgradeCTA";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

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
  estimate: ReturnType<typeof getFootprintEstimate>;
}

export default function FreeScan() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState("");
  const [results, setResults] = useState<ScanResults | null>(null);
  const [error, setError] = useState("");

  const runScan = useCallback(async (scanEmail: string) => {
    setIsScanning(true);
    setError("");
    trackEvent("scan_started", { source: "free_scan" });

    // Phase 1: Breach check
    setScanPhase("Checking breach databases...");
    let breachData = { breaches: [] as BreachData[], breachCount: 0, criticalCount: 0, highCount: 0, error: null as string | null };

    try {
      const { data, error: fnError } = await supabase.functions.invoke("free-breach-check", {
        body: { email: scanEmail },
      });

      if (fnError) {
        console.warn("Breach check failed:", fnError);
        breachData.error = "Could not check breaches right now";
      } else if (data?.error) {
        breachData.error = data.error;
      } else {
        breachData = {
          breaches: data.breaches || [],
          breachCount: data.breachCount || 0,
          criticalCount: data.criticalCount || 0,
          highCount: data.highCount || 0,
          error: null,
        };
      }
    } catch (err) {
      console.warn("Breach check error:", err);
      breachData.error = "Breach check unavailable";
    }

    // Phase 2: Footprint estimate
    setScanPhase("Analyzing digital footprint...");
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const estimate = getFootprintEstimate(scanEmail);

    setScanPhase("Generating report...");
    await new Promise((resolve) => setTimeout(resolve, 600));

    setResults({
      breaches: breachData.breaches,
      breachCount: breachData.breachCount,
      criticalCount: breachData.criticalCount,
      highCount: breachData.highCount,
      breachError: breachData.error,
      estimate,
    });

    trackEvent("scan_completed", {
      source: "free_scan",
      breach_count: breachData.breachCount,
      critical_count: breachData.criticalCount,
      estimated_services: estimate.estimatedServices,
    });

    setIsScanning(false);
    setScanPhase("");
  }, []);

  // Auto-scan if email passed via query param
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam && emailParam.includes("@") && !results) {
      setEmail(emailParam);
      runScan(emailParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    runScan(email);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Free Exposure Check</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {results ? "Your Exposure Report" : "See What's Exposed About You"}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {results
                ? "Real breaches and estimated exposure — here's what we found."
                : "Check breach databases and estimate your digital footprint. No signup required."}
            </p>
          </div>

          {/* Scan Form */}
          {!results && !isScanning && (
            <Card className="max-w-xl mx-auto mb-12">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Enter Your Email
                </CardTitle>
                <CardDescription>
                  We'll check real breach databases and estimate your footprint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleScan} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" className="gap-2">
                      <Search className="w-4 h-4" />
                      Check Exposure
                    </Button>
                  </div>
                  {error && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {error}
                    </p>
                  )}
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>We don't store or share your email address</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scanning state */}
          {isScanning && (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
              <p className="text-lg text-muted-foreground">{scanPhase}</p>
              <p className="text-sm text-muted-foreground mt-2">Breach databases · Data brokers · Public records</p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-10 animate-fade-in">
              {/* Layer 1: Real Breaches */}
              <section>
                <h2 className="text-lg font-semibold text-muted-foreground mb-4">Breach History</h2>
                <BreachResults
                  breaches={results.breaches}
                  criticalCount={results.criticalCount}
                  highCount={results.highCount}
                  error={results.breachError}
                />
              </section>

              {/* Layer 2: Footprint Estimate */}
              <section>
                <FootprintEstimate
                  categories={results.estimate.categories}
                  dataBrokers={results.estimate.dataBrokers}
                  estimatedServices={results.estimate.estimatedServices}
                />
              </section>

              {/* Layer 3: Upgrade CTA */}
              <section>
                <UpgradeCTA hasBreaches={results.breachCount > 0} />
              </section>

              {/* Try Again */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setResults(null);
                    setEmail("");
                  }}
                >
                  Check another email
                </Button>
              </div>
            </div>
          )}

          {/* Trust Indicators — pre-scan */}
          {!results && !isScanning && (
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="text-center">
                <CardContent className="p-6">
                  <Lock className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Privacy First</h3>
                  <p className="text-sm text-muted-foreground">
                    Your email is checked against breach databases but never stored or shared.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <Zap className="w-8 h-8 text-accent mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Real Data</h3>
                  <p className="text-sm text-muted-foreground">
                    See actual breaches from verified databases plus estimated account exposure.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <Shield className="w-8 h-8 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Take Action</h3>
                  <p className="text-sm text-muted-foreground">
                    After your full scan, we help you delete accounts and remove data broker listings.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
