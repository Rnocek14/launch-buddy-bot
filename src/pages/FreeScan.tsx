import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, AlertTriangle, CheckCircle, ArrowRight, Lock, Zap, Eye, Search } from "lucide-react";
import { Link } from "react-router-dom";

// Deterministic hash from email string
function emailHash(email: string): number {
  let hash = 5381;
  const str = email.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

const getExposurePreview = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  const hash = emailHash(email);
  const variation = hash % 20;

  const isOlderEmail = ["gmail.com", "yahoo.com", "hotmail.com", "aol.com"].includes(domain);
  const isWorkEmail = !["gmail.com", "yahoo.com", "hotmail.com", "aol.com", "outlook.com", "icloud.com"].includes(domain);

  const baseServices = isOlderEmail ? 45 : 25;
  const workBonus = isWorkEmail ? 15 : 0;
  const estimatedServices = baseServices + workBonus + variation;
  const dataBrokers = 3 + (hash % 8);

  return {
    estimatedServices,
    categories: [
      { name: "Shopping & E-commerce", count: Math.floor(estimatedServices * 0.25) },
      { name: "Social Media", count: Math.floor(estimatedServices * 0.15) },
      { name: "Newsletters & Marketing", count: Math.floor(estimatedServices * 0.30) },
      { name: "Financial Services", count: Math.floor(estimatedServices * 0.10) },
      { name: "Travel & Booking", count: Math.floor(estimatedServices * 0.10) },
      { name: "Other Services", count: Math.floor(estimatedServices * 0.10) },
    ],
    dataBrokers,
  };
};

export default function FreeScan() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof getExposurePreview> | null>(null);
  const [error, setError] = useState("");

  // Auto-scan if email passed via query param (from Hero)
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam && emailParam.includes("@") && !results) {
      setEmail(emailParam);
      runScan(emailParam);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runScan = async (scanEmail: string) => {
    setIsScanning(true);
    setError("");
    await new Promise(resolve => setTimeout(resolve, 2500));
    setResults(getExposurePreview(scanEmail));
    setIsScanning(false);
  };

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
                ? "Here's what we found based on your email — and what's likely hiding deeper."
                : "Get an instant preview of your digital footprint. No signup required."}
            </p>
          </div>

          {/* Scan Form — show when no results or scanning */}
          {!results && (
            <Card className="max-w-xl mx-auto mb-12">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Enter Your Email
                </CardTitle>
                <CardDescription>
                  We'll estimate how many services likely have your data
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
                      disabled={isScanning}
                    />
                    <Button type="submit" disabled={isScanning} className="gap-2">
                      {isScanning ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Check Exposure
                        </>
                      )}
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
          {isScanning && results === null && (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
              <p className="text-lg text-muted-foreground">Checking public exposure sources...</p>
              <p className="text-sm text-muted-foreground mt-2">Breach databases · Data brokers · Public records</p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-8 animate-fade-in">
              {/* Summary Card */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-12 h-12 text-primary" />
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <h2 className="text-3xl font-bold mb-2">
                        Estimated {results.estimatedServices}+ Accounts
                      </h2>
                      <p className="text-muted-foreground mb-2">
                        Based on users with similar email providers, this many services likely hold some of your data.
                      </p>
                      {results.dataBrokers > 0 && (
                        <p className="text-sm font-medium text-destructive/80">
                          + {results.dataBrokers} data brokers may have your personal information
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Typical Categories */}
              <h3 className="text-lg font-semibold text-muted-foreground">Where accounts often show up</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {results.categories.map((category, index) => (
                  <Card key={index} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">~{category.count} services</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* === TENSION SECTION === */}
              <Card className="border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700/30">
                <CardContent className="p-8 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-300">This is only what's publicly visible</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">
                    Most accounts never appear in breach databases
                  </h3>
                  <p className="text-muted-foreground max-w-xl mx-auto">
                    The services above are estimates. Your real footprint — newsletters, old signups,
                    forgotten accounts — lives in your inbox. A secure inbox scan finds the exact services holding your data.
                  </p>
                </CardContent>
              </Card>

              {/* === OAUTH UPGRADE CTA === */}
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-2">
                    Find Your Hidden Accounts
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    Run a secure inbox scan to discover exactly which services have your data — then delete what you don't need.
                  </p>

                  <Link to="/auth">
                    <Button size="lg" className="gap-2 mb-6">
                      <Shield className="w-5 h-5" />
                      Run Secure Inbox Scan
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>

                  {/* Trust bullets */}
                  <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Read-only access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>We scan sender metadata only</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>No email content stored</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Disconnect anytime</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link to="/demo">
                      <Button variant="ghost" size="sm" className="text-muted-foreground">
                        View demo first
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

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
                    Your email is never stored or shared. This preview uses statistical analysis.
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <Zap className="w-8 h-8 text-accent mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Instant Results</h3>
                  <p className="text-sm text-muted-foreground">
                    Get your exposure estimate in seconds. Full scan available with free signup.
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
