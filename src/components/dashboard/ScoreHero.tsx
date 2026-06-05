import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import type { HeroHeadline } from "@/lib/remediation";

interface ScoreHeroProps {
  headline: HeroHeadline;
  checkedCount: number;
  attentionCount: number;
  onCta: () => void;
}

export function ScoreHero({
  headline,
  checkedCount,
  attentionCount,
  onCta,
}: ScoreHeroProps) {
  const calm = !headline.hasWork;

  return (
    <Card
      className={
        calm
          ? "border-green-500/30 bg-green-500/5"
          : "border-primary/30 bg-primary/5"
      }
    >
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {calm ? (
            <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-primary" />
          )}
          <span>
            We checked {checkedCount} place{checkedCount === 1 ? "" : "s"}.{" "}
            {attentionCount > 0
              ? `${attentionCount} need${attentionCount === 1 ? "s" : ""} your attention.`
              : "Everything looks clean."}
          </span>
        </div>

        <div className="space-y-1">
          {!calm && (
            <p className="text-sm font-medium text-muted-foreground">
              Your biggest risk right now:
            </p>
          )}
          <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
            {headline.problem}
          </h2>
        </div>

        <Button
          size="lg"
          className="w-full sm:w-auto text-base h-12 px-6"
          onClick={onCta}
        >
          {headline.cta}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
