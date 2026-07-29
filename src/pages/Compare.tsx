import { useParams, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
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
  Info,
} from "lucide-react";
import {
  COMPETITORS,
  FEATURE_ROWS,
  RELATED_BROKERS,
  FOOTPRINT_FINDER_FEATURES,
  FOOTPRINT_FINDER_BROKER_COVERAGE,
  FOOTPRINT_FINDER_PRICING,
  COMPETITOR_PRICING_VERIFIED_ON,
  CONTENT_YEAR,
  formatVerifiedDate,
} from "@/data/competitors";
import {
  COMPETITOR_ARTICLES,
  CATEGORY_CONTEXT,
  RANKING_CRITERIA,
} from "@/data/competitorArticles";
import { isHeadToHeadSlug, headToHeadsFor } from "@/data/headToHead";
import HeadToHead from "./HeadToHead";

const SITE_URL = "https://footprintfinder.co";

export default function Compare() {
  const { competitor } = useParams<{ competitor: string }>();
  const slug = competitor?.toLowerCase();

  // /vs/:competitor also serves competitor-vs-competitor pages
  // (e.g. /vs/deleteme-vs-incogni). Dispatch before doing anything else.
  if (slug && isHeadToHeadSlug(slug)) {
    return <HeadToHead />;
  }

  return <AlternativesPage slug={slug} />;
}

