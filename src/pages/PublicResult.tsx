import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Globe, ArrowRight, CheckCircle2, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { trackEvent } from "@/lib/analytics";
import { toast } from "sonner";

interface PublicResultData {
  share_id: string;
  risk_score: number;
  risk_level: "low" | "medium" | "high";
  service_count: number;
  top_categories: string[];
  insights: string[];
  view_count: number;
}

export default function PublicResult() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<PublicResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (shareId) {
      fetchPublicResult(shareId);
      trackResultView(shareId);
    }
  }, [shareId]);

  const fetchPublicResult = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("public_results")
        .select("*")
        .eq("share_id", id)
        .single();

      if (error) {
        console.error("Error fetching result:", error);
        setNotFound(true);
        return;
      }

      if (data) {
        setResult({
          ...data,
          risk_level: data.risk_level as "low" | "medium" | "high",
          top_categories: data.top_categories as string[],
          insights: data.insights as string[],
        });
        // Increment view count
        await supabase
          .from("public_results")
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq("share_id", id);
      }
    } catch (error) {
      console.error("Error:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const trackResultView = async (id: string) => {
    await trackEvent("result_page_viewed", {
      share_id: id,
      referrer: document.referrer,
      source: new URLSearchParams(window.location.search).get("utm_source") || "direct",
    });
  };

  const handleScanYours = async () => {
    if (shareId) {
      await trackEvent("result_page_conversion", {
        share_id: shareId,
      });

      // Increment conversion count
      if (result) {
        await supabase
          .from("public_results")
          .update({ conversion_count: (result.view_count || 0) + 1 })
          .eq("share_id", shareId);
      }
    }

    navigate("/auth");
  };

  const getRiskColor = () => {
    if (!result) return "text-muted-foreground";
    if (result.risk_level === "low") return "text-green-600";
    if (result.risk_level === "medium") return "text-yellow-600";
    return "text-red-600";
  };

  const getRiskBgColor = () => {
    if (!result) return "bg-muted";
    if (result.risk_level === "low") return "bg-green-50 dark:bg-green-950/20";
    if (result.risk_level === "medium") return "bg-yellow-50 dark:bg-yellow-950/20";
    return "bg-red-50 dark:bg-red-950/20";
  };

  const getRiskIcon = () => {
    if (!result) return Shield;
    if (result.risk_level === "low") return CheckCircle2;
    return AlertTriangle;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading result...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !result) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Card className="max-w-md p-8 text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
            <h2 className="text-2xl font-bold">Result Not Found</h2>
            <p className="text-muted-foreground">
              This result link may have expired or doesn't exist.
            </p>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Homepage
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const RiskIcon = getRiskIcon();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Shared Digital Footprint Report
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground">
            Someone just discovered their digital footprint
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how many hidden accounts they found. Then check yours.
          </p>
        </div>

        {/* Main Risk Score Card */}
        <Card className={`mb-8 overflow-hidden ${getRiskBgColor()} border-2`}>
          <div className="p-12 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-background/50 backdrop-blur-sm mb-4">
              <RiskIcon className={`w-12 h-12 ${getRiskColor()}`} />
            </div>
            
            <div>
              <div className="text-muted-foreground text-lg mb-2">Digital Footprint Risk Score</div>
              <div className={`text-8xl font-bold ${getRiskColor()}`}>
                {result.risk_score}
              </div>
              <div className={`text-2xl font-semibold ${getRiskColor()} capitalize mt-4`}>
                {result.risk_level} Risk Level
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="bg-background/70 backdrop-blur-sm rounded-xl p-6">
                <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">{result.service_count}</div>
                <div className="text-sm text-muted-foreground">Services Found</div>
              </div>
              
              <div className="bg-background/70 backdrop-blur-sm rounded-xl p-6">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">{result.top_categories.length}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              
              <div className="bg-background/70 backdrop-blur-sm rounded-xl p-6">
                <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-foreground">{result.view_count || 0}</div>
                <div className="text-sm text-muted-foreground">People Viewed</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Categories */}
        {result.top_categories.length > 0 && (
          <Card className="mb-8 p-8">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Top Service Categories</h3>
            <div className="flex flex-wrap gap-2">
              {result.top_categories.map((category, i) => (
                <Badge key={i} variant="secondary" className="text-base px-4 py-2">
                  {category}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
          <div className="p-12 text-center space-y-6 relative">
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 space-y-6">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                  What's hiding in YOUR email?
                </h2>
                <p className="text-xl text-primary-foreground/90 max-w-xl mx-auto">
                  Most people find 50-200 hidden accounts they forgot about. 
                  Scan your inbox and see your digital footprint in 2 minutes.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={handleScanYours}
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-6 h-auto group"
                >
                  Get Your Footprint Report
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-primary-foreground/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  100% Free
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  2-Minute Scan
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  No Credit Card
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Social Proof */}
        <div className="text-center mt-12 space-y-4">
          <div className="text-sm text-muted-foreground">
            Join 10,000+ people taking control of their digital footprint
          </div>
          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            <div>✓ GDPR Compliant</div>
            <div>✓ Encrypted Data</div>
            <div>✓ Privacy First</div>
          </div>
        </div>
      </main>
    </div>
  );
}
