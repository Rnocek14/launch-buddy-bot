import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { COMPETITORS } from "@/data/competitors";
import { HEAD_TO_HEADS } from "@/data/headToHead";

/**
 * Bridge from the informational clusters (/guides/*, /remove-from/*) into the
 * commercial-investigation cluster (/vs/*, /best-data-removal-services).
 *
 * Why this exists: the guide and broker pages are the site's biggest pools of
 * pages and the ones most likely to earn links, but nothing on them pointed at
 * the comparison pages. New URLs with no internal links from established pages
 * take far longer to get crawled, indexed and ranked.
 *
 * It also matches the actual reading order. Someone working through a manual
 * opt-out guide is exactly the person who is about to wonder whether paying
 * somebody would be easier — answering that on the page is useful, not a
 * detour.
 */
export function ServiceComparisonLinks({
  /** Narrows the copy when rendered on a specific broker's opt-out page. */
  brokerName,
  className,
}: {
  brokerName?: string;
  className?: string;
}) {
  // Rotate the featured pairs by name so different pages surface different
  // links rather than every page pointing at the same two URLs.
  const seed = (brokerName ?? "").length;
  const pairs = [
    HEAD_TO_HEADS[0],
    HEAD_TO_HEADS[(seed + 1) % HEAD_TO_HEADS.length],
    HEAD_TO_HEADS[(seed + 4) % HEAD_TO_HEADS.length],
  ].filter((p, i, all) => all.findIndex((o) => o.slug === p.slug) === i);

  return (
    <section className={className}>
      <h2 className="text-xl font-bold mb-2">Rather not do this manually?</h2>
      <p className="text-sm text-muted-foreground mb-4">
        {brokerName
          ? `The ${brokerName} opt-out above is free and takes a few minutes — but you'll need to repeat it across dozens of brokers, and again every few months when they re-list you. `
          : "Every opt-out on this site is free to do yourself. The catch is that brokers re-list you within months, so it's a recurring job rather than a one-off. "}
        These services handle the repetition for you:
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to="/best-data-removal-services">
          <Button variant="outline" size="sm">
            Best data removal services compared
          </Button>
        </Link>
        {/* Californians can do this for free through the state. Saying so
            costs us conversions and is the single most useful thing on the
            page for a third of US visitors. */}
        <Link to="/guides/california-drop-delete-act">
          <Button variant="outline" size="sm">
            In California? Delete from all brokers free
          </Button>
        </Link>
        {pairs.map((pair) => (
          <Link key={pair.slug} to={`/vs/${pair.slug}`}>
            <Button variant="outline" size="sm">
              {COMPETITORS[pair.a]?.name} vs {COMPETITORS[pair.b]?.name}
            </Button>
          </Link>
        ))}
        <Link to="/vs">
          <Button variant="ghost" size="sm" className="gap-1">
            All comparisons
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
