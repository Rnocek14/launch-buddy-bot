import { Shield, ArrowRight, CheckCircle, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface UpgradeCTAProps {
  hasBreaches: boolean;
}

export function UpgradeCTA({ hasBreaches }: UpgradeCTAProps) {
  return (
    <div className="space-y-6">
      {/* Tension / curiosity gap */}
      <Card className="border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-700/30">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {hasBreaches ? "Breaches are only the tip of the iceberg" : "This is only what's publicly visible"}
            </span>
          </div>
          <h3 className="text-xl font-bold mb-3">
            {hasBreaches
              ? "Your real footprint is much larger"
              : "Your inbox knows more than breach databases"}
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Breach databases show what was compromised — not the newsletters, free trials, old signups, or accounts you forgot about.
            A secure inbox scan finds the exact services holding your data.
          </p>
        </CardContent>
      </Card>

      {/* OAuth CTA */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Reveal Your Full Footprint</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Connect your inbox to discover exactly which services have your data — then delete what you don't need.
          </p>

          <Link to="/auth">
            <Button size="lg" className="gap-2 mb-6">
              <Shield className="w-5 h-5" />
              Run Secure Inbox Scan
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Read-only access", "Sender metadata only", "No email content stored", "Disconnect anytime"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Link to="/demo">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                View demo first
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
