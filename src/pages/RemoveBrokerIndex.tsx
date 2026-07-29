import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Clock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ServiceComparisonLinks } from "@/components/ServiceComparisonLinks";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";

interface BrokerListItem {
  slug: string;
  name: string;
  opt_out_difficulty: string | null;
  opt_out_time_estimate: string | null;
  priority: string;
}

/**
 * Hub page listing all available broker removal guides.
 * This is the SEO sitemap-style index that links into every /remove-from/:slug page.
 */
export default function RemoveBrokerIndex() {
  const [brokers, setBrokers] = useState<BrokerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";

  // The WebSite SearchAction in index.html declares this URL as the site's
  // search endpoint. Reading ?q= here is what makes that declaration true —
  // schema describing a search that doesn't exist is a structured-data error.
  useSEO({
    title: "Remove Yourself from Data Brokers — Free Opt-Out Guides",
    description:
      "Free step-by-step opt-out guides for 45+ US data brokers — Spokeo, Whitepages, BeenVerified, Radaris, LexisNexis and more.",
    // Filtered views are the same page with fewer cards, so they always
    // canonicalise to the unfiltered URL and stay out of the index.
    canonical: "https://footprintfinder.co/remove-from",
    ogType: "website",
    noindex: Boolean(query),
  });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brokers;
    return brokers.filter(
      (b) => b.name.toLowerCase().includes(q) || b.slug.includes(q),
    );
  }, [brokers, query]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("data_brokers")
        .select("slug,name,opt_out_difficulty,opt_out_time_estimate,priority")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .order("name", { ascending: true });
      if (cancelled) return;
      setBrokers((data ?? []) as BrokerListItem[]);
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16 px-4">
        <div className="container max-w-5xl mx-auto">
          <header className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Free Removal Guides
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Remove Yourself from Data Brokers
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Step-by-step opt-out guides for 45+ data brokers that publish your
              personal info. Pick a site below — or let us scan your inbox and
              remove you from all of them automatically.
            </p>
            <div className="mt-6">
              <Link to="/free-scan">
                <Button size="lg" className="gap-2 cta-shimmer">
                  Free exposure scan
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </header>

          <div className="max-w-md mx-auto mb-8">
            <label htmlFor="broker-search" className="sr-only">
              Search data brokers
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                id="broker-search"
                type="search"
                value={query}
                placeholder="Search 45+ brokers — Spokeo, Whitepages, Radaris…"
                className="pl-9"
                onChange={(e) => {
                  const v = e.target.value;
                  setParams(v ? { q: v } : {}, { replace: true });
                }}
              />
            </div>
            {query && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {visible.length} of {brokers.length} guides match "{query}"
                {visible.length === 0 && (
                  <>
                    {" — "}
                    <button
                      type="button"
                      className="underline hover:text-foreground"
                      onClick={() => setParams({}, { replace: true })}
                    >
                      clear
                    </button>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <div className="h-5 w-1/2 bg-muted rounded animate-pulse mb-2" />
                      <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                    </CardContent>
                  </Card>
                ))
              : visible.map((b) => (
                  <Link
                    key={b.slug}
                    to={`/remove-from/${b.slug}`}
                    className="block group"
                  >
                    <Card className="h-full transition-colors group-hover:border-primary/50">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-2">
                          <h2 className="font-semibold text-base">
                            Remove from {b.name}
                          </h2>
                          {b.priority === "high" && (
                            <Badge variant="outline" className="text-xs">
                              Priority
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {b.opt_out_difficulty && (
                            <span className="capitalize">
                              {b.opt_out_difficulty}
                            </span>
                          )}
                          {b.opt_out_time_estimate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {b.opt_out_time_estimate}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>

          <ServiceComparisonLinks className="mt-12" />
        </div>
      </main>

      <Footer />
    </div>
  );
}
