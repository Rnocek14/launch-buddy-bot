import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign,
  MousePointerClick,
  TrendingUp,
  Copy,
  Loader2,
  Clock,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface AffiliateRow {
  id: string;
  code: string;
  full_name: string;
  email: string;
  status: string;
  commission_rate: number;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  total_earnings_cents: number;
  created_at: string;
  approved_at: string | null;
}

interface ConversionRow {
  id: string;
  conversion_type: string;
  amount_cents: number;
  commission_cents: number;
  status: string;
  created_at: string;
  paid_at: string | null;
}

interface ClickRow {
  id: string;
  landing_path: string | null;
  source_url: string | null;
  created_at: string;
}

export default function AffiliateDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  useSEO({
    title: "Affiliate Dashboard | Deleteist",
    description: "Track your referral clicks, conversions, and commission earnings.",
    canonical: "https://footprintfinder.co/affiliates/dashboard",
  });

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null);
  const [conversions, setConversions] = useState<ConversionRow[]>([]);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [recentClickCount, setRecentClickCount] = useState(0);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session?.user?.email) {
        navigate("/auth?redirect=/affiliates/dashboard");
        return;
      }

      const email = session.user.email.toLowerCase();
      setUserEmail(email);

      // Find affiliate record by email (matched on application email)
      const { data: aff, error: affErr } = await supabase
        .from("affiliates")
        .select("*")
        .ilike("email", email)
        .maybeSingle();

      if (affErr) {
        console.error("[AFFILIATE_DASHBOARD] lookup failed:", affErr);
      }

      setAffiliate(aff as AffiliateRow | null);

      if (aff) {
        // Conversions
        const { data: convData } = await supabase
          .from("affiliate_conversions")
          .select("id, conversion_type, amount_cents, commission_cents, status, created_at, paid_at")
          .eq("affiliate_id", aff.id)
          .order("created_at", { ascending: false })
          .limit(50);
        setConversions((convData as ConversionRow[]) ?? []);

        // Recent clicks (last 30)
        const { data: clickData, count } = await supabase
          .from("affiliate_clicks")
          .select("id, landing_path, source_url, created_at", { count: "exact" })
          .eq("affiliate_id", aff.id)
          .order("created_at", { ascending: false })
          .limit(30);
        setClicks((clickData as ClickRow[]) ?? []);
        setRecentClickCount(count ?? 0);
      }
    } catch (err) {
      console.error("[AFFILIATE_DASHBOARD] load error:", err);
      toast({
        title: "Failed to load dashboard",
        description: "Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    if (!affiliate) return;
    const link = `https://footprintfinder.co/?ref=${affiliate.code}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Copied!", description: "Your referral link is on the clipboard." });
  }

  function formatMoney(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not an affiliate yet
  if (!affiliate) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-16 w-full">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <h1 className="text-2xl font-semibold">Not an affiliate yet</h1>
              <p className="text-muted-foreground">
                We couldn't find an affiliate application matching{" "}
                <span className="font-medium">{userEmail}</span>.
              </p>
              <p className="text-sm text-muted-foreground">
                Apply to the program first — we approve most applications within 24 hours.
              </p>
              <Button onClick={() => navigate("/affiliates")} className="mt-4">
                Apply to the affiliate program
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Pending approval
  if (affiliate.status !== "approved") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-16 w-full">
          <Card>
            <CardContent className="p-8 text-center space-y-4">
              <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
              <h1 className="text-2xl font-semibold">Application under review</h1>
              <p className="text-muted-foreground">
                Hi {affiliate.full_name.split(" ")[0]}, your application is{" "}
                <Badge variant="secondary" className="ml-1">
                  {affiliate.status}
                </Badge>
                .
              </p>
              <p className="text-sm text-muted-foreground">
                We review applications within 24 hours. You'll receive an email at{" "}
                <span className="font-medium">{affiliate.email}</span> once approved.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Approved — show dashboard
  const referralLink = `https://footprintfinder.co/?ref=${affiliate.code}`;
  const conversionRate =
    affiliate.total_clicks > 0
      ? ((affiliate.total_conversions / affiliate.total_clicks) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Affiliate Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {affiliate.full_name.split(" ")[0]}. Earning{" "}
              <span className="font-medium text-foreground">
                {Math.round(affiliate.commission_rate * 100)}%
              </span>{" "}
              recurring commission.
            </p>
          </div>
          <Badge variant="outline" className="gap-1.5 self-start">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </Badge>
        </div>

        {/* Referral link */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your referral link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-sm" />
              <Button onClick={copyLink} variant="outline" size="icon" aria-label="Copy link">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link anywhere. Visitors who sign up within 90 days are attributed to you.
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<MousePointerClick className="w-4 h-4" />}
            label="Total clicks"
            value={affiliate.total_clicks.toLocaleString()}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Conversions"
            value={affiliate.total_conversions.toLocaleString()}
            sublabel={`${conversionRate}% rate`}
          />
          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Total earned"
            value={formatMoney(affiliate.total_earnings_cents)}
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Pending payout"
            value={formatMoney(
              conversions
                .filter((c) => c.status === "pending")
                .reduce((sum, c) => sum + c.commission_cents, 0)
            )}
          />
        </div>

        {/* Conversions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent conversions</CardTitle>
          </CardHeader>
          <CardContent>
            {conversions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversions yet. Share your link to start earning.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {conversions.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium capitalize">
                        {c.conversion_type.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()} ·{" "}
                        {formatMoney(c.amount_cents)} sale
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold">
                        +{formatMoney(c.commission_cents)}
                      </div>
                      <Badge
                        variant={c.status === "paid" ? "default" : "secondary"}
                        className="text-[10px] uppercase tracking-wide mt-0.5"
                      >
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent clicks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Recent clicks
              {recentClickCount > clicks.length && (
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  (showing latest {clicks.length} of {recentClickCount.toLocaleString()})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clicks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No clicks yet. Drop your link on Reddit, your blog, or a YouTube description to get
                started.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {clicks.map((click) => (
                  <div key={click.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm truncate">
                        Landed on{" "}
                        <span className="font-mono">{click.landing_path || "/"}</span>
                      </div>
                      {click.source_url && (
                        <a
                          href={click.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 truncate max-w-full"
                        >
                          from {new URL(click.source_url).hostname}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {new Date(click.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="p-6 space-y-3">
            <h3 className="font-semibold">Quick tips to earn more</h3>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
              <li>
                Write a comparison post: "Deleteist vs Incogni" — these rank fast on Google.
              </li>
              <li>
                Answer questions in r/privacy and r/PrivacyGuides (provide value first, link last).
              </li>
              <li>
                Target the keyword "remove personal info from internet" — high intent, lower
                competition.
              </li>
              <li>
                The /parents landing page converts well for senior-focused audiences ($39 one-time).
              </li>
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-semibold mt-2">{value}</div>
        {sublabel && <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>}
      </CardContent>
    </Card>
  );
}
