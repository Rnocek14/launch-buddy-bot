import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Heart,
  AlertTriangle,
  Shield,
  Search,
  CheckCircle2,
  Users,
  Lock,
  ArrowRight,
  FileText,
  Loader2,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PARENT_SCAN_FEATURES, STRIPE_PRICES } from "@/config/pricing";
import { useSEO } from "@/hooks/useSEO";

export default function Parents() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [parentEmail, setParentEmail] = useState("");
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const { toast } = useToast();

  useSEO({
    title: "Protect Parents from Online Scams — $39 Parent Scan",
    description:
      "Adult children: check your parent's email against public breach records, then search people-search listings by name. One-time $39, no recurring fee. Built for non-technical seniors.",
    canonical: "https://footprintfinder.co/parents",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Footprint Finder Parent Scan",
      description: "One-time exposure report and removal guidance for a parent. Not scam detection or automatic removal.",
      offers: {
        "@type": "Offer",
        price: "39",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    },
  });

  useEffect(() => {
    const status = searchParams.get("purchase");
    if (status === "success") {
      trackEvent("parent_scan_purchase_success", {});
      toast({
        title: "Payment received 🎉",
        description: "Check your inbox — we'll email instructions to start the parent scan.",
      });
    } else if (status === "cancelled") {
      trackEvent("parent_scan_purchase_cancelled", {});
    }
  }, [searchParams, toast]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentEmail.includes("@")) return;
    trackEvent("parents_scan_started", { email_domain: parentEmail.split("@")[1] });
    navigate(`/free-scan?email=${encodeURIComponent(parentEmail)}&src=parents`);
  };

  const handlePurchaseParentScan = async () => {
    setPurchaseLoading(true);
    try {
      trackEvent("parent_scan_checkout_started", {
        has_email: parentEmail.includes("@"),
      });
      const { getStoredAffiliateRef } = await import("@/lib/affiliateTracking");
      const ref = getStoredAffiliateRef();
      const body: Record<string, string> = {};
      if (parentEmail.includes("@")) body.parentEmail = parentEmail;
      if (ref?.code) body.affiliateCode = ref.code;
      const { data, error } = await supabase.functions.invoke(
        "create-parent-scan-payment",
        { body }
      );
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      console.error("Parent scan checkout error:", err);
      toast({
        title: "Checkout failed",
        description: err.message || "Please try again in a moment.",
        variant: "destructive",
      });
      setPurchaseLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24">
        {/* HERO */}
        <section className="px-4 py-16 md:py-24">
          <div className="container max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-concern/10 text-concern border-concern/20 hover:bg-concern/10">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Help protect a parent’s privacy
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  Your parents’ personal information{" "}
                  <span className="text-concern">deserves a closer look.</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Start with a free breach check. Then use their name and location to search for public listings. Unavailable checks are marked clearly; a matching listing is not proof of a scam.
                </p>

                <form onSubmit={handleScan} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      type="email"
                      aria-label="Parent's email address"
                      placeholder="Mom or Dad's email address"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="flex-1 h-12 text-base"
                    />
                    <Button type="submit" size="lg" className="h-12 gap-2 px-6">
                      <Search className="w-4 h-4" />
                      Check Their Exposure
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Lock className="w-3 h-3" />
                    Free breach check · No signup · No inbox access
                  </p>
                </form>

                {/* Social proof */}
                <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Built for adult children</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-concern" />
                    <span>Senior-friendly</span>
                  </div>
                </div>
              </div>

              {/* Visual scenario card */}
              <Card className="border-concern/20 bg-gradient-to-br from-concern/5 to-transparent">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-concern/10 flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-concern" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-1">Tuesday, 2:47 PM</p>
                      <p className="text-sm text-muted-foreground italic">
                        "Hi Margaret, this is Steve from Microsoft Support. We detected a virus
                        on your computer at 1247 Oak Street..."
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-concern mt-0.5 shrink-0" />
                      <p>
                        <span className="font-semibold">How they got her info:</span> Public listings can reveal names, addresses, and phone numbers. This is an illustrative scenario, not a real scan result.
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <p>
                        <span className="font-semibold">How we help:</span> Provide guided broker opt-outs. Complete adds monthly rechecks; removing listings does not prevent every scam.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS — for adult children */}
        <section className="px-4 py-16">
          <div className="container max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Protect them in 3 steps
              </h2>
              <p className="text-lg text-muted-foreground">
                You handle it. They never have to learn a new dashboard.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  step: "1",
                  title: "Enter their email",
                  desc: "The free email check looks for public breaches. A separate name and location check searches six people-search sites.",
                  icon: Search,
                },
                {
                  step: "2",
                  title: "Get a clear report",
                  desc: "Review matching public listings, possible matches, and any sites that could not be checked.",
                  icon: Shield,
                },
                {
                  step: "3",
                  title: "Follow simple steps",
                  desc: "The printable plan walks you through each opt-out in plain language. Want us to keep watching? Add monthly re-checks with Complete.",
                  icon: CheckCircle2,
                },
              ].map((item, i) => (
                <Card key={i} className="relative">
                  <CardContent className="p-6">
                    <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <item.icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PARENT PROTECTION SCAN — One-time SKU */}
        <section className="px-4 py-16">
          <div className="container max-w-3xl mx-auto">
            <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg">
              <CardContent className="p-8 md:p-10">
                <div className="text-center mb-6">
                  <Badge className="mb-3 bg-primary text-primary-foreground">
                    <FileText className="w-3 h-3 mr-1" />
                    One-time scan · No subscription
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold mb-3">
                    Parent Protection Scan
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    Pay once. Get a complete privacy report for your parent — including a printable PDF action plan.
                  </p>
                </div>

                <div className="text-center mb-8">
                  <div className="text-5xl font-bold mb-1">${STRIPE_PRICES.PARENT_SCAN_ONETIME.amount}</div>
                  <div className="text-sm text-muted-foreground">one-time payment · no recurring charges</div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-8">
                  {PARENT_SCAN_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handlePurchaseParentScan}
                  disabled={purchaseLoading}
                  size="lg"
                  className="w-full h-14 text-lg bg-gradient-to-r from-primary to-accent"
                >
                  {purchaseLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading checkout...
                    </>
                  ) : (
                    <>
                      Get Parent Scan — $39
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Secure checkout via Stripe · Refund if we can't complete the scan
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-4 py-20">
          <div className="container max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Don't wait for the scam call.
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Check your parent’s email against public breach records. No inbox connection required.
            </p>
            <form onSubmit={handleScan} className="max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  aria-label="Parent's email address"
                  placeholder="Mom or Dad's email address"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  className="flex-1 h-12 text-base"
                />
                <Button type="submit" size="lg" className="h-12 gap-2 px-6">
                  Check Now
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              Free · No signup required · Availability depends on the source
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
