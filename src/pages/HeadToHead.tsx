import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { trackEvent } from "@/lib/analytics";
import { CheckCircle2, XCircle, ArrowRight, Info } from "lucide-react";
import {
  COMPETITORS,
  FEATURE_ROWS,
  FOOTPRINT_FINDER_FEATURES,
  FOOTPRINT_FINDER_PRICING,
  FOOTPRINT_FINDER_BROKER_COVERAGE,
  COMPETITOR_PRICING_VERIFIED_ON,
  CONTENT_YEAR,
  formatVerifiedDate,
} from "@/data/competitors";
import { resolveHeadToHead, HEAD_TO_HEADS } from "@/data/headToHead";

const SITE_URL = "https://footprintfinder.co";

/**
 * Competitor-vs-competitor page, e.g. /vs/deleteme-vs-incogni.
 *
 * These target the highest-volume queries in the category, none of which
 * contain our brand name. The page's job is to answer the A-versus-B question
 * honestly; Footprint Finder appears once, near the end, clearly labelled as
 * ours. Steering every section back to our product would defeat the purpose.
 */
export default function HeadToHead() {
  const { competitor } = useParams<{ competitor: string }>();
  const resolved = competitor ? resolveHeadToHead(competitor) : undefined;

  const title = resolved
    ? `${resolved.a.name} vs ${resolved.b.name} (${CONTENT_YEAR}): Which Should You Use?`
    : "Compare privacy services";
  const description = resolved
    ? `${resolved.a.name} vs ${resolved.b.name} compared on price, broker coverage, filing method and reporting. ${resolved.data.angle}`
    : "Compare data removal services side by side.";
  const canonical = resolved ? `${SITE_URL}/vs/${resolved.data.slug}` : undefined;

  const jsonLd = resolved
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description,
          image: `${SITE_URL}/og-image.png`,
          dateModified: COMPETITOR_PRICING_VERIFIED_ON,
          author: { "@type": "Organization", name: "Footprint Finder", url: SITE_URL },
          publisher: {
            "@type": "Organization",
            name: "Footprint Finder",
            url: SITE_URL,
            logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` },
          },
          mainEntityOfPage: canonical,
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: resolved.data.faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Compare", item: `${SITE_URL}/vs` },
            {
              "@type": "ListItem",
              position: 3,
              name: `${resolved.a.name} vs ${resolved.b.name}`,
              item: canonical,
            },
          ],
        },
      ]
    : undefined;

  useSEO({ title, description, canonical, jsonLd });

  useEffect(() => {
    if (resolved) {
      trackEvent("seo_head_to_head_view", { pair: resolved.data.slug });
    }
  }, [resolved]);

  if (!resolved) return <Navigate to="/vs" replace />;

  // Only the canonical ordering serves this page; the reverse slug redirects
  // so we never ship two URLs with identical content.
  if (resolved.isReversed) {
    return <Navigate to={`/vs/${resolved.data.slug}`} replace />;
  }

  const { data, a, b } = resolved;
  const otherPairs = HEAD_TO_HEADS.filter((h) => h.slug !== data.slug).slice(0, 6);

  const priceRows: { label: string; a: string; b: string }[] = [
    { label: "Annual price", a: a.annualPrice, b: b.annualPrice },
    { label: "Monthly price", a: a.monthlyPrice, b: b.monthlyPrice },
    { label: "Broker coverage", a: a.brokerCoverage, b: b.brokerCoverage },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/vs" className="hover:text-foreground">Compare</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">
              {a.name} vs {b.name}
            </span>
          </nav>

          <header className="mb-8">
            <Badge variant="outline" className="mb-3">
              Head-to-head
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {a.name} vs {b.name}: which should you use?
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {data.angle}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Pricing last verified{" "}
              <time dateTime={COMPETITOR_PRICING_VERIFIED_ON}>
                {formatVerifiedDate(COMPETITOR_PRICING_VERIFIED_ON)}
              </time>
              . Check current rates on each vendor's site before buying.
            </p>
          </header>

          {/* Pricing and coverage at a glance. */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
              {a.name} vs {b.name} at a glance
            </h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left font-semibold p-3"> </th>
                    <th className="text-left font-semibold p-3">{a.name}</th>
                    <th className="text-left font-semibold p-3">{b.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {priceRows.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                      <td className="p-3 font-medium">{row.label}</td>
                      <td className="p-3">{row.a}</td>
                      <td className="p-3">{row.b}</td>
                    </tr>
                  ))}
                  {FEATURE_ROWS.map((row, i) => (
                    <tr
                      key={row.key}
                      className={(i + priceRows.length) % 2 === 1 ? "bg-muted/20" : undefined}
                    >
                      <td className="p-3">{row.label}</td>
                      <td className="p-3">
                        {a.features[row.key] ? (
                          <CheckCircle2 className="w-4 h-4 text-accent" aria-label="Yes" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive/60" aria-label="No" />
                        )}
                      </td>
                      <td className="p-3">
                        {b.features[row.key] ? (
                          <CheckCircle2 className="w-4 h-4 text-accent" aria-label="Yes" />
                        ) : (
                          <XCircle className="w-4 h-4 text-destructive/60" aria-label="No" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {data.sections.map((section) => (
            <section key={section.heading} className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>
              {section.body.map((para, i) => (
                <p key={i} className="text-base leading-relaxed mb-4 text-foreground/90">
                  {para}
                </p>
              ))}
            </section>
          ))}

          {/* Pros and cons side by side. */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              Strengths and weaknesses
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[a, b].map((service) => (
                <Card key={service.slug}>
                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg mb-1">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {service.annualPrice} · {service.brokerCoverage}
                    </p>
                    <ul className="space-y-2 text-sm">
                      {service.pros.map((pro) => (
                        <li key={pro} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                      {service.cons.map((con) => (
                        <li key={con} className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-destructive/60 flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{con}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={`/vs/${service.slug}`}
                      className="text-sm text-primary inline-flex items-center hover:underline mt-4"
                    >
                      All {service.name} alternatives
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* The recommendation. */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Which should you pick?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="border-primary/30">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">Pick {a.name} if…</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {data.pickA}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/30">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">Pick {b.name} if…</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {data.pickB}
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Third option — clearly disclosed, once. */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">A third option worth knowing about</h2>
            <Card className="border-accent/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-4 h-4 flex-shrink-0 mt-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Disclosure:</strong>{" "}
                    Footprint Finder is our product. We've kept it out of the
                    comparison above because this page exists to answer the{" "}
                    {a.name}-versus-{b.name} question, not to sell you a third
                    thing. Here it is anyway, in case it's relevant.
                  </p>
                </div>
                <p className="text-base leading-relaxed mb-3">
                  Both {a.name} and {b.name} work outward from your name into
                  public databases. Footprint Finder also works outward from
                  your inbox — read-only metadata, sender and subject only,
                  never message bodies — to find the accounts you've actually
                  created. Those accounts are where breaches start, and breaches
                  are what refill the broker databases both services are busy
                  clearing.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {FOOTPRINT_FINDER_PRICING.pro} for inbox discovery and breach
                  monitoring; {FOOTPRINT_FINDER_PRICING.complete} adds broker
                  removal across {FOOTPRINT_FINDER_BROKER_COVERAGE}. Broker
                  coverage is smaller than {a.name}'s and {b.name}'s — if
                  people-search listings are your only concern, one of them
                  covers more sites.
                </p>
                <div className="overflow-x-auto rounded-lg border mb-4">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left font-semibold p-3">Capability</th>
                        <th className="text-center font-semibold p-3">{a.name}</th>
                        <th className="text-center font-semibold p-3">{b.name}</th>
                        <th className="text-center font-semibold p-3">Footprint Finder</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FEATURE_ROWS.map((row, i) => (
                        <tr key={row.key} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                          <td className="p-3">{row.label}</td>
                          {[a.features[row.key], b.features[row.key], FOOTPRINT_FINDER_FEATURES[row.key]].map(
                            (yes, j) => (
                              <td key={j} className="p-3 text-center">
                                {yes ? (
                                  <CheckCircle2 className="w-4 h-4 text-accent inline" aria-label="Yes" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-destructive/60 inline" aria-label="No" />
                                )}
                              </td>
                            ),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Link
                  to="/free-scan"
                  onClick={() => trackEvent("seo_head_to_head_cta_click", { pair: data.slug })}
                >
                  <Button className="gap-2">
                    Run a free scan
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              {a.name} vs {b.name}: frequently asked questions
            </h2>
            <div className="space-y-4">
              {data.faqs.map((faq) => (
                <Card key={faq.question}>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Other head-to-head comparisons</h2>
            <div className="flex flex-wrap gap-2">
              {otherPairs.map((pair) => (
                <Link key={pair.slug} to={`/vs/${pair.slug}`}>
                  <Button variant="outline" size="sm">
                    {COMPETITORS[pair.a]?.name} vs {COMPETITORS[pair.b]?.name}
                  </Button>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Keep researching</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/best-data-removal-services">
                <Button variant="outline" size="sm">
                  Best data removal services
                </Button>
              </Link>
              <Link to="/vs">
                <Button variant="outline" size="sm">
                  All comparisons
                </Button>
              </Link>
              <Link to="/remove-from">
                <Button variant="outline" size="sm">
                  Free opt-out guides
                </Button>
              </Link>
              <Link to="/guides">
                <Button variant="ghost" size="sm" className="gap-1">
                  Privacy removal guides
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
