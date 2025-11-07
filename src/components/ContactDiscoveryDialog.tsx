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
import { Loader2, CheckCircle2, XCircle, Mail, Globe, Phone, AlertTriangle, Sparkles, PlusCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    setError(null);
    setContacts([]);
    setSelectedContact(null);

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
        setContacts(data.contacts);
        toast({
          title: "Contacts Discovered!",
          description: `Found ${data.contacts.length} contact method(s) for ${service.name}`,
        });
      } else {
        setError(`No privacy contacts found for ${service.name}. The privacy policy may not be accessible or doesn't list contact methods.`);
      }
    } catch (err: any) {
      console.error("Discovery error:", err);
      
      // Parse the error to provide better feedback
      let errorMessage = "Failed to discover contacts. Please try again.";
      let errorType = "unknown";
      
      if (err.message) {
        errorMessage = err.message;
        
        if (err.message.includes("Unable to find privacy policy")) {
          errorType = "not_found";
          errorMessage = `Could not locate ${service.name}'s privacy policy. Their privacy page may be at a non-standard URL or requires JavaScript to load.`;
        } else if (err.message.includes("Authentication failed")) {
          errorType = "auth";
          errorMessage = "Authentication failed. Please sign in again.";
        }
      }
      
      setError(errorMessage);
      
      // Only show toast for non-404 errors to avoid spam
      if (errorType !== "not_found") {
        toast({
          title: "Discovery Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
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
        // MX validation passed, now approve the contact
        const { error: approveError } = await supabase
          .from("privacy_contacts")
          .update({ verified: true })
          .eq("id", contact.id);

        if (approveError) throw approveError;

        // Update service catalog
        const { error: catalogError } = await supabase
          .from("service_catalog")
          .update({
            contact_verified: true,
            privacy_email: contact.value,
          })
          .eq("id", service.id);

        if (catalogError) {
          console.error("Error updating service catalog:", catalogError);
        }

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
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; color: string }> = {
      high: { variant: "default", color: "text-green-600" },
      medium: { variant: "secondary", color: "text-amber-600" },
      low: { variant: "destructive", color: "text-red-600" },
    };

    const config = variants[confidence] || variants.low;

    return (
      <Badge variant={config.variant}>
        {confidence}
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
      }, 300);
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Discover Privacy Contact
          </DialogTitle>
          <DialogDescription>
            AI will analyze {service.name}'s privacy policy to find the correct contact for deletion requests
          </DialogDescription>
        </DialogHeader>

        {/* Initial State - Before Discovery */}
        {contacts.length === 0 && !discovering && !error && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">No Verified Contact Found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Let AI analyze {service.name}'s privacy policy to find the correct email or form for deletion requests.
                This usually takes 10-15 seconds.
              </p>
            </div>
          </div>
        )}

        {/* Discovering State */}
        {discovering && (
          <div className="py-8 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <div>
              <h3 className="font-semibold mb-2">Discovering Contacts...</h3>
              <p className="text-sm text-muted-foreground">
                AI is analyzing {service.name}'s privacy policy
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !discovering && !showManualEntry && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex justify-center gap-2">
              <Button onClick={startDiscovery} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => setShowManualEntry(true)} variant="secondary">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Manually
              </Button>
            </div>
          </div>
        )}
        
        {/* Manual Entry Form */}
        {showManualEntry && (
          <div className="space-y-4">
            <Alert>
              <PlusCircle className="h-4 w-4" />
              <AlertDescription>
                Submit a contact manually for admin review. Your submission will be verified before use.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-type">Contact Type</Label>
                <Select
                  value={manualContactType}
                  onValueChange={(value: "email" | "form" | "phone") => {
                    setManualContactType(value);
                    setValidationError(null);
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
                    manualContactType === "email" ? "privacy@example.com" :
                    manualContactType === "form" ? "https://example.com/privacy/delete" :
                    "+1 (555) 123-4567"
                  }
                  value={manualValue}
                  onChange={(e) => {
                    setManualValue(e.target.value);
                    setValidationError(null);
                  }}
                  maxLength={manualContactType === "phone" ? 20 : manualContactType === "email" ? 255 : 500}
                />
                {validationError && (
                  <p className="text-sm text-destructive">{validationError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact-notes">Notes (Optional)</Label>
                <Textarea
                  id="contact-notes"
                  placeholder="Add any relevant notes about this contact (e.g., where you found it, why it's correct)"
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
                              <Globe className="h-3 w-3" />
                              MX Valid
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
                {contacts.length > 0 ? "Skip for Now" : "Cancel"}
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
                      <Sparkles className="mr-2 h-4 w-4" />
                      Discover Contacts
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
                      Validate & Use
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
