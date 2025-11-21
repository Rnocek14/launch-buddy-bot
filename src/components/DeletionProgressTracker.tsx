import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface DeletionProgressTrackerProps {
  services: Array<{
    id: string;
    deletion_requested_at?: string | null;
    deletion_status?: string | null;
  }>;
}

export function DeletionProgressTracker({ services }: DeletionProgressTrackerProps) {
  const stats = useMemo(() => {
    const total = services.length;
    const deleted = services.filter(s => s.deletion_requested_at || s.deletion_status).length;
    const percentage = total > 0 ? Math.round((deleted / total) * 100) : 0;
    
    // Estimate time savings: 5 minutes per account for password reset, data download, etc.
    const timeSavedMinutes = deleted * 5;
    const timeSavedHours = Math.floor(timeSavedMinutes / 60);
    const remainingMinutes = timeSavedMinutes % 60;
    
    return {
      total,
      deleted,
      percentage,
      timeSavedMinutes,
      timeSavedHours,
      remainingMinutes,
    };
  }, [services]);

  if (stats.total === 0) {
    return null;
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-yellow-500";
    return "bg-muted-foreground";
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Deletion Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress stats */}
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">
              {stats.deleted}/{stats.total}
            </p>
            <p className="text-sm text-muted-foreground">accounts deleted</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{stats.percentage}%</p>
            <p className="text-sm text-muted-foreground">complete</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={stats.percentage} className="h-3" />
          <p className="text-xs text-muted-foreground text-center">
            {stats.total - stats.deleted} accounts remaining
          </p>
        </div>

        {/* Time savings estimate */}
        {stats.deleted > 0 && (
          <div className="flex items-center gap-4 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 flex-1">
              <Clock className="h-4 w-4 text-accent" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {stats.timeSavedHours > 0
                    ? `${stats.timeSavedHours}h ${stats.remainingMinutes}m saved`
                    : `${stats.timeSavedMinutes}m saved`}
                </p>
                <p className="text-xs text-muted-foreground">
                  Estimated time you've reclaimed
                </p>
              </div>
            </div>
            
            <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        )}

        {/* Encouragement message */}
        {stats.percentage > 0 && stats.percentage < 100 && (
          <p className="text-sm text-center text-muted-foreground pt-2 border-t border-border/50">
            {stats.percentage < 25 && "Great start! Keep going to secure your digital footprint."}
            {stats.percentage >= 25 && stats.percentage < 50 && "You're making excellent progress!"}
            {stats.percentage >= 50 && stats.percentage < 75 && "Over halfway there! Your privacy is improving."}
            {stats.percentage >= 75 && "Almost done! You're a privacy champion!"}
          </p>
        )}

        {stats.percentage === 100 && (
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-green-700 dark:text-green-400">
              All accounts deleted! Your digital footprint is clean.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
