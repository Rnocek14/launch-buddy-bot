import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, AlertCircle, Info, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RiskScoreProps {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    totalAccounts: number;
    oldAccountsCount: number;
    sensitiveAccountsCount: number;
    unmatchedDomainsCount: number;
    avgAccountAge: number;
  };
  insights: string;
}

export function RiskScoreCard({ score, level, factors, insights }: RiskScoreProps) {
  const levelConfig = {
    low: {
      icon: Shield,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      label: "Low Risk",
      description: "Your digital footprint is well-managed",
    },
    medium: {
      icon: Info,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      label: "Medium Risk",
      description: "Some areas need attention",
    },
    high: {
      icon: AlertTriangle,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      label: "High Risk",
      description: "Your footprint needs cleanup",
    },
    critical: {
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      label: "Critical Risk",
      description: "Immediate action recommended",
    },
  };

  const config = levelConfig[level];
  const Icon = config.icon;

  // Parse insights into bullet points
  const insightsList = insights
    .split(/\d+\.\s+/)
    .filter(s => s.trim())
    .map(s => s.trim());

  return (
    <Card className={`overflow-hidden border-2 ${config.borderColor} ${config.bgColor}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl mb-1">
              <Icon className={`w-6 h-6 ${config.color}`} />
              Privacy Risk Score
            </CardTitle>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          <Badge variant="outline" className={`${config.color} ${config.bgColor} border-current`}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl font-bold ${config.color}`}>{score}</div>
                <div className="text-xs text-muted-foreground">/ 100</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total Accounts</span>
                <span className="font-semibold">{factors.totalAccounts}</span>
              </div>
              <Progress value={Math.min(100, (factors.totalAccounts / 50) * 100)} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Old Accounts (3+ years)</span>
                <span className="font-semibold">{factors.oldAccountsCount}</span>
              </div>
              <Progress 
                value={factors.totalAccounts > 0 ? (factors.oldAccountsCount / factors.totalAccounts) * 100 : 0} 
                className="h-2" 
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Sensitive Services</span>
                <span className="font-semibold">{factors.sensitiveAccountsCount}</span>
              </div>
              <Progress 
                value={Math.min(100, (factors.sensitiveAccountsCount / 10) * 100)} 
                className="h-2" 
              />
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm">AI Insights</h4>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            {insightsList.map((insight, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {factors.avgAccountAge.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Avg Account Age (years)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {factors.unmatchedDomainsCount}
            </div>
            <div className="text-xs text-muted-foreground">Unknown Services</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
