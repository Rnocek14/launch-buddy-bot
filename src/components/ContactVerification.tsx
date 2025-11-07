import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Mail, Globe, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ContactStats {
  totalContacts: number;
  verifiedContacts: number;
  unverifiedContacts: number;
  mxValidated: number;
}

interface Contact {
  id: string;
  service_id: string;
  contact_type: string;
  value: string;
  confidence: string;
  verified: boolean;
  mx_validated: boolean;
  last_validated_at: string | null;
  service_catalog: {
    name: string;
    logo_url: string | null;
  };
}

export const ContactVerification = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState<string | null>(null);
  const [stats, setStats] = useState<ContactStats>({
    totalContacts: 0,
    verifiedContacts: 0,
    unverifiedContacts: 0,
    mxValidated: 0,
  });
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      // Fetch all email contacts from privacy_contacts
      const { data: contactsData, error } = await supabase
        .from("privacy_contacts")
        .select(`
          id,
          service_id,
          contact_type,
          value,
          confidence,
          verified,
          mx_validated,
          last_validated_at,
          service_catalog (
            name,
            logo_url
          )
        `)
        .eq("contact_type", "email")
        .order("verified", { ascending: true })
        .order("mx_validated", { ascending: true });

      if (error) throw error;

      setContacts(contactsData || []);

      // Calculate stats
      const total = contactsData?.length || 0;
      const verified = contactsData?.filter(c => c.verified).length || 0;
      const unverified = total - verified;
      const mxValidated = contactsData?.filter(c => c.mx_validated).length || 0;

      setStats({
        totalContacts: total,
        verifiedContacts: verified,
        unverifiedContacts: unverified,
        mxValidated,
      });
    } catch (error: any) {
      console.error("Error fetching contacts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contacts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateContact = async (contact: Contact) => {
    setValidating(contact.id);
    try {
      const { data, error } = await supabase.functions.invoke(
        "validate-email-contact",
        {
          body: {
            email: contact.value,
            updateDatabase: true,
            contactId: contact.id,
            serviceId: contact.service_id,
          },
        }
      );

      if (error) throw error;

      if (data.validation.isValid) {
        toast({
          title: "Validation Success",
          description: `${contact.value} has valid MX records`,
        });
      } else {
        toast({
          title: "Validation Failed",
          description: data.validation.error || "No MX records found",
          variant: "destructive",
        });
      }

      // Refresh contacts
      fetchContacts();
    } catch (error: any) {
      console.error("Validation error:", error);
      toast({
        title: "Validation Error",
        description: error.message || "Failed to validate contact",
        variant: "destructive",
      });
    } finally {
      setValidating(null);
    }
  };

  const bulkValidate = async () => {
    if (loading || validating) return;

    const unvalidatedContacts = contacts.filter(c => !c.mx_validated);
    
    if (unvalidatedContacts.length === 0) {
      toast({
        title: "No Contacts to Validate",
        description: "All contacts have already been validated",
      });
      return;
    }

    const confirmBulk = window.confirm(
      `This will validate ${unvalidatedContacts.length} email contacts. This may take a few minutes. Continue?`
    );

    if (!confirmBulk) return;

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const contact of unvalidatedContacts) {
      try {
        const { data, error } = await supabase.functions.invoke(
          "validate-email-contact",
          {
            body: {
              email: contact.value,
              updateDatabase: true,
              contactId: contact.id,
              serviceId: contact.service_id,
            },
          }
        );

        if (!error && data.validation.isValid) {
          successCount++;
        } else {
          failCount++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to validate ${contact.value}:`, error);
        failCount++;
      }
    }

    setLoading(false);
    
    toast({
      title: "Bulk Validation Complete",
      description: `✅ ${successCount} validated successfully, ❌ ${failCount} failed`,
    });

    fetchContacts();
  };

  const approveContact = async (contact: Contact) => {
    try {
      const { error } = await supabase
        .from("privacy_contacts")
        .update({ verified: true })
        .eq("id", contact.id);

      if (error) throw error;

      // Also update service_catalog
      const { error: catalogError } = await supabase
        .from("service_catalog")
        .update({
          contact_verified: true,
          privacy_email: contact.value,
        })
        .eq("id", contact.service_id);

      if (catalogError) {
        console.error("Error updating service catalog:", catalogError);
      }

      toast({
        title: "Contact Approved",
        description: `${contact.value} marked as verified`,
      });

      fetchContacts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to approve contact",
        variant: "destructive",
      });
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; icon: any }> = {
      high: { variant: "default", icon: CheckCircle2 },
      medium: { variant: "secondary", icon: AlertTriangle },
      low: { variant: "destructive", icon: XCircle },
    };

    const config = variants[confidence] || variants.low;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {confidence}
      </Badge>
    );
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          MX Validation checks if email addresses have valid mail server records. This helps prevent
          sending deletion requests to non-existent addresses.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.verifiedContacts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unverified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats.unverifiedContacts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">MX Validated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.mxValidated}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contact Verification</CardTitle>
              <CardDescription>
                Validate and approve email contacts for deletion requests
              </CardDescription>
            </div>
            <Button
              onClick={bulkValidate}
              disabled={loading || validating !== null}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                "Bulk Validate All"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Validated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {contact.service_catalog.logo_url && (
                        <img
                          src={contact.service_catalog.logo_url}
                          alt={contact.service_catalog.name}
                          className="h-6 w-6 rounded"
                        />
                      )}
                      {contact.service_catalog.name}
                    </div>
                  </TableCell>
                  <TableCell>{contact.value}</TableCell>
                  <TableCell>{getConfidenceBadge(contact.confidence)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {contact.verified ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                      {contact.mx_validated && (
                        <Badge variant="outline" className="gap-1">
                          <Globe className="h-3 w-3" />
                          MX Valid
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.last_validated_at
                      ? new Date(contact.last_validated_at).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {!contact.mx_validated && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => validateContact(contact)}
                          disabled={validating === contact.id}
                        >
                          {validating === contact.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Validate"
                          )}
                        </Button>
                      )}
                      {contact.mx_validated && !contact.verified && (
                        <Button
                          size="sm"
                          onClick={() => approveContact(contact)}
                        >
                          Approve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {contacts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No contacts found. AI discovery will populate this list.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
