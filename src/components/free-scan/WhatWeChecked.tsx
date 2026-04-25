import { CheckCircle2, Database, Shield, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WhatWeCheckedProps {
  breachCount: number;
  breachError: string | null;
}

export function WhatWeChecked({ breachCount, breachError }: WhatWeCheckedProps) {
  const sources = [
    {
      icon: Database,
      name: "Have I Been Pwned",
      detail: "850+ verified breach databases",
      status: breachError ? "unavailable" : "checked",
      result: breachError ? "Temporarily unavailable" : `${breachCount} breach${breachCount === 1 ? "" : "es"} found`,
    },
    {
      icon: Mail,
      name: "Email exposure",
      detail: "Public mention scanning",
      status: "checked",
      result: "Email-only check complete (no inbox access)",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-1">What We Checked</h3>
        <p className="text-sm text-muted-foreground">
          Real, verifiable sources — no estimates or guesses.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {sources.map((source, index) => {
          const Icon = source.icon;
          const isAvailable = source.status === "checked";
          return (
            <Card key={index} className={isAvailable ? "border-primary/20" : "border-muted"}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-2 rounded-md ${isAvailable ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`w-4 h-4 ${isAvailable ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{source.name}</p>
                      {isAvailable && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{source.detail}</p>
                    <p className="text-xs font-medium mt-1.5">{source.result}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
              This check only looks at public breach data
            </p>
            <p className="text-amber-700 dark:text-amber-400/80">
              It cannot see your accounts, data broker listings, or what's in your inbox. 
              Sign up free to run a full scan.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
