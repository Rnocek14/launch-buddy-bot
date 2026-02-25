import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingUp, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrivacyScoreGaugeProps {
  /** Raw risk score 0-100 (higher = worse). We invert to 300-850 (higher = better). */
  riskScore: number;
  riskLevel: string;
  serviceCount: number;
  onShare?: () => void;
}

function riskToPrivacyScore(risk: number): number {
  // risk 0 (best) → 850, risk 100 (worst) → 300
  const clamped = Math.max(0, Math.min(100, risk));
  return Math.round(850 - (clamped / 100) * 550);
}

function getScoreLabel(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 750) return { label: "Excellent", color: "text-green-600 dark:text-green-400", bgColor: "bg-green-500" };
  if (score >= 650) return { label: "Good", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-500" };
  if (score >= 550) return { label: "Fair", color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-500" };
  if (score >= 450) return { label: "Poor", color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-500" };
  return { label: "Critical", color: "text-red-600 dark:text-red-400", bgColor: "bg-red-500" };
}

export function PrivacyScoreGauge({ riskScore, riskLevel, serviceCount, onShare }: PrivacyScoreGaugeProps) {
  const privacyScore = useMemo(() => riskToPrivacyScore(riskScore), [riskScore]);
  const scoreConfig = useMemo(() => getScoreLabel(privacyScore), [privacyScore]);

  // SVG arc math
  const radius = 80;
  const strokeWidth = 12;
  const cx = 100;
  const cy = 100;
  const startAngle = 135; // left side
  const endAngle = 405; // right side (270 degree arc)
  const totalArc = endAngle - startAngle;

  const scorePercent = (privacyScore - 300) / 550; // 0 to 1
  const sweepAngle = startAngle + totalArc * scorePercent;

  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const bgArc = describeArc(startAngle, endAngle);
  const fgArc = describeArc(startAngle, sweepAngle);

  // Color for the arc
  const arcColor = privacyScore >= 750
    ? "#22c55e"
    : privacyScore >= 650
    ? "#10b981"
    : privacyScore >= 550
    ? "#eab308"
    : privacyScore >= 450
    ? "#f97316"
    : "#ef4444";

  return (
    <Card className="overflow-hidden border-2 border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Privacy Score
          </CardTitle>
          {onShare && (
            <Button variant="ghost" size="sm" onClick={onShare} className="gap-1.5">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col items-center">
          {/* Gauge */}
          <div className="relative w-[200px] h-[140px]">
            <svg
              viewBox="0 0 200 160"
              className="w-full h-full"
              style={{ overflow: "visible" }}
            >
              {/* Background arc */}
              <path
                d={bgArc}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              {/* Score arc */}
              <path
                d={fgArc}
                fill="none"
                stroke={arcColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              {/* Score labels on arc */}
              <text x="30" y="155" className="fill-muted-foreground text-[10px]" textAnchor="middle">
                300
              </text>
              <text x="170" y="155" className="fill-muted-foreground text-[10px]" textAnchor="middle">
                850
              </text>
            </svg>
            {/* Center score */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
              <span className={`text-4xl font-bold tabular-nums ${scoreConfig.color}`}>
                {privacyScore}
              </span>
              <Badge
                variant="outline"
                className={`mt-1 ${scoreConfig.color} border-current text-xs`}
              >
                {scoreConfig.label}
              </Badge>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 mt-4 w-full">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{serviceCount}</div>
              <div className="text-xs text-muted-foreground">Accounts</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="flex items-center gap-1">
                <TrendingUp className={`w-4 h-4 ${scoreConfig.color}`} />
                <span className={`text-sm font-semibold ${scoreConfig.color}`}>
                  {scoreConfig.label}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
          </div>

          {/* Tip */}
          <p className="text-xs text-muted-foreground text-center mt-4 max-w-[250px]">
            {privacyScore >= 650
              ? "Great job! Keep managing your accounts to stay safe."
              : "Delete unused accounts and opt out of data sales to improve your score."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
