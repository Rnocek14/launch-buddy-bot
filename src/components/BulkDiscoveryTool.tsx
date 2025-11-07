import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Loader2, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Clock,
  Database,
  AlertTriangle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BulkJob {
  id: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  total_services: number;
  processed_services: number;
  successful_discoveries: number;
  failed_discoveries: number;
  estimated_cost: number;
  actual_cost: number;
  created_at: string;
  started_at: string;
  completed_at: string;
  error_message: string;
}

interface CostEstimate {
  totalServices: number;
  estimatedCost: string;
  estimatedTimeMinutes: number;
}

export const BulkDiscoveryTool = () => {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [currentJob, setCurrentJob] = useState<BulkJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEstimate();
    fetchCurrentJob();
  }, []);

  useEffect(() => {
    if (currentJob?.status === 'running') {
      const interval = setInterval(() => {
        fetchCurrentJob();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    }
  }, [currentJob?.status]);

  const fetchEstimate = async () => {
    setEstimating(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-discover-contacts', {
        body: { action: 'estimate' }
      });

      if (error) throw error;
      setEstimate(data);
    } catch (error: any) {
      console.error('Error fetching estimate:', error);
      toast({
        title: "Failed to fetch estimate",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setEstimating(false);
    }
  };

  const fetchCurrentJob = async () => {
    try {
      const { data, error } = await supabase
        .from('bulk_discovery_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
      if (data) {
        // Cast status to the correct type
        setCurrentJob({
          ...data,
          status: data.status as BulkJob['status']
        });
      }
    } catch (error: any) {
      console.error('Error fetching current job:', error);
    }
  };

  const startBulkDiscovery = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('bulk-discover-contacts', {
        body: { action: 'start', batchSize: 5 }
      });

      if (error) throw error;

      setCurrentJob(data.job);
      toast({
        title: "Bulk discovery started",
        description: `Processing ${estimate?.totalServices} services in the background.`,
      });
    } catch (error: any) {
      console.error('Error starting bulk discovery:', error);
      toast({
        title: "Failed to start bulk discovery",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const pauseJob = async () => {
    if (!currentJob) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('bulk-discover-contacts', {
        body: { action: 'pause', jobId: currentJob.id }
      });

      if (error) throw error;

      setCurrentJob({ ...currentJob, status: 'paused' });
      toast({
        title: "Job paused",
        description: "You can resume it anytime.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to pause job",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resumeJob = async () => {
    if (!currentJob) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('bulk-discover-contacts', {
        body: { action: 'resume', jobId: currentJob.id }
      });

      if (error) throw error;

      setCurrentJob({ ...currentJob, status: 'running' });
      
      // Continue processing
      await supabase.functions.invoke('bulk-discover-contacts', {
        body: { action: 'process', jobId: currentJob.id, batchSize: 5 }
      });

      toast({
        title: "Job resumed",
        description: "Processing will continue in the background.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resume job",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { color: 'bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/30', label: 'Pending' },
      running: { color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30', label: 'Running' },
      paused: { color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border-yellow-500/30', label: 'Paused' },
      completed: { color: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30', label: 'Completed' },
      failed: { color: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30', label: 'Failed' },
    };

    const config = configs[status as keyof typeof configs] || configs.pending;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const progressPercentage = currentJob 
    ? Math.round((currentJob.processed_services / currentJob.total_services) * 100) 
    : 0;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Bulk Contact Discovery
            </CardTitle>
            <CardDescription className="mt-2">
              Automatically discover and validate contacts for all services in the catalog
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchEstimate();
              fetchCurrentJob();
            }}
            disabled={estimating}
          >
            <RefreshCw className={`w-4 h-4 ${estimating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Cost Estimate */}
        {estimate && !currentJob && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Database className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Services to Process</p>
                <p className="text-2xl font-bold">{estimate.totalServices}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <p className="text-2xl font-bold">${estimate.estimatedCost}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Estimated Time</p>
                <p className="text-2xl font-bold">{estimate.estimatedTimeMinutes}m</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Job Status */}
        {currentJob && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">Current Job</h3>
                {getStatusBadge(currentJob.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                Started {new Date(currentJob.started_at).toLocaleString()}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Progress: {currentJob.processed_services} / {currentJob.total_services} services
                </span>
                <span className="font-semibold">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">Successful</p>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {currentJob.successful_discoveries}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed</p>
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {currentJob.failed_discoveries}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Actual Cost</p>
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  ${currentJob.actual_cost?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Remaining</p>
                </div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {currentJob.total_services - currentJob.processed_services}
                </p>
              </div>
            </div>

            {currentJob.error_message && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{currentJob.error_message}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {!currentJob && estimate && (
            <Button
              onClick={startBulkDiscovery}
              disabled={loading || estimate.totalServices === 0}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Bulk Discovery
                </>
              )}
            </Button>
          )}

          {currentJob?.status === 'running' && (
            <Button
              onClick={pauseJob}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}

          {currentJob?.status === 'paused' && (
            <Button
              onClick={resumeJob}
              disabled={loading}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}

          {(currentJob?.status === 'completed' || currentJob?.status === 'failed') && (
            <Button
              onClick={() => {
                setCurrentJob(null);
                fetchEstimate();
              }}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start New Job
            </Button>
          )}
        </div>

        {estimate?.totalServices === 0 && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>
              All services in the catalog already have verified contacts!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};