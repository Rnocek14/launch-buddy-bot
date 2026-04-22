import { useEffect, useRef } from "react";
import { Heart, ArrowRight, Phone, Home, Users, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

interface ParentScanUpsellProps {
  /** Total exposure count we just showed the user — used to anchor the "your parents have more" message */
  exposureCount?: number;
}

/**
 * Post-scan upsell card for the $39 Parent Protection Scan.
 * Shown right after the user sees their own exposure — the highest-intent moment.
 */
export const ParentScanUpsell = ({ exposureCount }: ParentScanUpsellProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!ref.current || viewedRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            trackEvent("parent_scan_cta_view", {
              source: "free_scan_results",
              exposure_count: exposureCount ?? 0,
            });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [exposureCount]);

  const handleClick = () => {
    trackEvent("parent_scan_cta_click", {
      source: "free_scan_results",
      exposure_count: exposureCount ?? 0,
    });
  };

  return (
    <Card ref={ref} className="border-accent/30 bg-gradient-to-br from-accent/5 via-background to-primary/5 overflow-hidden">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-start gap-4 mb-5">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
            <Heart className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-2">
              <span className="text-xs font-medium text-accent">Now think about your parents</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
              {exposureCount && exposureCount > 0
                ? `You have ${exposureCount} exposures. Your parents are typically 2–3× more exposed — and far more targeted.`
                : "Your parents are typically 2–3× more exposed — and far more targeted."}
            </h3>
          </div>
        </div>

        <p className="text-muted-foreground mb-6 leading-relaxed">
          Scammers target seniors first. Robocalls, fake Medicare offers, romance scams, fake IRS calls — they all start with one thing: <span className="font-semibold text-foreground">your parents' personal info being public</span>.
        </p>

        {/* What gets scanned */}
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border">
            <Home className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold">Home address</div>
              <div className="text-xs text-muted-foreground">Public on broker sites</div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border">
            <Phone className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold">Phone number</div>
              <div className="text-xs text-muted-foreground">Used for robocalls & scams</div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-background/50 border border-border">
            <Users className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold">Relatives & age</div>
              <div className="text-xs text-muted-foreground">Used for impersonation</div>
            </div>
          </div>
        </div>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to="/parents" onClick={handleClick} className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 cta-shimmer">
              Scan my parent's exposure
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <div className="text-center sm:text-left">
            <div className="text-sm">
              <span className="text-2xl font-bold text-foreground">$39</span>
              <span className="text-muted-foreground"> · one-time</span>
            </div>
            <div className="text-xs text-muted-foreground">No subscription · Full report in minutes</div>
            <div className="text-[11px] text-muted-foreground/80 mt-0.5">One missed exposure can lead to thousands in fraud.</div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-5 pt-4 border-t border-border flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-accent" />
            <span>Based on real data broker scans</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-accent" />
            <span>No login required for your parent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-accent" />
            <span>Trusted by privacy-conscious families</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
