import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, RefreshCw, LogOut, Loader2, ExternalLink, Search, Download, AlertCircle, Sparkles, Mail, Tag, TrendingUp, Trash2, CheckCircle, FileText, DollarSign, Package, Lock, Bell, Settings, HelpCircle } from "lucide-react";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { useToast } from "@/hooks/use-toast";
import { validateGmailScope, isTokenValid } from "@/lib/googleAuth";
import { Progress } from "@/components/ui/progress";
import { useAuthorization } from "@/hooks/useAuthorization";
import { DeletionRequestDialog } from "@/components/DeletionRequestDialog";
import { BatchDeletionToolbar } from "@/components/BatchDeletionToolbar";
import { BatchDeletionDialog } from "@/components/BatchDeletionDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ContactDiscoveryDialog } from "@/components/ContactDiscoveryDialog";
import { Navbar } from "@/components/Navbar";
import { DashboardEmptyState } from "@/components/DashboardEmptyState";
import { ServiceGridSkeleton } from "@/components/ServiceCardSkeleton";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { getErrorMessage, successMessages } from "@/lib/errorMessages";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";

interface Service {
  id: string;
  name: string;
  logo_url: string;
  homepage_url: string;
  category: string;
  discovered_at: string;
  contact_status?: 'verified' | 'ai_discovered' | 'needs_discovery';
  domain: string;
}

interface ScanStats {
  servicesFound: number;
  emailsScanned: number;
  unmatchedCount: number;
  identifierMatches?: number;
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
  const [selectedContactStatus, setSelectedContactStatus] = useState<string>("all");
  const [hideDeletedServices, setHideDeletedServices] = useState(true);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [riskData, setRiskData] = useState<any>(null);
  const [loadingRisk, setLoadingRisk] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [quickDiscoveryOpen, setQuickDiscoveryOpen] = useState(false);
  const [quickDiscoveryService, setQuickDiscoveryService] = useState<Service | null>(null);
  const { isAuthorized, loading: authLoading } = useAuthorization();
  const [scanType, setScanType] = useState<'quick' | 'deep'>('quick');
  const [scanAccountOption, setScanAccountOption] = useState<'all' | 'primary'>('all');
  const [analyzingDomains, setAnalyzingDomains] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{
    domain: string;
    suggested_name: string;
    category: string;
    confidence: string;
    reasoning: string;
  }> | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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
          category,
          contact_verified,
          domain
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

    // Fetch contact statuses for all services in parallel
    const serviceIds = data.map((item: any) => item.service_catalog.id);
    const { data: contactsData } = await supabase
      .from("privacy_contacts")
      .select("service_id, verified, mx_validated")
      .in("service_id", serviceIds)
      .eq("contact_type", "email");

    // Create a map of service_id to contact status
    const contactStatusMap = new Map<string, 'verified' | 'ai_discovered' | 'needs_discovery'>();
    
    for (const item of data) {
      const serviceId = item.service_catalog.id;
      const catalogVerified = item.service_catalog.contact_verified;
      const contacts = contactsData?.filter(c => c.service_id === serviceId) || [];
      
      const hasVerifiedContact = contacts.some(c => c.verified);
      const hasAiDiscoveredContact = contacts.length > 0 && !hasVerifiedContact;
      
      if (catalogVerified || hasVerifiedContact) {
        contactStatusMap.set(serviceId, 'verified');
      } else if (hasAiDiscoveredContact) {
        contactStatusMap.set(serviceId, 'ai_discovered');
      } else {
        contactStatusMap.set(serviceId, 'needs_discovery');
      }
    }

