import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { ArrowRight, Scale } from "lucide-react";
import {
  STATES,
  STATES_WITH_LAWS,
  STATES_WITHOUT_LAWS,
  REGISTRY_STATES,
  LAW_DATA_VERIFIED_ON,
} from "@/data/states";
import { CONTENT_YEAR, formatVerifiedDate } from "@/data/competitors";

const SITE_URL = "https://footprintfinder.co";

export default function PrivacyRightsIndex() {
  useSEO({
    title: `Data Deletion Rights by State (${CONTENT_YEAR}) — All 50 States`,
    description: `Which states let you demand deletion of your personal data, which run broker registries, and which have no law at all. All 50 states plus DC.`,
    canonical: `${SITE_URL}/privacy-rights`,
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "US data deletion rights by state",
        itemListElement: STATES.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${s.name} data privacy rights`,
          url: `${SITE_URL}/privacy-rights/${s.slug}`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Privacy rights by state", item: `${SITE_URL}/privacy-rights` },
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
            <Scale className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Your data deletion rights, state by state
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              What you can legally demand depends entirely on where you live —
              one state has a free government tool that binds every registered
              broker, {STATES_WITH_LAWS.length - 1} give you a right you exercise
              company by company, and {STATES_WITHOUT_LAWS.length} have no
              comprehensive law at all.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Laws last checked{" "}
              <time dateTime={LAW_DATA_VERIFIED_ON}>
                {formatVerifiedDate(LAW_DATA_VERIFIED_ON)}
              </time>
              . General information, not legal advice.
            </p>
          </header>

          <Link to="/privacy-rights/california" className="group block mb-10">
            <Card className="border-accent/40 bg-gradient-to-br from-accent/5 via-background to-primary/5 transition-colors group-hover:border-accent/70">
              <CardContent className="p-6">
                <Badge variant="secondary" className="mb-2">Strongest rights in the US</Badge>
                <h2 className="text-xl font-bold mb-1">California</h2>
                <p className="text-sm text-muted-foreground">
                  The only state with a centralised deletion platform. One free
                  request obliges every registered data broker to delete your
                  information — brokers have been required to act on it since
                  1 August 2026.
                </p>
                <span className="text-sm text-primary inline-flex items-center mt-3">
                  See California rights
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </CardContent>
            </Card>
          </Link>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">
              States with a comprehensive privacy law ({STATES_WITH_LAWS.length})
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              Residents here have a statutory right to demand deletion. Covered
              businesses must respond within a set window.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {STATES_WITH_LAWS.map((s) => (
                <Link key={s.slug} to={`/privacy-rights/${s.slug}`} className="group">
                  <Card className="h-full transition-colors group-hover:border-primary/50">
                    <CardContent className="p-4 flex items-center justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">{s.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {s.law?.abbrev} · {s.law?.effective}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">
              States with a data broker register ({REGISTRY_STATES.length})
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              These states require data brokers to declare themselves publicly,
              which tells you who is trading in personal information.
            </p>
            <div className="flex flex-wrap gap-2">
              {REGISTRY_STATES.map((s) => (
                <Link key={s.slug} to={`/privacy-rights/${s.slug}`}>
                  <Button variant="outline" size="sm">{s.name}</Button>
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">
              States without a comprehensive law ({STATES_WITHOUT_LAWS.length})
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              No statewide right to demand deletion — but every major data broker
              still offers a free opt-out to anyone who asks, and those opt-outs
              are what actually removes your listings.
            </p>
            <div className="flex flex-wrap gap-2">
              {STATES_WITHOUT_LAWS.map((s) => (
                <Link key={s.slug} to={`/privacy-rights/${s.slug}`}>
                  <Button variant="outline" size="sm">{s.name}</Button>
                </Link>
              ))}
            </div>
          </section>

          <div className="text-center">
            <Link to="/free-scan">
              <Button size="lg" className="gap-2 cta-shimmer">
                See what's exposed about you — free
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
