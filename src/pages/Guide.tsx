import { useParams, Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, CheckCircle2, Shield } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { trackEvent } from "@/lib/analytics";
import { SeoEmailCapture } from "@/components/SeoEmailCapture";
import { getGuide, getRelatedGuides, getRelatedBrokers } from "@/data/guides";

/**
 * Programmatic SEO pillar page: /guides/:slug
 * Targets the broad "remove my info from the internet" keyword cluster
 * and funnels readers into the free scan.
 */
export default function Guide() {
  const { slug } = useParams<{ slug: string }>();
  const guide = slug ? getGuide(slug) : undefined;

  const canonical = guide
    ? `https://footprintfinder.co/guides/${guide.slug}`
    : undefined;

  const jsonLd = guide
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.h1,
          description: guide.description,
          mainEntityOfPage: canonical,
          author: { "@type": "Organization", name: "Footprint Finder" },
          publisher: { "@type": "Organization", name: "Footprint Finder" },
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
      ]
    : undefined;

  useSEO({
    title: guide?.title ?? "Privacy Guides",
    description:
      guide?.description ?? "Free guides to removing your information online.",
    canonical,
    jsonLd,
  });

  if (!guide) return <Navigate to="/guides" replace />;

  const relatedGuides = getRelatedGuides(guide.slug);
  const relatedBrokers = getRelatedBrokers(guide.slug);


  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <article className="container max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/guides" className="hover:text-foreground">Guides</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{guide.h1}</span>
          </nav>

          <header className="mb-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Clock className="w-3.5 h-3.5" />
              {guide.readTime}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              {guide.h1}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {guide.intro}
            </p>
          </header>

          <div className="mb-10">
            <SeoEmailCapture brokerSlug={guide.slug} brokerName="the internet" />
          </div>

          {guide.sections.map((section, i) => (
            <section key={i} className="mb-8">
              <h2 className="text-2xl font-bold mb-3">{section.heading}</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                {section.body}
              </p>
              {section.bullets && (
                <ul className="space-y-2">
                  {section.bullets.map((b, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {/* FAQ */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Frequently asked questions</h2>
            <div className="space-y-4">
              {guide.faqs.map((f, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-2">{f.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Related guides */}
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4">More privacy guides</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {GUIDES.filter((g) => g.slug !== guide.slug).map((g) => (
                <Link key={g.slug} to={`/guides/${g.slug}`} className="group">
                  <Card className="h-full transition-colors group-hover:border-primary/50">
                    <CardContent className="p-4 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{g.h1}</span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <CardContent className="p-6 md:p-8 text-center">
              <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                See exactly where you're exposed
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Footprint Finder scans your inbox to find every account, broker
                listing and breach tied to your email — then helps you remove it.
              </p>
              <Link
                to="/free-scan"
                onClick={() =>
                  trackEvent("seo_guide_cta_click", { guide_slug: guide.slug })
                }
              >
                <Button size="lg" className="gap-2 cta-shimmer">
                  Scan my exposure in 60 seconds
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-5">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                <span>No credit card · 60-second scan · 50+ brokers covered</span>
              </div>
            </CardContent>
          </Card>
        </article>
      </main>
      <Footer />
    </div>
  );
}
