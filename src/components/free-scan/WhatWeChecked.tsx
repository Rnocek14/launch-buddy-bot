import { CheckCircle2, Database, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WhatWeCheckedProps {
  breachCount: number;
  breachError: string | null;
}

export function WhatWeChecked({ breachCount, breachError }: WhatWeCheckedProps) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <h3 className="mb-4 text-lg font-normal">What this check actually did</h3>
        <div className="flex items-start gap-3">
          {breachError
            ? <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            : <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden />}
          <div>
            <p className="font-medium">Have I Been Pwned breach lookup</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {breachError
                ? "Unavailable at the time of this request. No conclusion about breaches can be drawn."
                : `Lookup completed: ${breachCount} known breach${breachCount === 1 ? "" : "es"} returned for this address.`}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-start gap-3 border-t border-border pt-5">
          <Database className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-sm leading-relaxed text-muted-foreground">
            This result does not include inbox analysis, an account inventory, people-search listings, or removal verification. The optional people-search form above is a separate lookup.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
