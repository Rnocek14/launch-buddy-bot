import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  Mail,
  ExternalLink,
} from "lucide-react";
import { getBreachEvent } from "@/data/breachEvents";
import { trackEvent } from "@/lib/analytics";
import { useSEO } from "@/hooks/useSEO";

export default function Breach() {
  const { slug = "" } = useParams();
  const breach = getBreachEvent(slug);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useSEO({
    title: breach
      ? `Was your email in the ${breach.company} breach? Check free`
      : "Breach check — Footprint Finder",
    description: breach
      ? `The ${breach.company} breach (${breach.date}) exposed ${breach.affected}. Check in 60 seconds whether your email is affected — free, no signup.`
      : "Check instantly if your email was exposed in a known data breach.",
    canonical: breach
      ? `https://footprintfinder.co/breach/${breach.slug}`
      : "https://footprintfinder.co/breach",
    ogType: "article",
  });

  if (!breach) return <Navigate to="/breach" replace />;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return;
    setSubmitting(true);
    trackEvent("breach_email_capture", { breach_slug: breach.slug });
    navigate(`/free-scan?email=${encodeURIComponent(email)}&src=breach_${breach.slug}`);
  };

  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: `Was your email in the ${breach.company} breach?`,
    datePublished: breach.isoDate,
    description: breach.summary,
    author: { "@type": "Organization", name: "Footprint Finder" },
    publisher: { "@type": "Organization", name: "Footprint Finder" },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What was exposed in the ${breach.company} breach?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `${breach.summary} Confirmed data classes include: ${breach.whatLeaked.join(", ")}.`,
        },
      },
      {
        "@type": "Question",
        name: `How do I know if I was affected by the ${breach.company} breach?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Enter your email on this page to run a free 60-second scan against known breach databases. No signup or password required.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <main className="pt-24 pb-16 px-4">
        <article className="container max-w-3xl mx-auto">
          <Link to="/breach" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> All breach checks
          </Link>

          <header className="mb-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span className="px-2 py-0.5 rounded bg-muted">{breach.date}</span>
              <span className="px-2 py-0.5 rounded bg-muted">{breach.affected}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-start gap-3">
              <ShieldAlert className="w-8 h-8 text-accent flex-shrink-0 mt-1" />
              Was your email in the {breach.company} breach?
            </h1>
            <p className="text-lg text-muted-foreground">{breach.summary}</p>
          </header>

          {/* Email capture — straight into the free scan */}
          <Card className="mb-10 border-primary/40 bg-gradient-to-br from-primary/8 via-background to-accent/8">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1">Check in 60 seconds — free</h2>
                  <p className="text-sm text-muted-foreground">
                    We check your email against known breach databases. No signup, no password.
                  </p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-3">
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
                <Button type="submit" size="lg" disabled={submitting} className="gap-2 cta-shimmer whitespace-nowrap">
                  Check my email <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> No credit card</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> No password</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-accent" /> Results in 60s</span>
              </div>
            </CardContent>
          </Card>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">What was exposed</h2>
            <ul className="space-y-2 text-muted-foreground">
              {breach.whatLeaked.map((k, i) => (
                <li key={i} className="pl-4 border-l-2 border-accent/50">{k}</li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">What to do now</h2>
            <ol className="space-y-4">
              {breach.whatToDo.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <p className="text-muted-foreground pt-1">{step}</p>
                </li>
              ))}
            </ol>
            {breach.source && (
              <a
                href={breach.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-1 text-primary hover:underline text-sm"
              >
                {breach.source.label} <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </section>

          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">One breach is rarely the whole story</h3>
              <p className="text-muted-foreground mb-4">
                The average inbox is tied to 80+ services holding your data. Footprint Finder finds them all in one scan.
              </p>
              <Link to="/free-scan?src=breach_cta">
                <Button size="lg" className="gap-2 cta-shimmer">
                  Run my free scan <ArrowRight className="w-4 h-4" />
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
