import { useEffect, useState, useCallback } from "react";
import { Shield, Lock, AlertTriangle, Search, Zap, Target } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { trackEvent } from "@/lib/analytics";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { HeroScanAnimation } from "./HeroScanAnimation";

export const Hero = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    trackEvent("hero_cta_click");
    navigate(`/free-scan?email=${encodeURIComponent(email.trim())}`);
  };

  const handleFaqToggle = useCallback((value: string) => {
    if (value) {
      trackEvent("hero_faq_opened", { question: value });
    }
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-28 lg:py-36 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary to-background opacity-50" />
      
      {/* Animated circles */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="container relative z-10 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 mb-8">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Your exposure changes every week</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-normal mb-6 leading-tight tracking-tight">
              <span className="text-foreground">Monitor your</span>
              <br />
              <span className="text-foreground">digital exposure.</span>
              <br />
              <span className="text-accent">
                Every month.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-4 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Your data leaks, gets resold, and reappears over time. We monitor your exposure — surfacing new breaches, broker listings, and forgotten accounts as they appear.
            </p>

            {/* Concrete example */}
            <div className="mb-6 max-w-lg mx-auto lg:mx-0 rounded-lg border border-border/60 bg-card/40 backdrop-blur px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground/70 mb-1">Here's what changed for one user last month</p>
              <p className="text-sm text-foreground/90">
                <span className="text-destructive font-medium">2 new breaches detected</span> · <span className="text-destructive font-medium">1 broker re-listed your data</span> · <span className="text-accent font-medium">3 cleanups completed</span>
              </p>
            </div>

            <p className="text-sm text-muted-foreground/70 mb-8 max-w-lg mx-auto lg:mx-0 italic">
              Start with a free scan. We'll keep watching after.
            </p>

            {/* Email scan form */}
            <form onSubmit={handleScan} className="max-w-lg mx-auto lg:mx-0 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="flex-1 h-14 text-lg px-5 bg-background border-border"
                />
                <Button type="submit" size="lg" className="relative overflow-hidden gap-2 h-14 text-lg px-8 bg-accent hover:bg-accent/90 text-accent-foreground whitespace-nowrap cta-shimmer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Search className="w-5 h-5" />
                  Check My Exposure
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive flex items-center gap-2 mt-3 justify-center lg:justify-start">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </form>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8 justify-center lg:justify-start">
              <Lock className="w-3 h-3" />
              <span>Email-only scan · No inbox access · No content stored</span>
            </div>

            <div className="flex flex-wrap gap-4 mb-6 justify-center lg:justify-start">
              {isLoggedIn ? (
                <Link to="/dashboard" className="text-sm text-primary hover:underline">
                  Go to Dashboard →
                </Link>
              ) : (
                <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary">
                  Already have an account? Sign in →
                </Link>
              )}
              <span className="text-muted-foreground hidden sm:inline">|</span>
              <Link to="/enterprise" className="text-sm text-muted-foreground hover:text-primary">
                Enterprise solutions →
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap gap-6 text-sm justify-center lg:justify-start">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">169+ Services Tracked</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">20 Data Brokers</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">GDPR / CCPA</span>
              </div>
            </div>
          </div>

          {/* Mobile-only trust cue (animation hidden on mobile) */}
          <div className="flex md:hidden justify-center">
            <p className="text-xs text-muted-foreground border border-border rounded-full px-4 py-2">
              ✓ Email-only · No inbox access · No content stored
            </p>
          </div>

          {/* Right: Animated scan preview (desktop only) */}
          <div className="hidden md:flex justify-center lg:justify-end">
            <HeroScanAnimation />
          </div>
        </div>

        {/* Mini FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full" onValueChange={handleFaqToggle}>
            <AccordionItem value="emails_read" className="border-border">
              <AccordionTrigger className="text-sm text-foreground hover:no-underline">
                Do you read my emails?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                <strong>Free scan:</strong> uses only your email address — <strong>no inbox access</strong>. <strong>Optional deeper discovery:</strong> uses <strong>read-only access</strong> to scan <strong>sender metadata</strong> (who emailed you), <strong>never email content</strong>.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="data_stored" className="border-border">
              <AccordionTrigger className="text-sm text-foreground hover:no-underline">
                What data do you store?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                We store the <strong>services discovered</strong> for your account so you can view them in your dashboard. We do <strong>not</strong> store email content or passwords.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="data_brokers" className="border-border">
              <AccordionTrigger className="text-sm text-foreground hover:no-underline">
                How is this different from data broker removal?
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Data broker removal focuses on people-search/data broker sites. We focus on <strong>account discovery</strong> first — finding services tied to your email — and then guiding cleanup.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};
