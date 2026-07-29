import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import { ArrowRight, Fingerprint } from "lucide-react";
import { DATA_TYPE_GUIDES } from "@/data/dataTypes";
import { CONTENT_YEAR } from "@/data/competitors";

const SITE_URL = "https://footprintfinder.co";

export default function DataTypeIndex() {
  useSEO({
    title: `Remove Your Personal Data by Type (${CONTENT_YEAR}) — Free Guides`,
    description: "Your SSN, address history, date of birth, relatives, mugshot, court and property records — where each is exposed and what can actually be removed.",
    canonical: `${SITE_URL}/remove`,
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Personal data removal guides by type",
        itemListElement: DATA_TYPE_GUIDES.map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: g.h1,
          url: `${SITE_URL}/remove/${g.slug}`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Remove your data", item: `${SITE_URL}/remove` },
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
            <Fingerprint className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Remove your personal data, by type
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Different kinds of personal data get exposed in different ways and
              come off — or don't — for different reasons. Each guide covers
              where that data comes from, how to remove it, and what genuinely
              cannot be removed.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {DATA_TYPE_GUIDES.map((g) => (
              <Link key={g.slug} to={`/remove/${g.slug}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="font-semibold capitalize">{g.dataType}</h2>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Also useful</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/privacy-rights">
                <Button variant="outline" size="sm">Your rights by state</Button>
              </Link>
              <Link to="/remove-from">
                <Button variant="outline" size="sm">Data-broker opt-out guides</Button>
              </Link>
              <Link to="/guides">
                <Button variant="outline" size="sm">Privacy removal guides</Button>
              </Link>
              <Link to="/delete">
                <Button variant="outline" size="sm">Delete online accounts</Button>
              </Link>
              <Link to="/best-data-removal-services">
                <Button variant="ghost" size="sm" className="gap-1">
                  Compare removal services
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </section>

          <div className="text-center">
            <Link to="/free-scan">
              <Button size="lg" className="gap-2 cta-shimmer">
                Find out what's exposed — free scan
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
