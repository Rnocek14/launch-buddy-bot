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
import { SmartBatchSelector } from "@/components/SmartBatchSelector";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { MobileFilterDrawer } from "@/components/MobileFilterDrawer";
import { FilterChips } from "@/components/FilterChips";
import { useIsMobile } from "@/hooks/use-mobile";
import { Checkbox } from "@/components/ui/checkbox";
import { ContactDiscoveryDialog } from "@/components/ContactDiscoveryDialog";
import { Navbar } from "@/components/Navbar";
import { DashboardEmptyState } from "@/components/DashboardEmptyState";
import { PostScanWizard } from "@/components/PostScanWizard";
import { ServiceGridSkeleton } from "@/components/ServiceCardSkeleton";
import { DeletionProgressTracker } from "@/components/DeletionProgressTracker";
import { ImpactVisualization } from "@/components/ImpactVisualization";
import { SuccessAnimation } from "@/components/SuccessAnimation";
import { getErrorMessage, successMessages } from "@/lib/errorMessages";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { OnboardingBanner } from "@/components/OnboardingBanner";
import { ScanResultsBanner } from "@/components/ScanResultsBanner";
import { TRACKING_EVENTS, trackConversion } from "@/lib/analytics";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { ExtensionPrompt } from "@/components/ExtensionPrompt";
import { BrokerScanCard } from "@/components/BrokerScanCard";
import { PrivacySnapshot } from "@/components/PrivacySnapshot";
import { ScoreHistoryChart } from "@/components/ScoreHistoryChart";
import { ReferralChallengePanel } from "@/components/ReferralChallengePanel";
import { SimplifiedServiceCard } from "@/components/SimplifiedServiceCard";
import { CleanUpWizard } from "@/components/CleanUpWizard";
import { ServiceCard } from "@/components/ServiceCard";

