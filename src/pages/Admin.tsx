import { useState, useEffect } from "react";
import { Shield, Users, Mail, MailX, Send, Loader2, Download, LogOut, Rocket, Check, X } from "lucide-react";
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

      toast({
        title: "Status Updated",
        description: `Application ${status}`,
      });

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

  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchStats();
      fetchWaitlist();
      fetchAlphaApplications();
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
