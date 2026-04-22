import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const COMPETITORS = [
  { slug: "deleteme", name: "DeleteMe", desc: "The original — $129/yr, broker-only" },
  { slug: "incogni", name: "Incogni", desc: "Surfshark-owned — $95/yr, 180+ brokers" },
  { slug: "optery", name: "Optery", desc: "Tiered pricing $39–$249/yr" },
  { slug: "kanary", name: "Kanary", desc: "Reputation-focused — $179/yr" },
  { slug: "mine", name: "Mine", desc: "Free GDPR requests, no real removal" },
];

export default function CompareIndex() {
  useSEO({
    title: "Footprint Finder vs DeleteMe, Incogni, Optery — Honest Comparisons",
    description:
      "Compare Footprint Finder against DeleteMe, Incogni, Optery, Kanary, and Mine. Side-by-side pricing, features, and coverage. Find the best privacy tool for you.",
    canonical: "https://footprintfinder.co/vs",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <header className="text-center mb-10">
            <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Compare privacy services
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Honest, head-to-head comparisons of Footprint Finder vs the major
              data-removal services. Pricing, features, coverage — no fluff.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-4">
            {COMPETITORS.map((c) => (
              <Link key={c.slug} to={`/vs/${c.slug}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-semibold">vs {c.name}</h2>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground">{c.desc}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/free-scan">
              <Button size="lg" className="gap-2 cta-shimmer">
                Run a free scan first
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
