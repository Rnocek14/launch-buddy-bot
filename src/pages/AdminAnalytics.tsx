import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Users, TrendingUp, DollarSign, Percent, Activity, Trash2, Mail, Shield } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  totalUsers: number;
  freeUsers: number;
  proUsers: number;
  conversionRate: number;
  mrr: number;
  totalDeletions: number;
  totalEmailScans: number;
  totalServicesDiscovered: number;
  activeUsers30d: number;
}

interface SubscriptionTrend {
  date: string;
  free: number;
  pro: number;
}

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    freeUsers: 0,
    proUsers: 0,
    conversionRate: 0,
    mrr: 0,
    totalDeletions: 0,
    totalEmailScans: 0,
    totalServicesDiscovered: 0,
    activeUsers30d: 0,
  });
  const [subscriptionTrend, setSubscriptionTrend] = useState<SubscriptionTrend[]>([]);

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
      } else {
        fetchAnalytics();
      }
    }
  }, [user, isAdmin, authLoading, navigate, toast]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch total users from profiles
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch subscription breakdown
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("tier, status");

      const freeUsers = subscriptions?.filter(s => s.tier === "free" && s.status === "active").length || 0;
      const proUsers = subscriptions?.filter(s => s.tier === "pro" && s.status === "active").length || 0;
      
      // Calculate conversion rate
      const conversionRate = totalUsers ? (proUsers / totalUsers) * 100 : 0;

      // Calculate MRR (assuming $10/month for pro users)
      const mrr = proUsers * 10;

      // Fetch deletion requests count
      const { count: totalDeletions } = await supabase
        .from("deletion_requests")
        .select("*", { count: "exact", head: true });

      // Fetch email connections (scans) count
      const { count: totalEmailScans } = await supabase
        .from("email_connections")
        .select("*", { count: "exact", head: true });

      // Fetch user services (discovered services) count
      const { count: totalServicesDiscovered } = await supabase
        .from("user_services")
        .select("*", { count: "exact", head: true });

      // Active users in last 30 days (users with deletion requests or services discovered)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentActivity } = await supabase
        .from("deletion_requests")
        .select("user_id")
        .gte("created_at", thirtyDaysAgo.toISOString());

      const activeUsers = new Set(recentActivity?.map(r => r.user_id) || []).size;

      // Fetch subscription trend for last 30 days
      const { data: subscriptionHistory } = await supabase
        .from("subscriptions")
        .select("created_at, tier")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      // Group by date
      const trendMap = new Map<string, { free: number; pro: number }>();
      subscriptionHistory?.forEach(sub => {
        const date = new Date(sub.created_at).toLocaleDateString();
        const current = trendMap.get(date) || { free: 0, pro: 0 };
        if (sub.tier === "free") current.free++;
        else if (sub.tier === "pro") current.pro++;
        trendMap.set(date, current);
      });

      const trend = Array.from(trendMap.entries())
        .map(([date, counts]) => ({ date, ...counts }))
        .slice(-14); // Last 14 days

      setAnalytics({
        totalUsers: totalUsers || 0,
        freeUsers,
        proUsers,
        conversionRate,
        mrr,
        totalDeletions: totalDeletions || 0,
        totalEmailScans: totalEmailScans || 0,
        totalServicesDiscovered: totalServicesDiscovered || 0,
        activeUsers30d: activeUsers,
      });

      setSubscriptionTrend(trend);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pieData = [
    { name: "Free", value: analytics.freeUsers, color: "hsl(var(--muted))" },
    { name: "Pro", value: analytics.proUsers, color: "hsl(var(--primary))" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Subscription metrics and user activity</p>
            </div>
          </div>
          <Button onClick={fetchAnalytics} variant="outline">
            Refresh Data
          </Button>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.freeUsers} free, {analytics.proUsers} pro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Free to Pro conversions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${analytics.mrr}</div>
              <p className="text-xs text-muted-foreground">MRR from {analytics.proUsers} pro users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activeUsers30d}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Subscription Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Distribution</CardTitle>
              <CardDescription>Free vs Pro users breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Subscription Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Trend</CardTitle>
              <CardDescription>New signups over last 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={subscriptionTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="free" stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
                  <Line type="monotone" dataKey="pro" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* User Activity Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deletion Requests</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalDeletions}</div>
              <p className="text-xs text-muted-foreground">Total requests submitted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Email Scans</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalEmailScans}</div>
              <p className="text-xs text-muted-foreground">Connected email accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Services Discovered</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalServicesDiscovered}</div>
              <p className="text-xs text-muted-foreground">Total accounts found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