function AlternativesPage({ slug }: { slug?: string }) {
  const data = slug ? COMPETITORS[slug] : undefined;
  const article = slug ? COMPETITOR_ARTICLES[slug] : undefined;

  // Every other service, plus Footprint Finder, is an alternative to this one.
  const alternatives = Object.values(COMPETITORS).filter(
    (c) => c.slug !== data?.slug,
  );
  const optionCount = alternatives.length + 1;

  const seoTitle = data
    ? `${data.name} Alternatives: ${optionCount} Options Compared (${CONTENT_YEAR})`
    : "Compare Privacy Tools — Footprint Finder";
  // Kept under 160 characters: Google truncates past roughly that, and a
  // snippet cut mid-clause costs clicks.
  const seoDescription = data
    ? `${data.name} alternatives compared: ${optionCount} data removal services on price, broker coverage and what each one can actually see.`
    : "Compare digital privacy tools.";
  const canonical = data ? `${SITE_URL}/vs/${data.slug}` : undefined;

  // Article FAQs target People Also Ask; compareFaqs cover our own product.
  const faqs = article?.faqs ?? [];
  const relatedPairs = data ? headToHeadsFor(data.slug) : [];

  const jsonLd = data
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: seoTitle,
          description: seoDescription,
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
          mainEntity: faqs.map((f) => ({
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
              name: `${data.name} alternatives`,
              item: canonical,
            },
          ],
        },
      ]
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

  if (!slug || !data || !article) {
    return <Navigate to="/vs" replace />;
  }

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
            <span className="text-foreground">{data.name} alternatives</span>
          </nav>

          <header className="mb-8">
            <Badge variant="outline" className="mb-3">
              {optionCount} services compared
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {data.name} alternatives: {optionCount} options compared
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {data.tagline}. Here's how it stacks up against every major
              alternative on price, broker coverage and what each one can
              actually see — including the cases where {data.name} is still the
              right buy.
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Pricing last verified{" "}
              <time dateTime={COMPETITOR_PRICING_VERIFIED_ON}>
                {formatVerifiedDate(COMPETITOR_PRICING_VERIFIED_ON)}
              </time>
              . Vendors change plans often — check current rates before buying.
            </p>
          </header>

          {/* Disclosure. Stated up front, not buried. */}
          <Card className="mb-10 border-muted-foreground/20 bg-muted/30">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Disclosure:</strong>{" "}
                Footprint Finder is our own product and appears in this
                comparison. The capability table below is generated from one
                shared data file, so we're scored on the same criteria as
                everyone else — and we've been explicit about where {data.name}{" "}
                and others beat us.
              </p>
            </CardContent>
          </Card>

          {/* Quick answer — the summary a skimmer needs in ten seconds. */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
              The short answer
            </h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left font-semibold p-3">Service</th>
                    <th className="text-left font-semibold p-3">Best for</th>
                    <th className="text-left font-semibold p-3 w-32">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {alternatives.map((alt, i) => {
                    const altArticle = COMPETITOR_ARTICLES[alt.slug];
                    return (
                      <tr key={alt.slug} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
                        <td className="p-3 font-medium">
                          <Link to={`/vs/${alt.slug}`} className="hover:text-primary">
                            {alt.name}
                          </Link>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {altArticle?.bestForShort ?? alt.tagline}
                        </td>
                        <td className="p-3 whitespace-nowrap">{alt.annualPrice}</td>
                      </tr>
                    );
                  })}
                  <tr className="bg-accent/5 border-t-2 border-accent/30">
                    <td className="p-3 font-medium">Footprint Finder (ours)</td>
                    <td className="p-3 text-muted-foreground">
                      Finding forgotten accounts in your inbox
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {FOOTPRINT_FINDER_PRICING.pro}+
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
              Why people look for {data.name} alternatives
            </h2>
            <ul className="space-y-3">
              {article.whySeekAlternatives.map((reason) => (
                <li key={reason} className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-destructive/60 flex-shrink-0 mt-1" />
                  <span className="text-base leading-relaxed">{reason}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Unique long-form body. */}
          {article.sections.map((section) => (
            <section key={section.heading} className="mb-12">
              <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>
              {section.body.map((para, i) => (
                <p key={i} className="text-base leading-relaxed mb-4 text-foreground/90">
                  {para}
                </p>
              ))}
            </section>
          ))}

          {/* Head-to-head: us vs them. */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">
              Footprint Finder vs {data.name}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Footprint Finder removes you from {FOOTPRINT_FINDER_BROKER_COVERAGE}{" "}
              on the {FOOTPRINT_FINDER_PRICING.brokerTier} plan; {data.name}{" "}
              covers {data.brokerCoverage}.
            </p>
            <div className="overflow-x-auto rounded-lg border mb-6">
              <table className="w-full text-sm min-w-[480px]">
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
                    <tr key={row.key} className={i % 2 === 1 ? "bg-muted/20" : undefined}>
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
                  <tr className="border-t">
                    <td className="p-3 font-medium">Price</td>
                    <td className="p-3 text-center text-xs">
                      Free · {FOOTPRINT_FINDER_PRICING.pro} · {FOOTPRINT_FINDER_PRICING.complete}
                    </td>
                    <td className="p-3 text-center text-xs">{data.annualPrice}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.whyFf.map((reason) => (
                <Card key={reason}>
                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed">{reason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* The alternatives themselves. */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">
              The best {data.name} alternatives
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Every other major service in the category, with what each one is
              genuinely good at.
            </p>
            <div className="space-y-4">
              {alternatives.map((alt) => {
                const altArticle = COMPETITOR_ARTICLES[alt.slug];
                return (
                  <Card key={alt.slug}>
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          <Link to={`/vs/${alt.slug}`} className="hover:text-primary">
                            {alt.name}
                          </Link>
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {alt.annualPrice} · {alt.brokerCoverage}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed mb-3">
                        {altArticle?.shortTake ?? alt.tagline}
                      </p>
                      <Link
                        to={`/vs/${alt.slug}`}
                        className="text-sm text-primary inline-flex items-center hover:underline"
                      >
                        {alt.name} vs {data.name} and other alternatives
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">{RANKING_CRITERIA.heading}</h2>
            {RANKING_CRITERIA.body.map((para, i) => (
              <p key={i} className="text-base leading-relaxed mb-4 text-foreground/90">
                {para}
              </p>
            ))}
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">{CATEGORY_CONTEXT.heading}</h2>
            {/* Trimmed on competitor pages; the full version lives on the
                best-services roundup so the shared block stays a small share
                of each page's word count. */}
            {CATEGORY_CONTEXT.body.slice(0, 2).map((para, i) => (
              <p key={i} className="text-base leading-relaxed mb-4 text-foreground/90">
                {para}
              </p>
            ))}
            <Link to="/best-data-removal-services" className="text-sm text-primary inline-flex items-center hover:underline">
              Full breakdown: best data removal services compared
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
              What to check before you switch from {data.name}
            </h2>
            <ul className="space-y-3">
              {article.switchNotes.map((note) => (
                <li key={note} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-1" />
                  <span className="text-base leading-relaxed">{note}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">
              {data.name} alternatives: frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq) => (
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

          <section className="mb-12 rounded-lg bg-muted/30 p-6">
            <h2 className="text-2xl font-bold mb-3">The verdict</h2>
            <p className="text-base leading-relaxed">{article.verdict}</p>
          </section>

          <Card className="border-accent/30 bg-gradient-to-br from-accent/5 via-background to-primary/5 mb-12">
            <CardContent className="p-6 md:p-8 text-center">
              <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                See your full exposure before you buy anything
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Free scan, no credit card. Find the breaches, broker listings
                and forgotten accounts tied to your email — then decide which
                service you actually need.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/free-scan"
                  onClick={() =>
                    trackEvent("seo_compare_cta_click", { competitor: data.slug })
                  }
                >
                  <Button size="lg" className="gap-2 cta-shimmer">
                    Run free scan
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/remove-from">
                  <Button size="lg" variant="outline">
                    Do it yourself — free guides
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {relatedPairs.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold mb-4">
                Head-to-head comparisons involving {data.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                {relatedPairs.map((pair) => (
                  <Link key={pair.slug} to={`/vs/${pair.slug}`}>
                    <Button variant="outline" size="sm">
                      {COMPETITORS[pair.a]?.name} vs {COMPETITORS[pair.b]?.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-2">
              Free data-broker removal guides
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Whichever service you choose — or none — here's how to opt out of
              the brokers people search for most:
            </p>
            <div className="flex flex-wrap gap-2">
              {RELATED_BROKERS.map((b) => (
                <Link key={b.slug} to={`/remove-from/${b.slug}`}>
                  <Button variant="outline" size="sm">
                    {b.name} opt out
                  </Button>
                </Link>
              ))}
              <Link to="/remove-from">
                <Button variant="ghost" size="sm" className="gap-1">
                  All removal guides
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">
              Compare other privacy tools
            </h2>
            <div className="flex flex-wrap gap-2">
              {alternatives.map((c) => (
                <Link key={c.slug} to={`/vs/${c.slug}`}>
                  <Button variant="outline" size="sm">
                    {c.name} alternatives
                  </Button>
                </Link>
              ))}
              <Link to="/best-data-removal-services">
                <Button variant="ghost" size="sm" className="gap-1">
                  Best data removal services
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
