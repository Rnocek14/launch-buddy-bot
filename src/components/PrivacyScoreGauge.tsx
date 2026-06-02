import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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

interface ScoreConfig {
  label: string;
  text: string;
  badgeBg: string;
  badgeBorder: string;
  from: string;
  to: string;
}

function getScoreConfig(score: number): ScoreConfig {
  if (score >= 750)
    return { label: "Excellent", text: "text-green-700 dark:text-green-400", badgeBg: "bg-green-50 dark:bg-green-500/10", badgeBorder: "border-green-100 dark:border-green-500/20", from: "#22c55e", to: "#16a34a" };
  if (score >= 650)
    return { label: "Good", text: "text-emerald-700 dark:text-emerald-400", badgeBg: "bg-emerald-50 dark:bg-emerald-500/10", badgeBorder: "border-emerald-100 dark:border-emerald-500/20", from: "#10b981", to: "#059669" };
  if (score >= 550)
    return { label: "Fair", text: "text-yellow-700 dark:text-yellow-400", badgeBg: "bg-yellow-50 dark:bg-yellow-500/10", badgeBorder: "border-yellow-100 dark:border-yellow-500/20", from: "#eab308", to: "#ca8a04" };
  if (score >= 450)
    return { label: "Poor", text: "text-orange-700 dark:text-orange-400", badgeBg: "bg-orange-50 dark:bg-orange-500/10", badgeBorder: "border-orange-100 dark:border-orange-500/20", from: "#f97316", to: "#ea580c" };
  return { label: "Critical", text: "text-red-700 dark:text-red-400", badgeBg: "bg-red-50 dark:bg-red-500/10", badgeBorder: "border-red-100 dark:border-red-500/20", from: "#ef4444", to: "#dc2626" };
}

export function PrivacyScoreGauge({ riskScore, riskLevel, serviceCount, onShare }: PrivacyScoreGaugeProps) {
  const privacyScore = useMemo(() => riskToPrivacyScore(riskScore), [riskScore]);
  const cfg = useMemo(() => getScoreConfig(privacyScore), [privacyScore]);

  // SVG arc math — 270° gauge opening at the bottom
  const radius = 80;
  const strokeWidth = 16;
  const cx = 100;
  const cy = 100;
  const startAngle = 135;
  const endAngle = 405; // 270° sweep
  const totalArc = endAngle - startAngle;

  const scorePercent = Math.max(0, Math.min(1, (privacyScore - 300) / 550));
  const sweepAngle = startAngle + totalArc * scorePercent;

  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  const bgArc = describeArc(startAngle, endAngle);
  const fgArc = describeArc(startAngle, Math.max(startAngle + 0.01, sweepAngle));
  const gradientId = `score-gradient-${cfg.label.toLowerCase()}`;

  return (
    <Card className="overflow-hidden rounded-3xl border-border/60 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border/50">
            <Shield className="w-5 h-5 text-foreground" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight">Privacy Score</h2>
        </div>
        {onShare && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="gap-2 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        )}
      </div>

      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col items-center">
          {/* Gauge */}
          <div className="relative w-[240px] h-[200px]">
            <svg viewBox="0 0 200 180" className="w-full h-full" style={{ overflow: "visible" }}>
              <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={cfg.from} />
                  <stop offset="100%" stopColor={cfg.to} />
                </linearGradient>
              </defs>
              {/* Background track */}
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
                stroke={`url(#${gradientId})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              {/* Range markers */}
              <text x="34" y="172" className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-widest" textAnchor="middle">
                300
              </text>
              <text x="166" y="172" className="fill-muted-foreground text-[10px] font-semibold uppercase tracking-widest" textAnchor="middle">
                850
              </text>
            </svg>

            {/* Center score */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pb-6">
              <span className="text-6xl font-bold tabular-nums tracking-tighter text-foreground">
                {privacyScore}
              </span>
              <div className={`mt-2 inline-flex items-center px-4 py-1.5 rounded-full border ${cfg.badgeBg} ${cfg.badgeBorder}`}>
                <span className={`text-xs font-bold uppercase tracking-widest ${cfg.text}`}>
                  {cfg.label}
                </span>
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-px bg-border/60 w-full max-w-md mt-8 rounded-2xl border border-border/60 overflow-hidden">
            <div className="bg-card p-5 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{serviceCount}</span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">
                Accounts
              </span>
            </div>
            <div className="bg-card p-5 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-5 h-5 ${cfg.text}`} />
                <span className={`text-2xl font-bold tracking-tight ${cfg.text}`}>{cfg.label}</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">
                Rating
              </span>
            </div>
          </div>

          {/* Tip footer */}
          <div className="mt-6 w-full flex items-center justify-center gap-3 py-4 px-6 bg-muted/50 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] shrink-0" />
            <p className="text-sm text-muted-foreground font-medium text-center">
              {privacyScore >= 650
                ? "Great job! Keep managing your accounts to stay safe."
                : "Delete unused accounts and opt out of data sales to improve your score."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
