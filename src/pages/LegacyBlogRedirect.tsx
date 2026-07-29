import { useParams, Navigate } from "react-router-dom";

/**
 * The five /blog/footprint-finder-vs-* comparison articles were merged into
 * the /vs/:competitor pages they duplicated. Two self-canonical pages
 * competing for the same query split their own signals and left neither
 * complete — the articles had the prose, the /vs pages had the feature
 * matrix and the internal links.
 *
 * Real requests are 301'd at the edge (netlify.toml, vercel.json,
 * public/_redirects). This component only covers client-side navigation to a
 * legacy path, and keeps the mapping in one place next to the route.
 */
const LEGACY_BLOG_REDIRECTS: Record<string, string> = {
  "footprint-finder-vs-incogni": "/vs/incogni",
  "footprint-finder-vs-deleteme": "/vs/deleteme",
  "footprint-finder-vs-optery": "/vs/optery",
  "footprint-finder-vs-mine": "/vs/mine",
  "footprint-finder-vs-aura": "/vs/aura",
};

export default function LegacyBlogRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const target = slug ? LEGACY_BLOG_REDIRECTS[slug.toLowerCase()] : undefined;
  return <Navigate to={target ?? "/vs"} replace />;
}
