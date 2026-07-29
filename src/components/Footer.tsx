import { Link } from "react-router-dom";
import { BrandMark } from "./BrandMark";

/**
 * Site-wide footer. This is the only global entry point into the SEO content
 * clusters, so every indexable hub must appear here — /guides, /vs, /delete,
 * /breach and /remove-from were previously reachable only from sitemap.xml,
 * which left ~50 pages orphaned in the internal link graph.
 *
 * Uses <Link> rather than <a> so navigation stays client-side; crawlers still
 * see real hrefs in the prerendered HTML.
 */
const COLUMNS: { heading: string; links: { to: string; label: string }[] }[] = [
  {
    heading: "Find your exposure",
    links: [
      { to: "/free-scan", label: "Free exposure scan" },
      { to: "/parents", label: "Parent scan" },
      { to: "/breach", label: "Recent data breaches" },
      { to: "/demo", label: "Interactive demo" },
      { to: "/extension", label: "Browser extension" },
    ],
  },
  {
    heading: "Remove your data",
    links: [
      { to: "/plan", label: "Free removal plan builder" },
      { to: "/remove", label: "Remove data by type" },
      { to: "/privacy-rights", label: "Your rights by state" },
      { to: "/for", label: "Guidance by situation" },
      { to: "/guides/california-drop-delete-act", label: "California DROP (free)" },
      { to: "/remove-from", label: "Data broker opt-out guides" },
      { to: "/delete", label: "Delete your accounts" },
      { to: "/guides", label: "Privacy removal guides" },
      { to: "/who-has-my-data", label: "Who has my data?" },
    ],
  },
  {
    heading: "Compare & learn",
    links: [
      { to: "/best-data-removal-services", label: "Best data removal services" },
      { to: "/vs", label: "All service comparisons" },
      { to: "/vs/deleteme-vs-incogni", label: "DeleteMe vs Incogni" },
      { to: "/pricing", label: "Pricing" },
      { to: "/enterprise", label: "For businesses" },
      { to: "/help", label: "Help center" },
    ],
  },
  {
    heading: "Company",
    links: [
      { to: "/affiliates", label: "Affiliate program" },
      { to: "/status", label: "System status" },
      { to: "/privacy", label: "Privacy policy" },
      { to: "/terms", label: "Terms of service" },
    ],
  },
];

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-12 px-4">
      <div className="container max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.2fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <BrandMark className="w-8 h-8 text-foreground" />
              <span className="font-bold text-xl">
                Footprint <span className="text-accent">Finder</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground tracking-wide uppercase">
              Find it. Remove it.{" "}
              <span className="text-accent font-semibold">Protect</span> your privacy.
            </p>
            <a
              href="mailto:support@footprintfinder.co"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              support@footprintfinder.co
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h2 className="text-sm font-semibold mb-3">{col.heading}</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mt-10 pt-6 border-t border-border/50">
          © 2026 Footprint Finder. Built with privacy in mind.
        </p>
      </div>
    </footer>
  );
};
