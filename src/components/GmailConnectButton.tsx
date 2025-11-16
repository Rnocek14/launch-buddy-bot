import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle2, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GmailConnection {
  id: string;
  email: string;
  is_primary: boolean;
  account_label: string;
}

export function GmailConnectButton() {
  const [connections, setConnections] = useState<GmailConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkGmailConnections();
  }, []);

  const checkGmailConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("gmail_connections")
        .select("id, email, is_primary, account_label")
        .eq("user_id", user.id)
        .order("is_primary", { ascending: false });

      if (!error && data) {
        setConnections(data);
      }
    } catch (error) {
      console.error("Error checking Gmail connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Not Authenticated",
          description: "Please sign in to connect Gmail",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke("get-gmail-oauth-url", {
        body: { userId: user.id },
      });

      if (error || !data?.authUrl) {
        throw new Error("Failed to generate OAuth URL");
      }

      window.location.href = data.authUrl;
    } catch (error: any) {
      console.error("Error connecting Gmail:", error);
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
        .from("gmail_connections")
        .update({ is_primary: false })
        .eq("user_id", user.id);

      // Set new primary
      const { error } = await supabase
        .from("gmail_connections")
        .update({ is_primary: true })
        .eq("id", connectionId);

      if (error) throw error;

      await checkGmailConnections();

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

      const { error } = await supabase
        .from("gmail_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      // If we deleted the primary account, set another as primary
      if (wasPrimary && connections.length > 1) {
        const nextConnection = connections.find(c => c.id !== connectionId);
        if (nextConnection) {
          await handleSetPrimary(nextConnection.id);
        }
      }

      await checkGmailConnections();

      toast({
        title: "Account Disconnected",
        description: "Gmail account has been removed",
      });
    } catch (error: any) {
      console.error("Error disconnecting Gmail:", error);
      toast({
        variant: "destructive",
        title: "Disconnection Failed",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <Button disabled variant="outline">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="space-y-3">
        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Connect your Gmail account to scan for services and send deletion requests
            from your own email address.
          </AlertDescription>
        </Alert>
        <Button onClick={handleConnect}>
          <Mail className="mr-2 h-4 w-4" />
          Connect Gmail Account
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {connections.map((connection) => (
          <Card key={connection.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{connection.account_label}</span>
                    {connection.is_primary && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        Primary
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{connection.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {!connection.is_primary && (
                  <Button
                    onClick={() => handleSetPrimary(connection.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Star className="mr-1 h-3 w-3" />
                    Set Primary
                  </Button>
                )}
                <Button
                  onClick={() => handleDisconnect(connection.id)}
                  variant="outline"
                  size="sm"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Button onClick={handleConnect} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Another Gmail Account
      </Button>
      
      <p className="text-xs text-muted-foreground">
        You can scan multiple accounts to discover all your online services. The primary
        account is used by default for deletion requests.
      </p>
    </div>
  );
}
