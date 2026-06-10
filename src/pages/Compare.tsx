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
import {
  COMPETITORS,
  FOOTPRINT_FINDER_FEATURES,
  FOOTPRINT_FINDER_BROKER_COVERAGE,
  type CompetitorFeatures,
} from "@/data/competitors";

const FEATURE_ROWS: { key: keyof CompetitorFeatures; label: string }[] = [
  { key: "inboxScan", label: "Inbox scan for forgotten accounts" },
  { key: "brokerRemoval", label: "Data-broker removal" },
  { key: "breachMonitoring", label: "Data-breach monitoring" },
  { key: "gdprCcpaRequests", label: "GDPR / CCPA data requests" },
  { key: "accountDeletionHelp", label: "Account & subscription deletion help" },
  { key: "ongoingMonitoring", label: "Ongoing re-scans & alerts" },
];

// High-intent broker pages to interlink from every comparison page,
// building the privacy-removal topical cluster.
const RELATED_BROKERS = [
  { slug: "truepeoplesearch", name: "TruePeopleSearch" },
  { slug: "spokeo", name: "Spokeo" },
  { slug: "radaris", name: "Radaris" },
  { slug: "mylife", name: "MyLife" },
  { slug: "whitepages", name: "Whitepages" },
  { slug: "beenverified", name: "BeenVerified" },
];

export default function Compare() {
  const { competitor } = useParams<{ competitor: string }>();
  const data = competitor ? COMPETITORS[competitor.toLowerCase()] : undefined;

  const seoTitle = data
    ? `Footprint Finder vs ${data.name} — Honest Comparison`
    : "Compare Privacy Tools — Footprint Finder";
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

          {/* Feature comparison matrix */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">
              Feature comparison: Footprint Finder vs {data.name}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Coverage: Footprint Finder removes you from{" "}
              {FOOTPRINT_FINDER_BROKER_COVERAGE}; {data.name} covers{" "}
              {data.brokerCoverage}.
            </p>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left font-semibold p-3">Capability</th>
                    <th className="text-center font-semibold p-3 w-32">
                      Footprint Finder
                    </th>
                    <th className="text-center font-semibold p-3 w-32">
                      {data.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_ROWS.map((row, i) => (
                    <tr
                      key={row.key}
                      className={i % 2 === 1 ? "bg-muted/20" : undefined}
                    >
                      <td className="p-3">{row.label}</td>
                      <td className="p-3 text-center">
                        {FOOTPRINT_FINDER_FEATURES[row.key] ? (
                          <CheckCircle2 className="w-4 h-4 text-accent inline" aria-label="Yes" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive/60 inline" aria-label="No" />
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {data.features[row.key] ? (
                          <CheckCircle2 className="w-4 h-4 text-muted-foreground inline" aria-label="Yes" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive/60 inline" aria-label="No" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>


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
