import { useParams, Link, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { ServiceComparisonLinks } from "@/components/ServiceComparisonLinks";
import { ArrowRight, Scale, CheckCircle2, Info } from "lucide-react";
import {
  getState,
  STATES,
  stateTier,
  stateVerdict,
  stateSteps,
  stateFaqs,
  COMMON_RIGHTS,
  LAW_DATA_VERIFIED_ON,
} from "@/data/states";
import { CONTENT_YEAR, formatVerifiedDate } from "@/data/competitors";

const SITE_URL = "https://footprintfinder.co";

/**
 * /privacy-rights/:state — what deletion rights a resident actually has.
 *
 * The value here is the honest tiering. A Californian gets pointed at a free
 * state platform that beats our own product; someone in a state with no law
 * gets told so plainly rather than sold a right that doesn't exist.
 */
export default function StateRights() {
  const { state: slug } = useParams<{ state: string }>();
  const state = slug ? getState(slug) : undefined;

  const title = state
    ? `${state.name} Data Privacy Rights: Delete Your Info (${CONTENT_YEAR})`
    : "State privacy rights";
  const description = state
    ? `${state.law ? `${state.name}'s ${state.law.abbrev} gives you a right to delete.` : `${state.name} has no comprehensive privacy law.`} What that means in practice, and how to get your data removed.`
    : "Data deletion rights by state.";
  const canonical = state ? `${SITE_URL}/privacy-rights/${state.slug}` : undefined;
  const faqs = state ? stateFaqs(state) : [];
  const steps = state ? stateSteps(state) : [];

  useSEO({
    title,
    description,
    canonical,
    jsonLd: state
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description,
            image: `${SITE_URL}/og-image.png`,
            dateModified: LAW_DATA_VERIFIED_ON,
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
            mainEntity: faqs.map((f) => ({
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
              { "@type": "ListItem", position: 2, name: "Privacy rights by state", item: `${SITE_URL}/privacy-rights` },
              { "@type": "ListItem", position: 3, name: state.name, item: canonical },
            ],
          },
        ]
      : undefined,
  });

  if (!slug || !state) return <Navigate to="/privacy-rights" replace />;

  const tier = stateTier(state);
  const nearby = STATES.filter((s) => s.slug !== state.slug)
    .filter((s) => (state.law ? Boolean(s.law) : !s.law))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-3xl mx-auto">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/privacy-rights" className="hover:text-foreground">Privacy rights by state</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{state.name}</span>
          </nav>

          <header className="mb-8">
            <Badge variant="outline" className="mb-3">
              <Scale className="w-3 h-3 mr-1" />
              {state.law ? `${state.law.abbrev} · in effect ${state.law.effective}` : "No comprehensive state law"}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              How to delete your personal data in {state.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {stateVerdict(state)}
            </p>
          </header>

          {tier === "centralized" && (
            <Card className="mb-8 border-accent/50 bg-accent/5">
              <CardContent className="p-5">
                <h2 className="font-bold mb-2">Start here: DROP is free</h2>
                <p className="text-sm text-muted-foreground mb-3">
                  California is the only state with a government-run deletion
                  platform. One request, no cost, and every registered broker is
                  obliged to act on it. We sell a competing product and we still
                  think you should do this first.
                </p>
                <Link to="/guides/california-drop-delete-act">
                  <Button size="sm" className="gap-2">
                    How to use DROP
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {state.law && (
            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-3">
                What the {state.law.abbrev} gives you
              </h2>
              <p className="text-base leading-relaxed mb-4 text-foreground/90">
                The {state.law.name} took effect in {state.law.effective}.
                {state.law.note ? ` ${state.law.note}` : ""}
              </p>
              <ul className="space-y-2">
                {COMMON_RIGHTS.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                Exact scope varies — some laws exempt smaller businesses or
                specific sectors. This is general information, not legal advice.
              </p>
            </section>
          )}

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">
              What to do, in order
            </h2>
            <ol className="space-y-5">
              {steps.map((s, i) => (
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

          <ServiceComparisonLinks className="mb-10" />

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">
              {state.name} privacy rights: FAQ
            </h2>
            <div className="space-y-4">
              {faqs.map((f) => (
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
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Law names and effective dates last checked{" "}
                <time dateTime={LAW_DATA_VERIFIED_ON}>
                  {formatVerifiedDate(LAW_DATA_VERIFIED_ON)}
                </time>
                . This page is general information about consumer privacy rights,
                not legal advice — for advice about your situation, speak to a
                lawyer or your state attorney general's office.
              </p>
            </CardContent>
          </Card>

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-4">
              {state.law ? "Other states with privacy laws" : "Other states without a comprehensive law"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {nearby.map((s) => (
                <Link key={s.slug} to={`/privacy-rights/${s.slug}`}>
                  <Button variant="outline" size="sm">{s.name}</Button>
                </Link>
              ))}
              <Link to="/privacy-rights">
                <Button variant="ghost" size="sm" className="gap-1">
                  All 51
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </section>

          <Card className="border-accent/30 bg-gradient-to-br from-accent/5 via-background to-primary/5">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-3">
                See what's actually exposed first
              </h2>
              <p className="text-muted-foreground mb-5 max-w-xl mx-auto">
                Free scan, no credit card. Find the breaches, broker listings and
                forgotten accounts tied to your email before you decide which
                route to take.
              </p>
              <Link to="/free-scan">
                <Button size="lg" className="gap-2 cta-shimmer">
                  Run free scan
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
