import { useEffect, useState } from "react";
import { ArrowRight, Check, LockKeyhole, Mail, ShieldCheck, Search, FileText, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { persistGuestEmail } from "@/lib/checkout";

const examples = [
  { icon: Mail, name: "Connected services", description: "Find accounts through inbox metadata" },
  { icon: Search, name: "Exposure checks", description: "Review known breaches and broker results" },
  { icon: FileText, name: "Cleanup requests", description: "Send requests and follow up in one place" },
];

export const Hero = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setIsLoggedIn(!!session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (mounted) setIsLoggedIn(!!session);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const handleScan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const candidate = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)) {
      setError("Enter a valid email address to continue.");
      return;
    }
    setError("");
    persistGuestEmail(candidate);
    trackEvent("hero_cta_click");
    // Keep email addresses out of shareable URLs, browser history and referrers.
    navigate("/free-scan", { state: { scanEmail: candidate } });
  };

  return (
    <section className="relative overflow-hidden bg-background pt-32 pb-16 md:pt-40 md:pb-28 px-5 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 items-center">
        <div className="max-w-2xl">
          <p className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            A clearer way to take back your online privacy
          </p>
          <h1 className="max-w-[680px] text-[clamp(3rem,5.8vw,5.5rem)] leading-[1.04] tracking-[-0.045em] font-normal text-foreground">
            Your digital life, <span className="italic text-primary">back in your hands.</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Forgotten accounts. Old sign-ups. Data exposure. Find the places your information may be held, then take practical steps to clean it up.
          </p>

          <div className="mt-9 max-w-xl">
            <form onSubmit={handleScan} className="flex flex-col gap-3 sm:flex-row" aria-label="Free breach scan">
              <label htmlFor="hero-email" className="sr-only">Email address</label>
              <input
                id="hero-email"
                type="email"
                autoComplete="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                aria-invalid={!!error}
                aria-describedby={error ? "hero-error" : "hero-description"}
                className="min-h-14 w-full flex-1 rounded-xl border border-border bg-white/90 px-4 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10 dark:bg-card"
              />
              <button type="submit" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                Check my email <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </form>
            {error && <p id="hero-error" role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
            <p id="hero-description" className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <LockKeyhole className="h-4 w-4 shrink-0" aria-hidden />
              Free breach check. No account or inbox permission needed.
            </p>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" aria-hidden /> Start free</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" aria-hidden /> Understand your options</span>
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" aria-hidden /> You stay in control</span>
          </div>
          <p className="mt-7 text-sm text-muted-foreground">
            Want to discover forgotten accounts too? <Link to="/auth" className="font-semibold text-primary underline underline-offset-4 hover:text-accent">Connect your inbox after signing in.</Link>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[510px]" aria-label="Illustration of the privacy workspace">
          <div className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-secondary/70 blur-3xl" aria-hidden />
          <div className="relative overflow-hidden rounded-[1.8rem] border border-border bg-card p-5 shadow-[0_25px_70px_-40px_rgba(23,38,35,0.4)] sm:p-7">
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="h-5 w-5" aria-hidden /></span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Your privacy workspace</p>
                  <p className="text-xs text-muted-foreground">Find it. Review it. Take action.</p>
                </div>
              </div>
              <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground">Illustration</span>
            </div>
            <div className="py-7">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">An easier starting point</p>
              <h2 className="font-display text-3xl leading-tight text-foreground">Less guessing.<br />More clarity.</h2>
            </div>
            <div className="space-y-3">
              {examples.map(({ icon: Icon, name, description }) => (
                <div key={name} className="flex items-center gap-4 rounded-xl border border-border bg-background px-4 py-4">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><Icon className="h-5 w-5" aria-hidden /></div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-secondary/70 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              <Eye className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              We distinguish requests sent from removals confirmed. Results depend on the service and available evidence.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
