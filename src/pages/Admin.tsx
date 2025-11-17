import { useState, useEffect } from "react";
import { Shield, Users, Mail, MailX, Send, Loader2, Download, LogOut, Rocket, Check, X, BarChart3, TrendingUp, MousePointerClick, Eye, ScanSearch, GitPullRequest, CheckCircle2, XCircle, Clock, Search, AlertTriangle } from "lucide-react";
import PrivacyContactDiscovery from "@/components/PrivacyContactDiscovery";
import { ContactVerification } from "@/components/ContactVerification";
import { BulkDiscoveryTool } from "@/components/BulkDiscoveryTool";
import { FailedDiscoveriesLog } from "@/components/FailedDiscoveriesLog";
import { ManualContactReview } from "@/components/ManualContactReview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Link, useNavigate } from "react-router-dom";

export default function Admin() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading, signOut } = useAdminAuth();
  const [loading, setLoading] = useState(false);
  
  // Stats
  const [totalSignups, setTotalSignups] = useState(0);
  const [totalUnsubscribed, setTotalUnsubscribed] = useState(0);
  const [frequencyStats, setFrequencyStats] = useState({ weekly: 0, monthly: 0, never: 0 });
  
  // Waitlist data
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Email sending
  const [testEmail, setTestEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Alpha applications
  const [alphaApplications, setAlphaApplications] = useState<any[]>([]);
  const [alphaStats, setAlphaStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Email analytics
  const [emailAnalytics, setEmailAnalytics] = useState<any>(null);
  const [emailEvents, setEmailEvents] = useState<any[]>([]);
  const [emailEventsLoading, setEmailEventsLoading] = useState(false);

  // Scanner analytics
  const [scannerStats, setScannerStats] = useState({
    totalUsers: 0,
    totalScans: 0,
    avgAccountsPerUser: 0,
    topServices: [] as Array<{ name: string; count: number; logo_url: string }>
  });

  // Service submissions
  const [serviceSubmissions, setServiceSubmissions] = useState<any[]>([]);
  const [submissionsStats, setSubmissionsStats] = useState({ pending: 0, approved: 0, rejected: 0 });

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  const fetchStats = async () => {
    try {
      // Fetch total signups
      const { count: signupCount } = await supabase
        .from("waitlist")
        .select("*", { count: "exact", head: true });
      
      setTotalSignups(signupCount || 0);

      // Fetch email preferences stats
      const { data: preferences } = await supabase
        .from("email_preferences")
        .select("unsubscribed, email_frequency");

      if (preferences) {
        const unsubscribed = preferences.filter(p => p.unsubscribed).length;
        const weekly = preferences.filter(p => p.email_frequency === "weekly").length;
        const monthly = preferences.filter(p => p.email_frequency === "monthly").length;
        const never = preferences.filter(p => p.email_frequency === "never").length;

        setTotalUnsubscribed(unsubscribed);
        setFrequencyStats({ weekly, monthly, never });
      }

      // Fetch alpha application stats
      const { data: applications } = await supabase
        .from("alpha_applications")
        .select("status");

      if (applications) {
        const pending = applications.filter(a => a.status === "pending").length;
        const approved = applications.filter(a => a.status === "approved").length;
        const rejected = applications.filter(a => a.status === "rejected").length;
        
        setAlphaStats({ pending, approved, rejected });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch preferences for each email
      const { data: preferences } = await supabase
        .from("email_preferences")
        .select("email, unsubscribed, email_frequency");

      const preferencesMap = new Map(
        preferences?.map(p => [p.email, { unsubscribed: p.unsubscribed, frequency: p.email_frequency }]) || []
      );

      const enrichedData = data?.map(entry => ({
        ...entry,
        unsubscribed: preferencesMap.get(entry.email)?.unsubscribed || false,
        frequency: preferencesMap.get(entry.email)?.frequency || "weekly",
      })) || [];

      setWaitlist(enrichedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch waitlist data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendProgressEmail = async (testMode: boolean = false) => {
    setSendingEmail(true);
    try {
      const body: any = {};
      if (testMode) {
        if (!testEmail) {
          toast({ title: "Error", description: "Please enter a test email", variant: "destructive" });
          return;
        }
        body.email = testEmail;
        body.testMode = true;
      }

      const { error } = await supabase.functions.invoke("send-progress-email", { body });

      if (error) throw error;

      toast({
        title: "Success",
        description: testMode 
          ? `Test email sent to ${testEmail}` 
          : "Progress emails sent to all waitlist users",
      });
      
      setTestEmail("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send emails",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const exportWaitlist = () => {
    const csv = [
      ["Email", "Joined Date", "Unsubscribed", "Frequency"],
      ...waitlist.map(entry => [
        entry.email,
        new Date(entry.created_at).toLocaleDateString(),
        entry.unsubscribed ? "Yes" : "No",
        entry.frequency,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const fetchAlphaApplications = async () => {
    try {
      const { data, error } = await supabase
        .from("alpha_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAlphaApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch alpha applications",
        variant: "destructive",
      });
    }
  };

  const fetchEmailAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from("email_analytics_summary")
        .select("*")
        .single();

      if (error) throw error;

      setEmailAnalytics(data);
    } catch (error: any) {
      console.error("Error fetching email analytics:", error);
      // Set default values if no data exists yet
      setEmailAnalytics({
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        total_bounced: 0,
        total_complained: 0,
        unique_opens: 0,
        unique_clicks: 0,
        open_rate: 0,
        click_rate: 0,
      });
    }
  };

  const fetchEmailEvents = async () => {
    setEmailEventsLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_analytics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Group events by email_id
      const groupedEvents = data?.reduce((acc: any, event: any) => {
        const emailId = event.email_id;
        if (!acc[emailId]) {
          acc[emailId] = {
            email_id: emailId,
            email_address: event.email_address,
            email_subject: event.email_subject,
            events: [],
            sent_at: null,
            delivered: false,
            opened: false,
            clicked: false,
            bounced: false,
            complained: false,
            open_count: 0,
            click_count: 0,
          };
        }

        acc[emailId].events.push(event);

        // Track event types
        if (event.event_type === "sent") {
          acc[emailId].sent_at = event.created_at;
        }
        if (event.event_type === "delivered") {
          acc[emailId].delivered = true;
        }
        if (event.event_type === "opened") {
          acc[emailId].opened = true;
          acc[emailId].open_count++;
        }
        if (event.event_type === "clicked") {
          acc[emailId].clicked = true;
          acc[emailId].click_count++;
        }
        if (event.event_type === "bounced") {
          acc[emailId].bounced = true;
        }
        if (event.event_type === "complained") {
          acc[emailId].complained = true;
        }

        return acc;
      }, {});

      setEmailEvents(Object.values(groupedEvents || {}));
    } catch (error: any) {
      console.error("Error fetching email events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch email events",
        variant: "destructive",
      });
    } finally {
      setEmailEventsLoading(false);
    }
  };

  const updateApplicationStatus = async (id: string, status: string, notes?: string) => {
    try {
      const updates: any = { status };
      if (notes !== undefined) {
        updates.admin_notes = notes;
      }

      const { error } = await supabase
        .from("alpha_applications")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Send email notification if approved or rejected
      if (status === "approved" || status === "rejected") {
        const { error: emailError } = await supabase.functions.invoke(
          "send-alpha-status-email",
          {
            body: { applicationId: id, status },
          }
        );

        if (emailError) {
          console.error("Failed to send email notification:", emailError);
          toast({
            title: "Status Updated",
            description: `Application ${status} but email notification failed`,
            variant: "default",
          });
        } else {
          toast({
            title: "Status Updated",
            description: `Application ${status} and email sent to applicant`,
          });
        }
      } else {
        toast({
          title: "Status Updated",
          description: `Application ${status}`,
        });
      }

      fetchAlphaApplications();
      fetchStats();
      setSelectedApplication(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    }
  };

  const fetchScannerStats = async () => {
    try {
      // Get total users who have scanned
      const { data: userServicesData, error: usersError } = await supabase
        .from("user_services")
        .select("user_id", { count: "exact", head: false });

      if (usersError) throw usersError;

      const uniqueUsers = new Set(userServicesData?.map(us => us.user_id) || []);
      const totalUsers = uniqueUsers.size;

      // Get total accounts discovered
      const { count: totalScans, error: scansError } = await supabase
        .from("user_services")
        .select("*", { count: "exact", head: true });

      if (scansError) throw scansError;

      // Calculate average accounts per user
      const avgAccountsPerUser = totalUsers > 0 ? Math.round((totalScans || 0) / totalUsers) : 0;

      // Get most discovered services (top 10)
      const { data: topServicesData, error: topError } = await supabase
        .from("user_services")
        .select(`
          service_id,
          service_catalog (
            name,
            logo_url
          )
        `);

      if (topError) throw topError;

      // Count occurrences of each service
      const serviceCounts = new Map<string, { name: string; count: number; logo_url: string }>();
      
      topServicesData?.forEach((item: any) => {
        const serviceId = item.service_id;
        const serviceName = item.service_catalog.name;
        const logoUrl = item.service_catalog.logo_url;
        
        if (serviceCounts.has(serviceId)) {
          serviceCounts.get(serviceId)!.count++;
        } else {
          serviceCounts.set(serviceId, { name: serviceName, count: 1, logo_url: logoUrl });
        }
      });

      // Sort and get top 10
      const topServices = Array.from(serviceCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setScannerStats({
        totalUsers,
        totalScans: totalScans || 0,
        avgAccountsPerUser,
        topServices
      });

    } catch (error) {
      console.error("Error fetching scanner stats:", error);
    }
  };

  const fetchServiceSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("service_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setServiceSubmissions(data || []);

      // Calculate stats
      const pending = data?.filter(s => s.status === "pending").length || 0;
      const approved = data?.filter(s => s.status === "approved").length || 0;
      const rejected = data?.filter(s => s.status === "rejected").length || 0;
      
      setSubmissionsStats({ pending, approved, rejected });
    } catch (error: any) {
      console.error("Error fetching service submissions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch service submissions",
        variant: "destructive",
      });
    }
  };

  const handleApproveSubmission = async (submission: any) => {
    try {
      // Add to service catalog
      const { error: catalogError } = await supabase
        .from("service_catalog")
        .insert({
          name: submission.suggested_name,
          domain: submission.domain,
          category: submission.suggested_category,
        });

      if (catalogError) throw catalogError;

      // Update submission status
      const { error: updateError } = await supabase
        .from("service_submissions")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", submission.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Service added to catalog",
      });

      fetchServiceSubmissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve submission",
        variant: "destructive",
      });
    }
  };

  const handleRejectSubmission = async (submissionId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("service_submissions")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          admin_notes: notes,
        })
        .eq("id", submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Submission rejected",
      });

      fetchServiceSubmissions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reject submission",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchStats();
      fetchWaitlist();
      fetchAlphaApplications();
      fetchEmailAnalytics();
      fetchEmailEvents();
      fetchScannerStats();
      fetchServiceSubmissions();
    }
  }, [isAdmin, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null; // Will redirect via useEffect
  }

  const filteredWaitlist = waitlist.filter(entry =>
    entry.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your waitlist and email campaigns • Logged in as {user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Link to="/admin/analytics">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </Link>
            <Button variant="ghost" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            To grant admin access to other users, manually add their user ID to the user_roles table with role='admin' in Supabase.
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Signups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSignups}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSignups - totalUnsubscribed}</div>
              <p className="text-xs text-muted-foreground">
                {frequencyStats.weekly} weekly, {frequencyStats.monthly} monthly
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
              <MailX className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnsubscribed}</div>
              <p className="text-xs text-muted-foreground">
                {totalSignups > 0 ? ((totalUnsubscribed / totalSignups) * 100).toFixed(1) : 0}% unsub rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Engagement</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalSignups > 0 ? (((totalSignups - totalUnsubscribed) / totalSignups) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Active subscriber rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Scanner Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanSearch className="w-5 h-5" />
              Scanner Analytics
            </CardTitle>
            <CardDescription>Track footprint scanner usage and discovered accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Scanner Stats Grid */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Users Scanned</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{scannerStats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      Total users who ran scanner
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{scannerStats.totalScans}</div>
                    <p className="text-xs text-muted-foreground">
                      Accounts discovered across all users
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg per User</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{scannerStats.avgAccountsPerUser}</div>
                    <p className="text-xs text-muted-foreground">
                      Average accounts per user
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Top Discovered Services */}
              {scannerStats.topServices.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Most Discovered Services</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {scannerStats.topServices.map((service, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <img 
                          src={service.logo_url}
                          alt={service.name}
                          className="w-10 h-10 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.count} {service.count === 1 ? 'user' : 'users'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Email Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Email Analytics
            </CardTitle>
            <CardDescription>Track email delivery, opens, and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            {emailAnalytics ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{emailAnalytics.total_delivered || 0}</div>
                      <p className="text-xs text-muted-foreground">
                        of {emailAnalytics.total_sent || 0} sent
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{emailAnalytics.open_rate || 0}%</div>
                      <p className="text-xs text-muted-foreground">
                        {emailAnalytics.total_opened || 0} opens ({emailAnalytics.unique_opens || 0} unique)
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{emailAnalytics.click_rate || 0}%</div>
                      <p className="text-xs text-muted-foreground">
                        {emailAnalytics.total_clicked || 0} clicks ({emailAnalytics.unique_clicks || 0} unique)
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Issues</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {(emailAnalytics.total_bounced || 0) + (emailAnalytics.total_complained || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {emailAnalytics.total_bounced || 0} bounced, {emailAnalytics.total_complained || 0} complaints
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertDescription>
                    Email analytics are tracked via Resend webhooks. Configure the webhook URL in your Resend dashboard:
                    <code className="ml-2 text-xs">https://gqxkeezkajkiyjpnjgkx.supabase.co/functions/v1/resend-webhook</code>
                  </AlertDescription>
                </Alert>

                {/* Per-Email Analytics Table */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Individual Email Performance</h3>
                  
                  {emailEventsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : emailEvents.length > 0 ? (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Sent At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Opens</TableHead>
                            <TableHead>Clicks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {emailEvents.map((email: any) => (
                            <TableRow key={email.email_id}>
                              <TableCell className="font-medium">
                                <div className="max-w-[200px] truncate" title={email.email_address}>
                                  {email.email_address}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[250px] truncate" title={email.email_subject}>
                                  {email.email_subject || "No subject"}
                                </div>
                              </TableCell>
                              <TableCell>
                                {email.sent_at
                                  ? new Date(email.sent_at).toLocaleDateString() + " " + 
                                    new Date(email.sent_at).toLocaleTimeString()
                                  : "—"}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {email.delivered && (
                                    <Badge variant="default" className="text-xs">
                                      Delivered
                                    </Badge>
                                  )}
                                  {email.bounced && (
                                    <Badge variant="destructive" className="text-xs">
                                      Bounced
                                    </Badge>
                                  )}
                                  {email.complained && (
                                    <Badge variant="destructive" className="text-xs">
                                      Spam
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {email.opened ? (
                                    <>
                                      <Eye className="w-4 h-4 text-green-500" />
                                      <span className="text-sm">{email.open_count}x</span>
                                    </>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {email.clicked ? (
                                    <>
                                      <MousePointerClick className="w-4 h-4 text-blue-500" />
                                      <span className="text-sm">{email.click_count}x</span>
                                    </>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      No email events tracked yet. Emails will appear here once they're sent.
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground mt-4">
                    Showing last 100 emails. Individual opens and clicks are tracked for detailed engagement metrics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Loading analytics...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alpha Applications Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Alpha Access Applications
                </CardTitle>
                <CardDescription>
                  {alphaStats.pending} pending • {alphaStats.approved} approved • {alphaStats.rejected} rejected
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">
                  Pending ({alphaStats.pending})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({alphaStats.approved})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({alphaStats.rejected})
                </TabsTrigger>
              </TabsList>

              {["pending", "approved", "rejected"].map((status) => (
                <TabsContent key={status} value={status} className="mt-4">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead>Platforms</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {alphaApplications
                          .filter((app) => app.status === status)
                          .map((app) => (
                            <TableRow key={app.id}>
                              <TableCell className="font-medium">{app.full_name}</TableCell>
                              <TableCell>{app.email}</TableCell>
                              <TableCell>
                                {new Date(app.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {app.platform_preferences?.map((p: string) => (
                                    <Badge key={p} variant="outline" className="text-xs">
                                      {p}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedApplication(app);
                                        setAdminNotes(app.admin_notes || "");
                                      }}
                                    >
                                      View Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Application Details</DialogTitle>
                                      <DialogDescription>
                                        Review and manage this alpha access application
                                      </DialogDescription>
                                    </DialogHeader>
                                    {selectedApplication && (
                                      <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div>
                                            <Label className="text-sm font-semibold">Full Name</Label>
                                            <p className="text-sm">{selectedApplication.full_name}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold">Email</Label>
                                            <p className="text-sm">{selectedApplication.email}</p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold">Applied On</Label>
                                            <p className="text-sm">
                                              {new Date(selectedApplication.created_at).toLocaleString()}
                                            </p>
                                          </div>
                                          <div>
                                            <Label className="text-sm font-semibold">Status</Label>
                                            <Badge
                                              variant={
                                                selectedApplication.status === "approved"
                                                  ? "default"
                                                  : selectedApplication.status === "rejected"
                                                  ? "destructive"
                                                  : "outline"
                                              }
                                            >
                                              {selectedApplication.status}
                                            </Badge>
                                          </div>
                                        </div>

                                        <div>
                                          <Label className="text-sm font-semibold">Platform Preferences</Label>
                                          <div className="flex gap-2 mt-1">
                                            {selectedApplication.platform_preferences?.map((p: string) => (
                                              <Badge key={p} variant="secondary">
                                                {p}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>

                                        {selectedApplication.current_tools && (
                                          <div>
                                            <Label className="text-sm font-semibold">Current Tools</Label>
                                            <p className="text-sm mt-1">{selectedApplication.current_tools}</p>
                                          </div>
                                        )}

                                        <div>
                                          <Label className="text-sm font-semibold">Use Case</Label>
                                          <p className="text-sm mt-1 whitespace-pre-wrap">
                                            {selectedApplication.use_case}
                                          </p>
                                        </div>

                                        <div>
                                          <Label htmlFor="admin-notes">Admin Notes</Label>
                                          <Textarea
                                            id="admin-notes"
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            placeholder="Add internal notes about this application..."
                                            rows={3}
                                          />
                                        </div>

                                        <div className="flex gap-2">
                                          {selectedApplication.status !== "approved" && (
                                            <Button
                                              onClick={() =>
                                                updateApplicationStatus(
                                                  selectedApplication.id,
                                                  "approved",
                                                  adminNotes
                                                )
                                              }
                                              className="flex-1"
                                            >
                                              <Check className="w-4 h-4 mr-2" />
                                              Approve
                                            </Button>
                                          )}
                                          {selectedApplication.status !== "rejected" && (
                                            <Button
                                              onClick={() =>
                                                updateApplicationStatus(
                                                  selectedApplication.id,
                                                  "rejected",
                                                  adminNotes
                                                )
                                              }
                                              variant="destructive"
                                              className="flex-1"
                                            >
                                              <X className="w-4 h-4 mr-2" />
                                              Reject
                                            </Button>
                                          )}
                                          {selectedApplication.status !== "pending" && (
                                            <Button
                                              onClick={() =>
                                                updateApplicationStatus(
                                                  selectedApplication.id,
                                                  "pending",
                                                  adminNotes
                                                )
                                              }
                                              variant="outline"
                                              className="flex-1"
                                            >
                                              Reset to Pending
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        {alphaApplications.filter((app) => app.status === status).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No {status} applications
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Service Submissions Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitPullRequest className="w-5 h-5" />
                  Service Submissions
                </CardTitle>
                <CardDescription>
                  {submissionsStats.pending} pending • {submissionsStats.approved} approved • {submissionsStats.rejected} rejected
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pending">
                  Pending ({submissionsStats.pending})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Approved ({submissionsStats.approved})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejected ({submissionsStats.rejected})
                </TabsTrigger>
              </TabsList>

              {["pending", "approved", "rejected"].map((status) => (
                <TabsContent key={status} value={status} className="mt-4">
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Domain</TableHead>
                          <TableHead>Suggested Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Submitted</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceSubmissions
                          .filter((sub) => sub.status === status)
                          .map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell className="font-medium">{sub.domain}</TableCell>
                              <TableCell>{sub.suggested_name}</TableCell>
                              <TableCell>
                                {sub.suggested_category ? (
                                  <Badge variant="outline">{sub.suggested_category}</Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">Not specified</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {new Date(sub.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {status === "pending" && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveSubmission(sub)}
                                    >
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRejectSubmission(sub.id, "Not suitable for catalog")}
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                                {status !== "pending" && (
                                  <Badge
                                    variant={status === "approved" ? "default" : "destructive"}
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(sub.reviewed_at).toLocaleDateString()}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        {serviceSubmissions.filter((sub) => sub.status === status).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No {status} submissions
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Bulk Discovery Tool */}
        <BulkDiscoveryTool />

        {/* Failed Discoveries Log */}
        <FailedDiscoveriesLog />

        {/* Manual Contact Review */}
        <ManualContactReview />

        {/* Contact Verification Tool */}
        <ContactVerification />

        {/* Privacy Contact Discovery Testing */}
        <PrivacyContactDiscovery />

        {/* Email Campaign Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Send Progress Email</CardTitle>
            <CardDescription>Manually trigger the Day 7 progress email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="your@email.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <Button
                onClick={() => sendProgressEmail(true)}
                disabled={sendingEmail || !testEmail}
                className="mt-6"
              >
                {sendingEmail ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Send Test
              </Button>
            </div>
            
            <div className="flex items-center gap-4 pt-4 border-t">
              <Button
                onClick={() => sendProgressEmail(false)}
                disabled={sendingEmail}
                variant="default"
                size="lg"
              >
                {sendingEmail ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Send to All Active Subscribers
              </Button>
              <p className="text-sm text-muted-foreground">
                This will send to {totalSignups - totalUnsubscribed} active subscribers
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Waitlist Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Waitlist</CardTitle>
                <CardDescription>{filteredWaitlist.length} entries</CardDescription>
              </div>
              <Button onClick={exportWaitlist} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Frequency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWaitlist.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.email}</TableCell>
                        <TableCell>{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {entry.unsubscribed ? (
                            <Badge variant="destructive">Unsubscribed</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.frequency}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
