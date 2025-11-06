import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, Search, FileText, CheckCircle2, Clock, AlertCircle, XCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeletionRequest {
  id: string;
  service_name: string;
  request_type: string;
  method: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  verification_required: boolean;
  contact_email: string | null;
  notes: string | null;
}

interface Stats {
  total: number;
  sent: number;
  pending: number;
  completed: number;
  failed: number;
}

export default function DeletionRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    await fetchRequests();
    setLoading(false);
  }

  async function fetchRequests() {
    const { data, error } = await supabase
      .from("deletion_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading requests",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setRequests(data || []);
  }

  const stats: Stats = useMemo(() => {
    return {
      total: requests.length,
      sent: requests.filter(r => r.status === "sent").length,
      pending: requests.filter(r => r.status === "pending").length,
      completed: requests.filter(r => r.status === "completed").length,
      failed: requests.filter(r => r.status === "failed").length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = request.service_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      sent: {
        variant: "default",
        icon: <Mail className="w-3 h-3 mr-1" />,
        label: "Sent",
      },
      pending: {
        variant: "secondary",
        icon: <Clock className="w-3 h-3 mr-1" />,
        label: "Pending",
      },
      completed: {
        variant: "default",
        icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
        label: "Completed",
      },
      failed: {
        variant: "destructive",
        icon: <XCircle className="w-3 h-3 mr-1" />,
        label: "Failed",
      },
      "requires-verification": {
        variant: "outline",
        icon: <AlertCircle className="w-3 h-3 mr-1" />,
        label: "Needs Verification",
      },
    };

    const config = variants[status] || variants.pending;

    return (
      <Badge
        variant={config.variant}
        className="flex items-center w-fit"
      >
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">
                Deletion Request History
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Track all your data deletion requests
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <div className="text-2xl font-bold text-foreground">
                  {stats.total}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total Requests
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Mail className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-foreground">
                  {stats.sent}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Sent</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Clock className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                <div className="text-2xl font-bold text-foreground">
                  {stats.pending}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-foreground">
                  {stats.completed}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <XCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold text-foreground">
                  {stats.failed}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Failed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by service name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Statuses ({stats.total})
                  </SelectItem>
                  <SelectItem value="sent">Sent ({stats.sent})</SelectItem>
                  <SelectItem value="pending">
                    Pending ({stats.pending})
                  </SelectItem>
                  <SelectItem value="completed">
                    Completed ({stats.completed})
                  </SelectItem>
                  <SelectItem value="failed">Failed ({stats.failed})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        {filteredRequests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                {requests.length === 0 ? (
                  <>
                    <p className="text-muted-foreground mb-4">
                      No deletion requests yet
                    </p>
                    <Button onClick={() => navigate("/dashboard")}>
                      Go to Dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-4">
                      No requests match your filters
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                All Requests ({filteredRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.service_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {request.method || "Email"}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(request.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {request.completed_at
                            ? new Date(request.completed_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {request.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Box */}
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">
                  About Deletion Requests
                </p>
                <p className="text-muted-foreground">
                  Services are legally required to respond within 30-45 days
                  depending on jurisdiction (GDPR: 30 days, CCPA: 45 days). If a
                  service doesn't respond, you may need to follow up or escalate
                  to regulatory authorities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
