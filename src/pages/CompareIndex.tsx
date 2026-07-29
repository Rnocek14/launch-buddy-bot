import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import {
  COMPETITORS,
  COMPETITOR_PRICING_VERIFIED_ON,
} from "@/data/competitors";

// Derived from the single COMPETITORS source rather than a parallel list, so
// this hub can never quote a price the /vs/:slug page contradicts.
const CARDS = Object.values(COMPETITORS).map((c) => ({
  slug: c.slug,
  name: c.name,
  desc: `${c.tagline} — ${c.annualPrice}, ${c.brokerCoverage}`,
}));

export default function CompareIndex() {
  useSEO({
    title: "Footprint Finder vs DeleteMe, Incogni, Optery — Honest Comparisons",
    description:
      "Compare Footprint Finder against DeleteMe, Incogni, OneRep, Optery, Privacy Bee, Kanary, Aura, EasyOptOuts and Mine. Side-by-side pricing, features, and coverage.",
    canonical: "https://footprintfinder.co/vs",
    ogType: "website",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Footprint Finder privacy service comparisons",
      itemListElement: CARDS.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `Footprint Finder vs ${c.name}`,
        url: `https://footprintfinder.co/vs/${c.slug}`,
      })),
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <header className="text-center mb-10">
            <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Compare privacy services
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Honest, head-to-head comparisons of Footprint Finder vs the major
              data-removal services. Pricing, features, coverage — no fluff.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Competitor pricing last verified{" "}
              <time dateTime={COMPETITOR_PRICING_VERIFIED_ON}>
                {new Date(COMPETITOR_PRICING_VERIFIED_ON).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              .
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-4">
            {CARDS.map((c) => (
              <Link key={c.slug} to={`/vs/${c.slug}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-semibold">vs {c.name}</h2>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground">{c.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/free-scan">
              <Button size="lg" className="gap-2 cta-shimmer">
                Run a free scan first
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <section className="mt-12">
            <h2 className="text-lg font-semibold mb-4">
              Prefer to do it yourself?
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/remove-from">
                <Button variant="outline" size="sm">
                  Free data-broker opt-out guides
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
              <Link to="/blog">
                <Button variant="ghost" size="sm" className="gap-1">
                  Long-form comparisons
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
