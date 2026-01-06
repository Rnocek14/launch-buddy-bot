import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Loader2, Search, FileText, CheckCircle2, Clock, AlertCircle, XCircle, Mail, ScanSearch, MessageSquare, Timer, TrendingUp, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PrivacyContactDiscovery from "@/components/PrivacyContactDiscovery";
import { ResponseTrackingDialog } from "@/components/ResponseTrackingDialog";

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
  response_received_at: string | null;
  response_type: string | null;
  response_notes: string | null;
  days_to_response: number | null;
  follow_up_count: number;
  last_follow_up_at: string | null;
}

interface Stats {
  total: number;
  sent: number;
  pending: number;
  completed: number;
  failed: number;
  awaitingResponse: number;
  avgResponseDays: number | null;
}

export default function DeletionRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);

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
    const awaitingResponse = requests.filter(
      r => r.status === "sent" && !r.response_received_at
    ).length;
    
    const responseTimes = requests
      .filter(r => r.days_to_response !== null)
      .map(r => r.days_to_response as number);
    
    const avgResponseDays = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : null;

    return {
      total: requests.length,
      sent: requests.filter(r => r.status === "sent").length,
      pending: requests.filter(r => r.status === "pending").length,
      completed: requests.filter(r => r.status === "completed").length,
      failed: requests.filter(r => r.status === "failed").length,
      awaitingResponse,
      avgResponseDays,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = request.service_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || 
        statusFilter === "awaiting" 
          ? (statusFilter === "all" || (request.status === "sent" && !request.response_received_at))
          : request.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const getDaysSinceRequest = (createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (request: DeletionRequest) => {
    // If we have a response, show response type
    if (request.response_type) {
      const responseVariants: Record<string, { variant: any; icon: any; label: string; className?: string }> = {
        confirmed: {
          variant: "default",
          icon: <CheckCircle2 className="w-3 h-3 mr-1" />,
          label: "Confirmed",
          className: "bg-green-500/10 text-green-600 border-green-500/30",
        },
        denied: {
          variant: "destructive",
          icon: <XCircle className="w-3 h-3 mr-1" />,
          label: "Denied",
        },
        needs_info: {
          variant: "outline",
          icon: <HelpCircle className="w-3 h-3 mr-1" />,
          label: "Needs Info",
          className: "text-blue-600 border-blue-500/30 bg-blue-500/10",
        },
        partial: {
          variant: "outline",
          icon: <AlertCircle className="w-3 h-3 mr-1" />,
          label: "Partial",
          className: "text-amber-600 border-amber-500/30 bg-amber-500/10",
        },
        no_response: {
          variant: "outline",
          icon: <Clock className="w-3 h-3 mr-1" />,
          label: "No Response",
          className: "text-muted-foreground",
        },
      };
      
      const config = responseVariants[request.response_type] || responseVariants.no_response;
      
      return (
        <Badge variant={config.variant} className={`flex items-center w-fit ${config.className || ""}`}>
          {config.icon}
          {config.label}
        </Badge>
      );
    }

    // Original status badges
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

    const config = variants[request.status] || variants.pending;

    return (
      <Badge variant={config.variant} className="flex items-center w-fit">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getWaitingIndicator = (request: DeletionRequest) => {
    if (request.response_received_at || request.status !== "sent") return null;
    
    const days = getDaysSinceRequest(request.created_at);
    let color = "text-muted-foreground";
    let tooltip = `${days} days since request`;
    
    if (days >= 30) {
      color = "text-red-500";
      tooltip = `⚠️ ${days} days - Past GDPR deadline (30 days)`;
    } else if (days >= 20) {
      color = "text-amber-500";
      tooltip = `${days} days - Approaching deadline`;
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 text-xs ${color}`}>
              <Timer className="w-3 h-3" />
              <span>{days}d</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const handleTrackResponse = (request: DeletionRequest) => {
    setSelectedRequest(request);
    setTrackingDialogOpen(true);
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
                Track all your data deletion requests and company responses
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="requests" className="space-y-6">
          <TabsList>
            <TabsTrigger value="requests" className="gap-2">
              <FileText className="w-4 h-4" />
              My Requests
            </TabsTrigger>
            <TabsTrigger value="discover" className="gap-2">
              <ScanSearch className="w-4 h-4" />
              Discover Contacts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
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

              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Timer className="w-8 h-8 mx-auto mb-2 text-amber-600" />
                    <div className="text-2xl font-bold text-foreground">
                      {stats.awaitingResponse}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Awaiting Response</p>
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
                    <p className="text-xs text-muted-foreground mt-1">Failed/Denied</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <div className="text-2xl font-bold text-foreground">
                      {stats.avgResponseDays !== null ? `${stats.avgResponseDays}d` : "-"}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Avg Response</p>
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
                      <SelectItem value="awaiting">
                        Awaiting Response ({stats.awaitingResponse})
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
                          <TableHead>Waiting</TableHead>
                          <TableHead>Response</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{request.service_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(request.created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {request.method || "Email"}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(request)}</TableCell>
                            <TableCell>
                              {getWaitingIndicator(request)}
                              {request.days_to_response !== null && (
                                <span className="text-xs text-muted-foreground">
                                  {request.days_to_response}d response
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs">
                              {request.response_notes ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate block max-w-[150px]">
                                        {request.response_notes}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p>{request.response_notes}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {request.status === "sent" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTrackResponse(request)}
                                  className="gap-1"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  {request.response_type ? "Update" : "Track"}
                                </Button>
                              )}
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
                      About Response Tracking
                    </p>
                    <p className="text-muted-foreground">
                      Services are legally required to respond within 30-45 days
                      depending on jurisdiction (GDPR: 30 days, CCPA: 45 days). 
                      Use the "Track" button to record when companies respond to your requests.
                      This helps you follow up on overdue requests and build a record of company compliance.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discover">
            <PrivacyContactDiscovery />
          </TabsContent>
        </Tabs>
      </div>

      {/* Response Tracking Dialog */}
      <ResponseTrackingDialog
        open={trackingDialogOpen}
        onOpenChange={setTrackingDialogOpen}
        request={selectedRequest}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
