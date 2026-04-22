import { useParams, Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { trackEvent } from "@/lib/analytics";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Shield,
  Mail,
  Search,
  AlertTriangle,
} from "lucide-react";
import { useEffect } from "react";

interface CompetitorData {
  slug: string;
  name: string;
  tagline: string;
  monthlyPrice: string;
  annualPrice: string;
  pros: string[];
  cons: string[];
  whyFf: string[];
  bestFor: string;
}

const COMPETITORS: Record<string, CompetitorData> = {
  deleteme: {
    slug: "deleteme",
    name: "DeleteMe",
    tagline: "The original people-search removal service",
    monthlyPrice: "$10.75/mo (annual)",
    annualPrice: "$129/yr",
    pros: [
      "Established brand (since 2010)",
      "Manual human reviewers",
      "Removes from ~30 broker sites",
    ],
    cons: [
      "Doesn't scan your inbox for forgotten accounts",
      "No breach monitoring built in",
      "Only covers data brokers — misses 90% of your footprint",
      "Manual reports take time to generate",
    ],
    whyFf: [
      "Scans your Gmail/Outlook inbox to find every account tied to your email",
      "Includes HaveIBeenPwned breach check + monthly rescans",
      "Covers data brokers AND mailing lists AND old accounts",
      "$79/yr vs DeleteMe's $129 — and broader coverage",
    ],
    bestFor:
      "DeleteMe is best if you only care about US people-search sites. Footprint Finder is best if you want to clean up your entire digital footprint — accounts, breaches, and brokers.",
  },
  incogni: {
    slug: "incogni",
    name: "Incogni",
    tagline: "Surfshark's data-broker removal service",
    monthlyPrice: "$15.49/mo",
    annualPrice: "$95.40/yr",
    pros: [
      "Backed by Surfshark (trusted VPN brand)",
      "Removes from 180+ broker sites",
      "Automated, hands-off",
    ],
    cons: [
      "No inbox scan — can't find your forgotten accounts",
      "No breach alerts",
      "Doesn't help you delete old subscriptions or services",
      "Limited transparency on what was actually removed",
    ],
    whyFf: [
      "Inbox scan reveals where you actually have accounts (Incogni can't see this)",
      "Breach monitoring + per-scan alerts when new exposures appear",
      "Cheaper at $79/yr with broader coverage (brokers + accounts + breaches)",
      "Bring-your-own-data — we don't share your info with third parties",
    ],
    bestFor:
      "Incogni is great if you only want broker removal on autopilot. Footprint Finder is the right choice if you want to see and clean up your full digital exposure, not just broker listings.",
  },
  optery: {
    slug: "optery",
    name: "Optery",
    tagline: "Data-broker removal with a free exposure report",
    monthlyPrice: "$3.99–$24.99/mo",
    annualPrice: "$39–$249/yr",
    pros: [
      "Free exposure report shows where you appear",
      "Multiple tier options",
      "Strong broker coverage at higher tiers",
    ],
    cons: [
      "Cheapest tier only covers ~25 brokers",
      "Doesn't scan your inbox",
      "No built-in breach monitoring",
      "Pricing gets expensive fast for full coverage",
    ],
    whyFf: [
      "Single $79/yr plan = full coverage, no upsells",
      "Inbox-driven discovery finds what Optery can't see",
      "Unified view of accounts + brokers + breaches in one dashboard",
      "Per-scan email alerts the moment something new shows up",
    ],
    bestFor:
      "Optery's free report is useful for a quick check. For ongoing protection across brokers AND your accounts AND breaches, Footprint Finder is more complete and cheaper than Optery's mid-tier plans.",
  },
  kanary: {
    slug: "kanary",
    name: "Kanary",
    tagline: "Reputation-focused removal service",
    monthlyPrice: "$14.99/mo",
    annualPrice: "$179.88/yr",
    pros: [
      "Removes from ~75 broker sites",
      "Includes reputation/Google search scanning",
      "Court-record removal at higher tiers",
    ],
    cons: [
      "Expensive vs alternatives ($179/yr base)",
      "No email inbox scan",
      "No breach database integration",
      "Reputation features overlap with what's free in Google",
    ],
    whyFf: [
      "Less than half the price ($79 vs $179)",
      "Inbox scan finds the accounts Kanary doesn't know exist",
      "Breach monitoring through HaveIBeenPwned partnership",
      "Real-time alerts when new exposures appear",
    ],
    bestFor:
      "Kanary is built for reputation cleanup. Footprint Finder is built for digital footprint cleanup — finding and removing the accounts and listings you've forgotten about.",
  },
  mine: {
    slug: "mine",
    name: "Mine",
    tagline: "Free inbox-based privacy discovery (Israeli startup)",
    monthlyPrice: "Free / $4.99/mo Pro",
    annualPrice: "$59.88/yr Pro",
    pros: [
      "Free tier scans your inbox",
      "Pretty UI",
      "GDPR-focused",
    ],
    cons: [
      "Doesn't actually remove broker listings",
      "Sends generic GDPR requests with low response rates",
      "No breach monitoring",
      "Free tier is limited; Pro upsells aggressively",
    ],
    whyFf: [
      "Real broker removal (not just emails to companies)",
      "HaveIBeenPwned-powered breach checks",
      "Higher response rates with US/EU-specific templates",
      "Single price, no upsells — $79/yr covers everything",
    ],
    bestFor:
      "Mine is fine for a one-time GDPR cleanup. Footprint Finder gives you broker removal + breach alerts + monthly rescans — a complete privacy ops layer rather than a one-shot tool.",
  },
};

