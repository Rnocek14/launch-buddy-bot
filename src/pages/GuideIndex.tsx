import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, BookOpen } from "lucide-react";
import { GUIDES, type GuideCategory } from "@/data/guides";

const CATEGORY_ORDER: { key: GuideCategory; label: string; blurb: string }[] = [
  {
    key: "Discovery",
    label: "Start here: who has your information",
    blurb: "Find out why your details are online and who's holding them.",
  },
  {
    key: "Education",
    label: "Understand the threat",
    blurb: "How data brokers, doxxing, spam calls and identity theft actually work.",
  },
  {
    key: "Google Removal",
    label: "Remove yourself from Google",
    blurb: "Take your name, address, phone number and images out of search results.",
  },
  {
    key: "Removal",
    label: "Remove yourself everywhere",
    blurb: "Full playbooks for getting your data off the internet for good.",
  },
];
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

          <div className="space-y-12">
            {CATEGORY_ORDER.map((cat) => {
              const guides = GUIDES.filter((g) => g.category === cat.key);
              if (guides.length === 0) return null;
              return (
                <section key={cat.key}>
                  <div className="mb-4">
                    <h2 className="text-xl md:text-2xl font-bold">{cat.label}</h2>
                    <p className="text-sm text-muted-foreground">{cat.blurb}</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {guides.map((g) => (
                      <Link key={g.slug} to={`/guides/${g.slug}`} className="group">
                        <Card className="h-full transition-colors group-hover:border-primary/50">
                          <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold leading-snug">{g.h1}</h3>
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
                </section>
              );
            })}
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
