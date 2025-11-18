import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle2, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UpgradeModal } from "@/components/UpgradeModal";
import { TRACKING_EVENTS, trackConversion } from "@/lib/analytics";

interface EmailConnection {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook';
  is_primary: boolean;
  account_label: string | null;
}

export function EmailConnectButton() {
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkEmailConnections();
    
    // Check URL parameters for connection status
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('connected');
    const error = params.get('error');
    
    if (connected) {
      // Track successful connection
      const trackConnection = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          trackConversion(TRACKING_EVENTS.EMAIL_CONNECTED, user.id, {
            provider: connected,
          });
        }
      };
      trackConnection();
      
      toast({
        title: "Account Connected",
        description: `Successfully connected your ${connected === 'outlook' ? 'Outlook' : 'Gmail'} account`,
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      toast({
        variant: "destructive",
        title: "Connection Failed", 
        description: error,
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkEmailConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("email_connections")
        .select("id, email, provider, is_primary, account_label")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false });

      if (!error && data) {
        setConnections(data as EmailConnection[]);
      }
    } catch (error) {
      console.error("Error checking email connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider: 'gmail' | 'outlook') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Not Authenticated",
          description: "Please sign in to connect an email account",
        });
        return;
      }

      // Check subscription tier and enforce connection limits
      const { data: subData, error: subError } = await supabase.functions.invoke('check-subscription');
      if (subError) {
        console.error('Error checking subscription:', subError);
      }
      const tier = subData?.tier || 'free';
      const currentCount = connections.length;

      // Enforce connection limits: Free = 1, Pro = 3
      if (tier === 'free' && currentCount >= 1) {
        setShowUpgradeModal(true);
        return;
      }

      if (currentCount >= 3) {
        toast({
          title: "Connection Limit Reached",
          description: "You can connect up to 3 email accounts with Pro.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("get-email-oauth-url", {
        body: { provider },
      });

      if (error || !data?.url) {
        throw new Error("Failed to generate OAuth URL");
      }

      window.location.href = data.url;
    } catch (error: any) {
      console.error("Error connecting email:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message,
      });
    }
  };

  const handleSetPrimary = async (connectionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove primary from all accounts
      await supabase
        .from("email_connections")
        .update({ is_primary: false })
        .eq("user_id", user.id);

      // Set new primary
      const { error } = await supabase
        .from("email_connections")
        .update({ is_primary: true })
        .eq("id", connectionId);

      if (error) throw error;

      await checkEmailConnections();

      toast({
        title: "Primary Account Updated",
        description: "This account will be used by default for scanning and sending",
      });
    } catch (error: any) {
      console.error("Error setting primary:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const connection = connections.find(c => c.id === connectionId);
      const wasPrimary = connection?.is_primary;

      console.log('Deleting connection:', connectionId);
      const { error } = await supabase
        .from("email_connections")
        .delete()
        .eq("id", connectionId)
        .eq("user_id", user.id); // Add user_id check for RLS

      if (error) {
        console.error('Deletion error:', error);
        throw error;
      }

      console.log('Connection deleted successfully');

      // If we deleted the primary account, set another as primary
      if (wasPrimary && connections.length > 1) {
        const remainingConnections = connections.filter(c => c.id !== connectionId);
        if (remainingConnections.length > 0) {
          await supabase
            .from("email_connections")
            .update({ is_primary: true })
            .eq("id", remainingConnections[0].id);
        }
      }

      await checkEmailConnections();

      toast({
        title: "Account Disconnected",
        description: `${connection?.email} has been disconnected`,
      });
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast({
        variant: "destructive",
        title: "Disconnect Failed",
        description: error.message,
      });
    }
  };

  const getProviderIcon = (provider: 'gmail' | 'outlook') => {
    return <Mail className="h-4 w-4" />;
  };

  const getProviderLabel = (provider: 'gmail' | 'outlook') => {
    return provider === 'gmail' ? 'Gmail' : 'Outlook';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const gmailConnections = connections.filter(c => c.provider === 'gmail');
  const outlookConnections = connections.filter(c => c.provider === 'outlook');

  return (
    <div className="space-y-4">
      {connections.length === 0 ? (
        <>
          <Alert>
            <AlertDescription>
              Connect your email account to scan for services and send deletion requests.
              We support Gmail and Outlook/Microsoft 365.
            </AlertDescription>
          </Alert>
          
          <Tabs defaultValue="gmail" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gmail">Gmail</TabsTrigger>
              <TabsTrigger value="outlook">Outlook</TabsTrigger>
            </TabsList>
            
            <TabsContent value="gmail" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Google/Gmail account to scan your inbox and send emails.
              </p>
              <Button
                onClick={() => handleConnect('gmail')}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Connect Gmail Account
              </Button>
            </TabsContent>
            
            <TabsContent value="outlook" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Microsoft/Outlook account to scan your inbox and send emails.
                Note: Gmail addresses can also be used as Microsoft accounts.
              </p>
              <Button
                onClick={() => handleConnect('outlook')}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Connect Outlook Account
              </Button>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <>
          <div className="space-y-4">
            {/* Gmail Connections */}
            {gmailConnections.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Gmail Accounts
                </h3>
                {gmailConnections.map((connection) => (
                  <Card key={connection.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{connection.email}</p>
                          {connection.account_label && (
                            <p className="text-sm text-muted-foreground">
                              {connection.account_label}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {connection.is_primary ? (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Primary
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(connection.id)}
                          >
                            Set as Primary
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(connection.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Outlook Connections */}
            {outlookConnections.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Outlook Accounts
                </h3>
                {outlookConnections.map((connection) => (
                  <Card key={connection.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{connection.email}</p>
                          {connection.account_label && (
                            <p className="text-sm text-muted-foreground">
                              {connection.account_label}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {connection.is_primary ? (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Primary
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetPrimary(connection.id)}
                          >
                            Set as Primary
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(connection.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Add Another Account Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleConnect('gmail')}
              className="flex-1"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Gmail
            </Button>
            <Button
              variant="outline"
              onClick={() => handleConnect('outlook')}
              className="flex-1"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Outlook
            </Button>
          </div>
        </>
      )}

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        context="email-connections"
      />
    </div>
  );
}
