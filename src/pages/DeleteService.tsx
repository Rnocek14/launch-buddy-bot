import { Link, useParams, Navigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Clock, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getDeleteGuide } from "@/data/deleteGuides";
import { useSEO } from "@/hooks/useSEO";

export default function DeleteService() {
  const { slug = "" } = useParams();
  const guide = getDeleteGuide(slug);

  useSEO({
    title: guide
      ? `How to Delete Your ${guide.service} Account (${new Date().getFullYear()}) — Step-by-Step`
      : "Delete Account Guide — Footprint Finder",
    description: guide
      ? `Permanently delete your ${guide.service} account in ${guide.timeEstimate}. Step-by-step instructions, what data they keep, and common gotchas.`
      : "Step-by-step guide to deleting your online account.",
    canonical: guide ? `https://footprintfinder.co/delete/${guide.slug}` : undefined,
    ogType: "article",
  });

  if (!guide) return <Navigate to="/delete" replace />;

  // JSON-LD HowTo schema
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to delete your ${guide.service} account`,
    description: guide.intro,
    totalTime: guide.timeEstimate,
    step: guide.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.title,
      text: s.body,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <main className="pt-24 pb-16 px-4">
        <article className="container max-w-3xl mx-auto">
          <Link to="/delete" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> All deletion guides
          </Link>

          <header className="mb-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span className="px-2 py-0.5 rounded bg-muted">{guide.category}</span>
              <span className="px-2 py-0.5 rounded bg-muted">{guide.difficulty}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {guide.timeEstimate}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              How to delete your {guide.service} account
            </h1>
            <p className="text-lg text-muted-foreground">{guide.intro}</p>
          </header>

          {/* Inline CTA */}
          <Card className="mb-8 border-primary/30 bg-primary/5">
            <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium mb-1">Not sure which other accounts to clean up?</p>
                <p className="text-sm text-muted-foreground">Scan your inbox in 30s and see every service holding your data.</p>
              </div>
              <Link to="/free-scan">
                <Button className="gap-2 whitespace-nowrap cta-shimmer">
                  Free inbox scan <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Step-by-step</h2>
            <ol className="space-y-4">
              {guide.steps.map((s, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-muted-foreground">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <a href={guide.officialUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-1 text-primary hover:underline">
              Open official {guide.service} deletion page <ExternalLink className="w-4 h-4" />
            </a>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> What {guide.service} keeps after you delete
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              {guide.whatTheyKeep.map((k, i) => (
                <li key={i} className="pl-4 border-l-2 border-border">{k}</li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-accent" /> Common gotchas
            </h2>
            <ul className="space-y-2 text-muted-foreground">
              {guide.gotchas.map((g, i) => (
                <li key={i} className="pl-4 border-l-2 border-accent/50">{g}</li>
              ))}
            </ul>
          </section>

          {/* Bottom CTA */}
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Found one — what about the other 50?</h3>
              <p className="text-muted-foreground mb-4">
                The average inbox has 80+ services with your data. Footprint Finder discovers them all in one scan.
              </p>
              <Link to="/free-scan">
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
