import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RelatedBroker {
  slug: string;
  name: string;
  opt_out_difficulty: string | null;
  opt_out_time_estimate: string | null;
}

interface RelatedBrokersProps {
  currentSlug: string;
  /** How many to show. Default 6. */
  limit?: number;
}

/**
 * SEO internal-linking block: shows other broker removal guides on each
 * /remove-from/:slug page. Boosts crawl depth, dwell time, and rankings.
 */
export function RelatedBrokers({ currentSlug, limit = 6 }: RelatedBrokersProps) {
  const [items, setItems] = useState<RelatedBroker[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("data_brokers")
        .select("slug,name,opt_out_difficulty,opt_out_time_estimate")
        .eq("is_active", true)
        .neq("slug", currentSlug)
        .order("priority", { ascending: false })
        .order("name", { ascending: true })
        .limit(limit);
      if (cancelled) return;
      setItems((data ?? []) as RelatedBroker[]);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentSlug, limit]);

  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-2xl font-bold mb-2">
        Also remove yourself from these brokers
      </h2>
      <p className="text-sm text-muted-foreground mb-4">
        Each one publishes a different slice of your data. Removing one doesn't
        affect the rest.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((b) => (
          <Link
            key={b.slug}
            to={`/remove-from/${b.slug}`}
            className="block group"
          >
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">
                    Remove from {b.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {b.opt_out_difficulty ?? "medium"} · {b.opt_out_time_estimate ?? "~10 min"}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-4">
        <Link
          to="/remove-from"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          See all removal guides
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
