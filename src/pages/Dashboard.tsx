import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, RefreshCw, LogOut, Loader2, ExternalLink, Search, Download, AlertCircle, Sparkles, Mail, Tag, TrendingUp, Trash2, CheckCircle, FileText, DollarSign, Package, Lock, Bell } from "lucide-react";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { useToast } from "@/hooks/use-toast";
import { validateGmailScope, isTokenValid } from "@/lib/googleAuth";
import { Progress } from "@/components/ui/progress";
import { useAuthorization } from "@/hooks/useAuthorization";
import { DeletionRequestDialog } from "@/components/DeletionRequestDialog";
import { BatchDeletionToolbar } from "@/components/BatchDeletionToolbar";
import { BatchDeletionDialog } from "@/components/BatchDeletionDialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Service {
  id: string;
  name: string;
  logo_url: string;
  homepage_url: string;
  category: string;
  discovered_at: string;
}

interface ScanStats {
  servicesFound: number;
  emailsScanned: number;
  unmatchedCount: number;
  breakdown?: {
    signup: number;
    financial: number;
    commerce: number;
    security: number;
    engagement: number;
  };
}

interface ScanProgress {
  currentEmail: number;
  totalEmails: number;
  status: string;
}

interface UnmatchedDomain {
  domain: string;
  email_from: string;
  occurrence_count: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [hasGmailAccess, setHasGmailAccess] = useState(false);
  const [scanStats, setScanStats] = useState<ScanStats | null>(null);
  const [unmatchedDomains, setUnmatchedDomains] = useState<UnmatchedDomain[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const { isAuthorized, loading: authLoading } = useAuthorization();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      fetchRiskScore();
    }
  }, [services.length]);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    setHasGmailAccess(!!session.provider_token);
    await fetchServices();
    await fetchUnmatchedDomains();
    setLoading(false);
  }

  async function fetchServices() {
    const { data, error } = await supabase
      .from("user_services")
      .select(`
        service_id,
        discovered_at,
        service_catalog (
          id,
          name,
          logo_url,
          homepage_url,
          category
        )
      `)
      .order("discovered_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading services",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    const mapped = data.map((item: any) => ({
      id: item.service_catalog.id,
      name: item.service_catalog.name,
      logo_url: item.service_catalog.logo_url,
      homepage_url: item.service_catalog.homepage_url,
      category: item.service_catalog.category,
      discovered_at: item.discovered_at
    }));

    setServices(mapped);
  }

  async function fetchUnmatchedDomains() {
    const { data, error } = await supabase
      .from("unmatched_domains")
      .select("domain, email_from, occurrence_count")
      .order("occurrence_count", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error loading unmatched domains:", error);
      return;
    }

    setUnmatchedDomains(data || []);
  }

  async function handleScan() {
    setScanning(true);
    setScanProgress({ currentEmail: 0, totalEmails: 100, status: "Connecting to Gmail..." });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if we have a provider token
      if (!session?.provider_token) {
        // Need to authorize with Google
        setScanning(false);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
            scopes: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });

        if (error) {
          toast({
            title: "Authorization failed",
            description: error.message,
            variant: "destructive"
          });
        }
        return;
      }

      // Validate token has Gmail scope
      console.log('Validating token scopes...');
      const hasGmailScope = await validateGmailScope(session.provider_token);
      if (!hasGmailScope) {
        setScanning(false);
        toast({
          title: "Gmail Access Required",
          description: "Your token doesn't have Gmail access. Please reconnect to grant permission.",
          variant: "destructive"
        });
        
        // Trigger re-authorization with consent prompt
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
            scopes: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });

        if (error) {
          toast({
            title: "Authorization failed",
            description: error.message,
            variant: "destructive"
          });
        }
        return;
      }

      // Check if token is still valid
      const tokenIsValid = await isTokenValid(session.provider_token);
      if (!tokenIsValid) {
        setScanning(false);
        toast({
          title: "Token Expired",
          description: "Your access token has expired. Please reconnect.",
          variant: "destructive"
        });
        
        // Trigger re-authorization
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
            scopes: 'openid email profile https://www.googleapis.com/auth/gmail.readonly',
            queryParams: {
              access_type: 'offline',
              prompt: 'consent'
            }
          }
        });

        if (error) {
          toast({
            title: "Authorization failed",
            description: error.message,
            variant: "destructive"
          });
        }
        return;
      }

      // All validations passed, proceed with scan
      setScanProgress({ currentEmail: 10, totalEmails: 100, status: "Fetching emails..." });
      
      const { data, error } = await supabase.functions.invoke("scan-gmail", {
        body: { accessToken: session.provider_token }
      });

      if (error) throw error;

      setScanProgress({ currentEmail: 90, totalEmails: 100, status: "Analyzing services..." });

      setScanStats({
        servicesFound: data.servicesFound,
        emailsScanned: data.emailsScanned,
        unmatchedCount: data.unmatchedCount,
        breakdown: data.breakdown
      });

      setScanProgress({ currentEmail: 100, totalEmails: 100, status: "Complete!" });

      toast({
        title: "Scan complete!",
        description: `${data.message}. ${data.unmatchedCount > 0 ? `${data.unmatchedCount} unrecognized services found.` : ''}`,
        duration: 5000
      });

      await fetchServices();
      await fetchUnmatchedDomains();
      await fetchRiskScore();
    } catch (error: any) {
      toast({
        title: "Scan failed",
        description: error.message || "Please try reconnecting your Google account",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
      setTimeout(() => setScanProgress(null), 2000);
    }
  }

  async function fetchRiskScore() {
    setLoadingRisk(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-risk-score');
      
      if (error) throw error;
      
      setRiskData(data);
    } catch (error: any) {
      console.error('Failed to fetch risk score:', error);
      toast({
        title: "Could not calculate risk score",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingRisk(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  const handleRequestDeletion = (service: Service) => {
    if (!isAuthorized) {
      toast({
        title: "Authorization Required",
        description: "You need to complete the authorization wizard first.",
      });
      navigate("/authorize");
      return;
    }
    setSelectedService(service);
    setDeletionDialogOpen(true);
  };

  const toggleServiceSelection = (serviceId: string) => {
    const newSelection = new Set(selectedServices);
    if (newSelection.has(serviceId)) {
      newSelection.delete(serviceId);
    } else {
      newSelection.add(serviceId);
    }
    setSelectedServices(newSelection);
  };

  const handleBatchDeletion = () => {
    if (!isAuthorized) {
      toast({
        title: "Authorization Required",
        description: "You need to complete the authorization wizard first.",
      });
      navigate("/authorize");
      return;
    }
    setBatchDialogOpen(true);
  };

  const handleBatchComplete = () => {
    setSelectedServices(new Set());
    fetchServices();
  };

  const selectedServicesArray = Array.from(selectedServices)
    .map(id => services.find(s => s.id === id))
    .filter((s): s is Service => s !== undefined);

  const categoryColors: Record<string, string> = {
    "Social": "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
    "Shopping": "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
    "Finance": "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    "Streaming": "bg-pink-500/10 text-pink-700 dark:text-pink-300 border-pink-500/20",
    "Productivity": "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20",
    "Gaming": "bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20",
    "News": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
    "Travel": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    "Other": "bg-muted text-muted-foreground border-border",
  };

  const getServiceInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const exportToCSV = () => {
    const headers = ['Service Name', 'Category', 'Homepage URL', 'Discovered Date'];
    const rows = services.map(service => [
      service.name,
      service.category || 'Other',
      service.homepage_url || 'N/A',
      new Date(service.discovered_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `digital-footprint-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export successful",
      description: `Downloaded ${services.length} services to CSV`,
    });
  };

  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [services, searchQuery, selectedCategory]);


  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category || "Other"));
    return Array.from(cats).sort();
  }, [services]);


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Digital Footprint</h1>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                {!authLoading && (
                  <Badge 
                    variant={isAuthorized ? "default" : "outline"}
                    className="text-xs"
                  >
                    {isAuthorized ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Authorized Agent
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Authorized
                      </>
                    )}
                  </Badge>
                )}
                {!isAuthorized && !authLoading && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate("/authorize")}
                    className="h-auto p-0 text-xs"
                  >
                    Complete Authorization →
                  </Button>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Risk Score Card */}
        {riskData && (
          <div className="mb-8">
            <RiskScoreCard
              score={riskData.riskScore}
              level={riskData.riskLevel}
              factors={riskData.riskFactors}
              insights={riskData.insights}
            />
          </div>
        )}

        {/* Scan Hero Card */}
        <Card className="mb-8 overflow-hidden border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">{services.length}</h2>
                    <p className="text-sm text-muted-foreground">Online accounts discovered</p>
                  </div>
                </div>
                
                {scanStats && !scanning && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-4 h-4" />
                        <span>{scanStats.emailsScanned} emails scanned</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" />
                        <span>{scanStats.servicesFound} services found</span>
                      </div>
                    </div>
                    
                    {scanStats.breakdown && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {scanStats.breakdown.signup > 0 && (
                          <Badge variant="secondary" className="gap-1.5 text-xs">
                            <Mail className="w-3 h-3" />
                            {scanStats.breakdown.signup} signup
                          </Badge>
                        )}
                        {scanStats.breakdown.financial > 0 && (
                          <Badge variant="secondary" className="gap-1.5 text-xs">
                            <DollarSign className="w-3 h-3" />
                            {scanStats.breakdown.financial} invoices
                          </Badge>
                        )}
                        {scanStats.breakdown.commerce > 0 && (
                          <Badge variant="secondary" className="gap-1.5 text-xs">
                            <Package className="w-3 h-3" />
                            {scanStats.breakdown.commerce} orders
                          </Badge>
                        )}
                        {scanStats.breakdown.security > 0 && (
                          <Badge variant="secondary" className="gap-1.5 text-xs">
                            <Lock className="w-3 h-3" />
                            {scanStats.breakdown.security} security
                          </Badge>
                        )}
                        {scanStats.breakdown.engagement > 0 && (
                          <Badge variant="secondary" className="gap-1.5 text-xs">
                            <Bell className="w-3 h-3" />
                            {scanStats.breakdown.engagement} newsletters
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {scanning && scanProgress && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{scanProgress.status}</span>
                      <span className="text-primary font-medium">{Math.round((scanProgress.currentEmail / scanProgress.totalEmails) * 100)}%</span>
                    </div>
                    <Progress value={(scanProgress.currentEmail / scanProgress.totalEmails) * 100} className="h-2" />
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                <Button 
                  onClick={handleScan}
                  disabled={scanning}
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {hasGmailAccess ? "Rescan Inbox" : "Connect Gmail"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Section */}
        {services.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Discover Your Digital Footprint
                </h3>
                <p className="text-muted-foreground mb-6">
                  Connect your Gmail to automatically scan for online accounts and services you've signed up for over the years.
                </p>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Safe & secure - read-only access</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>No email content stored</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Results in seconds</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{filteredServices.length}</span>
                <span>of</span>
                <span className="font-medium text-foreground">{services.length}</span>
                <span>services</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => navigate("/cleanup")}
                  className="flex-shrink-0 bg-gradient-to-r from-primary to-primary/80"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Cleanup
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/deletion-requests")}
                  className="flex-shrink-0"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Requests
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportToCSV}
                  className="flex-shrink-0"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Search and Filter */}
            <Card>
              <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">(
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat} ({services.filter(s => (s.category || "Other") === cat).length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </CardContent>
            </Card>

            {/* Batch Selection Helper */}
            {filteredServices.length > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>
                    {selectedServices.size > 0 
                      ? `${selectedServices.size} ${selectedServices.size === 1 ? 'service' : 'services'} selected`
                      : 'Select services for batch deletion'}
                  </span>
                  {selectedServices.size > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setSelectedServices(new Set())}
                      className="h-auto p-0 text-xs"
                    >
                      Clear selection
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const oldServices = filteredServices
                        .sort((a, b) => new Date(a.discovered_at).getTime() - new Date(b.discovered_at).getTime())
                        .slice(0, 10)
                        .map(s => s.id);
                      setSelectedServices(new Set(oldServices));
                    }}
                  >
                    Select Oldest 10
                  </Button>
                </div>
              </div>
            )}

            {/* Services Grid */}
            {filteredServices.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12">
                  <div className="text-center">
                    <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground mb-4">
                      No services match your search
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredServices.map(service => (
                  <Card 
                    key={service.id}
                    className={`group hover:shadow-lg transition-all duration-200 relative ${
                      selectedServices.has(service.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/30'
                    }`}
                  >
                    <CardContent className="p-4">
                      {/* Selection Checkbox */}
                      <div className="absolute top-3 right-3 z-10">
                        <Checkbox
                          checked={selectedServices.has(service.id)}
                          onCheckedChange={() => toggleServiceSelection(service.id)}
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </div>

                      <div className="flex flex-col items-center text-center space-y-3">
                        {/* Logo */}
                        <div className="relative">
                          <Avatar className="w-16 h-16 rounded-xl ring-2 ring-border group-hover:ring-primary/30 transition-all">
                            <AvatarImage 
                              src={service.logo_url || ''} 
                              alt={service.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="rounded-xl bg-primary/10 text-primary text-lg font-semibold">
                              {getServiceInitials(service.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        {/* Service Name */}
                        <div className="space-y-1 w-full">
                          <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">
                            {service.name}
                          </h3>
                          
                          {/* Category Badge */}
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${categoryColors[service.category] || categoryColors["Other"]}`}
                          >
                            {service.category || "Other"}
                          </Badge>
                        </div>

                        {/* Date */}
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(service.discovered_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </p>

                        {/* Action Buttons */}
                        <div className="w-full space-y-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-full"
                            onClick={() => handleRequestDeletion(service)}
                            disabled={authLoading}
                          >
                            <Trash2 className="w-3 h-3 mr-2" />
                            Request Deletion
                          </Button>
                          {service.homepage_url && (
                            <a 
                              href={service.homepage_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full block"
                            >
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                              >
                                Visit Site
                                <ExternalLink className="w-3 h-3 ml-2" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {unmatchedDomains.length > 0 && (
          <Card className="mt-8 border-orange-500/20 bg-orange-500/5">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">
                    Unrecognized Services Found
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    We found <strong>{unmatchedDomains.length}</strong> services that aren't in our database yet. 
                    These might be smaller services, regional platforms, or newer companies.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {unmatchedDomains.slice(0, 5).map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-lg border border-orange-200 dark:border-orange-900/30 bg-background hover:border-orange-400 dark:hover:border-orange-600 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{item.domain}</p>
                      <p className="text-xs text-muted-foreground mt-1">From: {item.email_from}</p>
                    </div>
                    <Badge variant="outline" className="ml-4">
                      {item.occurrence_count} {item.occurrence_count === 1 ? 'email' : 'emails'}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Tip:</strong> Tag these services and submit them for approval to add to our catalog.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/unmatched-domains")}
                  className="w-full sm:w-auto"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Review & Tag All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Privacy Notice:</strong> We scan your inbox with read-only access to identify account signup emails. 
              Email content and subjects are never stored—only service names are saved to show you this list. 
              You can revoke access anytime in your{" "}
              <a 
                href="https://myaccount.google.com/permissions" 
                className="underline hover:text-foreground" 
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Account settings
              </a>.
            </span>
          </p>
        </div>
      </div>

      {/* Deletion Request Dialog */}
      <DeletionRequestDialog
        open={deletionDialogOpen}
        onOpenChange={setDeletionDialogOpen}
        service={selectedService}
        onSuccess={() => {
          toast({
            title: "Success",
            description: "Deletion request has been sent successfully.",
          });
        }}
      />

      {/* Batch Deletion Toolbar */}
      <BatchDeletionToolbar
        selectedCount={selectedServices.size}
        onClear={() => setSelectedServices(new Set())}
        onDelete={handleBatchDeletion}
      />

      {/* Batch Deletion Dialog */}
      <BatchDeletionDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        services={selectedServicesArray}
        onComplete={handleBatchComplete}
      />
    </div>
  );
}
