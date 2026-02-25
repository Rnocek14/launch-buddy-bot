import { Shield, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Breach {
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  dataClasses: string[];
  isVerified: boolean;
  severity: "critical" | "high" | "medium" | "low";
}

interface BreachResultsProps {
  breaches: Breach[];
  criticalCount: number;
  highCount: number;
  error?: string | null;
}

const severityConfig = {
  critical: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300", icon: AlertTriangle, label: "Critical" },
  high: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300", icon: AlertCircle, label: "High" },
  medium: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: AlertCircle, label: "Medium" },
  low: { color: "bg-muted text-muted-foreground", icon: Shield, label: "Low" },
};

export function BreachResults({ breaches, criticalCount, highCount, error }: BreachResultsProps) {
  if (error && breaches.length === 0) {
    return (
      <Card className="border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (breaches.length === 0) {
    return (
      <Card className="border-emerald-300/50 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-1">No Known Breaches Found</h3>
          <p className="text-sm text-muted-foreground">
            Your email wasn't found in any known data breaches. But breaches are only part of your footprint.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className={criticalCount > 0
        ? "border-red-300/50 bg-red-50/50 dark:bg-red-950/20 dark:border-red-700/30"
        : "border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700/30"
      }>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              criticalCount > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"
            }`}>
              <AlertTriangle className={`w-7 h-7 ${
                criticalCount > 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
              }`} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                {breaches.length} Data Breach{breaches.length !== 1 ? "es" : ""} Found
              </h3>
              <p className="text-sm text-muted-foreground">
                {criticalCount > 0 && <span className="text-red-600 dark:text-red-400 font-medium">{criticalCount} critical</span>}
                {criticalCount > 0 && highCount > 0 && " · "}
                {highCount > 0 && <span className="text-orange-600 dark:text-orange-400 font-medium">{highCount} high severity</span>}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breach List */}
      <div className="grid gap-3">
        {breaches.slice(0, 8).map((breach) => {
          const config = severityConfig[breach.severity];
          const Icon = config.icon;
          return (
            <Card key={breach.name} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{breach.title}</span>
                    <Badge variant="outline" className={`text-xs ${config.color}`}>
                      {config.label}
                    </Badge>
                    {breach.isVerified && (
                      <Badge variant="outline" className="text-xs">Verified</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Breached {breach.breachDate} · {breach.dataClasses.slice(0, 4).join(", ")}
                    {breach.dataClasses.length > 4 && ` +${breach.dataClasses.length - 4} more`}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {breaches.length > 8 && (
          <p className="text-sm text-muted-foreground text-center">
            + {breaches.length - 8} more breaches found
          </p>
        )}
      </div>
    </div>
  );
}
