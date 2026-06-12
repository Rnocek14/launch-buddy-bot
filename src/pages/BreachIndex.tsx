import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { BREACH_EVENTS } from "@/data/breachEvents";
import { useSEO } from "@/hooks/useSEO";

export default function BreachIndex() {
  useSEO({
    title: "Recent Data Breaches — Check If Your Email Was Exposed | Footprint Finder",
    description:
      "Was your email caught in a recent data breach? Check any major breach in 60 seconds — free, no signup. Then find every service still holding your data.",
    canonical: "https://footprintfinder.co/breach",
    ogType: "website",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <header className="text-center mb-10">
            <ShieldAlert className="w-10 h-10 text-accent mx-auto mb-3" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Recent data breaches</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Check if your email was caught in a known breach — free, in 60 seconds. No signup.{" "}
              <Link to="/free-scan" className="text-primary underline">
                Or scan your whole inbox now
              </Link>.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-4">
            {BREACH_EVENTS.map((b) => (
              <Link key={b.slug} to={`/breach/${b.slug}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-semibold">{b.company}</h2>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{b.summary.slice(0, 120)}…</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted">{b.date}</span>
                      <span className="px-2 py-0.5 rounded bg-muted">{b.affected}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/free-scan?src=breach_index">
              <Button size="lg" className="gap-2 cta-shimmer">
                Run my free scan <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
