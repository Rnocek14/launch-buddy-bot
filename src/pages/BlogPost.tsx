import { Link, useParams, Navigate } from "react-router-dom";
import { getPostBySlug, BLOG_POSTS } from "@/data/blogPosts";
import { useSEO } from "@/hooks/useSEO";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

const SITE_URL = "https://footprintfinder.co";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPostBySlug(slug) : undefined;

  useSEO({
    title: post ? `${post.title} | Footprint Finder` : "Article | Footprint Finder",
    description: post?.description ?? "Privacy tool comparison.",
    canonical: post ? `${SITE_URL}/blog/${post.slug}` : `${SITE_URL}/blog`,
    jsonLd: post
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.publishedAt,
          author: { "@type": "Organization", name: "Footprint Finder" },
          publisher: {
            "@type": "Organization",
            name: "Footprint Finder",
            url: SITE_URL,
          },
          mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
        }
      : undefined,
  });

  if (!post) return <Navigate to="/blog" replace />;

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <article className="container max-w-3xl py-12 px-4">
          <Link
            to="/blog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            All comparisons
          </Link>

          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">vs {post.competitor}</Badge>
              <span className="text-sm text-muted-foreground">
                {post.readMinutes} min read · Updated {new Date(post.publishedAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{post.title}</h1>
            <p className="text-lg text-muted-foreground">{post.description}</p>
          </header>

          <div className="rounded-lg border-l-4 border-accent bg-accent/5 p-5 mb-10">
            <div className="text-xs uppercase tracking-wide text-accent font-semibold mb-2">
              TL;DR
            </div>
            <p className="text-base">{post.tldr}</p>
          </div>

          {post.sections.map((section, i) => (
            <section key={i} className="mb-10">
              <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>
              {section.body.map((para, j) => (
                <p key={j} className="text-base leading-relaxed mb-4 text-foreground/90">
                  {para}
                </p>
              ))}
            </section>
          ))}

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Side-by-side comparison</h2>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-semibold">Feature</th>
                    <th className="text-left p-3 font-semibold text-primary">Footprint Finder</th>
                    <th className="text-left p-3 font-semibold">{post.competitor}</th>
                  </tr>
                </thead>
                <tbody>
                  {post.comparisonTable.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3 font-medium">{row.feature}</td>
                      <td className="p-3 text-foreground/90">
                        <div className="flex items-start gap-2">
                          {row.us.toLowerCase().startsWith("yes") || row.us.includes("✓") ? (
                            <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          ) : row.us.toLowerCase() === "no" ? (
                            <X className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          ) : null}
                          <span>{row.us}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        <div className="flex items-start gap-2">
                          {row.them.toLowerCase().startsWith("yes") ? (
                            <Check className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          ) : row.them.toLowerCase() === "no" ? (
                            <X className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          ) : null}
                          <span>{row.them}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10 rounded-lg bg-muted/30 p-6">
            <h2 className="text-2xl font-bold mb-3">Our verdict</h2>
            <p className="text-base leading-relaxed">{post.verdict}</p>
          </section>

          <section className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Try Footprint Finder free</h2>
            <p className="text-muted-foreground mb-5">
              See exactly what's exposed about you in 60 seconds. No credit card.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/free-scan">
                <Button size="lg">
                  Start free scan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/#pricing">
                <Button size="lg" variant="outline">
                  See pricing
                </Button>
              </Link>
            </div>
          </section>
        </article>

        <section className="border-t bg-muted/20 py-12">
          <div className="container max-w-5xl px-4">
            <h2 className="text-2xl font-bold mb-6">More comparisons</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {otherPosts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="block rounded-lg border bg-background p-5 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <Badge variant="secondary" className="text-xs mb-2">
                    vs {p.competitor}
                  </Badge>
                  <h3 className="font-semibold mb-2 leading-snug">{p.title}</h3>
                  <span className="text-sm text-primary inline-flex items-center">
                    Read <ArrowRight className="w-3 h-3 ml-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
