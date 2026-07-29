import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import { ArrowRight, Users } from "lucide-react";
import { PERSONA_GUIDES } from "@/data/personas";
import { CONTENT_YEAR } from "@/data/competitors";

const SITE_URL = "https://footprintfinder.co";

export default function PersonaIndex() {
  useSEO({
    title: `Data Removal by Situation (${CONTENT_YEAR}) — Free Guides`,
    description: "Survivors, officers, nurses, teachers, journalists, seniors, job seekers and creators are exposed differently — and need different advice.",
    canonical: `${SITE_URL}/for`,
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Personal data removal guidance by situation",
        itemListElement: PERSONA_GUIDES.map((g, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: g.h1,
          url: `${SITE_URL}/for/${g.slug}`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "By situation", item: `${SITE_URL}/for` },
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
            <Users className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Data removal guidance by situation
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Removal services sell one plan to everybody, but the right advice
              genuinely differs. A survivor needs a state confidentiality
              programme, not a subscription. A police officer in some states has
              a takedown right with penalties behind it. Each guide starts with
              the strongest option actually available to that group — including
              when that option is free and beats paying us.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {PERSONA_GUIDES.map((g) => (
              <Link key={g.slug} to={`/for/${g.slug}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="font-semibold capitalize">{g.audience}</h2>
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
              <Link to="/remove">
                <Button variant="outline" size="sm">Remove data by type</Button>
              </Link>
              <Link to="/remove-from">
                <Button variant="outline" size="sm">Data-broker opt-out guides</Button>
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
                See what's exposed — free scan
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
