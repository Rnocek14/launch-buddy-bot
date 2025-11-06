import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, RefreshCw, LogOut, Loader2, ExternalLink } from "lucide-react";
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [hasGmailAccess, setHasGmailAccess] = useState(false);

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
            scopes: 'https://www.googleapis.com/auth/gmail.readonly',
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
            scopes: 'https://www.googleapis.com/auth/gmail.readonly',
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
            scopes: 'https://www.googleapis.com/auth/gmail.readonly',
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

      toast({
        title: "Scan complete!",
        description: data.message,
        duration: 5000
      });

      await fetchServices();
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
            <CardTitle>Discovered Accounts</CardTitle>
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.map(service => (
                  <div 
                    key={service.id}
                    className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors group"
                  >
                    <img 
                      src={service.logo_url}
                      alt={service.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{service.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Found {new Date(service.discovered_at).toLocaleDateString()}
                      </p>
                    </div>
                    {service.homepage_url && (
                      <a 
                        href={service.homepage_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
