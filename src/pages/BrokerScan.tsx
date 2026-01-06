import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ShieldAlert, ShieldCheck, Loader2, AlertCircle, ArrowLeft, RefreshCw, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BrokerResultCard } from "@/components/BrokerResultCard";
import { OptOutInstructions } from "@/components/OptOutInstructions";
import { Badge } from "@/components/ui/badge";

interface Broker {
  id: string;
  name: string;
  slug: string;
  website: string;
  opt_out_url: string;
  opt_out_difficulty: string;
  opt_out_time_estimate: string;
  instructions: string;
  requires_captcha: boolean;
  requires_phone: boolean;
  requires_id: boolean;
}

interface ScanResult {
  id: string;
  status: 'pending' | 'scanning' | 'found' | 'clean' | 'error' | 'opted_out';
  profile_url?: string;
  match_confidence?: number;
  scanned_at?: string;
  broker: Broker;
}

interface Scan {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_brokers: number;
  scanned_count: number;
  found_count: number;
  clean_count: number;
  error_count: number;
  started_at?: string;
  completed_at?: string;
}

export default function BrokerScan() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scan, setScan] = useState<Scan | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  const [optOutDialogOpen, setOptOutDialogOpen] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentTier, setCurrentTier] = useState<'free' | 'pro' | 'complete'>('free');

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  useEffect(() => {
    // Poll for updates while scan is running
    if (scan?.status === 'running' || scan?.status === 'pending') {
      const interval = setInterval(loadScanData, 5000);
      return () => clearInterval(interval);
    }
  }, [scan?.status]);

  const checkAuthAndLoad = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    // Check subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    const tier = subscription?.tier || 'free';
    setCurrentTier(tier as 'free' | 'pro' | 'complete');
    setIsComplete(tier === 'complete');
    
    if (tier === 'complete') {
      await loadScanData();
    }
    setLoading(false);
  };

  const loadScanData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase.functions.invoke('scan-brokers', {
      method: 'GET',
    });

    if (error) {
      console.error('Error loading scan data:', error);
      return;
    }

    if (data.scan) {
      setScan(data.scan);
    }
    if (data.results) {
      setResults(data.results);
    }
    if (data.brokers) {
      setBrokers(data.brokers);
    }
  };

  const startScan = async () => {
    setScanning(true);
    
    const { data, error } = await supabase.functions.invoke('scan-brokers', {
      method: 'POST',
      body: {},
    });

    if (error || data.error) {
      toast({
        variant: "destructive",
        title: "Scan failed",
        description: data?.error || error?.message || "Failed to start scan",
      });
      setScanning(false);
      return;
    }

    toast({
      title: "Scan started",
      description: "We're scanning data brokers for your information. This may take a few minutes.",
    });

    setScan(data.scan);
    setScanning(false);
  };

  const handleOptOut = (broker: Broker) => {
    setSelectedBroker(broker);
    setOptOutDialogOpen(true);
  };

  const handleMarkOptedOut = async (brokerId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase
      .from('broker_scan_results')
      .update({ 
        status: 'opted_out',
        opted_out_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)
      .eq('broker_id', brokerId);

    toast({
      title: "Marked as opted out",
      description: "We'll verify the removal in 30 days",
    });

    await loadScanData();
  };

  const progress = scan ? (scan.scanned_count / scan.total_brokers) * 100 : 0;
  const foundResults = results.filter(r => r.status === 'found');
  const cleanResults = results.filter(r => r.status === 'clean');
  const optedOutResults = results.filter(r => r.status === 'opted_out');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Data Broker Scan</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Discover which data brokers have your personal information exposed online, 
            then follow our step-by-step guides to remove it.
          </p>
        </div>

        {/* Complete Gate */}
        {!isComplete && (
          <Card className="mb-8 border-accent/50 bg-gradient-to-br from-card to-accent/5">
            <CardContent className="p-6 text-center">
              <Crown className="h-12 w-12 text-accent mx-auto mb-4" />
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">Complete Feature</h3>
                <Badge className="bg-accent text-accent-foreground">COMPLETE</Badge>
              </div>
              <p className="text-muted-foreground mb-4">
                Data broker scanning is available on the Complete plan. 
                Upgrade to find and remove your information from 20+ data broker sites.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/subscribe?tier=complete')}
                  className="bg-gradient-to-r from-accent to-primary"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Complete - $129/year
                </Button>
                {currentTier === 'pro' && (
                  <p className="text-xs text-muted-foreground">
                    You're on Pro. Add broker scanning for $50 more/year.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {isComplete && (
          <>
            {/* Scan Status Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>Scan Status</span>
                    <Badge className="bg-accent text-accent-foreground text-xs">COMPLETE</Badge>
                  </div>
                  {scan?.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={startScan}
                      disabled={scanning}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
                      Rescan
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  {!scan && "Start a scan to check 20+ data broker sites for your information"}
                  {scan?.status === 'pending' && "Your scan is queued and will begin shortly"}
                  {scan?.status === 'running' && `Scanning ${scan.scanned_count} of ${scan.total_brokers} brokers...`}
                  {scan?.status === 'completed' && `Scan completed on ${new Date(scan.completed_at!).toLocaleDateString()}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!scan && (
                  <Button onClick={startScan} disabled={scanning} className="w-full">
                    {scanning ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Starting Scan...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Start Data Broker Scan
                      </>
                    )}
                  </Button>
                )}

                {(scan?.status === 'pending' || scan?.status === 'running') && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      {scan.scanned_count} of {scan.total_brokers} brokers scanned
                    </p>
                  </div>
                )}

                {scan?.status === 'completed' && (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-destructive/10 rounded-lg">
                      <ShieldAlert className="h-6 w-6 text-destructive mx-auto mb-2" />
                      <p className="text-2xl font-bold text-destructive">{foundResults.length}</p>
                      <p className="text-sm text-muted-foreground">Exposed</p>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-lg">
                      <ShieldCheck className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{cleanResults.length}</p>
                      <p className="text-sm text-muted-foreground">Clean</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-lg">
                      <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{optedOutResults.length}</p>
                      <p className="text-sm text-muted-foreground">Opted Out</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                {foundResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                      Exposed on {foundResults.length} broker{foundResults.length !== 1 ? 's' : ''}
                    </h3>
                    {foundResults.map(result => (
                      <BrokerResultCard
                        key={result.id}
                        broker={result.broker}
                        status={result.status}
                        profileUrl={result.profile_url}
                        matchConfidence={result.match_confidence}
                        onOptOut={handleOptOut}
                      />
                    ))}
                  </div>
                )}

                {cleanResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                      Not found on {cleanResults.length} broker{cleanResults.length !== 1 ? 's' : ''}
                    </h3>
                    {cleanResults.map(result => (
                      <BrokerResultCard
                        key={result.id}
                        broker={result.broker}
                        status={result.status}
                        onOptOut={handleOptOut}
                      />
                    ))}
                  </div>
                )}

                {optedOutResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-600" />
                      Opted out of {optedOutResults.length} broker{optedOutResults.length !== 1 ? 's' : ''}
                    </h3>
                    {optedOutResults.map(result => (
                      <BrokerResultCard
                        key={result.id}
                        broker={result.broker}
                        status={result.status}
                        onOptOut={handleOptOut}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state for no scan */}
            {!scan && results.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No scan results yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start a scan to discover where your personal information is exposed online.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

      <Footer />

      <OptOutInstructions
        broker={selectedBroker}
        open={optOutDialogOpen}
        onOpenChange={setOptOutDialogOpen}
        onMarkOptedOut={handleMarkOptedOut}
      />
    </div>
  );
}
