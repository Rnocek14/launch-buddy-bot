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
import { Shield, RefreshCw, LogOut, Loader2, ExternalLink, Search, Download, AlertCircle, Sparkles, Mail, Tag, TrendingUp, Trash2, CheckCircle, FileText, DollarSign, Package, Lock, Bell, Settings, HelpCircle, Calendar, Activity, Share2 } from "lucide-react";
import { RiskScoreCard } from "@/components/RiskScoreCard";
import { ShareResultDialog } from "@/components/ShareResultDialog";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { trackEvent } from "@/lib/analytics";
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
import { PostScanWizard } from "@/components/PostScanWizard";
import { ServiceGridSkeleton } from "@/components/ServiceCardSkeleton";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { getErrorMessage, successMessages } from "@/lib/errorMessages";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { ScanResultsBanner } from "@/components/ScanResultsBanner";
import { TRACKING_EVENTS, trackConversion } from "@/lib/analytics";

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
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [scanResultsBanner, setScanResultsBanner] = useState<{
    scannedEmails: string[];
    totalServices: number;
    newServices: number;
    messagesScanned: number;
    scanTimestamp: Date;
  } | null>(null);
  const [newServiceIds, setNewServiceIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'new'>('all');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [showShareNudge, setShowShareNudge] = useState(false);
  const [showAdvancedScan, setShowAdvancedScan] = useState(false);
  const [viewTab, setViewTab] = useState<'all' | 'priority' | 'new'>('all');
  const [showPostScanWizard, setShowPostScanWizard] = useState(false);
  const [priorityServicesForWizard, setPriorityServicesForWizard] = useState<Service[]>([]);

  // Monthly stats state
  const [monthlyStats, setMonthlyStats] = useState<{
    newServicesCount: number;
    reappearedCount: number;
    totalDeletions: number;
    lastScanDate: string | null;
  } | null>(null);

  useEffect(() => {
    checkAuth();
    checkSubscription();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      fetchRiskScore();
      fetchMonthlyStats();
    }
  }, [services.length]);

  useEffect(() => {
    if (!riskData) return;

    const hasSeen = window.localStorage.getItem('ff_seen_share_nudge');
    if (!hasSeen) {
      setShowShareNudge(true);
      trackEvent('share_nudge_shown', {
        riskScore: riskData.riskScore,
        riskLevel: riskData.riskLevel,
      });
    }
  }, [riskData]);

  useEffect(() => {
    if (user && services.length > 0) {
      fetchMonthlyStats();
    }
  }, [user, services]);

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

  async function checkSubscription() {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setSubscriptionTier(data?.tier || 'free');
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
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
    return mapped;
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
      
      // Determine whether to scan all emails or just one
      const shouldScanAll = connections.length > 1 && subscriptionTier === 'pro';
      
      let data, error;
      
      if (shouldScanAll) {
        // Scan all connected emails (up to 3 for Pro)
        const response = await supabase.functions.invoke("scan-all-emails", {
          body: { 
            maxResults: scanType === 'quick' ? 500 : 2000,
          }
        });
        
        data = response.data;
        error = response.error;
        
        if (!error && data) {
          setScanProgress({ currentEmail: 90, totalEmails: 100, status: "Analyzing services..." });
          
          setScanStats({
            servicesFound: data.totalDiscovered || 0,
            emailsScanned: data.totalMessagesScanned || 0,
            unmatchedCount: 0,
            identifierMatches: 0,
          });
        }
      } else {
        // Scan single email (free tier or only 1 connection)
        const primaryConnection = connections.find(c => c.is_primary) || connections[0];
        
        const response = await supabase.functions.invoke("scan-email", {
          body: { 
            connectionId: primaryConnection.id,
            maxResults: scanType === 'quick' ? 500 : 2000,
          }
        });
        
        data = response.data;
        error = response.error;
        
        if (!error && data) {
          setScanProgress({ currentEmail: 90, totalEmails: 100, status: "Analyzing services..." });
          
          setScanStats({
            servicesFound: data.servicesFound || 0,
            emailsScanned: data.emailsScanned || 0,
            unmatchedCount: data.unmatchedCount || 0,
            identifierMatches: 0,
          });
        }
      }

      if (error) throw error;

      // Check for token repair issues - only show error if tokens are actually encrypted
      if (data.tokenRepairStatus === 'failed') {
        // Verify if the connection's tokens are actually marked as encrypted
        const { data: connectionData } = await supabase
          .from('email_connections')
          .select('tokens_encrypted')
          .eq('user_id', user?.id)
          .single();
        
        // Only show error if tokens_encrypted flag is TRUE (real corruption)
        // Don't show error if tokens are plain text and working (false positive)
        if (connectionData?.tokens_encrypted) {
          toast({
            title: "Email Connection Issue Detected",
            description: "Your email connection needs to be reset. Please reconnect in Settings.",
            variant: "destructive",
            action: (
              <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
                Go to Settings
              </Button>
            )
          });
        }
      }

      if (data.tokenIssues && data.tokenIssues.length > 0) {
        console.warn('[Token State Issues]', {
          issues: data.tokenIssues,
          repairStatus: data.tokenRepairStatus
        });
      }

      setScanProgress({ currentEmail: 100, totalEmails: 100, status: "Complete!" });
      
      // Success - show animation
      setShowSuccessAnimation(true);
      setSuccessMessage(successMessages.scanComplete.message);
      
      const successDesc = shouldScanAll && data.scannedEmails
        ? `Scanned ${data.scannedEmails.length} email account${data.scannedEmails.length > 1 ? 's' : ''} and found ${data.totalDiscovered || 0} services.`
        : `${data.message || 'Scan complete'}. ${data.unmatchedCount > 0 ? `${data.unmatchedCount} unrecognized services found.` : ''}`;
      
      toast({
        title: successMessages.scanComplete.title,
        description: successDesc,
        duration: 5000
      });

      // Store scan results for banner
      const scanTimestamp = new Date();
      const scannedEmailsList = shouldScanAll && data.scannedEmails 
        ? data.scannedEmails 
        : connections.map(c => c.email).slice(0, 1);
      
      setScanResultsBanner({
        scannedEmails: scannedEmailsList,
        totalServices: shouldScanAll ? (data.totalDiscovered || 0) : (data.servicesFound || 0),
        newServices: 0, // Will be calculated after fetchServices
        messagesScanned: shouldScanAll ? (data.totalMessagesScanned || 0) : (data.emailsScanned || 0),
        scanTimestamp,
      });

      const freshServices = await fetchServices();
      
      // Calculate new services (discovered within last 2 minutes of scan)
      const twoMinutesAgo = new Date(scanTimestamp.getTime() - 2 * 60 * 1000);
      const newServicesList = freshServices?.filter(s => 
        new Date(s.discovered_at) > twoMinutesAgo
      ) || [];
      
      const newIds = new Set(newServicesList.map(s => s.id));
      setNewServiceIds(newIds);
      setScanResultsBanner(prev => prev ? { ...prev, newServices: newIds.size } : null);
      setBannerDismissed(false);
      
      await fetchUnmatchedDomains();
      await fetchRiskScore();

      // Show post-scan wizard if this is the first scan or if there are priority services
      if (freshServices && freshServices.length > 0) {
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
        const sensitiveCategories = ['Finance', 'Banking', 'Healthcare', 'Government'];
        
        const priority = freshServices.filter((s: any) => {
          const isOld = new Date(s.discovered_at) <= threeYearsAgo;
          const isSensitive = sensitiveCategories.includes(s.category);
          return isOld || isSensitive;
        }).slice(0, 5);

        if (priority.length > 0 && !window.localStorage.getItem('ff_seen_post_scan_wizard')) {
          setPriorityServicesForWizard(priority);
          setTimeout(() => {
            setShowPostScanWizard(true);
            window.localStorage.setItem('ff_seen_post_scan_wizard', '1');
          }, 1500);
        }
      }
      
      // Track successful scan completion
      if (user?.id) {
        trackConversion(TRACKING_EVENTS.SCAN_COMPLETED, user.id, {
          servicesDiscovered: shouldScanAll ? (data.totalDiscovered || 0) : (data.servicesFound || 0),
          emailsScanned: shouldScanAll ? (data.totalMessagesScanned || 0) : (data.emailsScanned || 0),
          provider: shouldScanAll ? 'multiple' : connections[0]?.provider,
          scanType: scanType,
        });
      }
    } catch (error: any) {
      // Handle Supabase FunctionsHttpError - extract actual error from context
      let actualError = error;
      if (error?.context && typeof error.context.json === 'function') {
        try {
          actualError = await error.context.json();
        } catch (e) {
          console.error('Failed to parse error context:', e);
        }
      }
      
      const errorMsg = getErrorMessage(actualError);
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
      
      if (error) {
        // Risk score is optional - don't show error toast
        console.warn('Risk score unavailable:', error);
        setRiskData(null);
        return;
      }
      
      setRiskData(data);
    } catch (error: any) {
      // Silent failure - risk score is optional
      console.warn('Failed to fetch risk score:', error);
      setRiskData(null);
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
    let filtered = services.filter((service: any) => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
      const matchesContactStatus = selectedContactStatus === "all" || service.contact_status === selectedContactStatus;
      const matchesDeletedFilter = !hideDeletedServices || !service.deletion_requested_at;
      return matchesSearch && matchesCategory && matchesContactStatus && matchesDeletedFilter;
    });

    // Apply "new this scan" filter if active
    if (filterMode === 'new' && newServiceIds.size > 0) {
      filtered = filtered.filter(s => newServiceIds.has(s.id));
    }

    // Apply tab filter
    if (viewTab === 'priority') {
      // Show oldest accounts (3+ years old) OR reappeared accounts OR sensitive categories
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      const sensitiveCategories = ['Finance', 'Banking', 'Healthcare', 'Government'];
      
      filtered = filtered.filter((s: any) => {
        const isOld = new Date(s.discovered_at) <= threeYearsAgo;
        const isReappeared = !!s.reappeared_at;
        const isSensitive = sensitiveCategories.includes(s.category);
        return isOld || isReappeared || isSensitive;
      });
    } else if (viewTab === 'new') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter((s: any) => new Date(s.discovered_at) >= thirtyDaysAgo);
    }

    return filtered;
  }, [services, searchQuery, selectedCategory, selectedContactStatus, hideDeletedServices, filterMode, newServiceIds, viewTab]);

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

  // Fetch monthly statistics
  async function fetchMonthlyStats() {
    if (!user?.id) return;

    try {
      // Get profile for last scan date
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_email_scan_date')
        .eq('id', user.id)
        .single();

      // Calculate services discovered in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newCount = services.filter((s: any) => 
        new Date(s.discovered_at) >= thirtyDaysAgo && !s.deletion_requested_at
      ).length;
      
      // Get reappeared services (services with reappeared_at set in last 30 days)
      const { data: reappearedServices } = await supabase
        .from('user_services')
        .select('reappeared_at')
        .eq('user_id', user.id)
        .not('reappeared_at', 'is', null)
        .gte('reappeared_at', thirtyDaysAgo.toISOString());

      // Get total deletions count
      const { count: deletionsCount } = await supabase
        .from('deletion_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setMonthlyStats({
        newServicesCount: newCount,
        reappearedCount: reappearedServices?.length || 0,
        totalDeletions: deletionsCount || 0,
        lastScanDate: profile?.last_email_scan_date || null
      });
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
    }
  }


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
            {/* Onboarding Banner */}
            <OnboardingBanner />

            {/* Scan Results Banner */}
            {scanResultsBanner && !bannerDismissed && (
              <ScanResultsBanner
                scannedEmails={scanResultsBanner.scannedEmails}
                totalServices={scanResultsBanner.totalServices}
                newServices={scanResultsBanner.newServices}
                messagesScanned={scanResultsBanner.messagesScanned}
                onViewNew={() => {
                  setFilterMode('new');
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedContactStatus("all");
                  document.getElementById("services-grid")?.scrollIntoView({ behavior: "smooth" });
                }}
                onViewAll={() => {
                  setFilterMode('all');
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedContactStatus("all");
                  document.getElementById("services-grid")?.scrollIntoView({ behavior: "smooth" });
                }}
                onDismiss={() => setBannerDismissed(true)}
              />
            )}

            {/* Subscription Status Card */}
            <SubscriptionStatusCard />

            {/* This Month Summary Block */}
            {monthlyStats && (
              <Card className="mb-8 overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">This Month</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your privacy activity summary
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* New Services */}
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">New Services</span>
                        <Sparkles className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          {monthlyStats.newServicesCount}
                        </span>
                        {monthlyStats.newServicesCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <Progress 
                        value={Math.min((monthlyStats.newServicesCount / services.length) * 100, 100)} 
                        className="h-1.5"
                      />
                      <p className="text-xs text-muted-foreground">
                        Discovered in last 30 days
                      </p>
                    </div>

                    {/* Reappeared Services */}
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Reappeared</span>
                        <Activity className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          {monthlyStats.reappearedCount}
                        </span>
                        {monthlyStats.reappearedCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            ⚠️
                          </Badge>
                        )}
                      </div>
                      <Progress 
                        value={monthlyStats.reappearedCount > 0 ? Math.min((monthlyStats.reappearedCount / services.length) * 100, 100) : 0} 
                        className="h-1.5"
                      />
                      <p className="text-xs text-muted-foreground">
                        Services still emailing after deletion
                      </p>
                    </div>

                    {/* Total Deletions */}
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Deletions</span>
                        <Trash2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">
                          {monthlyStats.totalDeletions}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((monthlyStats.totalDeletions / Math.max(services.length, 1)) * 100, 100)} 
                        className="h-1.5"
                      />
                      <p className="text-xs text-muted-foreground">
                        Deletion requests sent
                      </p>
                    </div>

                    {/* Last Scan */}
                    <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Scan</span>
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-semibold text-foreground">
                          {monthlyStats.lastScanDate
                            ? new Date(monthlyStats.lastScanDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Never'}
                        </span>
                        {monthlyStats.lastScanDate && (
                          <span className="text-xs text-muted-foreground">
                            {(() => {
                              const daysSince = Math.floor(
                                (Date.now() - new Date(monthlyStats.lastScanDate).getTime()) / (1000 * 60 * 60 * 24)
                              );
                              return daysSince === 0
                                ? 'Today'
                                : daysSince === 1
                                ? 'Yesterday'
                                : `${daysSince} days ago`;
                            })()}
                          </span>
                        )}
                      </div>
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleScan}
                          disabled={scanning}
                          className="w-full text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Scan Now
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Insights */}
                  {(monthlyStats.newServicesCount > 0 || monthlyStats.reappearedCount > 0) && (
                    <div className="pt-4 border-t border-border/50">
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5">
                        <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            {monthlyStats.reappearedCount > 0
                              ? `${monthlyStats.reappearedCount} service${monthlyStats.reappearedCount > 1 ? 's' : ''} reappeared after deletion`
                              : `${monthlyStats.newServicesCount} new service${monthlyStats.newServicesCount > 1 ? 's' : ''} discovered`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {monthlyStats.reappearedCount > 0
                              ? 'These services are still emailing you. Consider following up on your deletion requests.'
                              : 'Your digital footprint is growing. Review and manage these new accounts.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Viral Share Nudge */}
            {showShareNudge && riskData && (
              <Alert className="mb-4 border-primary/40 bg-primary/5">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle>Your digital footprint report is ready 🎯</AlertTitle>
                <AlertDescription>
                  We found <strong>{services.length} accounts</strong> tied to your email.
                  Your risk score is <strong>{riskData.riskScore}</strong> ({riskData.riskLevel} risk).
                </AlertDescription>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setShareDialogOpen(true);
                      setShowShareNudge(false);
                      window.localStorage.setItem('ff_seen_share_nudge', '1');
                      trackEvent('share_nudge_clicked');
                    }}
                  >
                    Share My Score
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowShareNudge(false);
                      window.localStorage.setItem('ff_seen_share_nudge', '1');
                      trackEvent('share_nudge_dismissed');
                    }}
                  >
                    Not now
                  </Button>
                </div>
              </Alert>
            )}

            {/* Risk Score Card */}
            {riskData && (
              <div className="mb-8 space-y-4">
                <RiskScoreCard
                  score={riskData.riskScore}
                  level={riskData.riskLevel}
                  factors={riskData.riskFactors}
                  insights={riskData.insights}
                  percentile={riskData.percentile}
                  exposureFactors={riskData.exposureFactors}
                  topCategories={riskData.topCategories}
                  comparison={riskData.comparison}
                  onFilterOldAccounts={() => {
                    setViewTab('priority');
                    document.getElementById("services-grid")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  onFilterSensitive={() => {
                    const sensitiveCategories = ['Finance', 'Banking', 'Healthcare', 'Government'];
                    const firstSensitive = services.find((s: any) => sensitiveCategories.includes(s.category));
                    if (firstSensitive) {
                      setSelectedCategory(firstSensitive.category);
                      document.getElementById("services-grid")?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  onFilterCategory={(category: string) => {
                    setSelectedCategory(category);
                    setViewTab('all');
                    document.getElementById("services-grid")?.scrollIntoView({ behavior: "smooth" });
                  }}
                />
                <div className="flex justify-center">
                  <Button
                    onClick={() => setShareDialogOpen(true)}
                    size="lg"
                    className="gap-2"
                    variant="outline"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Your Score
                  </Button>
                </div>
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

              {/* Simplified Scan Options */}
              {!scanning && (
                <div className="flex flex-col gap-3 pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      Quick scan (~30-60 seconds)
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAdvancedScan(!showAdvancedScan)}
                      className="text-xs h-auto p-1"
                    >
                      {showAdvancedScan ? 'Hide' : 'Show'} Advanced Options
                    </Button>
                  </div>
                  
                  {showAdvancedScan && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border animate-in slide-in-from-top-2">
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
                      
                      <div className="flex-1 space-y-2">
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
                        {scanType === 'deep' && (
                          <span>Up to 5,000 emails • ~2-5 minutes</span>
                        )}
                      </div>
                    </div>
                  )}
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
            {/* View Tabs */}
            <div className="flex items-center gap-2 border-b border-border">
              <Button
                variant={viewTab === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewTab('all')}
                className="rounded-b-none"
              >
                All Services
                <Badge variant="secondary" className="ml-2">
                  {services.length}
                </Badge>
              </Button>
              <Button
                variant={viewTab === 'priority' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewTab('priority')}
                className="rounded-b-none gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Priority
                <Badge variant="secondary" className="ml-1">
                  {(() => {
                    const threeYearsAgo = new Date();
                    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
                    const sensitiveCategories = ['Finance', 'Banking', 'Healthcare', 'Government'];
                    return services.filter((s: any) => {
                      const isOld = new Date(s.discovered_at) <= threeYearsAgo;
                      const isReappeared = !!s.reappeared_at;
                      const isSensitive = sensitiveCategories.includes(s.category);
                      return isOld || isReappeared || isSensitive;
                    }).length;
                  })()}
                </Badge>
              </Button>
              <Button
                variant={viewTab === 'new' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewTab('new')}
                className="rounded-b-none"
              >
                New (30d)
                <Badge variant="secondary" className="ml-2">
                  {newServicesCount}
                </Badge>
              </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{filteredServices.length}</span>
                <span>
                  {viewTab === 'priority' ? 'priority' : viewTab === 'new' ? 'new' : ''} 
                  {viewTab !== 'all' && ' '}services
                  {viewTab === 'all' && (
                    <>
                      <span className="mx-1">of</span>
                      <span className="font-medium text-foreground">{services.length}</span>
                    </>
                  )}
                </span>
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
              <div id="services-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredServices.map(service => {
                  const ServiceCardComponent = require('@/components/ServiceCard').ServiceCard;
                  return (
                    <ServiceCardComponent
                      key={service.id}
                      service={service}
                      isSelected={selectedServices.has(service.id)}
                      isNew={isServiceNew(service.discovered_at)}
                      categoryColor={categoryColors[service.category] || categoryColors["Other"]}
                      onToggleSelection={toggleServiceSelection}
                      onRequestDeletion={handleRequestDeletion}
                      onQuickDiscovery={handleQuickDiscovery}
                      getServiceInitials={getServiceInitials}
                      getContactStatusBadge={getContactStatusBadge}
                    />
                  );
                })}
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

      {/* Share Result Dialog */}
      {riskData && (
        <ShareResultDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          riskScore={riskData.riskScore}
          riskLevel={riskData.riskLevel}
          serviceCount={services.length}
          topServices={services
            .filter(s => s.name)
            .slice(0, 6)
            .map(s => s.name)
          }
          avgAccountAge={riskData.riskFactors?.avgAccountAge || 0}
          unmatchedCount={unmatchedDomains.length}
          percentile={riskData.percentile}
          topCategories={riskData.topCategories}
        />
      )}

      {/* Post-Scan Priority Wizard */}
      <PostScanWizard
        open={showPostScanWizard}
        onOpenChange={setShowPostScanWizard}
        priorityServices={priorityServicesForWizard}
        totalServices={services.length}
        onRequestDeletion={handleRequestDeletion}
        onQuickDiscovery={handleQuickDiscovery}
        getServiceInitials={getServiceInitials}
      />
    </div>
  );
}
