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
import { Loader2, AlertTriangle, CheckCircle2, Sparkles, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmailPreviewModal } from "@/components/EmailPreviewModal";
import { ContactDiscoveryDialog } from "@/components/ContactDiscoveryDialog";
import { UpgradeModal } from "@/components/UpgradeModal";
import { useNavigate } from "react-router-dom";

interface Service {
  id: string;
  name: string;
  domain?: string;
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
  const [jurisdiction, setJurisdiction] = useState<string>("GLOBAL");
  const [showPreview, setShowPreview] = useState(false);
  const [emailPreview, setEmailPreview] = useState<{
    subject: string;
    body: string;
    recipientEmail: string;
  } | null>(null);
  const [contactStatus, setContactStatus] = useState<{
    hasVerifiedContact: boolean;
    contactMethod: string;
    needsVerification: boolean;
  }>({ hasVerifiedContact: false, contactMethod: "none", needsVerification: false });
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [remainingServices, setRemainingServices] = useState<number>(0);
  const [showReconnectDialog, setShowReconnectDialog] = useState(false);
  const [reconnectMessage, setReconnectMessage] = useState<string>("");
  const [reconnecting, setReconnecting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const openReconnectFlow = (message?: string) => {
    setReconnectMessage(
      message ||
        "Your connected Gmail account needs to be reconnected before we can send deletion requests."
    );
    setShowPreview(false);
    onOpenChange(false);
    setShowReconnectDialog(true);
  };

  const handleInlineReconnect = async () => {
    setReconnecting(true);
    try {
      // Snapshot current Gmail connection's token_expires_at so we can detect a refresh
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: existing } = await supabase
        .from("email_connections")
        .select("id, token_expires_at, updated_at")
        .eq("user_id", user.id)
        .eq("provider", "gmail")
        .order("is_primary", { ascending: false })
        .limit(1)
        .maybeSingle();

      const previousUpdatedAt = existing?.updated_at || null;

      // Get OAuth URL
      const { data, error } = await supabase.functions.invoke("get-email-oauth-url", {
        body: { provider: "gmail" },
      });
      if (error || !data?.url) throw new Error("Failed to start Gmail reconnect");

      // Open OAuth in a popup
      const width = 520;
      const height = 700;
      const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
      const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
      const popup = window.open(
        data.url,
        "gmail-reconnect",
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        toast({
          title: "Popup blocked",
          description: "Please allow popups for this site, or use Settings to reconnect.",
          variant: "destructive",
        });
        setReconnecting(false);
        return;
      }

      // Poll for either: popup closed, or email_connections updated
      const start = Date.now();
      const timeoutMs = 3 * 60 * 1000; // 3 minutes
      const poll = window.setInterval(async () => {
        if (Date.now() - start > timeoutMs) {
          window.clearInterval(poll);
          setReconnecting(false);
          return;
        }

        const { data: refreshed } = await supabase
          .from("email_connections")
          .select("id, token_expires_at, updated_at")
          .eq("user_id", user.id)
          .eq("provider", "gmail")
          .order("is_primary", { ascending: false })
          .limit(1)
          .maybeSingle();

        const updated =
          refreshed &&
          (refreshed.updated_at !== previousUpdatedAt ||
            (refreshed.token_expires_at &&
              new Date(refreshed.token_expires_at).getTime() > Date.now() + 60_000));

        if (updated) {
          window.clearInterval(poll);
          try { popup.close(); } catch {}
          setShowReconnectDialog(false);
          setReconnecting(false);
          toast({
            title: "Gmail reconnected",
            description: "Sending your deletion request now…",
          });
          // Re-open the parent dialog and auto-retry the send
          onOpenChange(true);
          setTimeout(() => { handleConfirmSend(); }, 250);
          return;
        }

        if (popup.closed) {
          window.clearInterval(poll);
          setReconnecting(false);
        }
      }, 1500);
    } catch (err: any) {
      console.error("Inline reconnect failed:", err);
      toast({
        title: "Reconnect failed",
        description: err?.message || "Please try again from Settings.",
        variant: "destructive",
      });
      setReconnecting(false);
    }
  };

