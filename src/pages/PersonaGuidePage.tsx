import { useParams, Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSEO } from "@/hooks/useSEO";
import { ServiceComparisonLinks } from "@/components/ServiceComparisonLinks";
import { ArrowRight, ShieldCheck, XCircle, AlertTriangle } from "lucide-react";
import { getPersonaGuide, PERSONA_GUIDES } from "@/data/personas";
import { getDataTypeGuide } from "@/data/dataTypes";
import { getGuide } from "@/data/guides";
import { CONTENT_YEAR } from "@/data/competitors";

const SITE_URL = "https://footprintfinder.co";

/**
 * /for/:slug — removal guidance for a specific situation.
 *
 * `leadWith` renders above everything else, including any mention of paid
 * options. For survivors and public officials that block is a free legal
 * protection that beats our product, and it stays at the top regardless of
 * what that does to conversion.
 */
export default function PersonaGuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getPersonaGuide(slug) : undefined;
  const canonical = guide ? `${SITE_URL}/for/${guide.slug}` : undefined;

  useSEO({
    title: guide ? guide.title : "Data removal by situation",
    description: guide?.description ?? "Personal data removal guidance by situation.",
    canonical,
    ogType: "article",
    jsonLd: guide
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.h1,
            description: guide.description,
            image: `${SITE_URL}/og-image.png`,
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
              { "@type": "ListItem", position: 2, name: "By situation", item: `${SITE_URL}/for` },
              { "@type": "ListItem", position: 3, name: guide.audience, item: canonical },
            ],
          },
        ]
      : undefined,
  });

  if (!slug || !guide) return <Navigate to="/for" replace />;

  const others = PERSONA_GUIDES.filter((g) => g.slug !== guide.slug);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <article className="container max-w-3xl mx-auto">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/for" className="hover:text-foreground">By situation</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground capitalize">{guide.audience}</span>
          </nav>

          <header className="mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">{guide.h1}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{guide.intro}</p>
          </header>

          {/* The strongest protection available, above everything else. */}
          {guide.leadWith && (
            <Card className="mb-10 border-accent/50 bg-accent/5">
              <CardContent className="p-5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-bold mb-2">{guide.leadWith.heading}</h2>
                  <p className="text-sm leading-relaxed">{guide.leadWith.body}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">
              Why {guide.audience} are exposed differently
            </h2>
            <ul className="space-y-2">
              {guide.whyExposed.map((w) => (
                <li key={w} className="text-sm text-muted-foreground pl-4 border-l-2 border-border">{w}</li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">What to do, in order</h2>
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

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">What not to do</h2>
            <ul className="space-y-3">
              {guide.pitfalls.map((pit) => (
                <li key={pit} className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-destructive/60 flex-shrink-0 mt-1" />
                  <span className="text-sm leading-relaxed">{pit}</span>
                </li>
              ))}
            </ul>
          </section>

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
                General information, not legal advice. Protections and eligibility
                vary by state — see{" "}
                <Link to="/privacy-rights" className="underline hover:text-foreground">
                  your rights where you live
                </Link>{" "}
                for what applies in {CONTENT_YEAR}.
              </p>
            </CardContent>
          </Card>

          {guide.relatedDataTypes.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold mb-4">The data that matters most here</h2>
              <div className="flex flex-wrap gap-2">
                {guide.relatedDataTypes.map((s) => {
                  const d = getDataTypeGuide(s);
                  return d ? (
                    <Link key={s} to={`/remove/${s}`}>
                      <Button variant="outline" size="sm" className="capitalize">{d.dataType}</Button>
                    </Link>
                  ) : null;
                })}
              </div>
            </section>
          )}

          <ServiceComparisonLinks className="mb-10" />

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">Guidance for other situations</h2>
            <div className="flex flex-wrap gap-2">
              {others.map((g) => (
                <Link key={g.slug} to={`/for/${g.slug}`}>
                  <Button variant="outline" size="sm" className="capitalize">{g.audience}</Button>
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
              <h2 className="text-2xl font-bold mb-3">See what's exposed right now</h2>
              <p className="text-muted-foreground mb-5 max-w-xl mx-auto">
                Free scan, no credit card. Find the breaches, broker listings and
                forgotten accounts tied to your email before deciding what to do.
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
