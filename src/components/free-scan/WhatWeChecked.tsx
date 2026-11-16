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
      detail: "Public breach database lookup",
      status: breachError ? "unavailable" : "checked",
      result: breachError ? "Temporarily unavailable" : `${breachCount} breach${breachCount === 1 ? "" : "es"} found`,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-1">What We Checked</h3>
        <p className="text-sm text-muted-foreground">
          This email-only check uses Have I Been Pwned. The separate name check below searches public people-search results.
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

      <Card className="bg-muted/30 border-border">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-4 h-4 text-concern mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">
              No inbox access in this check
            </p>
            <p className="text-muted-foreground">
              Your email alone cannot reveal all your accounts or broker listings.
              Connecting an inbox is a separate step that requires your permission.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
