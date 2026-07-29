import { useParams, Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import { ServiceComparisonLinks } from "@/components/ServiceComparisonLinks";
import { ArrowRight, AlertTriangle, ShieldAlert } from "lucide-react";
import { getDataTypeGuide, DATA_TYPE_GUIDES } from "@/data/dataTypes";
import { getGuide } from "@/data/guides";
import { CONTENT_YEAR } from "@/data/competitors";

const SITE_URL = "https://footprintfinder.co";

const BROKER_LABELS: Record<string, string> = {
  whitepages: "Whitepages", spokeo: "Spokeo", beenverified: "BeenVerified",
  radaris: "Radaris", mylife: "MyLife", truthfinder: "TruthFinder",
  intelius: "Intelius", peoplefinders: "PeopleFinders", lexisnexis: "LexisNexis",
  acxiom: "Acxiom", instantcheckmate: "Instant Checkmate", infotracer: "InfoTracer",
  truepeoplesearch: "TruePeopleSearch", familytreenow: "FamilyTreeNow",
  voterrecords: "VoterRecords",
};

/**
 * /remove/:slug — removal guidance for one specific type of personal data.
 *
 * The `hardTruth` section is the reason these pages exist. Several of these
 * categories (mugshots, court records, SSNs) are surrounded by services
 * promising deletion that cannot be delivered, and saying so plainly is both
 * the most useful thing on the page and the thing competitors won't write.
 */
export default function DataTypeRemoval() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getDataTypeGuide(slug) : undefined;

  const canonical = guide ? `${SITE_URL}/remove/${guide.slug}` : undefined;

  useSEO({
    title: guide ? guide.title : "Remove your personal data",
    description: guide?.description ?? "How to remove personal information from the internet.",
    canonical,
    ogType: "article",
    jsonLd: guide
      ? [
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: guide.h1,
            description: guide.intro,
            step: guide.steps.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: s.title,
              text: s.body,
            })),
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: guide.faqs.map((f) => ({
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
              { "@type": "ListItem", position: 2, name: "Remove your data", item: `${SITE_URL}/remove` },
              { "@type": "ListItem", position: 3, name: guide.dataType, item: canonical },
            ],
          },
        ]
      : undefined,
  });

  if (!slug || !guide) return <Navigate to="/remove" replace />;

  const others = DATA_TYPE_GUIDES.filter((g) => g.slug !== guide.slug);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <article className="container max-w-3xl mx-auto">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/remove" className="hover:text-foreground">Remove your data</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{guide.dataType}</span>
          </nav>

          <header className="mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{guide.h1}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{guide.intro}</p>
          </header>

          {/* The honest limitation, placed above the steps rather than buried
              at the end — people deserve it before they start spending time. */}
          <Card className="mb-10 border-destructive/30 bg-destructive/5">
            <CardContent className="p-5 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive/70 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-bold mb-2">What you need to know first</h2>
                <p className="text-sm leading-relaxed">{guide.hardTruth}</p>
              </div>
            </CardContent>
          </Card>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-3">
              Where your {guide.dataType} comes from
            </h2>
            <ul className="space-y-2 mb-4">
              {guide.sources.map((s) => (
                <li key={s} className="text-sm text-muted-foreground pl-4 border-l-2 border-border">{s}</li>
              ))}
            </ul>
            <p className="text-base leading-relaxed text-foreground/90">{guide.risk}</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">
              How to remove it, step by step
            </h2>
            <ol className="space-y-5">
              {guide.steps.map((s, i) => (
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

          {guide.brokers.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-2">
                Sites most likely to be publishing it
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Free, step-by-step opt-out instructions for each:
              </p>
              <div className="flex flex-wrap gap-2">
                {guide.brokers.map((b) => (
                  <Link key={b} to={`/remove-from/${b}`}>
                    <Button variant="outline" size="sm">
                      {BROKER_LABELS[b] ?? b} opt out
                    </Button>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
            <div className="space-y-4">
              {guide.faqs.map((f) => (
                <Card key={f.question}>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-2">{f.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Card className="mb-10 border-muted-foreground/20 bg-muted/30">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                General information, not legal advice. Rules on public records
                and removal vary by state — your rights in {CONTENT_YEAR} depend
                on where you live, which we cover{" "}
                <Link to="/privacy-rights" className="underline hover:text-foreground">
                  state by state
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          <ServiceComparisonLinks className="mb-10" />

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Remove other personal data</h2>
            <div className="flex flex-wrap gap-2">
              {others.map((g) => (
                <Link key={g.slug} to={`/remove/${g.slug}`}>
                  <Button variant="outline" size="sm">{g.dataType}</Button>
                </Link>
              ))}
            </div>
          </section>

          {guide.relatedGuides.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold mb-4">Related guides</h2>
              <div className="flex flex-wrap gap-2">
                {guide.relatedGuides.map((s) => {
                  const g = getGuide(s);
                  return g ? (
                    <Link key={s} to={`/guides/${s}`}>
                      <Button variant="outline" size="sm">{g.h1}</Button>
                    </Link>
                  ) : null;
                })}
              </div>
            </section>
          )}

          <Card className="border-accent/30 bg-gradient-to-br from-accent/5 via-background to-primary/5">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-3">Find out what else is exposed</h2>
              <p className="text-muted-foreground mb-5 max-w-xl mx-auto">
                A free scan shows the breaches, broker listings and forgotten
                accounts tied to your email — including the ones feeding your{" "}
                {guide.dataType} back into these databases.
              </p>
              <Link to="/free-scan">
                <Button size="lg" className="gap-2 cta-shimmer">
                  Run free scan
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </article>
      </main>
      <Footer />
    </div>
  );
}
