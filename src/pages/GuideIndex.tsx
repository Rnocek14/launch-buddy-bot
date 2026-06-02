import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import { GUIDES } from "@/data/guides";
import { useSEO } from "@/hooks/useSEO";

export default function GuideIndex() {
  useSEO({
    title: "Privacy Guides — Remove Your Information From the Internet | Footprint Finder",
    description:
      "Free, step-by-step guides to removing your personal information from the internet, Google and data brokers. Plus a 60-second scan to find where you're exposed.",
    canonical: "https://footprintfinder.co/guides",
    ogType: "website",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <header className="text-center mb-10">
            <BookOpen className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Privacy & data removal guides
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Free, no-fluff guides to removing your personal information from the
              internet. Not sure where you're exposed?{" "}
              <Link to="/free-scan" className="text-primary underline">
                Scan your email in 60 seconds
              </Link>
              .
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-4">
            {GUIDES.map((g) => (
              <Link key={g.slug} to={`/guides/${g.slug}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-semibold leading-snug">{g.h1}</h2>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {g.description.slice(0, 120)}…
                    </p>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {g.readTime}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/free-scan">
              <Button size="lg" className="gap-2 cta-shimmer">
                Find where your information is exposed
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
