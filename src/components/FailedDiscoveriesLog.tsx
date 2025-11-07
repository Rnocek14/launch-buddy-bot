import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Search, ExternalLink, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FailedDiscovery {
  id: string;
  service_id: string;
  user_id: string;
  failure_type: string;
  error_message: string;
  urls_tried: string[];
  http_status_codes: any;
  created_at: string;
  service_catalog?: {
    name: string;
    domain: string;
    logo_url?: string;
  };
}

export function FailedDiscoveriesLog() {
  const { toast } = useToast();
  const [failures, setFailures] = useState<FailedDiscovery[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    fetch_failed: 0,
    no_policy_found: 0,
    ai_error: 0,
    all_filtered: 0,
    no_contacts_found: 0,
  });

  useEffect(() => {
    fetchFailures();
  }, []);

  const fetchFailures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_discovery_failures")
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

      setFailures(data || []);

      // Calculate stats
      const statsCounts = {
        fetch_failed: 0,
        no_policy_found: 0,
        ai_error: 0,
        all_filtered: 0,
        no_contacts_found: 0,
      };

      data?.forEach((f) => {
        const type = f.failure_type as keyof typeof statsCounts;
        if (statsCounts[type] !== undefined) {
          statsCounts[type]++;
        }
      });

      setStats(statsCounts);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch failed discoveries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFailureTypeBadge = (type: string) => {
    const variants: Record<string, { label: string; variant: "destructive" | "secondary" | "default" }> = {
      fetch_failed: { label: "Fetch Failed", variant: "destructive" },
      no_policy_found: { label: "No Policy Found", variant: "secondary" },
      ai_error: { label: "AI Error", variant: "destructive" },
      all_filtered: { label: "All Filtered", variant: "secondary" },
      no_contacts_found: { label: "No Contacts", variant: "default" },
    };

    const config = variants[type] || { label: type, variant: "default" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredFailures = failures.filter((f) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      f.service_catalog?.name?.toLowerCase().includes(search) ||
      f.service_catalog?.domain?.toLowerCase().includes(search) ||
      f.error_message?.toLowerCase().includes(search)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Failed Contact Discoveries
        </CardTitle>
        <CardDescription>
          Track websites where automated contact discovery failed - helps identify patterns and improve the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-3 bg-destructive/10 rounded-lg">
            <div className="text-2xl font-bold text-destructive">{stats.fetch_failed}</div>
            <div className="text-xs text-muted-foreground">Fetch Failed</div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.no_policy_found}</div>
            <div className="text-xs text-muted-foreground">No Policy Found</div>
          </div>
          <div className="p-3 bg-destructive/10 rounded-lg">
            <div className="text-2xl font-bold text-destructive">{stats.ai_error}</div>
            <div className="text-xs text-muted-foreground">AI Errors</div>
          </div>
          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.all_filtered}</div>
            <div className="text-xs text-muted-foreground">All Filtered</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{stats.no_contacts_found}</div>
            <div className="text-xs text-muted-foreground">No Contacts</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by service name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={fetchFailures} variant="outline" size="icon">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed discoveries help identify sites with strong bot protection or unusual privacy page structures. 
            Consider adding manual contact entries for frequently failing domains.
          </AlertDescription>
        </Alert>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Failure Type</TableHead>
                <TableHead>Error Message</TableHead>
                <TableHead>URLs Tried</TableHead>
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
              ) : filteredFailures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No failed discoveries found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFailures.map((failure) => (
                  <TableRow key={failure.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {failure.service_catalog?.logo_url && (
                          <img
                            src={failure.service_catalog.logo_url}
                            alt=""
                            className="h-6 w-6 rounded object-contain"
                          />
                        )}
                        <div>
                          <div className="font-medium">{failure.service_catalog?.name || "Unknown"}</div>
                          <div className="text-xs text-muted-foreground">{failure.service_catalog?.domain}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getFailureTypeBadge(failure.failure_type)}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm truncate" title={failure.error_message}>
                        {failure.error_message}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground">
                        {failure.urls_tried?.length || 0} URLs
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(failure.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const url = `https://${failure.service_catalog?.domain}`;
                          window.open(url, "_blank");
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
