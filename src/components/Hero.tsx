import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { supabase } from "@/integrations/supabase/client";
import { SampleScanResult } from "./home/SampleScanResult";

export const Hero = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    trackEvent("hero_cta_click");
    const trimmed = email.trim();
    import("@/lib/checkout").then((m) => m.persistGuestEmail(trimmed));
    navigate(`/free-scan?email=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="border-b border-border px-5 sm:px-8 pt-28 pb-16 lg:pt-36 lg:pb-24">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <div className="lg:col-span-6">
          <p className="section-label mb-6">Data broker + forgotten account cleanup</p>
          <h1 className="text-[2.6rem] sm:text-6xl lg:text-[4.25rem] leading-[0.98] text-foreground mb-6">
            See which sites are selling your address.{" "}
            <span className="text-muted-foreground">Then get them to delete it.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-8">
            People-search sites publish names, home addresses, phone numbers and relatives. We show you where
            you&apos;re listed, walk you through each removal, find old accounts tied to your email, and re-check every month.
          </p>

          <Button asChild className="h-14 rounded-none px-8 text-base bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link to="/protect" onClick={() => trackEvent("hero_cta_click")}>Check my name free →</Link>
          </Button>
          <p className="font-mono text-xs text-muted-foreground mt-3">
            Free · about a minute · name and city only, no inbox access
          </p>

          <form onSubmit={handleScan} className="mt-8 max-w-xl">
            <label htmlFor="hero-email" className="text-sm text-muted-foreground">Or check an email address for known breaches</label>
            <div className="mt-2 flex flex-col sm:flex-row border border-border bg-card">
              <Input
                id="hero-email"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="flex-1 h-12 text-base px-4 bg-transparent border-0 rounded-none shadow-none focus-visible:ring-0"
              />
              <Button type="submit" variant="ghost" className="h-12 rounded-none px-6">Check email</Button>
            </div>
          </form>
          {error && <p className="text-sm text-concern mt-2">{error}</p>}

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {!isLoggedIn && <Link to="/auth" className="underline underline-offset-4 hover:text-foreground">Sign in</Link>}
            <Link to="/enterprise" className="underline underline-offset-4 hover:text-foreground">For teams</Link>
            <a href="#what-we-read" className="underline underline-offset-4 hover:text-foreground">What we read (and don't)</a>
          </div>
        </div>

        <div className="lg:col-span-6">
          <SampleScanResult />
        </div>
      </div>
    </section>
  );
};
