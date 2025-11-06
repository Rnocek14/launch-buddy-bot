import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Shield, RefreshCw, LogOut, Loader2, ExternalLink, Search, ChevronDown, ChevronUp, Download, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validateGmailScope, isTokenValid } from "@/lib/googleAuth";

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
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAuth();
  }, []);

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
      const { data, error } = await supabase.functions.invoke("scan-gmail", {
        body: { accessToken: session.provider_token }
      });

      if (error) throw error;

      setScanStats({
        servicesFound: data.servicesFound,
        emailsScanned: data.emailsScanned,
        unmatchedCount: data.unmatchedCount
      });

      toast({
        title: "Scan complete!",
        description: `${data.message}. ${data.unmatchedCount > 0 ? `${data.unmatchedCount} unrecognized services found.` : ''}`,
        duration: 5000
      });

      await fetchServices();
      await fetchUnmatchedDomains();
    } catch (error: any) {
      toast({
        title: "Scan failed",
        description: error.message || "Please try reconnecting your Google account",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  const categoryColors: Record<string, string> = {
    "Social": "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    "Shopping": "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    "Finance": "bg-red-500/10 text-red-700 dark:text-red-400",
    "Streaming": "bg-pink-500/10 text-pink-700 dark:text-pink-400",
    "Productivity": "bg-green-500/10 text-green-700 dark:text-green-400",
    "Gaming": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    "News": "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
    "Travel": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
    "Other": "bg-gray-500/10 text-gray-700 dark:text-gray-400",
  };

  const categoryAvatarColors: Record<string, string> = {
    "Social": "bg-blue-500 text-white",
    "Shopping": "bg-purple-500 text-white",
    "Finance": "bg-red-500 text-white",
    "Streaming": "bg-pink-500 text-white",
    "Productivity": "bg-green-500 text-white",
    "Gaming": "bg-orange-500 text-white",
    "News": "bg-cyan-500 text-white",
    "Travel": "bg-indigo-500 text-white",
    "Other": "bg-gray-500 text-white",
  };

  const getServiceInitials = (name: string) => {
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

  const groupedServices = useMemo(() => {
    const groups: Record<string, Service[]> = {};
    filteredServices.forEach(service => {
      const category = service.category || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
    });
    return groups;
  }, [filteredServices]);

  const categories = useMemo(() => {
    const cats = new Set(services.map(s => s.category || "Other"));
    return Array.from(cats).sort();
  }, [services]);

  const toggleCategory = (category: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Digital Footprint Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.email}</p>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Privacy Footprint Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-6xl font-bold text-primary mb-2">
              {services.length}
            </div>
            <p className="text-muted-foreground mb-4">
              Active accounts discovered across the web
            </p>
            {scanStats && (
              <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/50 rounded-lg">
                <p><strong>Last Scan:</strong> {scanStats.emailsScanned} emails analyzed</p>
                <p><strong>Matched:</strong> {scanStats.servicesFound} known services</p>
                {scanStats.unmatchedCount > 0 && (
                  <p><strong>Unrecognized:</strong> {scanStats.unmatchedCount} domains (see below)</p>
                )}
              </div>
            )}
            <Button 
              onClick={handleScan}
              disabled={scanning}
              size="lg"
            >
              {scanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning inbox...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {hasGmailAccess ? "Rescan Inbox" : "Connect Gmail & Scan"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Discovered Accounts ({services.length})</CardTitle>
              {services.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportToCSV}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {services.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  No accounts found yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Click "Connect Gmail & Scan" above to discover your digital footprint
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search and Filter Controls */}
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
                    <SelectTrigger className="w-full sm:w-[180px]">
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

                {/* Results Count */}
                {(searchQuery || selectedCategory !== "all") && (
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredServices.length} of {services.length} services
                  </p>
                )}

                {/* No Results State */}
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground text-lg mb-2">
                      No services found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filters
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedServices).map(([category, categoryServices]) => (
                      <Collapsible
                        key={category}
                        open={openCategories[category] ?? true}
                        onOpenChange={() => toggleCategory(category)}
                      >
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="flex items-center gap-2">
                            <Badge className={categoryColors[category] || categoryColors["Other"]}>
                              {category}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {categoryServices.length} {categoryServices.length === 1 ? 'service' : 'services'}
                            </span>
                          </div>
                          {openCategories[category] ?? true ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-3">
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {categoryServices.map(service => (
                              <div 
                                key={service.id}
                                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
                              >
                                <Avatar className="w-12 h-12 rounded-lg">
                                  <AvatarImage 
                                    src={service.logo_url || ''} 
                                    alt={service.name}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className={`rounded-lg ${categoryAvatarColors[service.category] || categoryAvatarColors["Other"]}`}>
                                    {getServiceInitials(service.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-foreground truncate">{service.name}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {new Date(service.discovered_at).toLocaleDateString()}
                                    </Badge>
                                  </div>
                                </div>
                                {service.homepage_url && (
                                  <a 
                                    href={service.homepage_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0"
                                    title="Visit website"
                                  >
                                    <Button variant="outline" size="sm" className="gap-2">
                                      Visit
                                      <ExternalLink className="w-3 h-3" />
                                    </Button>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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
                {unmatchedDomains.map((item, idx) => (
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
              <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Tip:</strong> These domains sent you signup or notification emails. 
                  You may want to review them manually to see if they're services you forgot about or no longer use.
                </p>
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
    </div>
  );
}
