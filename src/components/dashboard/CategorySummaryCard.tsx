import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export type CardTone = "alert" | "warn" | "calm";

interface CategorySummaryCardProps {
  icon: LucideIcon;
  /** Category name — answers "what is this?". */
  title: string;
  /** Actionable status line — answers "do I have a problem?". */
  status: string;
  /** Quiet secondary line — answers "how big is it?". */
  secondary?: string;
  tone: CardTone;
  defaultOpen?: boolean;
  children: ReactNode;
}

const TONE: Record<
  CardTone,
  { card: string; iconWrap: string; icon: string }
> = {
  alert: {
    card: "border-destructive/30 bg-destructive/5",
    iconWrap: "bg-destructive/10",
    icon: "text-destructive",
  },
  warn: {
    card: "border-amber-500/30 bg-amber-500/5",
    iconWrap: "bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-400",
  },
  calm: {
    card: "",
    iconWrap: "bg-muted",
    icon: "text-muted-foreground",
  },
};

export function CategorySummaryCard({
  icon: Icon,
  title,
  status,
  secondary,
  tone,
  defaultOpen = false,
  children,
}: CategorySummaryCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const t = TONE[tone];

  return (
    <Card className={t.card}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-start gap-4 p-4 sm:p-5 text-left">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${t.iconWrap}`}
            >
              <Icon className={`w-5 h-5 ${t.icon}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-sm sm:text-base font-medium text-foreground mt-0.5 leading-snug">
                {status}
              </p>
              {secondary && (
                <p className="text-xs text-muted-foreground mt-0.5">{secondary}</p>
              )}
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground shrink-0 mt-1 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 sm:px-5 pb-5 space-y-3">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
