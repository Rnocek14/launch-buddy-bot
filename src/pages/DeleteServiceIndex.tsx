import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Trash2 } from "lucide-react";
import { DELETE_GUIDES } from "@/data/deleteGuides";
import { useSEO } from "@/hooks/useSEO";

export default function DeleteServiceIndex() {
  useSEO({
    title: "How to Delete Your Account — Step-by-Step Guides | Footprint Finder",
    description:
      "Free step-by-step guides for permanently deleting your Facebook, Instagram, Amazon, LinkedIn, Spotify and more. Plus a free scan to find every account linked to your email.",
    canonical: "https://footprintfinder.co/delete",
    ogType: "website",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <header className="text-center mb-10">
            <Trash2 className="w-10 h-10 text-primary mx-auto mb-3" />
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              How to delete any online account
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Free, accurate, no-fluff guides for permanently closing your accounts.
              Don't remember all of them?{" "}
              <Link to="/free-scan" className="text-primary underline">
                Scan your inbox in 30 seconds
              </Link>.
            </p>
          </header>

          <div className="grid sm:grid-cols-2 gap-4">
            {DELETE_GUIDES.map((g) => (
              <Link key={g.slug} to={`/delete/${g.slug}`} className="group">
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-semibold">Delete {g.service}</h2>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{g.intro.slice(0, 110)}…</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-muted">{g.category}</span>
                      <span className="px-2 py-0.5 rounded bg-muted">{g.difficulty}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {g.timeEstimate}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link to="/free-scan">
              <Button size="lg" className="gap-2 cta-shimmer">
                Find every account linked to your email
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
