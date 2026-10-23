import { AlertTriangle, CheckCircle2, Database, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ExposureSummaryProps {
  email: string;
  breachCount: number;
  breachError?: string | null;
}

/**
 * First contact with the product must represent observations, not invented
 * exposure counts. A failed HIBP request is UNKNOWN, never zero breaches.
 * Broker findings are shown separately only after an actual broker check.
 */
export function ExposureSummary({ email, breachCount, breachError }: ExposureSummaryProps) {
  const unavailable = Boolean(breachError);
  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardContent className="p-6 sm:p-9">
        <div className="flex items-start gap-4">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${unavailable ? "bg-amber-500/10" : breachCount > 0 ? "bg-destructive/10" : "bg-secondary"}`}>
            {unavailable
              ? <ShieldAlert className="h-5 w-5 text-amber-700 dark:text-amber-400" aria-hidden />
              : breachCount > 0
                ? <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden />
                : <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Email breach lookup</p>
            <h2 className="mt-2 text-2xl font-normal leading-tight text-foreground sm:text-3xl">
              {unavailable
                ? "We couldn't complete your breach check"
                : breachCount > 0
                  ? `${breachCount} known breach${breachCount === 1 ? "" : "es"} found`
                  : "No known breaches found in this check"}
            </h2>
            <p className="mt-3 break-words text-sm leading-relaxed text-muted-foreground">
              {unavailable
                ? "The breach database wasn't available. We don't know whether this email is in any known breaches yet, and no exposure count has been estimated."
                : breachCount > 0
                  ? "These results were returned by the breach database for the email you entered. See the dated findings below."
                  : "The lookup completed, but this email wasn't found in the checked breach records. That doesn't guarantee your information is private."}
            </p>
            <p className="mt-3 break-all text-xs text-muted-foreground">Checked email: {email}</p>
          </div>
        </div>
        <div className="mt-6 flex items-start gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
          <Database className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          This check does not examine your inbox, identify account signups, or look up people-search listings. Those are separate, optional steps.
        </div>
      </CardContent>
    </Card>
  );
}
