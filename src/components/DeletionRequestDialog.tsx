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
import { Loader2, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmailPreviewModal } from "@/components/EmailPreviewModal";
import { ContactDiscoveryDialog } from "@/components/ContactDiscoveryDialog";
import { UpgradeModal } from "@/components/UpgradeModal";

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
  const { toast } = useToast();

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
    // Refresh contact status after discovery
    checkContactStatus();
    console.log('[DeletionRequest] NOT showing duplicate toast - ContactDiscovery already showed one');
    // Don't show toast here - ContactDiscoveryDialog already shows "Contact Verified!" toast
    // Notify parent component to refresh services
    if (onSuccess) {
      console.log('[DeletionRequest] Calling onSuccess callback');
      onSuccess();
    }
  };

  const getTemplateType = (jurisdiction: string): string => {
    if (jurisdiction.includes("EU") || jurisdiction === "GDPR") {
      return "gdpr";
    } else if (jurisdiction === "US-CA" || jurisdiction === "CCPA") {
      return "ccpa";
    }
    return "global";
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Fetch user profile and authorization
      const [profileRes, authRes, identifierRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_authorizations").select("*").eq("user_id", user.id).is("revoked_at", null).order("created_at", { ascending: false }).limit(1).single(),
        selectedIdentifierId ? supabase.from("user_identifiers").select("*").eq("id", selectedIdentifierId).single() : Promise.resolve({ data: null })
      ]);

      const profile = profileRes.data;
      const authorization = authRes.data;
      const identifier = identifierRes.data;

      if (!profile || !authorization) {
        throw new Error("User profile or authorization not found");
      }

      // Fetch service details
      const { data: serviceData } = await supabase
        .from("service_catalog")
        .select("*")
        .eq("id", service.id)
        .single();

      // Fetch template
      const templateType = getTemplateType(jurisdiction);
      const { data: templates } = await supabase
        .from("request_templates")
        .select("*")
        .eq("is_active", true)
        .eq("template_type", templateType)
        .or(`jurisdiction.eq.${jurisdiction},jurisdiction.eq.GLOBAL`)
        .order("jurisdiction", { ascending: false })
        .limit(1);

      if (!templates || templates.length === 0) {
        throw new Error("No template found");
      }

      const template = templates[0];
      const identifierValue = identifier?.value || accountIdentifier;
      const signatureData = authorization.signature_data as any;
      const signature = signatureData?.text || profile.full_name || "Authorized User";

      // Personalize template
      const personalizedBody = template.body_template
        .replace(/\{\{user_full_name\}\}/g, profile.full_name || "User")
        .replace(/\{\{full_name\}\}/g, profile.full_name || "User")
        .replace(/\{\{user_email\}\}/g, profile.email || user.email || "")
        .replace(/\{\{email\}\}/g, profile.email || user.email || "")
        .replace(/\{\{account_identifier\}\}/g, identifierValue || profile.email || user.email || "")
        .replace(/\{\{jurisdiction\}\}/g, jurisdiction)
        .replace(/\{\{signature\}\}/g, signature)
        .replace(/\{\{service_name\}\}/g, service.name);

      const personalizedSubject = template.subject_template
        .replace(/\{\{service_name\}\}/g, service.name);

      setEmailPreview({
        subject: personalizedSubject,
        body: personalizedBody,
        recipientEmail: serviceData?.privacy_email || "privacy@example.com",
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

      if (error) {
        // Check if user hit deletion limit
        if (error.message?.includes("limitReached") || error.message?.includes("free deletion requests")) {
          // Fetch remaining services count
          const { data: servicesData } = await supabase
            .from("user_services")
            .select("service_id", { count: "exact" });
          
          setRemainingServices(servicesData?.length || 0);
          onOpenChange(false);
          setShowUpgradeModal(true);
          return;
        }
        
        // Check if user needs authorization
        if (error.message?.includes("requiresAuthorization")) {
          toast({
            title: "Authorization Required",
            description: "You need to complete the authorization wizard first.",
            variant: "destructive",
          });
          onOpenChange(false);
          window.location.href = "/authorize";
          return;
        }
        throw error;
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
    </>
  );
};
