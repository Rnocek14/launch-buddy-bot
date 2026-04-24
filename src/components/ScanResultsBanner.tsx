import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Mail, AlertTriangle, Activity, Shield, ArrowRight, X, Sparkles } from "lucide-react";

interface ScanResultsBannerProps {
  scannedEmails: string[];
  totalServices: number;
  newServices: number;
  messagesScanned: number;
  onViewNew: () => void;
  onViewAll: () => void;
  onDismiss: () => void;
  /** Real breakdown from activity_status */
  paidCount?: number;
  activeCount?: number;
  newsletterCount?: number;
}

function AnimatedCounter({ target, className }: { target: number; className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }
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
  paidCount = 0,
  activeCount = 0,
  newsletterCount = 0,
}: ScanResultsBannerProps) => {
  // Every detected service is exposure — that's the honest headline.
  // The breakdown shows confidence tiers underneath.
  const totalActive = paidCount + activeCount;

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
              <AnimatedCounter target={totalServices} className="text-destructive" />
              {" "}{totalServices === 1 ? "account is" : "accounts are"} exposing your data
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
              Every one of these companies has your email — and likely more. We scanned{" "}
              <span className="font-medium text-foreground">{messagesScanned.toLocaleString()}</span>
              {" "}messages to find them.
            </p>
          </div>

          {/* Confidence breakdown cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center space-y-1">
              <CreditCard className="w-5 h-5 text-destructive mx-auto" />
              <p className="text-2xl sm:text-3xl font-bold text-destructive">
                <AnimatedCounter target={paidCount} />
              </p>
              <p className="text-xs text-muted-foreground font-medium">Paid / Billing</p>
              <p className="text-[10px] text-muted-foreground/70 hidden sm:block">Has your payment info — clean up first</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
              <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto" />
              <p className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
                <AnimatedCounter target={activeCount} />
              </p>
              <p className="text-xs text-muted-foreground font-medium">Active accounts</p>
              <p className="text-[10px] text-muted-foreground/70 hidden sm:block">Confirmed logins or security alerts</p>
            </div>
            <div className="p-4 rounded-xl bg-muted border border-border text-center space-y-1">
              <Mail className="w-5 h-5 text-muted-foreground mx-auto" />
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                <AnimatedCounter target={Math.max(0, totalServices - totalActive)} />
              </p>
              <p className="text-xs text-muted-foreground font-medium">Other detected</p>
              <p className="text-[10px] text-muted-foreground/70 hidden sm:block">Newsletters, dormant, or unclassified</p>
            </div>
          </div>

          {/* Why this matters */}
          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-semibold text-destructive">Why this matters:</span>{" "}
              Each exposed account is a door scammers and identity thieves can walk through. Old accounts often hold your address, phone number, and payment info — even if you forgot they existed.
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
              "We do not store your email content",
              "We scan limited metadata to identify accounts",
              "Your data is encrypted and never sold",
              "Disconnect access at any time",
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
