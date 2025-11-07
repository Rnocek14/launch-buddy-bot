import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, CheckCircle, XCircle, Mail, Link as LinkIcon, Phone, ThumbsUp, ThumbsDown, ExternalLink, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  domain: string;
  privacy_email: string | null;
  privacy_form_url: string | null;
}

interface PrivacyContact {
  id: string;
  service_id: string;
  contact_type: string;
  value: string;
  confidence: string;
  reasoning: string;
  verified: boolean;
  created_at: string;
}

export default function PrivacyContactDiscovery() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [contacts, setContacts] = useState<PrivacyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState<string | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("service_catalog")
        .select("id, name, domain, privacy_email, privacy_form_url")
        .order("name");

      if (error) throw error;

      setServices(data || []);
      await fetchContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("privacy_contacts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setContacts(data || []);
    } catch (error: any) {
      console.error("Failed to fetch contacts:", error);
    }
  };

  const discoverContacts = async (serviceId: string) => {
    setDiscovering(serviceId);
    try {
      const { data, error } = await supabase.functions.invoke(
        "discover-privacy-contacts",
        {
          body: { service_id: serviceId },
        }
      );

      if (error) throw error;

      toast({
        title: "Success",
        description: `Found ${data.contacts_found} contact method(s) for ${data.service}`,
      });

      await fetchContacts();
      await fetchServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to discover contacts",
        variant: "destructive",
      });
    } finally {
      setDiscovering(null);
    }
  };

  const approveContact = async (contact: PrivacyContact) => {
    try {
      // Mark contact as verified
      const { error: verifyError } = await supabase
        .from("privacy_contacts")
        .update({ verified: true })
        .eq("id", contact.id);

      if (verifyError) throw verifyError;

      // Update service catalog with the approved contact
      const updateData: any = {};
      if (contact.contact_type === "email") {
        updateData.privacy_email = contact.value;
      } else if (contact.contact_type === "form") {
        updateData.privacy_form_url = contact.value;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("service_catalog")
          .update(updateData)
          .eq("id", contact.service_id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Contact Approved",
        description: "Contact has been verified and added to the service catalog",
      });

      await fetchContacts();
      await fetchServices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve contact",
        variant: "destructive",
      });
    }
  };

  const rejectContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from("privacy_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;

      toast({
        title: "Contact Rejected",
        description: "Contact has been removed",
      });

      await fetchContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject contact",
        variant: "destructive",
      });
    }
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "form":
        return <LinkIcon className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <Badge variant="default">High</Badge>;
      case "medium":
        return <Badge variant="secondary">Medium</Badge>;
      case "low":
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{confidence}</Badge>;
    }
  };

  const getServiceContacts = (serviceId: string) => {
    return contacts.filter((c) => c.service_id === serviceId);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Contact information copied to clipboard",
    });
  };

  const renderContactAction = (contact: PrivacyContact) => {
    if (contact.contact_type === "email") {
      return (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => copyToClipboard(contact.value)}
        >
          <Copy className="w-3 h-3" />
          Copy
        </Button>
      );
    } else if (contact.contact_type === "form") {
      return (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => window.open(contact.value, '_blank')}
        >
          <ExternalLink className="w-3 h-3" />
          Open Form
        </Button>
      );
    } else if (contact.contact_type === "phone") {
      return (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => copyToClipboard(contact.value)}
          >
            <Copy className="w-3 h-3" />
            Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => window.open(`tel:${contact.value}`, '_self')}
          >
            <Phone className="w-3 h-3" />
            Call
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          AI Privacy Contact Discovery
        </CardTitle>
        <CardDescription>
          Test the AI-powered system for discovering privacy contact methods from service privacy policies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Search className="h-4 w-4" />
          <AlertDescription>
            Click "Discover" to use OpenAI to extract privacy contact information from each service's privacy policy.
            The AI will find email addresses, forms, and other contact methods for data deletion requests.
          </AlertDescription>
        </Alert>

        <Button onClick={fetchServices} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading Services...
            </>
          ) : (
            "Load Services"
          )}
        </Button>

        {services.length > 0 && (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Current Contacts</TableHead>
                  <TableHead>AI Findings</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const serviceContacts = getServiceContacts(service.id);
                  return (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {service.domain}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          {service.privacy_email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {service.privacy_email}
                            </div>
                          )}
                          {service.privacy_form_url && (
                            <div className="flex items-center gap-1">
                              <LinkIcon className="w-3 h-3" />
                              Form URL
                            </div>
                          )}
                          {!service.privacy_email && !service.privacy_form_url && (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {serviceContacts.length > 0 ? (
                          <div className="space-y-2">
                            {serviceContacts.map((contact) => (
                              <div
                                key={contact.id}
                                className="flex items-start gap-2 text-xs border-l-2 border-primary/20 pl-2 py-1"
                              >
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    {getContactIcon(contact.contact_type)}
                                    <span className="font-medium">
                                      {contact.contact_type === "email" ? "Email" : 
                                       contact.contact_type === "form" ? "Web Form" : 
                                       contact.contact_type === "phone" ? "Phone" : 
                                       contact.contact_type}
                                    </span>
                                    {getConfidenceBadge(contact.confidence)}
                                  </div>
                                  <div className="text-muted-foreground break-all">
                                    {contact.value}
                                  </div>
                                  <div className="flex gap-2">
                                    {renderContactAction(contact)}
                                    {contact.verified ? (
                                      <Badge variant="outline" className="h-7 gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        Verified
                                      </Badge>
                                    ) : (
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 p-0"
                                          onClick={() => approveContact(contact)}
                                          title="Approve and add to service catalog"
                                        >
                                          <ThumbsUp className="w-3 h-3 text-green-600" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 p-0"
                                          onClick={() => rejectContact(contact.id)}
                                          title="Reject this contact"
                                        >
                                          <ThumbsDown className="w-3 h-3 text-red-600" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not scanned yet
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => discoverContacts(service.id)}
                          disabled={discovering === service.id}
                        >
                          {discovering === service.id ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Discovering...
                            </>
                          ) : (
                            <>
                              <Search className="w-3 h-3 mr-2" />
                              Discover
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {contacts.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold">All Discovered Contacts</h3>
            <div className="border rounded-lg p-4 max-h-[400px] overflow-y-auto space-y-3">
              {contacts.map((contact) => {
                const service = services.find((s) => s.id === contact.service_id);
                return (
                  <div
                    key={contact.id}
                    className="border-l-2 border-primary/30 pl-3 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      {getContactIcon(contact.contact_type)}
                      <span className="font-medium text-sm">
                        {service?.name || "Unknown Service"}
                      </span>
                      {getConfidenceBadge(contact.confidence)}
                      {contact.verified && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {contact.value}
                    </div>
                    <div className="text-xs text-muted-foreground italic">
                      {contact.reasoning}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Discovered: {new Date(contact.created_at).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
