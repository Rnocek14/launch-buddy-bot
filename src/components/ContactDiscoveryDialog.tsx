import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Mail, Globe, Phone, AlertTriangle, Search, PlusCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ServiceTypeGuides } from "./ServiceTypeGuides";
import { GuidedDiscoveryTips } from "./GuidedDiscoveryTips";

// Validation schemas
const emailSchema = z.string().trim().email("Invalid email address").max(255, "Email too long");
const urlSchema = z.string().trim().url("Invalid URL").max(500, "URL too long");
const phoneSchema = z.string().trim().regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format").min(10, "Phone number too short").max(20, "Phone number too long");

interface Service {
  id: string;
  name: string;
  domain: string;
  logo_url?: string;
}

interface DiscoveredContact {
  id?: string;
  contact_type: string;
  value: string;
  confidence: string;
  reasoning: string;
  mx_validated?: boolean;
}

interface ContactDiscoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onContactVerified: () => void;
}

export const ContactDiscoveryDialog = ({
  open,
  onOpenChange,
  service,
  onContactVerified,
}: ContactDiscoveryDialogProps) => {
  const [discovering, setDiscovering] = useState(false);
  const [discoveryPhase, setDiscoveryPhase] = useState<'checking' | 'reading' | 'extracting' | 'slow'>('checking');
  const [validating, setValidating] = useState(false);
  const [contacts, setContacts] = useState<DiscoveredContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<DiscoveredContact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Manual entry form state
  const [manualContactType, setManualContactType] = useState<"email" | "form" | "phone">("email");
  const [manualValue, setManualValue] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [realtimeValidation, setRealtimeValidation] = useState<{
    isValid: boolean;
    message: string;
    confidence: number;
  } | null>(null);
  
  const { toast } = useToast();

  // Auto-start discovery when dialog opens
  useEffect(() => {
    if (open && service && contacts.length === 0 && !discovering && !error) {
      const timer = setTimeout(() => {
        startDiscovery();
      }, 500); // Small delay for better UX
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service]);

  const startDiscovery = async () => {
    if (!service) return;

    setDiscovering(true);
    setDiscoveryPhase('checking');
    setError(null);
    setContacts([]);
    setSelectedContact(null);

    // Step-based progress for senior UX
    const phaseTimer1 = setTimeout(() => setDiscoveryPhase('reading'), 3000);
    const phaseTimer2 = setTimeout(() => setDiscoveryPhase('extracting'), 8000);
    const phaseTimer3 = setTimeout(() => setDiscoveryPhase('slow'), 20000);

    try {
      console.log(`Starting contact discovery for ${service.name}`);
      
      const { data, error: discoveryError } = await supabase.functions.invoke(
        "discover-privacy-contacts",
        {
          body: { service_id: service.id },
        }
      );

      if (discoveryError) throw discoveryError;

      if (data?.contacts && data.contacts.length > 0) {
        const isPdfOnly = data.requires_manual_review && data.contacts_found === 0;
        
        if (isPdfOnly) {
          setContacts(data.contacts);
          setShowManualEntry(true);
        } else {
          setContacts(data.contacts);
          toast({
            title: "Contacts Found",
            description: `Found ${data.contacts.length} contact method(s) for ${service.name}`,
          });
        }
      } else if (data?.already_known > 0) {
        toast({
          title: "Already up to date",
          description: `Found ${data.already_known} contact(s) for ${service.name}, but they're already saved.`,
        });
        // Refresh to show existing contacts
        setContacts([]);
      } else {
        setError(`No privacy contacts found for ${service.name}. The privacy policy may not be accessible or doesn't list contact methods.`);
      }
    } catch (err: any) {
      console.error("Discovery error:", err);
      
      let errorMessage = "We couldn't automatically discover privacy contacts.";
      let showGuidedMode = true;
      
      try {
        // FunctionsHttpError.context is a Response object - must be read async
        let errorData: any = null;
        if (err.context && typeof err.context.json === 'function') {
          errorData = await err.context.json();
        } else if (err.body) {
          errorData = err.body;
        }
        
        console.log("Parsed error data:", errorData);
        
        if (errorData?.error_type) {
          switch (errorData.error_type) {
            case 'bot_protection':
              errorMessage = `${service.name} has security protections that prevent automated discovery. Many companies use anti-bot technology.`;
              break;
            case 'no_policy_found':
            case 'privacy_policy_not_found':
              errorMessage = `We couldn't locate ${service.name}'s privacy policy. It may be at an unusual URL or require a login.`;
              break;
            case 'timeout':
              errorMessage = `${service.name}'s website took too long to respond.`;
              showGuidedMode = false;
              break;
            case 'network_error':
              errorMessage = `Having trouble connecting to ${service.name}. Please check your connection.`;
              showGuidedMode = false;
              break;
            case 'ai_error':
              errorMessage = `Our analysis service is temporarily unavailable.`;
              showGuidedMode = false;
              break;
            default:
              errorMessage = `Unable to automatically discover ${service.name}'s privacy contact.`;
          }
        }
      } catch (parseError) {
        console.warn("Could not parse error response:", parseError);
      }
      
      setError(errorMessage);
      if (showGuidedMode) {
        setShowManualEntry(true);
      }
    } finally {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      clearTimeout(phaseTimer3);
      setDiscovering(false);
    }
  };

  const validateAndApprove = async (contact: DiscoveredContact) => {
    console.log('[ContactDiscovery] Starting validation for:', contact.value);
    if (!service || contact.contact_type !== "email") return;

    setValidating(true);
    try {
      // First, run MX validation
      const { data: validationData, error: validationError } = await supabase.functions.invoke(
        "validate-email-contact",
        {
          body: {
            email: contact.value,
            updateDatabase: true,
            contactId: contact.id,
            serviceId: service.id,
          },
        }
      );

      if (validationError) throw validationError;

      if (validationData.validation.isValid) {
        // Edge function already updated privacy_contacts (verified=true, mx_validated=true)
        // and service_catalog (contact_verified=true, privacy_email).
        console.log('[ContactDiscovery] Showing Contact Verified toast');
        toast({
          title: "Contact Verified!",
          description: `${contact.value} has been verified and approved`,
        });

        console.log('[ContactDiscovery] Calling onContactVerified callback');
        // Notify parent and close
        onContactVerified();
        onOpenChange(false);
        console.log('[ContactDiscovery] Dialog closed');
      } else {
        toast({
          title: "Validation Failed",
          description: validationData.validation.error || "Email does not have valid MX records",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error("Validation error:", err);
      toast({
        title: "Validation Error",
        description: err.message || "Failed to validate contact",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "form":
        return <Globe className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      high: { variant: "default", label: "Strong match" },
      medium: { variant: "secondary", label: "Likely match" },
    };

    const config = variants[confidence] || variants.medium;

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const validateManualInput = (type: string, value: string): string | null => {
    try {
      const trimmedValue = value.trim();
      
      if (!trimmedValue) {
        return "This field is required";
      }
      
      switch (type) {
        case "email":
          emailSchema.parse(trimmedValue);
          break;
        case "form":
          urlSchema.parse(trimmedValue);
          break;
        case "phone":
          phoneSchema.parse(trimmedValue);
          break;
      }
      
      return null;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return err.errors[0].message;
      }
      return "Invalid input";
    }
  };

  // Real-time validation with confidence scoring
  const performRealtimeValidation = (type: string, value: string) => {
    if (!value.trim() || !service) {
      setRealtimeValidation(null);
      return;
    }

    const trimmedValue = value.trim().toLowerCase();
    const serviceDomain = service.domain.toLowerCase();
    let isValid = false;
    let message = "";
    let confidence = 0;

    try {
      switch (type) {
        case "email": {
          emailSchema.parse(value);
          const emailDomain = trimmedValue.split('@')[1] || '';
          
          const domainMatch = emailDomain.includes(serviceDomain) || serviceDomain.includes(emailDomain.replace('www.', ''));
          const hasPrivacyKeywords = /(privacy|dpo|data.?protection|legal|compliance)/i.test(trimmedValue);
          
          if (domainMatch && hasPrivacyKeywords) {
            isValid = true;
            message = "Great match! Domain and keywords look correct.";
            confidence = 95;
          } else if (domainMatch) {
            isValid = true;
            message = "Domain matches, but consider checking if this is the privacy-specific contact.";
            confidence = 70;
          } else if (hasPrivacyKeywords) {
            isValid = true;
            message = "Keywords look good, but domain doesn't match - double check this is correct.";
            confidence = 50;
          } else {
            isValid = true;
            message = "Email format is valid, but verify this is for privacy requests.";
            confidence = 30;
          }
          break;
        }
        
        case "form": {
          urlSchema.parse(value);
          const urlObj = new URL(value);
          const urlDomain = urlObj.hostname.toLowerCase().replace('www.', '');
          const urlPath = urlObj.pathname.toLowerCase();
          
          const domainMatch = urlDomain.includes(serviceDomain) || serviceDomain.includes(urlDomain);
          const hasPrivacyKeywords = /(privacy|data.?request|gdpr|ccpa|data.?rights|delete|opt.?out|do.?not.?sell)/i.test(urlPath);
          const isHomepage = urlPath === '/' || urlPath === '';
          
          if (!domainMatch) {
            isValid = false;
            message = "⚠️ Domain doesn't match - make sure this is the right website!";
            confidence = 10;
          } else if (isHomepage) {
            isValid = true;
            message = "This looks like the homepage. Try to find a specific privacy request page.";
            confidence = 20;
          } else if (hasPrivacyKeywords) {
            isValid = true;
            message = "Perfect! This looks like a privacy request form.";
            confidence = 95;
          } else {
            isValid = true;
            message = "Domain matches. Verify this page has a privacy request form.";
            confidence = 60;
          }
          break;
        }
        
        case "phone": {
          phoneSchema.parse(value);
          const digitsOnly = trimmedValue.replace(/\D/g, '');
          
          if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
            isValid = true;
            message = "Phone format looks good. Make sure this is for privacy requests specifically.";
            confidence = 60;
          } else {
            isValid = false;
            message = "Phone number length seems unusual.";
            confidence = 20;
          }
          break;
        }
      }

      setRealtimeValidation({ isValid, message, confidence });
    } catch {
      setRealtimeValidation({
        isValid: false,
        message: type === "email" ? "Invalid email format" : type === "form" ? "Invalid URL format" : "Invalid phone format",
        confidence: 0,
      });
    }
  };

  const submitManualContact = async () => {
    if (!service) return;
    
    // Validate input
    const error = validateManualInput(manualContactType, manualValue);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setSubmitting(true);
    setValidationError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error: insertError } = await supabase
        .from("manual_contact_submissions")
        .insert({
          service_id: service.id,
          submitted_by: user.id,
          contact_type: manualContactType,
          value: manualValue.trim(),
          notes: manualNotes.trim() || null,
        });
      
      if (insertError) throw insertError;
      
      toast({
        title: "Submission Sent!",
        description: "Your manual contact has been submitted for admin review.",
      });
      
      // Reset form
      setManualValue("");
      setManualNotes("");
      setShowManualEntry(false);
      onOpenChange(false);
      
    } catch (err: any) {
      console.error("Manual submission error:", err);
      toast({
        title: "Submission Failed",
        description: err.message || "Failed to submit contact",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!discovering && !validating && !submitting) {
      onOpenChange(false);
      // Reset state after animation
      setTimeout(() => {
        setContacts([]);
        setSelectedContact(null);
        setError(null);
        setShowManualEntry(false);
        setManualValue("");
        setManualNotes("");
        setValidationError(null);
        setRealtimeValidation(null);
      }, 300);
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Privacy Contact
          </DialogTitle>
          <DialogDescription>
            We'll look for the right privacy contact on {service.name}'s website for deletion requests
          </DialogDescription>
        </DialogHeader>

        {/* Initial State - Before Discovery */}
        {contacts.length === 0 && !discovering && !error && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">No Verified Contact Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                We'll check {service.name}'s website for the right email or form for deletion requests.
                This usually takes 15–30 seconds.
              </p>
            </div>
          </div>
        )}

        {/* Discovering State — step-based progress for senior UX */}
        {discovering && (
          <div className="py-8 text-center space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div>
              <h3 className="font-semibold mb-2">
                {discoveryPhase === 'checking' && "Checking website…"}
                {discoveryPhase === 'reading' && "Reading privacy policy…"}
                {discoveryPhase === 'extracting' && "Finding contact details…"}
                {discoveryPhase === 'slow' && "Still working…"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {discoveryPhase === 'checking' && `Looking for ${service.name}'s privacy policy page`}
                {discoveryPhase === 'reading' && `Found the page — now reading through it`}
                {discoveryPhase === 'extracting' && `Almost done — pulling out the right contact`}
                {discoveryPhase === 'slow' && `This site is taking longer than usual (up to 30 seconds)`}
              </p>
            </div>
            {/* Progress steps */}
            <div className="flex justify-center gap-2">
              {['checking', 'reading', 'extracting'].map((step, i) => {
                const phases = ['checking', 'reading', 'extracting', 'slow'];
                const currentIdx = phases.indexOf(discoveryPhase);
                const stepIdx = i;
                const isDone = currentIdx > stepIdx;
                const isCurrent = currentIdx === stepIdx || (discoveryPhase === 'slow' && stepIdx === 2);
                return (
                  <div key={step} className="flex items-center gap-1">
                    <div className={`h-2 w-8 rounded-full transition-colors ${
                      isDone ? 'bg-primary' : isCurrent ? 'bg-primary/50 animate-pulse' : 'bg-muted'
                    }`} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error State - Show only if manual entry not open */}
        {error && !discovering && !showManualEntry && (
          <div className="space-y-4">
            <Alert variant="default" className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                <p className="font-medium mb-1">Automatic Discovery Unavailable</p>
                <p className="text-sm">{error}</p>
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                You can help us find the contact, or try discovery again later.
              </p>
              <div className="flex justify-center gap-2">
                <Button onClick={startDiscovery} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={() => setShowManualEntry(true)} variant="default" size="sm">
                  <Search className="mr-2 h-4 w-4" />
                  Help Find Contact
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Entry Form with Guided Tips */}
        {showManualEntry && (
          <div className="space-y-4">
            {/* PDF-found info banner (non-error) */}
            {contacts.length > 0 && !error && (
              <Alert className="border-primary/20 bg-primary/5">
                <Search className="h-4 w-4 text-primary" />
                <AlertDescription>
                  <p className="font-medium mb-1">Privacy policy found (PDF)</p>
                  <p className="text-sm text-muted-foreground">
                    We found the privacy policy but need your help to locate the contact email or form inside it.
                  </p>
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="default" className="border-amber-200 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <p className="text-sm">{error}</p>
                </AlertDescription>
              </Alert>
            )}
            <div className="pb-3 border-b">
              <h3 className="text-sm font-semibold">Let's Find the Contact Together</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Follow the steps below, then submit what you find
              </p>
            </div>

            <GuidedDiscoveryTips domain={service.domain} />

            <ServiceTypeGuides
              serviceName={service.name}
              domain={service.domain}
              contactType={manualContactType}
            />
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-type">Contact Type</Label>
                <Select
                  value={manualContactType}
                  onValueChange={(value: "email" | "form" | "phone") => {
                    setManualContactType(value);
                    setValidationError(null);
                    setRealtimeValidation(null);
                  }}
                >
                  <SelectTrigger id="contact-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email Address
                      </div>
                    </SelectItem>
                    <SelectItem value="form">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Web Form URL
                      </div>
                    </SelectItem>
                    <SelectItem value="phone">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Number
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-value">
                  {manualContactType === "email" && "Email Address"}
                  {manualContactType === "form" && "Form URL"}
                  {manualContactType === "phone" && "Phone Number"}
                </Label>
                <Input
                  id="contact-value"
                  type={manualContactType === "email" ? "email" : manualContactType === "form" ? "url" : "tel"}
                  placeholder={
                    manualContactType === "email" ? `privacy@${service.domain}` :
                    manualContactType === "form" ? `https://${service.domain}/privacy-request` :
                    "+1-XXX-XXX-XXXX"
                  }
                  value={manualValue}
                  onChange={(e) => {
                    setManualValue(e.target.value);
                    setValidationError(null);
                    performRealtimeValidation(manualContactType, e.target.value);
                  }}
                  maxLength={manualContactType === "phone" ? 20 : manualContactType === "email" ? 255 : 500}
                  className={
                    realtimeValidation
                      ? realtimeValidation.isValid && realtimeValidation.confidence > 50
                        ? "border-green-500 focus-visible:ring-green-500"
                        : realtimeValidation.confidence < 30
                        ? "border-amber-500 focus-visible:ring-amber-500"
                        : ""
                      : ""
                  }
                />
                {realtimeValidation && (
                  <div className={`text-xs mt-2 flex items-start gap-2 ${
                    realtimeValidation.confidence > 70 
                      ? "text-green-700" 
                      : realtimeValidation.confidence > 40 
                      ? "text-blue-700" 
                      : "text-amber-700"
                  }`}>
                    {realtimeValidation.confidence > 70 ? (
                      <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    )}
                    <span>{realtimeValidation.message}</span>
                  </div>
                )}
                {validationError && (
                  <p className="text-sm text-destructive">{validationError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-notes">
                  Where did you find this? <span className="text-muted-foreground font-normal">(Helps others find it faster)</span>
                </Label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {["Privacy Policy page", "Contact Us page", "Footer", "Account Settings", "Help Center"].map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setManualNotes(suggestion)}
                        disabled={submitting}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    id="contact-notes"
                    placeholder="E.g., 'Found in footer under Legal section' or 'In privacy policy, section 8'"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">
                    {manualNotes.length}/500 characters
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discovered Contacts */}
        {contacts.length > 0 && !discovering && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Found {contacts.length} contact method(s). Select one to validate and use for deletion requests.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedContact === contact
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getContactIcon(contact.contact_type)}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{contact.value}</div>
                        <div className="flex items-center gap-2">
                          {getConfidenceBadge(contact.confidence)}
                          {contact.mx_validated && (
                            <Badge variant="outline" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Email verified
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contact.reasoning}
                      </p>
                      <div className="text-xs text-muted-foreground capitalize">
                        Type: {contact.contact_type}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedContact && selectedContact.contact_type === "form" && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This service uses a web form for deletion requests. Automated form submissions are not yet supported.
                  You'll need to visit the form manually.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          {showManualEntry ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowManualEntry(false);
                  setManualValue("");
                  setManualNotes("");
                  setValidationError(null);
                }} 
                disabled={submitting}
              >
                Back
              </Button>
              <Button onClick={submitManualContact} disabled={submitting || !manualValue.trim()}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Submit for Review
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose} disabled={discovering || validating}>
                {contacts.length > 0 ? "Close" : "Cancel"}
              </Button>

              {contacts.length === 0 && !discovering && !error && (
                <Button onClick={startDiscovery} disabled={discovering}>
                  {discovering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Find Contact
                    </>
                  )}
                </Button>
              )}

              {contacts.length > 0 && selectedContact && selectedContact.contact_type === "email" && (
                <Button
                  onClick={() => validateAndApprove(selectedContact)}
                  disabled={validating}
                >
                  {validating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Use This Contact
                    </>
                  )}
                </Button>
              )}

              {contacts.length > 0 && selectedContact && selectedContact.contact_type === "form" && (
                <Button onClick={() => window.open(selectedContact.value, "_blank")}>
                  <Globe className="mr-2 h-4 w-4" />
                  Open Form
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
