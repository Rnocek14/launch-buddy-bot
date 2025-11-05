import { useState, useEffect } from "react";
import { Shield, Users, Mail, MailX, Send, Loader2, Download, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchStats();
      fetchWaitlist();
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
