import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Globe, Phone, CheckCircle2, XCircle, Clock, Search, RefreshCw } from "lucide-react";

interface ManualSubmission {
  id: string;
  service_id: string;
  submitted_by: string;
  contact_type: string;
  value: string;
  notes: string | null;
  status: string;
  created_at: string;
  service_catalog?: {
    name: string;
    domain: string;
    logo_url?: string;
  };
}

export function ManualContactReview() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ManualSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<ManualSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("manual_contact_submissions")
        .select(`
          *,
          service_catalog (
            name,
            domain,
            logo_url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setSubmissions(data || []);

      // Calculate stats
      const statsCounts = {
        pending: data?.filter(s => s.status === "pending").length || 0,
        approved: data?.filter(s => s.status === "approved").length || 0,
        rejected: data?.filter(s => s.status === "rejected").length || 0,
      };

      setStats(statsCounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch manual submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveSubmission = async (submission: ManualSubmission) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Add to privacy_contacts
      const { error: contactError } = await supabase
        .from("privacy_contacts")
        .insert({
          service_id: submission.service_id,
          contact_type: submission.contact_type,
          value: submission.value,
          confidence: "high",
          reasoning: `Manually submitted by user. Notes: ${submission.notes || "None"}`,
          verified: true,
          added_by: "manual",
        });

      if (contactError) throw contactError;

      // Update submission status
      const { error: updateError } = await supabase
        .from("manual_contact_submissions")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      if (updateError) throw updateError;

      // Update service catalog if email
      if (submission.contact_type === "email") {
        await supabase
          .from("service_catalog")
          .update({
            privacy_email: submission.value,
            contact_verified: true,
            last_verified_at: new Date().toISOString(),
          })
          .eq("id", submission.service_id);
      }

      toast({
        title: "Contact Approved",
        description: `${submission.value} has been added to ${submission.service_catalog?.name}`,
      });

      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve contact",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const rejectSubmission = async (submission: ManualSubmission) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this submission",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("manual_contact_submissions")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason.trim(),
        })
        .eq("id", submission.id);

      if (error) throw error;

      toast({
        title: "Contact Rejected",
        description: "Submission has been rejected",
      });

      setSelectedSubmission(null);
      setRejectionReason("");
      fetchSubmissions();
    } catch (error: any) {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject contact",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="h-4 w-4" />;
      case "form": return <Globe className="h-4 w-4" />;
      case "phone": return <Phone className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { icon: any; variant: "default" | "secondary" | "destructive" }> = {
      pending: { icon: Clock, variant: "secondary" },
      approved: { icon: CheckCircle2, variant: "default" },
      rejected: { icon: XCircle, variant: "destructive" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      s.service_catalog?.name?.toLowerCase().includes(search) ||
      s.service_catalog?.domain?.toLowerCase().includes(search) ||
      s.value?.toLowerCase().includes(search)
    );
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Manual Contact Submissions
          </CardTitle>
          <CardDescription>
            Review and approve user-submitted contact information for privacy deletion requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending Review</div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.approved}</div>
              <div className="text-xs text-muted-foreground">Approved</div>
            </div>
            <div className="p-3 bg-destructive/10 rounded-lg">
              <div className="text-2xl font-bold text-destructive">{stats.rejected}</div>
              <div className="text-xs text-muted-foreground">Rejected</div>
            </div>
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by service, contact, or submitter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchSubmissions} variant="outline" size="icon">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No submissions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {submission.service_catalog?.logo_url && (
                            <img
                              src={submission.service_catalog.logo_url}
                              alt=""
                              className="h-6 w-6 rounded object-contain"
                            />
                          )}
                          <div>
                            <div className="font-medium">{submission.service_catalog?.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{submission.service_catalog?.domain}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getContactIcon(submission.contact_type)}
                          <div>
                            <div className="font-mono text-sm">{submission.value}</div>
                            <div className="text-xs text-muted-foreground capitalize">{submission.contact_type}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {submission.submitted_by.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(submission.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {submission.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSubmission(submission)}
                          >
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Manual Contact</DialogTitle>
            <DialogDescription>
              Review this user-submitted contact and approve or reject it
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              {/* Service Info */}
              <div className="space-y-2">
                <Label>Service</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  {selectedSubmission.service_catalog?.logo_url && (
                    <img
                      src={selectedSubmission.service_catalog.logo_url}
                      alt=""
                      className="h-8 w-8 rounded object-contain"
                    />
                  )}
                  <div>
                    <div className="font-medium">{selectedSubmission.service_catalog?.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedSubmission.service_catalog?.domain}</div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2">
                <Label>Contact Information</Label>
                <div className="p-3 bg-muted rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    {getContactIcon(selectedSubmission.contact_type)}
                    <span className="font-mono">{selectedSubmission.value}</span>
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">Type: {selectedSubmission.contact_type}</div>
                </div>
              </div>

              {/* Notes */}
              {selectedSubmission.notes && (
                <div className="space-y-2">
                  <Label>Submitter Notes</Label>
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {selectedSubmission.notes}
                  </div>
                </div>
              )}

              {/* Submitter */}
              <div className="space-y-2">
                <Label>Submitted By</Label>
                <div className="text-sm text-muted-foreground font-mono">
                  User ID: {selectedSubmission.submitted_by.substring(0, 12)}...
                </div>
              </div>

              {/* Rejection Reason Input */}
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why this contact is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedSubmission(null);
                setRejectionReason("");
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedSubmission && rejectSubmission(selectedSubmission)}
              disabled={processing}
            >
              {processing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
            <Button
              onClick={() => selectedSubmission && approveSubmission(selectedSubmission)}
              disabled={processing}
            >
              {processing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
