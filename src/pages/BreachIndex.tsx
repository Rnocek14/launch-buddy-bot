import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldAlert } from "lucide-react";
import {
  BREACHES_BY_DATE,
  UNIVERSAL_BREACH_STEPS,
  SEVERITY_LABEL,
} from "@/data/breachEvents";
import { useSEO } from "@/hooks/useSEO";

const SITE_URL = "https://footprintfinder.co";

export default function BreachIndex() {
  useSEO({
    title: "Major Data Breaches — Check If Your Email Was Exposed",
    description:
      "Equifax, Yahoo, Marriott, T-Mobile, 23andMe, Change Healthcare and more — what each breach exposed, why it still matters, and what to do about it now.",
    canonical: `${SITE_URL}/breach`,
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Major data breaches and what to do about them",
        itemListElement: BREACHES_BY_DATE.map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${b.company} breach (${b.date})`,
          url: `${SITE_URL}/breach/${b.slug}`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Data breaches", item: `${SITE_URL}/breach` },
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
            <ShieldAlert className="w-10 h-10 text-accent mx-auto mb-3" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Major data breaches</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              News coverage of a breach lasts about four days. The exposure
              lasts indefinitely — a Social Security number leaked in 2015 is
              still valid today. Each page below covers what was actually
              exposed, what it means for you now rather than on the day it
              broke, and the specific step that matches that kind of data.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {BREACHES_BY_DATE.map((b) => (
              <Link key={b.slug} to={`/breach/${b.slug}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-semibold">{b.company}</h2>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {b.summary.slice(0, 140)}…
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted">{b.date}</span>
                      <span className="px-2 py-0.5 rounded bg-muted">{b.affected}</span>
                    </div>
                    {b.severity && (
                      <p className="text-xs text-muted-foreground mt-3">
                        {SEVERITY_LABEL[b.severity]}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-2">What to do after any breach</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ordered deliberately. The free, permanent control comes first;
              the thing we sell comes last.
            </p>
            <ol className="space-y-5">
              {UNIVERSAL_BREACH_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Also useful</h2>
            <div className="flex flex-wrap gap-2">
              <Link to="/plan">
                <Button variant="outline" size="sm">Build a free removal plan</Button>
              </Link>
              <Link to="/what-they-know">
                <Button variant="outline" size="sm">What big tech knows about you</Button>
              </Link>
              <Link to="/remove-from">
                <Button variant="outline" size="sm">Data-broker opt-out guides</Button>
              </Link>
              <Link to="/privacy-rights">
                <Button variant="outline" size="sm">Your rights by state</Button>
              </Link>
              <Link to="/delete">
                <Button variant="outline" size="sm">Delete unused accounts</Button>
              </Link>
            </div>
          </section>

          <div className="text-center">
            <Link to="/free-scan?src=breach_index">
              <Button size="lg" className="gap-2 cta-shimmer">
                Check my email against known breaches — free
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
