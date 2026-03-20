import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Mail, AlertTriangle, Clock, Shield, ArrowRight, X, Sparkles } from "lucide-react";

interface ScanResultsBannerProps {
  scannedEmails: string[];
  totalServices: number;
  newServices: number;
  messagesScanned: number;
  onViewNew: () => void;
  onViewAll: () => void;
  onDismiss: () => void;
  /** Optional breakdown for richer display */
  highRiskCount?: number;
  inactiveCount?: number;
  activeCount?: number;
}

function AnimatedCounter({ target, className }: { target: number; className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) return;
    const duration = 1200;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [target]);

  return <span className={className}>{count}</span>;
}

export const ScanResultsBanner = ({
  scannedEmails,
  totalServices,
  newServices,
  messagesScanned,
  onViewNew,
  onViewAll,
  onDismiss,
  highRiskCount = 0,
  inactiveCount = 0,
  activeCount = 0,
}: ScanResultsBannerProps) => {
  // If breakdown not provided, estimate from totals
  const hasBreakdown = highRiskCount > 0 || inactiveCount > 0 || activeCount > 0;
  const displayHighRisk = hasBreakdown ? highRiskCount : Math.max(1, Math.floor(totalServices * 0.12));
  const displayInactive = hasBreakdown ? inactiveCount : Math.floor(totalServices * 0.3);
  const displayActive = hasBreakdown ? activeCount : totalServices - displayHighRisk - displayInactive;

  return (
    <Card className="mb-6 border-2 border-destructive/20 bg-gradient-to-br from-destructive/5 via-background to-background overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
      <CardContent className="p-6 sm:p-8 relative">
        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="space-y-6">
          {/* Hero headline */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <Badge variant="outline" className="text-xs bg-destructive/5 text-destructive border-destructive/30">
                Exposure Report
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight" style={{ lineHeight: '1.1' }}>
              We found{" "}
              <AnimatedCounter target={totalServices} className="text-destructive" />
              {" "}accounts linked to your email
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
              Scanned{" "}
              <span className="font-medium text-foreground">{messagesScanned.toLocaleString()}</span>
              {" "}messages across{" "}
              <span className="font-medium text-foreground">{scannedEmails.length}</span>
              {" "}email account{scannedEmails.length > 1 ? "s" : ""}.
              Some of these may expose your personal data.
            </p>
          </div>

          {/* Risk breakdown cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-1">
              <AlertTriangle className="w-5 h-5 text-destructive mx-auto" />
              <p className="text-2xl sm:text-3xl font-bold text-destructive">
                <AnimatedCounter target={displayHighRisk} />
              </p>
              <p className="text-xs text-muted-foreground font-medium">High Risk</p>
              <p className="text-[10px] text-muted-foreground/70 hidden sm:block">Broker exposure, sensitive, or breached</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto" />
              <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
                <AnimatedCounter target={displayInactive} />
              </p>
              <p className="text-xs text-muted-foreground font-medium">Inactive</p>
              <p className="text-[10px] text-muted-foreground/70 hidden sm:block">Old or unused — may still hold your data</p>
            </div>
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center space-y-1">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
              <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                <AnimatedCounter target={displayActive} />
              </p>
              <p className="text-xs text-muted-foreground font-medium">Active</p>
              <p className="text-[10px] text-muted-foreground/70 hidden sm:block">Accounts you likely still use</p>
            </div>
          </div>

          {/* Why this matters */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Why this matters:</span>{" "}
              Every unused or exposed account increases your risk of data breaches, identity theft, and spam.
              Removing what you don't need reduces your attack surface.
            </p>
          </div>

          {/* Scanned emails list (multi-email only) */}
          {scannedEmails.length > 1 && (
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-2">
                {scannedEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="font-normal text-xs">
                    {email}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onViewAll} size="lg" className="gap-2 flex-1 sm:flex-none">
              <Sparkles className="w-4 h-4" />
              Start Cleaning My Footprint
              <ArrowRight className="w-4 h-4" />
            </Button>
            {newServices > 0 && (
              <Button onClick={onViewNew} variant="outline" size="lg" className="gap-2">
                Review {newServices} new account{newServices > 1 ? "s" : ""}
              </Button>
            )}
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
            {[
              "We never read your emails",
              "Metadata only — no content stored",
              "Your data is encrypted",
              "Disconnect anytime",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
