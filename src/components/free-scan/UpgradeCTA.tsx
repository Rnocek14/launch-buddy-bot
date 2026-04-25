import { Shield, ArrowRight, CheckCircle, AlertTriangle, Home, Database, Bell } from "lucide-react";
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
            Breach databases show what was compromised — not the data brokers publishing your home address right now, the newsletters tracking you, or the old accounts you forgot about.
          </p>
        </CardContent>
      </Card>

      {/* Upgrade CTA with price + benefits */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Get the full picture — and clean it up</h3>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            We scan 200+ data broker sites, find every account tied to your email, and help you remove your data from each one.
          </p>

          {/* Concrete benefits — what you actually get */}
          <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-6 text-left">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border">
              <Home className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold">Find every broker</div>
                <div className="text-xs text-muted-foreground">200+ sites publishing your data</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border">
              <Database className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold">Discover all accounts</div>
                <div className="text-xs text-muted-foreground">Even ones you forgot about</div>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border">
              <Bell className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold">Real-time alerts</div>
                <div className="text-xs text-muted-foreground">When new exposures appear</div>
              </div>
            </div>
          </div>

          {/* Price anchor */}
          <div className="mb-6">
            <div className="inline-flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">$79</span>
              <span className="text-muted-foreground">/year</span>
              <span className="text-sm text-muted-foreground">· just $6.58/month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">No hidden fees · Cancel anytime · 30-day money-back guarantee</p>
          </div>

          <Link to="/subscribe?tier=pro&interval=year&autostart=1">
            <Button size="lg" className="gap-2 mb-4 cta-shimmer">
              <Shield className="w-5 h-5" />
              Start Protecting My Data
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground mb-4">
            {["Read-only access", "No email content stored", "Disconnect anytime"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 text-xs">
            <Link to="/auth?intent=signup" className="text-muted-foreground hover:text-foreground underline">
              Or start free
            </Link>
            <span className="text-muted-foreground">·</span>
            <Link to="/demo" className="text-muted-foreground hover:text-foreground underline">
              View demo first
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
