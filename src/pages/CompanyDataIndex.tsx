import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import { ArrowRight, Eye } from "lucide-react";
import { COMPANY_DATA_GUIDES } from "@/data/companyData";
import { CONTENT_YEAR } from "@/data/competitors";

const SITE_URL = "https://footprintfinder.co";

export default function CompanyDataIndex() {
  useSEO({
    title: `What Do Big Tech Companies Know About You? (${CONTENT_YEAR})`,
    description:
      "Google, Facebook, Amazon, TikTok, Apple and more — what each one holds on you, how to download your copy, and what survives deletion.",
    canonical: `${SITE_URL}/what-they-know`,
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "What big tech companies know about you",
        itemListElement: COMPANY_DATA_GUIDES.map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: g.h1,
          url: `${SITE_URL}/what-they-know/${g.slug}`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "What they know", item: `${SITE_URL}/what-they-know` },
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
            <Eye className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              What do they actually know about you?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Data-broker removal services work outward from your name into
              public records. None of them look at the accounts you opened
              yourself — which is where the detailed material lives. Every
              company below will hand you a copy of your own file if you ask,
              and most people have never asked.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {COMPANY_DATA_GUIDES.map((g) => (
              <Link key={g.slug} to={`/what-they-know/${g.slug}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="font-semibold">{g.company}</h2>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-3">
              Why your data request is worth the ten minutes
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground mb-3">
              Under the GDPR in Europe and under state laws in California,
              Colorado, Connecticut, Texas, Virginia and a growing list of
              others, these companies are legally obliged to give you a copy of
              what they hold. Most of them built a self-serve export tool rather
              than field the requests by hand, which is why the process below is
              usually a few clicks rather than a formal letter.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              The archive is worth reading for one specific reason: it shows you
              the shape of the problem. Nobody guesses correctly how far back the
              record goes, and seeing it is what turns privacy from an abstract
              worry into a to-do list.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Also useful</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/privacy-rights">
                <Button variant="outline" size="sm">Your rights by state</Button>
              </Link>
              <Link to="/delete">
                <Button variant="outline" size="sm">Delete your online accounts</Button>
              </Link>
              <Link to="/remove">
                <Button variant="outline" size="sm">Remove personal data by type</Button>
              </Link>
              <Link to="/remove-from">
                <Button variant="outline" size="sm">Data-broker opt-out guides</Button>
              </Link>
              <Link to="/plan">
                <Button variant="ghost" size="sm" className="gap-1">
                  Build a free removal plan
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </section>

          <div className="text-center">
            <Link to="/free-scan">
              <Button size="lg" className="gap-2 cta-shimmer">
                See every account tied to your email — free
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
