import { useEffect, useRef } from "react";
import { Heart, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";

/**
 * Homepage hero band — emotional pull toward the $39 Parent Protection Scan.
 * Sits between the Hero and the rest of the landing page so it catches cold traffic
 * at the moment they're already thinking about exposure.
 */
export const ParentScanBand = () => {
  const ref = useRef<HTMLElement | null>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!ref.current || viewedRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            trackEvent("parent_scan_cta_view", { source: "homepage_band" });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    trackEvent("parent_scan_cta_click", { source: "homepage_band" });
  };

  return (
    <section ref={ref} className="relative px-6 sm:px-8 lg:px-12 py-12">
      <div className="container max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 via-background to-primary/10 p-6 sm:p-8">
          {/* Subtle accent glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            {/* Icon */}
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <Heart className="w-7 h-7 text-accent" />
            </div>

            {/* Copy */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/80 border border-border mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs font-medium text-foreground">For families</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 leading-tight">
                Check what scammers can already see about your parents
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
                Scammers target seniors first — their address, phone, and relatives are likely public on dozens of sites right now. One missed exposure can lead to thousands in fraud.
              </p>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0 flex flex-col items-center md:items-end gap-2">
              <Link to="/parents" onClick={handleClick}>
                <Button size="lg" className="gap-2 cta-shimmer">
                  Scan my parent's exposure
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground">$39 · one-time · no subscription</span>
              <span className="text-[11px] text-muted-foreground/80">No login required for your parent</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
