import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Trophy } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import {
  COMPETITORS,
  COMPETITOR_PRICING_VERIFIED_ON,
  CONTENT_YEAR,
  formatVerifiedDate,
} from "@/data/competitors";
import { COMPETITOR_ARTICLES } from "@/data/competitorArticles";
import { HEAD_TO_HEADS } from "@/data/headToHead";
import { BEST_SERVICES_RANKING } from "@/data/bestServices";

const SITE_URL = "https://footprintfinder.co";

// Derived from the single COMPETITORS source rather than a parallel list, so
// this hub can never quote a price the /vs/:slug page contradicts.
const CARDS = Object.values(COMPETITORS).map((c) => ({
  slug: c.slug,
  name: c.name,
  price: c.annualPrice,
  coverage: c.brokerCoverage,
  take: COMPETITOR_ARTICLES[c.slug]?.shortTake ?? c.tagline,
}));

export default function CompareIndex() {
  useSEO({
    title: `Data Removal Service Comparisons (${CONTENT_YEAR}) — Footprint Finder`,
    description:
      "Side-by-side comparisons of DeleteMe, Incogni, OneRep, Optery, Privacy Bee, Kanary, Aura and Mine — pricing, coverage and honest alternatives.",
    canonical: `${SITE_URL}/vs`,
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Data removal service comparisons",
        itemListElement: CARDS.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${c.name} alternatives`,
          url: `${SITE_URL}/vs/${c.slug}`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Compare", item: `${SITE_URL}/vs` },
        ],
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <header className="text-center mb-10">
            <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Compare data removal services
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Honest, side-by-side comparisons of the major privacy and
              data-removal services — what each covers, what it costs, and which
              alternative fits your situation.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Pricing last verified{" "}
              <time dateTime={COMPETITOR_PRICING_VERIFIED_ON}>
                {formatVerifiedDate(COMPETITOR_PRICING_VERIFIED_ON)}
              </time>
              .
            </p>
          </header>

          {/* The roundup is the entry point most people want. */}
          <Link to="/best-data-removal-services" className="group block mb-10">
            <Card className="border-accent/40 bg-gradient-to-br from-accent/5 via-background to-primary/5 transition-colors group-hover:border-accent/70">
              <CardContent className="p-6 flex items-start gap-4">
                <Trophy className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    Best data removal services in {CONTENT_YEAR}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    All {BEST_SERVICES_RANKING.length} services ranked by
                    category, with the honest catch for each one — including
                    ours. Start here if you're not sure what you need.
                  </p>
                  <span className="text-sm text-primary inline-flex items-center mt-3">
                    Read the roundup
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">Alternatives by service</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Already using one of these, or deciding between them? Each page
              compares that service against every alternative.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {CARDS.map((c) => (
                <Link key={c.slug} to={`/vs/${c.slug}`} className="group">
                  <Card className="h-full transition-colors group-hover:border-primary/50">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold">{c.name} alternatives</h3>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {c.price} · {c.coverage}
                      </p>
                      <p className="text-sm text-muted-foreground">{c.take}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">Head-to-head comparisons</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Deciding between two specific services? These pages answer that
              question directly.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {HEAD_TO_HEADS.map((pair) => {
                const a = COMPETITORS[pair.a];
                const b = COMPETITORS[pair.b];
                return (
                  <Link key={pair.slug} to={`/vs/${pair.slug}`} className="group">
                    <Card className="h-full transition-colors group-hover:border-primary/50">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm mb-1">
                          {a?.name} vs {b?.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {pair.angle}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>

          <div className="text-center mb-12">
            <Link to="/free-scan">
              <Button size="lg" className="gap-2 cta-shimmer">
                See your exposure first — free scan
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <section>
            <h2 className="text-lg font-semibold mb-4">
              Prefer to do it yourself?
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Every opt-out these services perform is free to do yourself:
            </p>
            <div className="flex flex-wrap gap-2">
              <Link to="/remove-from">
                <Button variant="outline" size="sm">
                  Data-broker opt-out guides
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
              <Link to="/breach">
                <Button variant="ghost" size="sm" className="gap-1">
                  Recent data breaches
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
