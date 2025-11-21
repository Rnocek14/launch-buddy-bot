import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, RefreshCw, CheckCircle2, Lock, Unlock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectionHealth {
  id: string;
  email: string;
  provider: string;
  status: string;
  statusEmoji: string;
  isValid: boolean;
  issues: string[];
  recommendedAction: string;
  tokensEncrypted: boolean;
}

interface HealthSummary {
  total: number;
  healthy: number;
  needsRepair: number;
  needsEncryption: number;
  needsReconnect: number;
}

export function TokenHealthMonitor() {
  const [health, setHealth] = useState<{ connections: ConnectionHealth[]; summary: HealthSummary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const { toast } = useToast();

  const checkHealth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-token-health');
      
      if (error) throw error;
      
      setHealth(data);
      
      if (data.summary.healthy === data.summary.total) {
        toast({
          title: "All connections healthy",
          description: "All email tokens are properly encrypted and validated.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Health check failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    setFixing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-token-encryption-states');
      
      if (error) throw error;
      
      toast({
        title: "Migration complete",
        description: `${data.results.fixed} connections fixed, ${data.results.needsReconnect} need manual reconnection`,
      });
      
      // Refresh health status
      await checkHealth();
    } catch (error: any) {
      toast({
        title: "Migration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Checking token health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) return null;

  const getStatusVariant = (status: string) => {
    if (status.includes('✅')) return 'default';
    if (status.includes('⚠️')) return 'warning';
    if (status.includes('🔓')) return 'secondary';
    return 'destructive';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'decrypt_and_reencrypt':
        return <RefreshCw className="w-4 h-4" />;
      case 'encrypt':
        return <Lock className="w-4 h-4" />;
      case 'reconnect':
        return <Unlock className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Token Encryption Health Dashboard
              </CardTitle>
              <CardDescription>
                Monitor and repair OAuth token encryption states across all email connections
              </CardDescription>
            </div>
            <Button onClick={checkHealth} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{health.summary.total}</div>
              <div className="text-xs text-muted-foreground">Total Connections</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{health.summary.healthy}</div>
              <div className="text-xs text-muted-foreground">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{health.summary.needsRepair}</div>
              <div className="text-xs text-muted-foreground">Needs Repair</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{health.summary.needsEncryption}</div>
              <div className="text-xs text-muted-foreground">Needs Encryption</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{health.summary.needsReconnect}</div>
              <div className="text-xs text-muted-foreground">Needs Reconnect</div>
            </div>
          </div>

          {health.summary.healthy < health.summary.total && (
            <Alert className="mb-6 border-yellow-600 bg-yellow-50 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {health.summary.needsRepair + health.summary.needsEncryption} connections can be automatically repaired.
                  {health.summary.needsReconnect > 0 && ` ${health.summary.needsReconnect} require manual reconnection.`}
                </span>
                <Button
                  onClick={runMigration}
                  disabled={fixing}
                  className="ml-4"
                  variant="default"
                >
                  {fixing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Fixing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Fix All Issues
                    </>
                  )}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {health.connections.map((conn) => (
              <Alert
                key={conn.id}
                variant={conn.isValid ? "default" : "destructive"}
                className="border-l-4"
              >
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{conn.email}</span>
                        <Badge variant="outline" className="text-xs">
                          {conn.provider}
                        </Badge>
                        <Badge variant={getStatusVariant(conn.status) as any}>
                          {conn.statusEmoji} {conn.status}
                        </Badge>
                      </div>
                      {conn.issues.length > 0 && (
                        <ul className="text-sm text-muted-foreground ml-6 list-disc">
                          {conn.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!conn.isValid && (
                        <Badge variant="outline" className="gap-1">
                          {getActionIcon(conn.recommendedAction)}
                          {conn.recommendedAction.replace(/_/g, ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
