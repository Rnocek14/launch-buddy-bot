import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, AlertCircle, Trash2, ChevronRight, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BatchDeletionDialog } from "@/components/BatchDeletionDialog";
import { useAuthorization } from "@/hooks/useAuthorization";

interface Service {
  id: string;
  name: string;
  category: string;
  discovered_at: string;
  logo_url?: string;
}

interface CleanupTier {
  priority: 'high' | 'medium' | 'low';
  services: Service[];
  reasoning: string;
  risk_level: string;
}

interface CleanupAnalysis {
  summary: string;
  tiers: CleanupTier[];
}

export default function Cleanup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CleanupAnalysis | null>(null);
  const [selectedTier, setSelectedTier] = useState<CleanupTier | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const { isAuthorized } = useAuthorization();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setLoading(false);
    runAnalysis();
  }

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-cleanup-plan');

      if (error) throw error;

      setAnalysis(data);
      
      if (data.tiers && data.tiers.length > 0) {
        toast({
          title: "Analysis Complete",
          description: `Found ${data.tiers.length} cleanup tiers with actionable recommendations.`,
        });
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Could not analyze your accounts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  }

  function handleTierAction(tier: CleanupTier) {
    if (!isAuthorized) {
      toast({
        title: "Authorization Required",
        description: "Please complete the authorization wizard first.",
        variant: "destructive",
      });
      navigate("/alpha-access");
      return;
    }
    setSelectedTier(tier);
    setBatchDialogOpen(true);
  }

  function handleBatchComplete() {
    setBatchDialogOpen(false);
    setSelectedTier(null);
    // Refresh analysis
    runAnalysis();
  }

  const tierConfig = {
    high: {
      color: "destructive",
      bgColor: "bg-red-500/10 border-red-500/20",
      textColor: "text-red-600 dark:text-red-400",
      icon: "🔴"
    },
    medium: {
      color: "default",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      textColor: "text-amber-600 dark:text-amber-400",
      icon: "🟡"
    },
    low: {
      color: "secondary",
      bgColor: "bg-blue-500/10 border-blue-500/20",
      textColor: "text-blue-600 dark:text-blue-400",
      icon: "🔵"
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">AI Cleanup Wizard</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Intelligent recommendations for managing your digital footprint
          </p>
        </div>

        {analyzing && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <div>
                  <p className="font-medium">Analyzing your accounts...</p>
                  <p className="text-sm text-muted-foreground">
                    GPT-5 is evaluating your services for cleanup opportunities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!analyzing && analysis && (
          <>
            {/* Summary Card */}
            <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{analysis.summary}</p>
              </CardContent>
            </Card>

            {/* No tiers found */}
            {analysis.tiers.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No cleanup recommendations at this time. Your account list looks clean!
                </AlertDescription>
              </Alert>
            )}

            {/* Cleanup Tiers */}
            <div className="space-y-6">
              {analysis.tiers.map((tier, index) => {
                const config = tierConfig[tier.priority];
                return (
                  <Card key={index} className={`border-2 ${config.bgColor}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{config.icon}</span>
                            <span className="capitalize">{tier.priority} Priority</span>
                            <Badge variant={config.color as any}>
                              {tier.services.length} {tier.services.length === 1 ? 'service' : 'services'}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-base">
                            <span className={`font-medium ${config.textColor}`}>
                              {tier.risk_level} Risk
                            </span>
                            {' • '}
                            {tier.reasoning}
                          </CardDescription>
                        </div>
                        <Button
                          variant={tier.priority === 'high' ? 'destructive' : 'default'}
                          onClick={() => handleTierAction(tier)}
                          className="ml-4"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete All
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tier.services.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                          >
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={service.logo_url} alt={service.name} />
                              <AvatarFallback>{service.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{service.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{service.category}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Re-analyze Button */}
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={runAnalysis}
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Re-analyze
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Batch Deletion Dialog */}
      {selectedTier && (
        <BatchDeletionDialog
          open={batchDialogOpen}
          onOpenChange={setBatchDialogOpen}
          services={selectedTier.services.map(s => ({ id: s.id, name: s.name }))}
          onComplete={handleBatchComplete}
        />
      )}
    </div>
  );
}
