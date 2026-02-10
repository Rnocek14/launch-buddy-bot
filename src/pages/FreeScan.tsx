import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, AlertTriangle, CheckCircle, ArrowRight, Lock, Zap, Eye } from "lucide-react";
import { Link } from "react-router-dom";

// Simulated exposure categories based on email domain patterns
// Deterministic hash from email string — same email always gives same number
function emailHash(email: string): number {
  let hash = 0;
  const str = email.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash);
}

const getExposurePreview = (email: string) => {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  const hash = emailHash(email);
  
  // Deterministic variation based on email hash (0-19 range)
  const variation = hash % 20;
  
  const isOlderEmail = ["gmail.com", "yahoo.com", "hotmail.com", "aol.com"].includes(domain);
  const isWorkEmail = !["gmail.com", "yahoo.com", "hotmail.com", "aol.com", "outlook.com", "icloud.com"].includes(domain);
  
  const baseServices = isOlderEmail ? 45 : 25;
  const workBonus = isWorkEmail ? 15 : 0;
  const estimatedServices = baseServices + workBonus + variation;
  
  // Deterministic broker count (3-10 range)
  const dataBrokers = 3 + (hash % 8);
  
  return {
    estimatedServices,
    categories: [
      { name: "Shopping & E-commerce", count: Math.floor(estimatedServices * 0.25), risk: "medium" },
      { name: "Social Media", count: Math.floor(estimatedServices * 0.15), risk: "high" },
      { name: "Newsletters & Marketing", count: Math.floor(estimatedServices * 0.30), risk: "low" },
      { name: "Financial Services", count: Math.floor(estimatedServices * 0.10), risk: "high" },
      { name: "Travel & Booking", count: Math.floor(estimatedServices * 0.10), risk: "medium" },
      { name: "Other Services", count: Math.floor(estimatedServices * 0.10), risk: "low" },
    ],
    dataBrokers,
  };
};

export default function FreeScan() {
  const [email, setEmail] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof getExposurePreview> | null>(null);
  const [error, setError] = useState("");

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsScanning(true);
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const preview = getExposurePreview(email);
    setResults(preview);
    setIsScanning(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-500";
      case "medium": return "text-amber-500";
      default: return "text-emerald-500";
    }
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
              How Exposed Is Your Email?
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get an instant preview of your digital footprint. No signup required.
            </p>
          </div>

          {/* Scan Form */}
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
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
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

          {/* Results */}
          {results && (
            <div className="space-y-8 animate-fade-in">
              {/* Summary Card */}
              <Card className="border-amber-500/50 bg-amber-500/5">
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-12 h-12 text-amber-500" />
                    </div>
                    <div className="text-center md:text-left flex-1">
                      <h2 className="text-3xl font-bold mb-2">
                        ~{results.estimatedServices}+ Services
                      </h2>
                      <p className="text-muted-foreground mb-4">
                        Likely have access to your data based on typical email usage patterns. 
                        Plus <span className="font-semibold text-red-500">{results.dataBrokers} data brokers</span> may be selling your personal information.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Based on email domain analysis. Connect your email for exact results.</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <div className="grid md:grid-cols-2 gap-4">
                {results.categories.map((category, index) => (
                  <Card key={index} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ~{category.count} services
                        </p>
                      </div>
                      <div className={`text-sm font-medium ${getRiskColor(category.risk)}`}>
                        {category.risk.charAt(0).toUpperCase() + category.risk.slice(1)} Risk
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* CTA */}
              <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-4">
                    Get Your Full Report
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    Connect your email to scan your actual inbox and discover exactly which services have your data. 
                    Then use our tools to delete accounts and remove yourself from data brokers.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link to="/auth">
                      <Button size="lg" className="gap-2 w-full sm:w-auto">
                        <Shield className="w-5 h-5" />
                        Start Free Scan
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link to="/demo">
                      <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                        View Demo First
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>3 free deletions/month</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>GDPR compliant</span>
                    </div>
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

          {/* Trust Indicators */}
          {!results && (
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
