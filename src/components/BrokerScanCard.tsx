import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ShieldAlert, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface BrokerScan {
  id: string;
  status: string;
  found_count: number;
  clean_count: number;
  scanned_count: number;
  total_brokers: number;
  completed_at?: string;
}

export function BrokerScanCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scan, setScan] = useState<BrokerScan | null>(null);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    // Check subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    setIsPro(subscription?.tier === 'pro');

    // Get latest scan
    const { data: scanData } = await supabase
      .from('broker_scans')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (scanData) {
      setScan(scanData);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="mb-6 border-primary/20">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // No scan yet - show CTA
  if (!scan) {
    return (
      <Card className="mb-6 border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Data Broker Scan</h3>
                {!isPro && (
                  <Badge variant="secondary" className="text-xs">PRO</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Discover which data brokers have your personal information exposed online. 
                We'll check 20+ sites and show you how to remove yourself.
              </p>
            </div>
            <Button onClick={() => navigate('/broker-scan')} className="shrink-0">
              {isPro ? 'Start Scan' : 'Learn More'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Scan in progress
  if (scan.status === 'pending' || scan.status === 'running') {
    const progress = scan.total_brokers > 0 
      ? (scan.scanned_count / scan.total_brokers) * 100 
      : 0;

    return (
      <Card className="mb-6 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 shrink-0">
              <Shield className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Data Broker Scan in Progress</h3>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  Scanning
                </Badge>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Checking {scan.scanned_count} of {scan.total_brokers} data brokers...
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/broker-scan')} className="shrink-0">
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Scan completed - show results summary
  const hasExposures = scan.found_count > 0;

  return (
    <Card className={`mb-6 ${hasExposures ? 'border-destructive/30 bg-destructive/5' : 'border-green-500/30 bg-green-500/5'}`}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className={`p-3 rounded-xl shrink-0 ${hasExposures ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
            {hasExposures ? (
              <ShieldAlert className="h-8 w-8 text-destructive" />
            ) : (
              <ShieldCheck className="h-8 w-8 text-green-600" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Data Broker Scan</h3>
              {hasExposures ? (
                <Badge variant="destructive" className="text-xs">
                  {scan.found_count} Exposed
                </Badge>
              ) : (
                <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                  All Clear
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasExposures 
                ? `Your information was found on ${scan.found_count} data broker${scan.found_count > 1 ? 's' : ''}. Take action to remove it.`
                : `Great news! We didn't find your information on any of the ${scan.clean_count} brokers we checked.`
              }
            </p>
            {scan.completed_at && (
              <p className="text-xs text-muted-foreground">
                Last scanned {new Date(scan.completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <Button 
            variant={hasExposures ? "default" : "outline"} 
            onClick={() => navigate('/broker-scan')} 
            className="shrink-0"
          >
            {hasExposures ? 'Remove My Data' : 'View Results'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
