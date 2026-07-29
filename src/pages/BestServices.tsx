import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { ArrowRight, CheckCircle2, AlertTriangle, Trophy } from "lucide-react";
import {
  COMPETITORS,
  FEATURE_ROWS,
  FOOTPRINT_FINDER_FEATURES,
  FOOTPRINT_FINDER_PRICING,
  FOOTPRINT_FINDER_BROKER_COVERAGE,
  COMPETITOR_PRICING_VERIFIED_ON,
  CONTENT_YEAR,
  formatVerifiedDate,
  type CompetitorFeatures,
} from "@/data/competitors";
import { CATEGORY_CONTEXT, RANKING_CRITERIA } from "@/data/competitorArticles";
import {
  BEST_SERVICES_DESCRIPTION,
  BEST_SERVICES_INTRO,
  BEST_SERVICES_RANKING,
  BEST_SERVICES_HOW_TO_CHOOSE,
  BEST_SERVICES_FAQS,
} from "@/data/bestServices";
import { HEAD_TO_HEADS } from "@/data/headToHead";

const SITE_URL = "https://footprintfinder.co";
const OURS = "footprintfinder";

/** Renders **bold** spans in the how-to-choose copy. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="text-foreground">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function BestServices() {
  const title = `Best Data Removal Services in ${CONTENT_YEAR}: ${BEST_SERVICES_RANKING.length} Compared & Ranked`;

  // Every row of the master table, ours included, scored on the same criteria.
  const tableRows: {
    name: string;
    slug: string | null;
    price: string;
    coverage: string;
    features: CompetitorFeatures;
  }[] = BEST_SERVICES_RANKING.map((entry) => {
    if (entry.slug === OURS) {
      return {
        name: "Footprint Finder (ours)",
        slug: null,
        price: `${FOOTPRINT_FINDER_PRICING.pro} / ${FOOTPRINT_FINDER_PRICING.complete}`,
        coverage: FOOTPRINT_FINDER_BROKER_COVERAGE,
        features: FOOTPRINT_FINDER_FEATURES,
      };
    }
    const c = COMPETITORS[entry.slug];
    return {
      name: c.name,
      slug: c.slug,
      price: c.annualPrice,
      coverage: c.brokerCoverage,
      features: c.features,
    };
  });

  useSEO({
    title,
    description: BEST_SERVICES_DESCRIPTION,
    canonical: `${SITE_URL}/best-data-removal-services`,
    ogType: "article",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: BEST_SERVICES_DESCRIPTION,
        image: `${SITE_URL}/og-image.png`,
        dateModified: COMPETITOR_PRICING_VERIFIED_ON,
        author: { "@type": "Organization", name: "Footprint Finder", url: SITE_URL },
        publisher: {
          "@type": "Organization",
          name: "Footprint Finder",
          url: SITE_URL,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` },
        },
        mainEntityOfPage: `${SITE_URL}/best-data-removal-services`,
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: title,
        itemListElement: BEST_SERVICES_RANKING.map((entry, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name:
            entry.slug === OURS
              ? "Footprint Finder"
              : COMPETITORS[entry.slug]?.name,
          ...(entry.slug === OURS
            ? {}
            : { url: `${SITE_URL}/vs/${entry.slug}` }),
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: BEST_SERVICES_FAQS.map((f) => ({
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
            name: "Best data removal services",
            item: `${SITE_URL}/best-data-removal-services`,
          },
        ],
      },
    ],
  });

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
            <span className="text-foreground">Best data removal services</span>
          </nav>

          <header className="mb-8">
            <Badge variant="outline" className="mb-3">
              <Trophy className="w-3 h-3 mr-1" />
              {BEST_SERVICES_RANKING.length} services compared
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Best data removal services in {CONTENT_YEAR}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {BEST_SERVICES_DESCRIPTION}
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              Pricing last verified{" "}
              <time dateTime={COMPETITOR_PRICING_VERIFIED_ON}>
                {formatVerifiedDate(COMPETITOR_PRICING_VERIFIED_ON)}
              </time>
              . Vendors change plans often — confirm current rates before buying.
            </p>
          </header>

          <section className="mb-12">
            {BEST_SERVICES_INTRO.map((para, i) => (
              <p key={i} className="text-base leading-relaxed mb-4 text-foreground/90">
                {para}
              </p>
            ))}
          </section>

          {/* Master comparison table. */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Every service compared</h2>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left font-semibold p-3">Service</th>
                    <th className="text-left font-semibold p-3">Price</th>
                    <th className="text-left font-semibold p-3">Brokers</th>
                    {FEATURE_ROWS.map((row) => (
                      <th key={row.key} className="text-center font-semibold p-3 text-xs">
                        {row.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => (
                    <tr
                      key={row.name}
                      className={
                        row.slug === null
                          ? "bg-accent/5 border-t-2 border-accent/30"
                          : i % 2 === 1
                            ? "bg-muted/20"
                            : undefined
                      }
                    >
                      <td className="p-3 font-medium whitespace-nowrap">
                        {row.slug ? (
                          <Link to={`/vs/${row.slug}`} className="hover:text-primary">
                            {row.name}
                          </Link>
                        ) : (
                          row.name
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs">{row.price}</td>
                      <td className="p-3 whitespace-nowrap text-xs">{row.coverage}</td>
                      {FEATURE_ROWS.map((f) => (
                        <td key={f.key} className="p-3 text-center">
                          {row.features[f.key] ? (
                            <CheckCircle2 className="w-4 h-4 text-accent inline" aria-label="Yes" />
                          ) : (
                            <span className="text-muted-foreground/40" aria-label="No">
                              —
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* The ranked entries. */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">The picks, by category</h2>
            <div className="space-y-6">
              {BEST_SERVICES_RANKING.map((entry, i) => {
                const isOurs = entry.slug === OURS;
                const c = isOurs ? undefined : COMPETITORS[entry.slug];
                const name = isOurs ? "Footprint Finder" : c!.name;
                const price = isOurs
                  ? `Free · ${FOOTPRINT_FINDER_PRICING.pro} · ${FOOTPRINT_FINDER_PRICING.complete}`
                  : c!.annualPrice;
                const coverage = isOurs
                  ? FOOTPRINT_FINDER_BROKER_COVERAGE
                  : c!.brokerCoverage;

                return (
                  <Card
                    key={entry.slug}
                    className={isOurs ? "border-accent/40" : undefined}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                        <span className="text-sm font-mono text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-xl font-bold">
                          {isOurs ? (
                            <>
                              {name}{" "}
                              <span className="text-sm font-normal text-muted-foreground">
                                (our product)
                              </span>
                            </>
                          ) : (
                            <Link to={`/vs/${entry.slug}`} className="hover:text-primary">
                              {name}
                            </Link>
                          )}
                        </h3>
                      </div>
                      <Badge variant="secondary" className="mb-3">
                        {entry.award}
                      </Badge>
                      <p className="text-sm text-muted-foreground mb-3">
                        {price} · {coverage}
                      </p>
                      <p className="text-base leading-relaxed mb-4">{entry.why}</p>
                      <div className="flex items-start gap-2 rounded-md bg-muted/40 p-3">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">The catch:</strong>{" "}
                          {entry.caveat}
                        </p>
                      </div>
                      {!isOurs && (
                        <Link
                          to={`/vs/${entry.slug}`}
                          className="text-sm text-primary inline-flex items-center hover:underline mt-4"
                        >
                          {name} alternatives compared
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      )}
                      {isOurs && (
                        <Link
                          to="/free-scan"
                          className="text-sm text-primary inline-flex items-center hover:underline mt-4"
                        >
                          Run a free scan
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">
              {BEST_SERVICES_HOW_TO_CHOOSE.heading}
            </h2>
            <ul className="space-y-4">
              {BEST_SERVICES_HOW_TO_CHOOSE.body.map((para, i) => (
                <li key={i} className="text-base leading-relaxed text-foreground/90">
                  <RichText text={para} />
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">{CATEGORY_CONTEXT.heading}</h2>
            {CATEGORY_CONTEXT.body.map((para, i) => (
              <p key={i} className="text-base leading-relaxed mb-4 text-foreground/90">
                {para}
              </p>
            ))}
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
            <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
            <div className="space-y-4">
              {BEST_SERVICES_FAQS.map((faq) => (
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
            <h2 className="text-lg font-semibold mb-4">Head-to-head comparisons</h2>
            <div className="flex flex-wrap gap-2">
              {HEAD_TO_HEADS.map((pair) => (
                <Link key={pair.slug} to={`/vs/${pair.slug}`}>
                  <Button variant="outline" size="sm">
                    {COMPETITORS[pair.a]?.name} vs {COMPETITORS[pair.b]?.name}
                  </Button>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Do it yourself, for free</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Every opt-out these services perform is free to do yourself. Here
              are the step-by-step guides:
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/remove-from">
                <Button variant="outline" size="sm">
                  45+ data-broker opt-out guides
                </Button>
              </Link>
              <Link to="/guides">
                <Button variant="outline" size="sm">
                  Privacy removal guides
                </Button>
              </Link>
              <Link to="/delete">
                <Button variant="outline" size="sm">
                  Delete your online accounts
                </Button>
              </Link>
              <Link to="/free-scan">
                <Button size="sm" className="gap-1">
                  Free exposure scan
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