export default function Compare() {
  const { competitor } = useParams<{ competitor: string }>();
  const data = competitor ? COMPETITORS[competitor.toLowerCase()] : undefined;

  const seoTitle = data
    ? `Footprint Finder vs ${data.name} (${new Date().getFullYear()}): Honest Comparison`
    : "Compare Privacy Tools";
  const seoDescription = data
    ? `Compare Footprint Finder and ${data.name} side-by-side. Pricing, features, broker coverage, breach monitoring. Which privacy service is right for you?`
    : "Compare digital privacy tools.";
  const canonical = data
    ? `https://footprintfinder.co/vs/${data.slug}`
    : undefined;

  const jsonLd = data
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: `Is Footprint Finder cheaper than ${data.name}?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Footprint Finder costs $79/year. ${data.name} costs ${data.annualPrice}. Footprint Finder also includes inbox account discovery and breach monitoring, which ${data.name} does not.`,
            },
          },
          {
            "@type": "Question",
            name: `What does Footprint Finder do that ${data.name} doesn't?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: `Footprint Finder scans your Gmail or Outlook inbox to discover every account tied to your email — including forgotten subscriptions, old services, and shadow accounts. ${data.name} only removes you from data broker sites and cannot see your inbox-based footprint.`,
            },
          },
          {
            "@type": "Question",
            name: `Should I use ${data.name} or Footprint Finder?`,
            acceptedAnswer: {
              "@type": "Answer",
              text: data.bestFor,
            },
          },
        ],
      }
    : undefined;

  useSEO({
    title: seoTitle,
    description: seoDescription,
    canonical,
    jsonLd,
  });

  useEffect(() => {
    if (data) {
      trackEvent("seo_compare_page_view", { competitor: data.slug });
    }
  }, [data]);

  if (!competitor || !data) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">vs {data.name}</span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <Badge variant="outline" className="mb-3">
              Honest comparison
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Footprint Finder vs {data.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {data.tagline}. Here's how it stacks up against Footprint Finder
              on price, coverage, and features — written by people who use both.
            </p>
          </header>

          {/* Quick verdict */}
          <Card className="mb-10 border-primary/30 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-semibold mb-2">Quick verdict</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {data.bestFor}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side-by-side */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Side-by-side comparison</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* Footprint Finder */}
              <Card className="border-accent/40">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-5 h-5 text-accent" />
                    <h3 className="text-xl font-bold">Footprint Finder</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    $79/year · all-in-one
                  </p>

                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>Inbox scan finds every account tied to your email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>Removes you from 45+ data brokers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>HaveIBeenPwned breach monitoring + alerts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>Monthly rescans — privacy is maintenance, not a fix</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span>One price, no upsells</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Competitor */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">{data.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {data.annualPrice} · {data.monthlyPrice}
                  </p>

                  <ul className="space-y-2 text-sm">
                    {data.pros.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </li>
                    ))}
                    {data.cons.map((c) => (
                      <li key={c} className="flex items-start gap-2">
                        <XCircle className="w-4 h-4 text-destructive/70 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{c}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Why FF wins */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              What Footprint Finder does that {data.name} doesn't
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.whyFf.map((reason, i) => {
                const icons = [Mail, Search, Shield, AlertTriangle];
                const Icon = icons[i % icons.length];
                return (
                  <Card key={reason}>
                    <CardContent className="p-5">
                      <Icon className="w-5 h-5 text-primary mb-2" />
                      <p className="text-sm leading-relaxed">{reason}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Frequently asked: {data.name} vs Footprint Finder
            </h2>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">
                    Is Footprint Finder cheaper than {data.name}?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Yes. Footprint Finder is $79/year. {data.name} is{" "}
                    {data.annualPrice}. And Footprint Finder includes inbox
                    discovery and breach monitoring — features {data.name}{" "}
                    doesn't offer at any price.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">
                    What does Footprint Finder do that {data.name} doesn't?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Footprint Finder scans your Gmail or Outlook inbox to find
                    every account, subscription, and service tied to your email
                    — including ones you've forgotten about. {data.name} only
                    removes you from data brokers and can't see your inbox-based
                    footprint.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">
                    Can I use both {data.name} and Footprint Finder?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You can, but it's redundant. Footprint Finder already
                    handles broker removal, plus inbox scanning and breach
                    alerts. Most customers switch to Footprint Finder to
                    consolidate and save money.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA */}
          <Card className="border-accent/30 bg-gradient-to-br from-accent/5 via-background to-primary/5">
            <CardContent className="p-6 md:p-8 text-center">
              <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                See your full digital footprint in 60 seconds
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Free scan. No credit card. See exactly what {data.name}{" "}
                wouldn't show you — every account, every breach, every broker
                listing tied to your email.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/free-scan"
                  onClick={() =>
                    trackEvent("seo_compare_cta_click", {
                      competitor: data.slug,
                    })
                  }
                >
                  <Button size="lg" className="gap-2 cta-shimmer">
                    Run free scan
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/remove-from">
                  <Button size="lg" variant="outline">
                    Browse removal guides
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Other comparisons */}
          <section className="mt-12">
            <h2 className="text-lg font-semibold mb-4">
              Compare other privacy tools
            </h2>
            <div className="flex flex-wrap gap-2">
              {Object.values(COMPETITORS)
                .filter((c) => c.slug !== data.slug)
                .map((c) => (
                  <Link key={c.slug} to={`/vs/${c.slug}`}>
                    <Button variant="outline" size="sm">
                      vs {c.name}
                    </Button>
                  </Link>
                ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
