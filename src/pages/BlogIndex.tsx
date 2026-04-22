import { Link } from "react-router-dom";
import { BLOG_POSTS } from "@/data/blogPosts";
import { useSEO } from "@/hooks/useSEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ArrowRight, BookOpen } from "lucide-react";

const SITE_URL = "https://footprintfinder.co";

export default function BlogIndex() {
  useSEO({
    title: "Privacy Tool Comparisons & Guides | Footprint Finder Blog",
    description:
      "Honest comparisons of privacy services: Incogni, DeleteMe, Optery, Mine, Aura. Pick the right tool for your digital footprint cleanup.",
    canonical: `${SITE_URL}/blog`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: "Footprint Finder Blog",
      url: `${SITE_URL}/blog`,
      description: "Comparisons and guides for privacy and digital footprint tools.",
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container max-w-5xl py-12 px-4">
        <header className="mb-12 text-center">
          <Badge variant="outline" className="mb-4">
            <BookOpen className="w-3 h-3 mr-1" />
            Privacy guides
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Tool Comparisons
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Honest, up-to-date comparisons of privacy services. We tell you when competitors are the better fit — because trust matters more than conversions.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="group">
              <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      vs {post.competitor}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {post.readMinutes} min read
                    </span>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {post.title}
                  </CardTitle>
                  <CardDescription>{post.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    <span className="font-semibold text-foreground">TL;DR: </span>
                    {post.tldr}
                  </p>
                  <span className="inline-flex items-center text-sm text-primary font-medium">
                    Read comparison
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <section className="mt-16 text-center bg-muted/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-3">Ready to clean up your digital footprint?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Free scan finds every account in your inbox. No credit card required.
          </p>
          <Link
            to="/free-scan"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            Start free scan
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
