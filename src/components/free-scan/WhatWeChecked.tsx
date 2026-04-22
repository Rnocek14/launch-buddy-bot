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
      result: "Surface-level scan complete",
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

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Want a deeper scan?</p>
            <p>
              Connect Gmail or Outlook to find the actual accounts tied to your email — newsletters,
              shopping accounts, forgotten signups, and data brokers listing your information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
