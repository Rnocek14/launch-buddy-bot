import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Service {
  id: string;
  name: string;
  logo_url?: string;
  homepage_url?: string;
}

interface DeletionRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSuccess?: () => void;
}

export const DeletionRequestDialog = ({
  open,
  onOpenChange,
  service,
  onSuccess,
}: DeletionRequestDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [identifiers, setIdentifiers] = useState<any[]>([]);
  const [selectedIdentifierId, setSelectedIdentifierId] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  // Fetch user identifiers when dialog opens
  useEffect(() => {
    if (open && service) {
      fetchIdentifiers();
    }
  }, [open, service]);

  const fetchIdentifiers = async () => {
    const { data, error } = await supabase
      .from("user_identifiers")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true });

    if (!error && data && data.length > 0) {
      setIdentifiers(data);
      // Pre-select primary identifier or first one
      const primary = data.find((i) => i.is_primary);
      setSelectedIdentifierId(primary?.id || data[0]?.id || "");
    }
  };

  const handleSubmit = async () => {
    if (!service) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke(
        "send-deletion-request",
        {
          body: {
            service_id: service.id,
            identifier_id: selectedIdentifierId || undefined,
            account_identifier: accountIdentifier || undefined,
          },
        }
      );

      if (error) {
        // Check if user needs authorization
        if (error.message?.includes("requiresAuthorization")) {
          toast({
            title: "Authorization Required",
            description: "You need to complete the authorization wizard first.",
            variant: "destructive",
          });
          onOpenChange(false);
          // Redirect to authorization wizard
          window.location.href = "/authorize";
          return;
        }
        throw error;
      }

      setSuccess(true);
      
      toast({
        title: "Deletion Request Sent!",
        description: `Request sent to ${service.name}. You'll receive a confirmation email.`,
      });

      // Close dialog after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setAccountIdentifier("");
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error("Error sending deletion request:", error);
      toast({
        title: "Failed to Send Request",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      setSuccess(false);
      setAccountIdentifier("");
      setSelectedIdentifierId("");
      setIdentifiers([]);
    }
  };

  if (!service) return null;

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Request Sent!</h3>
            <p className="text-muted-foreground">
              Deletion request sent to {service.name}
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request Data Deletion</DialogTitle>
              <DialogDescription>
                Send a legal deletion request to {service.name} under GDPR/CCPA
              </DialogDescription>
            </DialogHeader>

            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                This will send a formal deletion request email to {service.name} on your behalf. 
                The service is required to respond within 30-45 days depending on jurisdiction.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {identifiers.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="identifier">
                    Account Identifier
                  </Label>
                  <select
                    id="identifier"
                    value={selectedIdentifierId}
                    onChange={(e) => setSelectedIdentifierId(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    {identifiers.map((identifier) => (
                      <option key={identifier.id} value={identifier.id}>
                        {getTypeLabel(identifier.type)}: {identifier.value}
                        {identifier.is_primary ? " (Primary)" : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Select which identifier to use for this request. You can manage your identifiers in Settings.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="accountIdentifier">
                    Account Identifier (Optional)
                  </Label>
                  <Input
                    id="accountIdentifier"
                    placeholder="Username, email, or account ID"
                    value={accountIdentifier}
                    onChange={(e) => setAccountIdentifier(e.target.value)}
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Helps the service identify your account faster. Your email will be used if left empty.
                  </p>
                </div>
              )}

              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">What happens next:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Email sent to {service.name}'s privacy team</li>
                  <li>You'll receive a copy of the request</li>
                  <li>Service must respond within legal timeframe</li>
                  <li>You can track status in your dashboard</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Deletion Request"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
