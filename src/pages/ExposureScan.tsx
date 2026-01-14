import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  Shield, 
  AlertTriangle, 
  Eye, 
  Loader2, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import ExposureFindingCard from "@/components/ExposureFindingCard";
import RemovalActionPanel from "@/components/RemovalActionPanel";

interface ScanFormData {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  state: string;
}

interface ExposureFinding {
  id: string;
  source_type: string;
  source_name: string;
  url: string | null;
  severity: string;
  status: string;
  data_types_found: string[] | null;
  snippet: string | null;
  removal_url: string | null;
  removal_difficulty: string | null;
  title: string | null;
  created_at: string;
}

interface ScanResult {
  id: string;
  status: string;
  sources_to_scan: string[] | null;
  sources_completed: string[] | null;
  critical_findings: number | null;
  high_findings: number | null;
  medium_findings: number | null;
  low_findings: number | null;
  total_findings: number | null;
}

export default function ExposureScan() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ScanFormData>({
    firstName: "",
    lastName: "",
    email: "",
    city: "",
    state: "",
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentSource, setCurrentSource] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [findings, setFindings] = useState<ExposureFinding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<ExposureFinding | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      
      // Pre-fill email from user profile
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
      
      // Check for existing scans
      await loadExistingScans(user.id);
    };
    getUser();
  }, [navigate]);

  const loadExistingScans = async (userId: string) => {
    const { data: scans } = await supabase
      .from("exposure_scans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (scans && scans.length > 0) {
      const latestScan = scans[0];
      setScanResult(latestScan);
      
      // Load findings for this scan
      const { data: scanFindings } = await supabase
        .from("exposure_findings")
        .select("*")
        .eq("scan_id", latestScan.id)
        .order("severity", { ascending: true });
      
      if (scanFindings) {
        setFindings(scanFindings);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startScan = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error("Please enter at least your first and last name");
      return;
    }

    setIsScanning(true);
    setScanProgress(0);
    setFindings([]);
    setScanResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to scan");
        navigate("/auth");
        return;
      }

      // Simulate progress while scanning
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 95) return prev;
          return prev + Math.random() * 10;
        });
      }, 2000);

      // Update current source being scanned
      const sources = ["Spokeo", "Whitepages", "TruePeopleSearch", "FastPeopleSearch", "BeenVerified", "Radaris", "Nuwber", "That'sThem"];
      let sourceIndex = 0;
      const sourceInterval = setInterval(() => {
        if (sourceIndex < sources.length) {
          setCurrentSource(sources[sourceIndex]);
          sourceIndex++;
        }
      }, 3000);

      // Call the scan-exposure edge function
      const response = await supabase.functions.invoke("scan-exposure", {
        body: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          city: formData.city,
          state: formData.state,
        },
      });

      clearInterval(progressInterval);
      clearInterval(sourceInterval);
      setScanProgress(100);

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      toast.success(`Scan complete! Found ${data.findings.total} exposures.`);

      // Also check for data breaches
      if (formData.email) {
        setCurrentSource("Checking data breaches...");
        await supabase.functions.invoke("check-breaches", {
          body: {
            email: formData.email,
            scanId: data.scanId,
          },
        });
      }

      // Reload scan results
      if (user) {
        await loadExistingScans(user.id);
      }

    } catch (error) {
      console.error("Scan error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to complete scan");
    } finally {
      setIsScanning(false);
      setCurrentSource("");
    }
  };

  const filteredFindings = findings.filter((f) => {
    if (activeTab === "all") return true;
    if (activeTab === "brokers") return f.source_type === "data_broker";
    if (activeTab === "breaches") return f.source_type === "breach";
    if (activeTab === "critical") return f.severity === "critical" || f.severity === "high";
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-600 border-red-500/30";
      case "high":
        return "bg-orange-500/10 text-orange-600 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      case "low":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Exposure Scanner</h1>
          <p className="text-muted-foreground">
            Discover where your personal information is exposed across data broker sites and data breaches.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scan Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Parameters
              </CardTitle>
              <CardDescription>
                Enter your information to scan for exposures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="John"
                    disabled={isScanning}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    disabled={isScanning}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  disabled={isScanning}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="New York"
                    disabled={isScanning}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="NY"
                    maxLength={2}
                    disabled={isScanning}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={startScan}
                disabled={isScanning || !formData.firstName || !formData.lastName}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Start Scan
                  </>
                )}
              </Button>

              {isScanning && (
                <div className="space-y-2">
                  <Progress value={scanProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    {currentSource ? `Scanning ${currentSource}...` : "Initializing..."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary Cards */}
            {scanResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Critical</p>
                        <p className="text-2xl font-bold text-red-600">
                          {scanResult.critical_findings || 0}
                        </p>
                      </div>
                      <AlertTriangle className="h-8 w-8 text-red-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">High</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {scanResult.high_findings || 0}
                        </p>
                      </div>
                      <Eye className="h-8 w-8 text-orange-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Medium</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {scanResult.medium_findings || 0}
                        </p>
                      </div>
                      <Shield className="h-8 w-8 text-yellow-500/20" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Low</p>
                        <p className="text-2xl font-bold text-green-600">
                          {scanResult.low_findings || 0}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500/20" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Findings List */}
            {findings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Exposure Findings</CardTitle>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="all">All ({findings.length})</TabsTrigger>
                      <TabsTrigger value="brokers">
                        Brokers ({findings.filter((f) => f.source_type === "data_broker").length})
                      </TabsTrigger>
                      <TabsTrigger value="breaches">
                        Breaches ({findings.filter((f) => f.source_type === "breach").length})
                      </TabsTrigger>
                      <TabsTrigger value="critical">
                        Critical ({findings.filter((f) => f.severity === "critical" || f.severity === "high").length})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredFindings.map((finding) => (
                      <ExposureFindingCard
                        key={finding.id}
                        finding={finding}
                        onStartRemoval={() => setSelectedFinding(finding)}
                      />
                    ))}
                    {filteredFindings.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No findings in this category
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : !isScanning && !scanResult ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Shield className="h-16 w-16 mx-auto text-muted-foreground/50" />
                    <div>
                      <h3 className="text-lg font-medium">No scan results yet</h3>
                      <p className="text-muted-foreground">
                        Enter your information and start a scan to discover exposures.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : !isScanning && scanResult && findings.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                    <div>
                      <h3 className="text-lg font-medium">No exposures found!</h3>
                      <p className="text-muted-foreground">
                        Great news! We didn't find your information on any data broker sites.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      {/* Removal Panel */}
      {selectedFinding && (
        <RemovalActionPanel
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          userEmail={formData.email || user?.email || ""}
          userName={`${formData.firstName} ${formData.lastName}`}
        />
      )}
    </div>
  );
}
