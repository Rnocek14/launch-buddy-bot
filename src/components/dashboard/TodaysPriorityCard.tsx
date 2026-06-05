import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target } from "lucide-react";
import type { HeroHeadline } from "@/lib/remediation";

interface TodaysPriorityCardProps {
  headline: HeroHeadline;
  onStart: () => void;
}

/**
 * Chooses the single highest-impact action for the user instead of asking
 * them to pick. Sits above the Needs Attention stack to prevent analysis
 * paralysis — one decision, already made.
 */
export function TodaysPriorityCard({ headline, onStart }: TodaysPriorityCardProps) {
  if (!headline.hasWork) return null;

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Target className="w-4 h-4" />
          Today's Priority
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
          {headline.priorityAction}
        </h2>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {headline.priorityImpact}
        </p>

        <Button
          size="lg"
          className="w-full sm:w-auto text-base h-12 px-6"
          onClick={onStart}
        >
          {headline.cta}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