  // Fetch user identifiers and jurisdiction when dialog opens
  useEffect(() => {
    if (open && service) {
      fetchIdentifiers();
      fetchJurisdiction();
      checkContactStatus();
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

  const fetchJurisdiction = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_authorizations")
      .select("jurisdiction")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data?.jurisdiction) {
      setJurisdiction(data.jurisdiction);
    }
  };

  const checkContactStatus = async () => {
    if (!service) return;

    try {
      // Check for verified contacts in privacy_contacts table
      const { data: verifiedContact } = await supabase
        .from("privacy_contacts")
        .select("*")
        .eq("service_id", service.id)
        .eq("contact_type", "email")
        .eq("verified", true)
        .limit(1)
        .maybeSingle();

      if (verifiedContact) {
        setContactStatus({
          hasVerifiedContact: true,
          contactMethod: "email",
          needsVerification: false,
        });
        return;
      }

      // Check service catalog for verified email
      const { data: serviceData } = await supabase
        .from("service_catalog")
        .select("privacy_email, contact_verified, privacy_form_url, domain")
        .eq("id", service.id)
        .single();

      if (serviceData?.privacy_email && serviceData.contact_verified) {
        setContactStatus({
          hasVerifiedContact: true,
          contactMethod: "email",
          needsVerification: false,
        });
        // Update service with domain if not already set
        if (serviceData.domain && !service.domain) {
          (service as any).domain = serviceData.domain;
        }
        return;
      }

      if (serviceData?.privacy_form_url) {
        setContactStatus({
          hasVerifiedContact: false,
          contactMethod: "form",
          needsVerification: false,
        });
        return;
      }

      // No verified contact found
      setContactStatus({
        hasVerifiedContact: false,
        contactMethod: "none",
        needsVerification: true,
      });
    } catch (error) {
      console.error("Error checking contact status:", error);
      setContactStatus({
        hasVerifiedContact: false,
        contactMethod: "none",
        needsVerification: true,
      });
    }
  };

  const handleDiscoverContact = () => {
    setShowDiscovery(true);
  };

  const handleContactDiscovered = () => {
    console.log('[DeletionRequest] handleContactDiscovered called');
    // Refresh contact availability after verification so the user can continue to preview/send.
    checkContactStatus();
    console.log('[DeletionRequest] Contact verified; waiting for preview/send before any success callback');
  };

  const getTemplateType = (jurisdiction: string): string => {
    if (jurisdiction.includes("EU") || jurisdiction === "GDPR") {
      return "gdpr";
    }

    if (["US-CA", "CCPA", "US", "California"].includes(jurisdiction)) {
      return "ccpa";
    }

    return "general_deletion";
  };

  const handlePreview = async () => {
    if (!service || (!selectedIdentifierId && !accountIdentifier)) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide an account identifier or select an existing one.",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-deletion-request", {
        body: {
          service_id: service.id,
          identifier_id: selectedIdentifierId || undefined,
          account_identifier: accountIdentifier || undefined,
          template_type: getTemplateType(jurisdiction),
          preview_only: true,
        },
      });

      if (error) {
        let message = error.message || "Failed to generate preview";

        try {
          if ("context" in error && error.context && typeof error.context.json === "function") {
            const errorBody = await error.context.json();
            message = errorBody?.error || message;
          }
        } catch (parseError) {
          console.warn("Failed to parse preview error response", parseError);
        }

        throw new Error(message);
      }

      if (!data?.preview || !data?.subject || !data?.body || !data?.recipient) {
        throw new Error("Preview data was incomplete.");
      }

      setEmailPreview({
        subject: data.subject,
        body: data.body,
        recipientEmail: data.recipient,
      });
      setShowPreview(true);
    } catch (error: any) {
      console.error("Preview error:", error);
      toast({
        variant: "destructive",
        title: "Preview Failed",
        description: error.message || "Failed to generate preview",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSend = async () => {
    console.log('[DeletionRequest] Starting send deletion request');
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
            template_type: getTemplateType(jurisdiction),
          },
        }
      );

      // Check for limitReached in the response data
      if (data?.limitReached || error?.message?.includes("free deletion requests")) {
        // Fetch remaining services count
        const { data: servicesData } = await supabase
          .from("user_services")
          .select("service_id", { count: "exact" });
        
        setRemainingServices(servicesData?.length || 0);
        setLoading(false);
        onOpenChange(false);
        setShowUpgradeModal(true);
        return;
      }

      // Detect Gmail reconnect requirement (structured response from edge function)
      const reconnectFromData = data?.reconnectRequired || data?.error_code === "GMAIL_RECONNECT_REQUIRED";
      let reconnectFromError = false;
      let parsedErrorMessage = "";
      if (error) {
        try {
          if ("context" in error && error.context && typeof (error.context as any).json === "function") {
            const body = await (error.context as any).json();
            if (body?.reconnectRequired || body?.error_code === "GMAIL_RECONNECT_REQUIRED") {
              reconnectFromError = true;
              parsedErrorMessage = body?.error || "";
            } else if (body?.error) {
              parsedErrorMessage = body.error;
            }
          }
        } catch (e) {
          console.warn("Failed to parse send error response", e);
        }
      }

      if (reconnectFromData || reconnectFromError) {
        openReconnectFlow(
          data?.error || parsedErrorMessage ||
            "Your connected Gmail account needs to be reconnected before we can send deletion requests."
        );
        setLoading(false);
        return;
      }

      if (error) {
        // Check if user needs authorization
        if (data?.requiresAuthorization || error.message?.includes("requiresAuthorization")) {
          toast({
            title: "Authorization Required",
            description: "You need to complete the authorization wizard first.",
            variant: "destructive",
          });
          onOpenChange(false);
          window.location.href = "/authorize";
          return;
        }
        throw new Error(parsedErrorMessage || error.message || "Failed to send request");
      }

      setShowPreview(false);
      setSuccess(true);
      
      console.log('[DeletionRequest] Showing Deletion Request Sent toast');
      toast({
        title: "Deletion Request Sent!",
        description: `Request sent to ${service.name}. You'll receive a confirmation email.`,
      });

      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setAccountIdentifier("");
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error("Error sending deletion request:", error);

      const fallbackMessage = String(error?.message || "");
      if (
        fallbackMessage.includes("GMAIL_RECONNECT_REQUIRED") ||
        fallbackMessage.toLowerCase().includes("reconnect gmail") ||
        fallbackMessage.toLowerCase().includes("connected gmail account needs to be reconnected") ||
        fallbackMessage.toLowerCase().includes("failed to refresh access token") ||
        fallbackMessage.toLowerCase().includes("invalid_grant")
      ) {
        openReconnectFlow(
          "Your connected Gmail session expired. Reconnect Gmail in Settings, then resend the deletion request."
        );
        return;
      }

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
      setShowPreview(false);
      setTimeout(() => {
        setSuccess(false);
        setAccountIdentifier("");
        setSelectedIdentifierId("");
        setIdentifiers([]);
        setEmailPreview(null);
      }, 300);
    }
  };

  if (!service) return null;

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <>
      <ContactDiscoveryDialog
        open={showDiscovery}
        onOpenChange={setShowDiscovery}
        service={service ? { 
          id: service.id, 
          name: service.name, 
          domain: service.domain || "",
          logo_url: service.logo_url 
        } : null}
        onContactVerified={handleContactDiscovered}
      />

      <EmailPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        subject={emailPreview?.subject || ""}
        body={emailPreview?.body || ""}
        recipientEmail={emailPreview?.recipientEmail || ""}
        serviceName={service?.name || ""}
        templateType={getTemplateType(jurisdiction)}
        onConfirmSend={handleConfirmSend}
        isLoading={loading}
      />
      
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

            {contactStatus.needsVerification ? (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="space-y-2">
                  <div>
                    <strong>Contact Not Verified:</strong> {service.name} does not have a verified contact email in our system.
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscoverContact}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Discover Contact with AI
                  </Button>
                </AlertDescription>
              </Alert>
            ) : contactStatus.contactMethod === "form" ? (
              <Alert className="border-blue-500/50 bg-blue-500/10">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm">
                  <strong>Form Required:</strong> This service requires manual form submission for deletion requests. 
                  Automated form submissions are coming soon.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-sm">
                  This will send a formal deletion request email to {service.name} on your behalf. 
                  The service is required to respond within 30-45 days depending on jurisdiction.
                </AlertDescription>
              </Alert>
            )}

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
                onClick={handlePreview}
                disabled={
                  loading || 
                  (!selectedIdentifierId && !accountIdentifier) || 
                  contactStatus.needsVerification ||
                  contactStatus.contactMethod === "form"
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : contactStatus.needsVerification ? (
                  "Contact Unverified"
                ) : contactStatus.contactMethod === "form" ? (
                  "Form Required"
                ) : (
                  "Review & Send"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
        </DialogContent>
      </Dialog>

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal}
        remainingServices={remainingServices}
      />

      <Dialog open={showReconnectDialog} onOpenChange={setShowReconnectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Reconnect Gmail to Continue
            </DialogTitle>
            <DialogDescription className="pt-2">
              {reconnectMessage || "Your Gmail connection has expired or is missing the permission needed to send deletion requests on your behalf."}
            </DialogDescription>
          </DialogHeader>

          <Alert className="border-primary/30 bg-primary/5">
            <AlertTriangle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              We send deletion requests <strong>from your own email address</strong> so services recognize you as the account owner. This requires an active Gmail connection with send access.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">What to do:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click <strong>Reconnect Gmail</strong> below</li>
              <li>Sign in with the same Google account</li>
              <li>Approve the "send email" permission</li>
              <li>Return here and try again</li>
            </ol>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowReconnectDialog(false)}>
              Not now
            </Button>
            <Button
              onClick={() => {
                setShowReconnectDialog(false);
                navigate("/settings");
              }}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Reconnect Gmail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
