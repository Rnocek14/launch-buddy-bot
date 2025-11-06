import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GmailConnectButton() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkGmailConnection();
  }, []);

  const checkGmailConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("gmail_connections")
        .select("email")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setIsConnected(true);
        setGmailEmail(data.email);
      }
    } catch (error) {
      console.error("Error checking Gmail connection:", error);
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

      // Get OAuth URL from edge function
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

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("gmail_connections")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setIsConnected(false);
      setGmailEmail(null);

      toast({
        title: "Gmail Disconnected",
        description: "Your Gmail account has been disconnected",
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
        Checking connection...
      </Button>
    );
  }

  if (isConnected) {
    return (
      <div className="space-y-3">
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm">
            Connected to <strong>{gmailEmail}</strong>
          </AlertDescription>
        </Alert>
        <Button onClick={handleDisconnect} variant="outline" size="sm">
          Disconnect Gmail
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Connect your Gmail account to send deletion requests from your own email address,
          improving success rates and compliance.
        </AlertDescription>
      </Alert>
      <Button onClick={handleConnect}>
        <Mail className="mr-2 h-4 w-4" />
        Connect Gmail Account
      </Button>
    </div>
  );
}
