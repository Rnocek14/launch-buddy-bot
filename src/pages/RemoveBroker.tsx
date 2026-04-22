import { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ArrowRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Lock,
  Users,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { trackEvent } from "@/lib/analytics";

interface BrokerRecord {
  slug: string;
  name: string;
  website: string;
  opt_out_url: string | null;
  opt_out_difficulty: string | null;
  opt_out_time_estimate: string | null;
  requires_id: boolean | null;
  requires_phone: boolean | null;
  requires_captcha: boolean | null;
  instructions: string | null;
  priority: string;
}

const difficultyTone: Record<string, string> = {
  easy: "bg-accent/15 text-accent border-accent/30",
  medium: "bg-primary/10 text-primary border-primary/30",
  hard: "bg-destructive/15 text-destructive border-destructive/30",
};

/**
 * Programmatic SEO landing page: /remove-from/:slug
 * One page per data broker, powered by the live `data_brokers` table.
 * Designed to rank for "remove from <broker>" / "<broker> opt out".
 */
export default function RemoveBroker() {
  const { slug } = useParams<{ slug: string }>();
  const [broker, setBroker] = useState<BrokerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("data_brokers")
        .select(
          "slug,name,website,opt_out_url,opt_out_difficulty,opt_out_time_estimate,requires_id,requires_phone,requires_captcha,instructions,priority"
        )
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setBroker(data as BrokerRecord);
        trackEvent("seo_broker_page_view", { broker_slug: slug });
      }
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const steps = useMemo(() => {
    if (!broker?.instructions) return [] as string[];
    return broker.instructions
      .split(/\\n|\n/)
      .map((s) => s.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);
  }, [broker]);

  const seoTitle = broker
    ? `How to Remove Yourself from ${broker.name} (${new Date().getFullYear()} Guide)`
    : "Data Broker Removal Guide";
  const seoDescription = broker
    ? `Step-by-step guide to opt out of ${broker.name}. Takes ${broker.opt_out_time_estimate ?? "a few minutes"}. Or let Footprint Finder do it for you across 20+ brokers.`
    : "Remove your personal info from data brokers.";
  const canonical = broker
    ? `https://footprintfinder.co/remove-from/${broker.slug}`
    : undefined;

  const jsonLd = broker
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `Remove your information from ${broker.name}`,
        description: `Opt-out instructions for ${broker.name} data broker.`,
        totalTime: broker.opt_out_time_estimate ?? "PT10M",
        step: steps.map((text, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: `Step ${i + 1}`,
          text,
        })),
      }
    : undefined;

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonical,
    jsonLd,
  });

  if (notFound) return <Navigate to="/remove-from" replace />;

  if (loading || !broker) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="container max-w-4xl mx-auto">
            <div className="h-8 w-2/3 rounded bg-muted animate-pulse mb-4" />
            <div className="h-4 w-full rounded bg-muted animate-pulse mb-2" />
            <div className="h-4 w-5/6 rounded bg-muted animate-pulse mb-8" />
            <div className="h-64 w-full rounded bg-muted animate-pulse" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const difficulty = (broker.opt_out_difficulty ?? "medium").toLowerCase();
  const difficultyClass = difficultyTone[difficulty] ?? difficultyTone.medium;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/remove-from" className="hover:text-foreground">Remove From Brokers</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{broker.name}</span>
          </nav>

          {/* H1 + meta */}
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className={difficultyClass}>
                {difficulty} difficulty
              </Badge>
              {broker.opt_out_time_estimate && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {broker.opt_out_time_estimate}
                </Badge>
              )}
              {broker.requires_captcha && (
                <Badge variant="outline" className="text-muted-foreground">
                  CAPTCHA required
                </Badge>
              )}
              {broker.requires_id && (
                <Badge variant="outline" className="text-muted-foreground">
                  ID verification
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              How to Remove Yourself from {broker.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {broker.name} is a data broker that publishes personal information — name,
              address, phone number, relatives — gathered from public records and other
              sources. Here's exactly how to opt out, and how Footprint Finder can do it
              for you across {broker.name} and 20+ other brokers automatically.
            </p>
          </header>

          {/* Above-the-fold CTA — auto-removal upsell */}
          <Card className="mb-10 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Don't want to do this manually?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Footprint Finder removes you from {broker.name} <strong>and 20+ other brokers</strong> — automatically. Free scan, no credit card.
                  </p>
                </div>
                <Link
                  to="/free-scan"
                  onClick={() =>
                    trackEvent("seo_broker_cta_click", {
                      broker_slug: broker.slug,
                      placement: "above_fold",
                    })
                  }
                >
                  <Button size="lg" className="gap-2 cta-shimmer whitespace-nowrap">
                    Free exposure scan
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Manual steps */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">
              Manual {broker.name} opt-out (step-by-step)
            </h2>

            {steps.length > 0 ? (
              <ol className="space-y-3 mb-6">
                {steps.map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-card"
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                      {i + 1}
                    </div>
                    <p className="text-sm leading-relaxed pt-0.5">{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground mb-6">
                Visit the {broker.name} opt-out page below and follow the on-site
                instructions.
              </p>
            )}

            {broker.opt_out_url && (
              <a
                href={broker.opt_out_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  trackEvent("seo_broker_optout_link_click", {
                    broker_slug: broker.slug,
                  })
                }
              >
                <Button variant="outline" className="gap-2">
                  Open {broker.name} opt-out page
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            )}
          </section>

          {/* Watch-outs */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">What to watch out for</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-5">
                  <AlertTriangle className="w-5 h-5 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">They re-list you</h3>
                  <p className="text-sm text-muted-foreground">
                    Most brokers refresh their data every 30–90 days. Even if you opt out
                    today, your info often reappears within a few months.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <Users className="w-5 h-5 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">{broker.name} is one of many</h3>
                  <p className="text-sm text-muted-foreground">
                    There are 100+ broker sites. Removing yourself from one doesn't
                    remove you from the others.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <Lock className="w-5 h-5 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">Verification can be invasive</h3>
                  <p className="text-sm text-muted-foreground">
                    Some brokers ask for an ID scan to "verify" you before removing
                    your data — the same data they got without your consent.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <Clock className="w-5 h-5 text-primary mb-2" />
                  <h3 className="font-semibold mb-1">It takes time</h3>
                  <p className="text-sm text-muted-foreground">
                    Manually opting out of one broker takes ~10 minutes. Doing all 20+
                    can take a full afternoon — and you'll need to redo it quarterly.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Final CTA */}
          <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 via-background to-accent/5">
            <CardContent className="p-6 md:p-8 text-center">
              <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Save 4+ hours. Let us remove you from {broker.name} — and the rest.
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Footprint Finder scans 20+ data brokers, requests removal on your
                behalf, and re-checks every month. Free to start.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/free-scan"
                  onClick={() =>
                    trackEvent("seo_broker_cta_click", {
                      broker_slug: broker.slug,
                      placement: "footer",
                    })
                  }
                >
                  <Button size="lg" className="gap-2 cta-shimmer">
                    Run my free scan
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/parents">
                  <Button size="lg" variant="outline">
                    Scanning for a parent? $39
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                <span>No credit card · 60-second scan · 20+ brokers covered</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
