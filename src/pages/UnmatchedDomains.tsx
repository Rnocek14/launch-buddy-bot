import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, Tag, Send, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UnmatchedDomain {
  id: string;
  domain: string;
  email_from: string;
  occurrence_count: number;
  first_seen_at: string;
  user_label: string | null;
}

export default function UnmatchedDomains() {
  const navigate = useNavigate();
  const [domains, setDomains] = useState<UnmatchedDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUnmatchedDomains();
  }, []);

  const fetchUnmatchedDomains = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("unmatched_domains")
        .select("*")
        .eq("user_id", user.id)
        .order("occurrence_count", { ascending: false });

      if (error) throw error;

      setDomains(data || []);
      
      // Initialize labels state
      const initialLabels: Record<string, string> = {};
      data?.forEach((domain) => {
        if (domain.user_label) {
          initialLabels[domain.id] = domain.user_label;
        }
      });
      setLabels(initialLabels);
    } catch (error: any) {
      toast.error("Failed to load unmatched domains");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLabelUpdate = async (domainId: string) => {
    const label = labels[domainId]?.trim();
    if (!label) {
      toast.error("Please enter a label");
      return;
    }

    try {
      const { error } = await supabase
        .from("unmatched_domains")
        .update({ user_label: label })
        .eq("id", domainId);

      if (error) throw error;

      toast.success("Label saved");
      fetchUnmatchedDomains();
    } catch (error: any) {
      toast.error("Failed to save label");
      console.error(error);
    }
  };

  const handleSubmitForApproval = async (domain: UnmatchedDomain) => {
    const label = labels[domain.id]?.trim();
    if (!label) {
      toast.error("Please add a label before submitting");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("service_submissions")
        .insert({
          user_id: user.id,
          domain: domain.domain,
          suggested_name: label,
          email_from: domain.email_from,
          occurrence_count: domain.occurrence_count,
        });

      if (error) throw error;

      toast.success("Submitted for admin approval");
    } catch (error: any) {
      toast.error("Failed to submit");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-6xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Unmatched Domains</h1>
          <p className="text-muted-foreground">
            These services weren't recognized in our catalog. Tag them and submit for approval.
          </p>
        </div>

        {domains.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No Unmatched Domains</h3>
              <p className="text-muted-foreground">
                All your email senders are recognized in our catalog.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {domains.map((domain) => (
              <Card key={domain.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{domain.domain}</CardTitle>
                      <CardDescription className="mt-1">
                        From: {domain.email_from}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {domain.occurrence_count} email{domain.occurrence_count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Label this service (e.g., 'Dodo - Travel Agency')"
                        value={labels[domain.id] || ""}
                        onChange={(e) =>
                          setLabels({ ...labels, [domain.id]: e.target.value })
                        }
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleLabelUpdate(domain.id)}
                      disabled={!labels[domain.id]?.trim()}
                    >
                      <Tag className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleSubmitForApproval(domain)}
                      disabled={!domain.user_label}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Submit for Approval
                    </Button>
                  </div>
                  {domain.user_label && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Current label: <span className="font-medium">{domain.user_label}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
