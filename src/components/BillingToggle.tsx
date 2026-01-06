import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/config/pricing";

interface BillingToggleProps {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <button
        onClick={() => onChange("month")}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all",
          value === "month"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange("year")}
        className={cn(
          "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
          value === "year"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        Annual
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          value === "year" 
            ? "bg-primary-foreground/20 text-primary-foreground" 
            : "bg-accent/20 text-accent"
        )}>
          Save up to 49%
        </span>
      </button>
    </div>
  );
}