interface Service {
  id: string;
  name: string;
  logo_url: string;
  homepage_url: string;
  category: string;
  discovered_at: string;
  contact_status?: 'verified' | 'ai_discovered' | 'needs_discovery';
  domain: string;
  discovery_source?: 'email' | 'extension' | 'manual';
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
  const isMobile = useIsMobile();
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
  const [showCleanUpWizard, setShowCleanUpWizard] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);

  // Pull-to-refresh setup
  const { isPulling, pullDistance, isRefreshing, setScrollableRef } = usePullToRefresh({
    onRefresh: async () => {
      if (!scanning) {
        await handleScan();
      }
    },
    threshold: 80,
    maxPullDistance: 150,
    enabled: isMobile && !scanning,
  });

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
    
    // Check for stored email connections instead of session.provider_token
    const { data: connections } = await supabase
      .from('email_connections')
      .select('id')
      .eq('user_id', session.user.id)
      .limit(1);
    
    setHasGmailAccess(connections && connections.length > 0);
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
      domain: item.service_catalog.domain || '',
      discovery_source: item.discovery_source || 'email'
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
      
      // Normalize risk data shape for RiskScoreCard compatibility
      const raw = data ?? {};
      const scoreVal = raw.riskScore ?? raw.score ?? 0;
      const levelVal = raw.riskLevel ?? raw.level ?? 'unknown';
      const factorsVal = raw.riskFactors ?? raw.factors;
      const insightsVal = raw.insights;
      setRiskData({
        ...raw,
        riskScore: typeof scoreVal === 'number' ? scoreVal : Number(scoreVal) || 0,
        riskLevel: typeof levelVal === 'string' ? levelVal : 'unknown',
        riskFactors: Array.isArray(factorsVal) ? factorsVal : [],
        insights: Array.isArray(insightsVal) ? insightsVal : (typeof insightsVal === 'string' ? insightsVal : ''),
      });
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

  const handleSmartSelectOldest = () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    
    const oldestServices = filteredServices.filter((service: any) => 
      new Date(service.discovered_at) < threeYearsAgo
    );
    setSelectedServices(new Set(oldestServices.map(s => s.id)));
    toast({
      title: "Smart Selection",
      description: `Selected ${oldestServices.length} oldest accounts (3+ years old)`,
    });
  };

  const handleSmartSelectSensitive = () => {
    const sensitiveCategories = ['Social Media', 'Dating', 'Health & Fitness', 'Finance', 'Banking', 'Healthcare'];
    const sensitiveServices = filteredServices.filter((service: any) =>
      sensitiveCategories.includes(service.category || '')
    );
    setSelectedServices(new Set(sensitiveServices.map(s => s.id)));
    toast({
      title: "Smart Selection",
      description: `Selected ${sensitiveServices.length} sensitive accounts`,
    });
  };

  const handleSmartSelectAll = () => {
    setSelectedServices(new Set(filteredServices.map(s => s.id)));
    toast({
      title: "Smart Selection", 
      description: `Selected all ${filteredServices.length} accounts`,
    });
  };

  const getSmartSelectionCounts = () => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    
    const oldestCount = filteredServices.filter((service: any) => 
      new Date(service.discovered_at) < threeYearsAgo
    ).length;
    
    const sensitiveCategories = ['Social Media', 'Dating', 'Health & Fitness', 'Finance', 'Banking', 'Healthcare'];
    const sensitiveCount = filteredServices.filter((service: any) =>
      sensitiveCategories.includes(service.category || '')
    ).length;
    
    return { oldestCount, sensitiveCount };
  };

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

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedContactStatus("all");
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

  const extensionServiceCount = useMemo(() => {
    return services.filter((s: any) => s.discovery_source === 'extension').length;
  }, [services]);

  const isServiceNew = (discoveredAt: string) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(discoveredAt) >= thirtyDaysAgo;
  };

  // Calculate impact metrics for visualization
  const impactMetrics = useMemo(() => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    const sensitiveCategories = ['Social Media', 'Dating', 'Health & Fitness', 'Finance', 'Banking', 'Healthcare'];

    // Count services with deletion requests
    const deletedServices = services.filter((s: any) => s.deletion_requested_at);
    const totalDeletions = deletedServices.length;
    const servicesRemaining = services.length - totalDeletions;

    // Count old accounts that were deleted
    const oldAccountsDeleted = deletedServices.filter((s: any) => 
      new Date(s.discovered_at) < threeYearsAgo
    ).length;

    // Count sensitive accounts that were deleted
    const sensitiveAccountsDeleted = deletedServices.filter((s: any) =>
      sensitiveCategories.includes(s.category || '')
    ).length;

    return {
      totalDeletions,
      servicesRemaining,
      oldAccountsDeleted,
      sensitiveAccountsDeleted,
    };
  }, [services]);

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
    <div className={`min-h-screen bg-background ${isMobile ? 'pb-24' : ''}`}>
      {/* Pull-to-refresh indicator (mobile only) */}
      {isMobile && (
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          threshold={80}
        />
      )}
      
      {/* Success Animation */}
      {showSuccessAnimation && (
        <SuccessAnimation
          message={successMessage}
          onComplete={() => setShowSuccessAnimation(false)}
        />
      )}
      {/* Navigation */}
      <Navbar />

      {/* Header */}
      <div className="border-b border-border bg-card mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your Online Accounts</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {services.length > 0
                  ? `${services.length} accounts found — review and clean up what you don't need.`
                  : "Scan your connected inbox to find services storing your data."}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {services.length > 0 && (
                <Button
                  onClick={() => setShowCleanUpWizard(true)}
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 text-base"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clean Up My Accounts
                </Button>
              )}
              {!scanning ? (
                <>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    Takes ~30s · Read-only
                  </span>
                  <Button
                    onClick={hasGmailAccess ? handleScan : handleConnectGmail}
                    disabled={scanning}
                    size="lg"
                    className="h-12 px-6 text-base"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {hasGmailAccess ? "Run Scan" : "Connect Gmail to Scan"}
                  </Button>
                </>
              ) : (
                <Button disabled size="lg" className="h-12 px-6">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
            {/* Privacy Snapshot — unified view of all scan results */}
            <PrivacySnapshot />

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

            {/* Scan Progress (only while scanning) */}
            {scanning && scanProgress && (
              <Card className="overflow-hidden border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <Loader2 className="w-4 h-4 mt-0.5 animate-spin text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground font-medium">
                          {(() => {
                            const pct = scanProgress.totalEmails
                              ? scanProgress.currentEmail / scanProgress.totalEmails
                              : 0;
                            return pct <= 0.05
                              ? "Step 1 of 3: Connecting to your inbox…"
                              : pct < 0.85
                                ? "Step 2 of 3: Reading your emails…"
                                : "Step 3 of 3: Matching services — almost done!";
                          })()}
                        </p>
                        {scanProgress.totalEmails && (scanProgress.currentEmail / scanProgress.totalEmails) <= 0.05 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            We look for signup emails, invoices, orders, and newsletters
                          </p>
                        )}
                      </div>
                    </div>
                    <Progress value={(scanProgress.currentEmail / scanProgress.totalEmails) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Last Scan Results (compact) */}
            {scanStats && !scanning && (
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground px-1">
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
            )}

            {/* Collapsible Insights Section */}
            {(riskData || monthlyStats || services.length > 0) && (
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer list-none py-3 px-4 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm text-foreground">Insights</span>
                  <span className="text-xs text-muted-foreground ml-1">— Score history, monthly stats, impact</span>
                  <span className="ml-auto text-xs text-muted-foreground group-open:hidden">▸</span>
                  <span className="ml-auto text-xs text-muted-foreground hidden group-open:inline">▾</span>
                </summary>
                <div className="mt-4 space-y-6">
                  {/* Onboarding Banner (for returning users — not shown above fold) */}
                  {services.length > 0 && <OnboardingBanner />}

                  {/* Subscription Status Card */}
                  <SubscriptionStatusCard />

                  {/* Extension Prompt */}
                  <ExtensionPrompt extensionServiceCount={extensionServiceCount} />

                   {/* Broker scan results now shown in Privacy Snapshot above */}

                  {/* This Month Summary */}
                  {monthlyStats && (
                    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
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
                      <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-1">
                            <span className="text-sm text-muted-foreground">New Services</span>
                            <p className="text-2xl font-bold">{monthlyStats.newServicesCount}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-1">
                            <span className="text-sm text-muted-foreground">Reappeared</span>
                            <p className="text-2xl font-bold">{monthlyStats.reappearedCount}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-1">
                            <span className="text-sm text-muted-foreground">Deletions Sent</span>
                            <p className="text-2xl font-bold">{monthlyStats.totalDeletions}</p>
                          </div>
                          <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-1">
                            <span className="text-sm text-muted-foreground">Last Scan</span>
                            <p className="text-lg font-bold">
                              {monthlyStats.lastScanDate
                                ? new Date(monthlyStats.lastScanDate).toLocaleDateString()
                                : 'Never'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Risk Score & History */}
                  {riskData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <RiskScoreCard
                        score={riskData.riskScore}
                        level={riskData.riskLevel}
                        factors={riskData.riskFactors}
                        insights={riskData.insights || ''}
                        percentile={riskData.percentile}
                        topCategories={riskData.topCategories}
                      />
                      <ScoreHistoryChart />
                    </div>
                  )}

                  {/* Deletion Progress Tracker */}
                  {services.length > 0 && (
                    <DeletionProgressTracker services={services} />
                  )}

                  {/* Impact Visualization */}
                  {services.length > 0 && impactMetrics.totalDeletions > 0 && (
                    <ImpactVisualization
                      totalDeletions={impactMetrics.totalDeletions}
                      servicesRemaining={impactMetrics.servicesRemaining}
                      oldAccountsDeleted={impactMetrics.oldAccountsDeleted}
                      sensitiveAccountsDeleted={impactMetrics.sensitiveAccountsDeleted}
                    />
                  )}

                  {/* Referral panel moved to bottom of page */}
                </div>
              </details>
            )}

        {/* Services Grid Section */}
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
                variant={viewTab === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewTab('all')}
                className="rounded-b-none"
              >
                All
                <Badge variant="secondary" className="ml-2">
                  {services.length}
                </Badge>
              </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{filteredServices.length}</span>
                  <span>
                    {viewTab === 'priority' ? 'worth reviewing' : ''} 
                    {viewTab !== 'all' && ' '}accounts
                    {viewTab === 'all' && (
                      <>
                        <span className="mx-1">of</span>
                        <span className="font-medium text-foreground">{services.length}</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant={bulkMode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setBulkMode(!bulkMode);
                    if (bulkMode) setSelectedServices(new Set());
                  }}
                >
                  {bulkMode ? "Done selecting" : "Select multiple"}
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
            {isMobile ? (
              <div className="flex items-center gap-3">
                <MobileFilterDrawer
                  searchQuery={searchQuery}
                  selectedCategory={selectedCategory}
                  selectedContactStatus={selectedContactStatus}
                  categories={categories}
                  services={services}
                  onSearchChange={setSearchQuery}
                  onCategoryChange={setSelectedCategory}
                  onContactStatusChange={setSelectedContactStatus}
                  onClearAll={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setSelectedContactStatus("all");
                  }}
                />
                {(searchQuery || selectedCategory !== "all" || selectedContactStatus !== "all") && (
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                    <span className="text-xs text-muted-foreground">
                      {filteredServices.length} results
                    </span>
                  </div>
                )}
              </div>
            ) : (
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
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  You don't need to delete everything — start with accounts you no longer use.
                </p>
                <div id="services-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredServices.map(service => (
                  <SimplifiedServiceCard
                    key={service.id}
                    service={service}
                    onRequestDeletion={handleRequestDeletion}
                    getServiceInitials={getServiceInitials}
                    bulkMode={bulkMode}
                    isSelected={selectedServices.has(service.id)}
                    onToggleSelection={toggleServiceSelection}
                  />
                ))}
              </div>
              </>
            )}
          </div>

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

        {/* Referral Challenge Panel - below main content */}
        <div className="mt-8">
          <ReferralChallengePanel />
        </div>

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

      {/* Batch Deletion Toolbar - Desktop Only */}
      {!isMobile && (
        <BatchDeletionToolbar
          selectedCount={selectedServices.size}
          onClear={() => setSelectedServices(new Set())}
          onDelete={handleBatchDeletion}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        selectedCount={selectedServices.size}
        onClear={() => setSelectedServices(new Set())}
        onDelete={handleBatchDeletion}
        onSmartSelect={handleSmartSelectSensitive}
        totalServices={filteredServices.length}
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

      {/* Clean Up Wizard */}
      <CleanUpWizard
        open={showCleanUpWizard}
        onOpenChange={setShowCleanUpWizard}
        services={services}
        getServiceInitials={getServiceInitials}
        onComplete={() => {
          fetchServices();
          setShowCleanUpWizard(false);
        }}
      />
    </div>
  );
}
