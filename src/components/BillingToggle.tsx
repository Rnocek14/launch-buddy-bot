import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/config/pricing";

interface BillingToggleProps {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
      <div className="flex items-center gap-2">
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
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            value === "year"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          Annual
        </button>
      </div>
      {value === "year" && (
        <span className="text-xs px-2 py-1 rounded-full bg-accent/15 text-accent font-medium whitespace-nowrap">
          Save up to 49%
        </span>
      )}
    </div>
  );
}
