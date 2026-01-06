import { useState, useEffect } from "react";
import { Building2, Loader2, Search, Mail, Phone, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnterpriseLead {
  id: string;
  name: string;
  email: string;
  company: string;
  employees: string | null;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", color: "bg-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "qualified", label: "Qualified", color: "bg-purple-500" },
  { value: "closed", label: "Closed", color: "bg-green-500" },
];

export function EnterpriseLeadsAdmin() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<EnterpriseLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<EnterpriseLead | null>(null);
  const [stats, setStats] = useState({ new: 0, contacted: 0, qualified: 0, closed: 0, total: 0 });

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("enterprise_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setLeads(data || []);

      // Calculate stats
      const newCount = data?.filter((l) => l.status === "new").length || 0;
      const contacted = data?.filter((l) => l.status === "contacted").length || 0;
      const qualified = data?.filter((l) => l.status === "qualified").length || 0;
      const closed = data?.filter((l) => l.status === "closed").length || 0;

      setStats({
        new: newCount,
        contacted,
        qualified,
        closed,
        total: data?.length || 0,
      });
    } catch (error: any) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Error",
        description: "Failed to fetch enterprise leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("enterprise_leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Lead status changed to ${newStatus}`,
      });

      fetchLeads();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <Badge
        variant="secondary"
        className={`${statusConfig?.color || "bg-gray-500"} text-white`}
      >
        {statusConfig?.label || status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Enterprise Leads
        </CardTitle>
        <CardDescription>
          Manage enterprise inquiries and track sales pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Leads</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
              <p className="text-xs text-muted-foreground">New</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
              <p className="text-xs text-muted-foreground">Contacted</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">{stats.qualified}</div>
              <p className="text-xs text-muted-foreground">Qualified</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.closed}</div>
              <p className="text-xs text-muted-foreground">Closed</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {leads.length === 0 ? "No enterprise leads yet" : "No leads match your filters"}
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div className="font-medium">{lead.company}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{lead.name}</div>
                      <div className="text-xs text-muted-foreground">{lead.email}</div>
                    </TableCell>
                    <TableCell>{lead.employees || "—"}</TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLead(lead)}
                        >
                          View
                        </Button>
                        <Select
                          value={lead.status}
                          onValueChange={(value) => updateLeadStatus(lead.id, value)}
                        >
                          <SelectTrigger className="h-8 w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedLead?.company}</DialogTitle>
              <DialogDescription>Enterprise lead details</DialogDescription>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedLead.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedLead.company}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${selectedLead.email}`} className="text-primary hover:underline">
                      {selectedLead.email}
                    </a>
                  </div>
                  {selectedLead.employees && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedLead.employees} employees</span>
                    </div>
                  )}
                </div>

                {selectedLead.message && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="w-4 h-4" />
                      Message
                    </div>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg whitespace-pre-wrap">
                      {selectedLead.message}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Submitted {new Date(selectedLead.created_at).toLocaleDateString()}
                  </div>
                  {getStatusBadge(selectedLead.status)}
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" asChild>
                    <a href={`mailto:${selectedLead.email}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </a>
                  </Button>
                  <Select
                    value={selectedLead.status}
                    onValueChange={(value) => {
                      updateLeadStatus(selectedLead.id, value);
                      setSelectedLead({ ...selectedLead, status: value });
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