    const mapped = data.map((item: any) => ({
      id: item.service_catalog.id,
      name: item.service_catalog.name,
      logo_url: item.service_catalog.logo_url,
      homepage_url: item.service_catalog.homepage_url,
      category: item.service_catalog.category,
      discovered_at: item.discovered_at,
      contact_status: contactStatusMap.get(item.service_catalog.id) || 'needs_discovery',
      domain: item.service_catalog.domain || ''
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
    setScanProgress({ 
      currentEmail: 0, 
      totalEmails: 100, 
      status: 'Checking email connections...' 
    });

    try {
      // Check if user has any email connections
      const { data: connections, error: connError } = await supabase
        .from('email_connections')
        .select('*')
        .eq('user_id', user?.id);

      if (connError) throw connError;

      if (!connections || connections.length === 0) {
        setScanning(false);
        toast({
          title: "No Email Connected",
          description: "Please connect an email account in Settings to scan your inbox.",
        });
        navigate('/settings');
        return;
      }

      setScanProgress({ currentEmail: 10, totalEmails: 100, status: "Fetching emails..." });
      
      // Use primary connection or first available
      const primaryConnection = connections.find(c => c.is_primary) || connections[0];
      
      const { data, error } = await supabase.functions.invoke("scan-email", {
        body: { 
          connectionId: primaryConnection.id,
          maxResults: scanType === 'quick' ? 500 : 2000,
        }
      });

      if (error) throw error;

      setScanProgress({ currentEmail: 90, totalEmails: 100, status: "Analyzing services..." });

      setScanStats({
        servicesFound: data.servicesFound || 0,
        emailsScanned: data.emailsScanned || 0,
        unmatchedCount: data.unmatchedCount || 0,
        identifierMatches: 0,
      });

      setScanProgress({ currentEmail: 100, totalEmails: 100, status: "Complete!" });
      
      // Success - show animation
      setShowSuccessAnimation(true);
      setSuccessMessage(successMessages.scanComplete.message);
      
      toast({
        title: successMessages.scanComplete.title,
        description: `${data.message}. ${data.unmatchedCount > 0 ? `${data.unmatchedCount} unrecognized services found.` : ''}`,
        duration: 5000
      });

      await fetchServices();
      await fetchUnmatchedDomains();
      await fetchRiskScore();
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
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
      const errorMsg = getErrorMessage(error);
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
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

  const handleDeletionSuccess = () => {
    // Refresh services to update contact status badges
    fetchServices();
  };

  const handleQuickDiscovery = (service: Service) => {
    setQuickDiscoveryService(service);
    setQuickDiscoveryOpen(true);
  };

  const handleQuickDiscoveryComplete = () => {
    fetchServices();
    setQuickDiscoveryOpen(false);
    toast({
      title: "Contact Discovered",
      description: "Contact has been verified and service status updated.",
    });
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

  const handleAnalyzeDomains = async () => {
    setAnalyzingDomains(true);
    setAiSuggestions(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-unmatched-domains', {
        body: { 
          domains: unmatchedDomains.slice(0, 10) // Analyze top 10
        }
      });

      if (error) throw error;

      setAiSuggestions(data.suggestions);
      
      toast({
        title: "Analysis complete!",
        description: `AI generated ${data.suggestions.length} suggestions for your unmatched domains.`,
      });
    } catch (error: any) {
      console.error('AI analysis error:', error);
      const errorMsg = getErrorMessage(error);
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: "destructive"
      });
    } finally {
      setAnalyzingDomains(false);
    }
  };

  const handleConnectGmail = async () => {
    try {
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
        const errorMsg = getErrorMessage(error);
        toast({
          title: errorMsg.title,
          description: errorMsg.description,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      const errorMsg = getErrorMessage(error);
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: "destructive"
      });
    }
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

  const getContactStatusBadge = (status?: 'verified' | 'ai_discovered' | 'needs_discovery') => {
    if (!status) return null;

    const configs = {
      verified: {
        icon: CheckCircle,
        text: 'Verified',
        className: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30 hover:bg-green-500/20'
      },
      ai_discovered: {
        icon: Sparkles,
        text: 'AI Discovered',
        className: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
      },
      needs_discovery: {
        icon: AlertCircle,
        text: 'Needs Discovery',
        className: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30 hover:bg-red-500/20'
      }
    };

    const config = configs[status];
    const Icon = config.icon;

    return (
      <Badge 
        variant="outline" 
        className={`text-xs gap-1 ${config.className}`}
      >
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
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
    return services.filter((service: any) => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
      const matchesContactStatus = selectedContactStatus === "all" || service.contact_status === selectedContactStatus;
      const matchesDeletedFilter = !hideDeletedServices || !service.deletion_requested_at;
      return matchesSearch && matchesCategory && matchesContactStatus && matchesDeletedFilter;
    });
  }, [services, searchQuery, selectedCategory, selectedContactStatus, hideDeletedServices]);

  const newServicesCount = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return services.filter((s: any) => 
      new Date(s.discovered_at) >= thirtyDaysAgo && !s.deletion_requested_at
    ).length;
  }, [services]);

  const isServiceNew = (discoveredAt: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(discoveredAt) >= thirtyDaysAgo;
  };


  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category || "Other"));
    return Array.from(cats).sort();
  }, [services]);


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-64 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ServiceGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Success Animation */}
      {showSuccessAnimation && (
        <SuccessAnimation
          message={successMessage}
          onComplete={() => setShowSuccessAnimation(false)}
        />
      )}
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Digital Footprint</h1>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-5 w-5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Services discovered from your connected email accounts. Connect Gmail to scan for more.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/settings")}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show empty state when no services and not scanning */}
        {services.length === 0 && !scanning ? (
          <DashboardEmptyState
            hasGmailAccess={hasGmailAccess}
            onConnectGmail={handleConnectGmail}
            onStartScan={handleScan}
            isAuthorized={isAuthorized}
            onAuthorize={() => navigate("/authorize")}
          />
        ) : (
          <>
            {/* Subscription Status Card */}
            <SubscriptionStatusCard />

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
            <div className="flex flex-col gap-6">
              {/* Stats Row */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-foreground">{services.length}</h2>
                  <p className="text-sm text-muted-foreground">Online accounts discovered</p>
                </div>
              </div>
              
              {/* Scan Results */}
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
                    {scanStats.identifierMatches && scanStats.identifierMatches > 0 && (
                      <div className="flex items-center gap-1.5 text-primary">
                        <CheckCircle className="w-4 h-4" />
                        <span>{scanStats.identifierMatches} matched via identifiers</span>
                      </div>
                    )}
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

              {/* Scan Type Toggle */}
              {!scanning && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <Button
                      variant={scanType === 'quick' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScanType('quick')}
                    >
                      Quick Scan
                    </Button>
                    <Button
                      variant={scanType === 'deep' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setScanType('deep')}
                    >
                      Deep Scan
                    </Button>
                  </div>
                  
                  {/* Account Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Gmail Accounts</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={scanAccountOption === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScanAccountOption('all')}
                      >
                        All Accounts
                      </Button>
                      <Button
                        variant={scanAccountOption === 'primary' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScanAccountOption('primary')}
                      >
                        Primary Only
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {scanType === 'quick' ? (
                      <span>500 emails per category • ~30-60 seconds</span>
                    ) : (
                      <span>Up to 5,000 emails per category • ~2-5 minutes</span>
                    )}
                  </div>
                </div>
              )}

              {/* Scanning Progress */}
              {scanning && scanProgress && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <Loader2 className="w-4 h-4 mt-0.5 animate-spin text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium">{scanProgress.status}</p>
                      {scanProgress.currentEmail === 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          We're checking signup emails, invoices, orders, security alerts, and newsletters
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-primary font-medium">{Math.round((scanProgress.currentEmail / scanProgress.totalEmails) * 100)}%</span>
                    </div>
                    <Progress value={(scanProgress.currentEmail / scanProgress.totalEmails) * 100} className="h-2" />
                  </div>
                </div>
              )}

              {/* Scan Button */}
              <div className="flex justify-center pt-2">
                <Button 
                  onClick={handleScan}
                  disabled={scanning}
                  size="lg"
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {hasGmailAccess ? `Start ${scanType === 'quick' ? 'Quick' : 'Deep'} Scan` : "Connect Gmail"}
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
                {newServicesCount > 0 && (
                  <Badge variant="default" className="ml-2 bg-green-500">
                    {newServicesCount} NEW
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant={hideDeletedServices ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHideDeletedServices(!hideDeletedServices)}
                >
                  {hideDeletedServices ? "Show Deleted" : "Hide Deleted"}
                </Button>
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
              <div className="flex flex-col sm:flex-row gap-3">
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
                <Select value={selectedContactStatus} onValueChange={setSelectedContactStatus}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="All Contact Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">
                      🟢 Verified ({services.filter(s => s.contact_status === 'verified').length})
                    </SelectItem>
                    <SelectItem value="ai_discovered">
                      🟡 AI Discovered ({services.filter(s => s.contact_status === 'ai_discovered').length})
                    </SelectItem>
                    <SelectItem value="needs_discovery">
                      🔴 Needs Discovery ({services.filter(s => s.contact_status === 'needs_discovery').length})
                    </SelectItem>
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
                        setSelectedContactStatus("all");
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
                          
                          <div className="flex flex-wrap gap-2 justify-center">
                            {/* Category Badge */}
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${categoryColors[service.category] || categoryColors["Other"]}`}
                            >
                              {service.category || "Other"}
                            </Badge>
                            
                            {/* Contact Status Badge */}
                            {getContactStatusBadge(service.contact_status)}
                          </div>
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
                          {/* Quick Discovery Button - Only for needs_discovery status */}
                          {service.contact_status === 'needs_discovery' && (
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full bg-gradient-to-r from-primary to-primary/80"
                              onClick={() => handleQuickDiscovery(service)}
                            >
                              <Sparkles className="w-3 h-3 mr-2" />
                              Discover Contact
                            </Button>
                          )}
                          
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
              <div className="space-y-4">
                {/* AI Suggestions */}
                {aiSuggestions && aiSuggestions.length > 0 && (
                  <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-foreground">AI Suggestions</h4>
                    </div>
                    <div className="space-y-3">
                      {aiSuggestions.map((suggestion, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-background border border-border">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{suggestion.suggested_name}</p>
                              <p className="text-xs text-muted-foreground">{suggestion.domain}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {suggestion.category}
                              </Badge>
                              <Badge 
                                variant={suggestion.confidence === 'high' ? 'default' : suggestion.confidence === 'medium' ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                {suggestion.confidence}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{suggestion.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unmatched Domains List */}
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
                    💡 <strong>Tip:</strong> Use AI to automatically categorize these domains and suggest service names.
                  </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={handleAnalyzeDomains}
                    disabled={analyzingDomains}
                    variant="default"
                    className="flex-1 sm:flex-none bg-gradient-to-r from-primary to-primary/80"
                  >
                    {analyzingDomains ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={() => navigate("/unmatched-domains")}
                    variant="outline"
                    className="flex-1 sm:flex-none"
                  >
                    <Tag className="w-4 h-4 mr-2" />
                    Review All
                  </Button>
                </div>
              </div>
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
          </>
        )}
      </div>

      {/* Deletion Request Dialog */}
      <DeletionRequestDialog
        open={deletionDialogOpen}
        onOpenChange={setDeletionDialogOpen}
        service={selectedService}
        onSuccess={() => {
          fetchServices(); // Refresh to update contact status badges
          toast({
            title: "Success",
            description: "Deletion request has been sent successfully.",
          });
        }}
      />

      {/* Quick Contact Discovery Dialog */}
      <ContactDiscoveryDialog
        open={quickDiscoveryOpen}
        onOpenChange={setQuickDiscoveryOpen}
        service={quickDiscoveryService}
        onContactVerified={handleQuickDiscoveryComplete}
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
