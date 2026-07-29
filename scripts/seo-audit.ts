// Static SEO audit over the prerendered output in dist/.
//
// Run after a build:  npm run seo:audit
//
// This exists because the failures that matter most are the boring ones —
// a title that truncates, a canonical pointing at the wrong URL, a page that
// ships no internal links, a JSON-LD block that stopped parsing. None of them
// break the build, none show up in a browser, and all of them cost rankings.
//
// Exits non-zero when it finds an error-level issue, so it can gate a deploy.

import { readdirSync, readFileSync, statSync, existsSync } from "fs";
import { join, relative, resolve } from "path";

const ROOT = resolve(".");
const DIST = join(ROOT, "dist");

/** Google truncates titles past roughly this, and descriptions past ~160. */
const MAX_TITLE = 65;
const MIN_TITLE = 25;
const MAX_DESC = 160;
const MIN_DESC = 70;
/** Below this a prerendered page is too thin to compete for anything. */
const MIN_WORDS = 250;
/** A page with fewer outbound links than this is close to a crawl dead end. */
const MIN_LINKS = 5;

/**
 * Pages exempt from the word/link floors. Hubs are short by design and legal
 * pages are not ranking targets — flagging them every run trains people to
 * ignore the output.
 */
const THIN_OK = new Set([
  "/vs",
  "/remove",
  "/privacy-rights",
  "/for",
  "/guides",
  "/delete",
  "/breach",
  "/remove-from",
  "/privacy",
  "/terms",
  "/free-scan",
  "/parents",
  "/enterprise",
  "/help",
  "/pricing",
]);

type Level = "error" | "warn";
const issues: { level: Level; route: string; msg: string }[] = [];
const add = (level: Level, route: string, msg: string) =>
  issues.push({ level, route, msg });

const decode = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

function collectPages(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectPages(full, out);
    else if (entry === "index.html") out.push(full);
  }
  return out;
}

if (!existsSync(DIST)) {
  console.error("[seo-audit] dist/ not found — run `npm run build` first.");
  process.exit(1);
}

// Routes the app actually serves, for validating internal links.
const app = readFileSync(join(ROOT, "src/App.tsx"), "utf8");
const routePatterns = Array.from(app.matchAll(/<Route\s+path="([^"]+)"/g)).map(
  (m) => m[1],
);
const staticRoutes = new Set(
  routePatterns.filter((r) => !r.includes(":") && r !== "*"),
);
const dynamicRoutes = routePatterns
  .filter((r) => r.includes(":"))
  .map((r) => new RegExp("^" + r.replace(/:[^/]+/g, "[^/]+") + "$"));

const pages = collectPages(DIST);
/** dist/foo/index.html -> "/foo"; dist/index.html -> "/" */
const routeOf = (file: string) =>
  "/" + relative(DIST, file).replace(/index\.html$/, "").replace(/\/$/, "");
const titles = new Map<string, string[]>();
const descs = new Map<string, string[]>();
const brokenLinks = new Map<string, Set<string>>();
const wordCounts: number[] = [];

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const route = routeOf(file);
  const start = html.indexOf('<div id="root">');
  const end = html.indexOf("</body>");
  const body = start >= 0 && end > start ? html.slice(start, end) : "";
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  wordCounts.push(words);

  const title = decode((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] ?? "");
  const desc = decode(
    (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] ?? "",
  );
  const canonical =
    (html.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] ?? "";

  if (!title) add("error", route, "missing <title>");
  else if (title.length > MAX_TITLE)
    add("warn", route, `title ${title.length} chars (truncates past ${MAX_TITLE})`);
  else if (title.length < MIN_TITLE)
    add("warn", route, `title only ${title.length} chars`);

  if (!desc) add("error", route, "missing meta description");
  else if (desc.length > MAX_DESC)
    add("warn", route, `description ${desc.length} chars (truncates past ${MAX_DESC})`);
  else if (desc.length < MIN_DESC)
    add("warn", route, `description only ${desc.length} chars`);

  if (!canonical) add("error", route, "missing canonical");
  else if (!canonical.endsWith(route === "/" ? "/" : route))
    add("error", route, `canonical points elsewhere: ${canonical}`);

  const h1s = (body.match(/<h1[ >]/g) || []).length;
  if (h1s !== 1) add("error", route, `${h1s} <h1> tags (want exactly 1)`);

  if (!THIN_OK.has(route)) {
    if (words < MIN_WORDS)
      add("warn", route, `only ${words} words of prerendered body`);
    if (new Set(Array.from(body.matchAll(/href="(\/[^"]*)"/g)).map((m) => m[1])).size < MIN_LINKS)
      add("warn", route, "fewer than 5 internal links — near dead end for crawlers");
  }

  for (const block of html.matchAll(
    /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g,
  )) {
    try {
      JSON.parse(block[1]);
    } catch {
      add("error", route, "malformed JSON-LD block");
    }
  }

  if (!/og:image" content=/.test(html)) add("warn", route, "no og:image");
  if (!/og:image:width/.test(html)) add("warn", route, "no og:image dimensions");

  if (title) titles.set(title, [...(titles.get(title) ?? []), route]);
  if (desc) descs.set(desc, [...(descs.get(desc) ?? []), route]);

  // Internal links must resolve to a real route or a prerendered file.
  for (const m of body.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = (m[1].replace(/\/$/, "") || "/") as string;
    if (href.startsWith("/assets/") || /\.\w{2,5}$/.test(href)) continue;
    const ok =
      staticRoutes.has(href) ||
      dynamicRoutes.some((re) => re.test(href)) ||
      existsSync(join(DIST, href.slice(1), "index.html"));
    if (!ok) {
      if (!brokenLinks.has(href)) brokenLinks.set(href, new Set());
      brokenLinks.get(href)!.add(route);
    }
  }
}

for (const [title, routes] of titles)
  if (routes.length > 1)
    add("error", routes.join(", "), `duplicate title: "${title.slice(0, 60)}"`);
for (const [desc, routes] of descs)
  if (routes.length > 1)
    add("error", routes.join(", "), `duplicate description: "${desc.slice(0, 60)}"`);
for (const [href, from] of brokenLinks)
  add("error", [...from][0], `link to non-existent route ${href}`);

/**
 * Every URL we submit in the sitemap must have prerendered HTML behind it.
 *
 * This check exists because /breach and /breach/:slug sat in the sitemap for
 * months with no prerender route: the URLs were submitted to search engines
 * and served an empty <div id="root"> to anything that did not run JavaScript.
 * Nothing else in the pipeline noticed, because each half was individually
 * correct — the sitemap listed real routes, and the prerenderer rendered
 * everything it was asked to. Only the join between them was wrong.
 *
 * Two exemptions, both legitimate:
 *   - /remove-from/* comes from Supabase, which is unreachable from sandboxes
 *     and CI. Those pages exist in a production build.
 *   - /results/* are user-generated share links, deliberately dynamic.
 */
const SITEMAP_PRERENDER_EXEMPT = [/^\/remove-from\//, /^\/results\//];

const sitemapPath = join(ROOT, "public/sitemap.xml");
if (existsSync(sitemapPath)) {
  const sitemap = readFileSync(sitemapPath, "utf8");
  const locs = Array.from(
    sitemap.matchAll(/<loc>https:\/\/footprintfinder\.co(\/[^<]*)<\/loc>/g),
  ).map((m) => m[1].replace(/\/$/, "") || "/");
  const rendered = new Set(pages.map(routeOf));
  const missing = locs.filter(
    (loc) =>
      !rendered.has(loc) && !SITEMAP_PRERENDER_EXEMPT.some((re) => re.test(loc)),
  );
  for (const loc of missing)
    add("error", loc, "in sitemap.xml but has no prerendered HTML");
}

wordCounts.sort((a, b) => a - b);
const median = wordCounts[Math.floor(wordCounts.length / 2)];
console.log(`[seo-audit] ${pages.length} prerendered pages · median ${median} words`);

const errors = issues.filter((i) => i.level === "error");
const warns = issues.filter((i) => i.level === "warn");

for (const group of [errors, warns]) {
  if (!group.length) continue;
  console.log(`\n${group[0].level.toUpperCase()} (${group.length}):`);
  for (const i of group) console.log(`  ${i.route.padEnd(46)} ${i.msg}`);
}

if (!issues.length) console.log("\nNo issues.");
if (errors.length) {
  console.error(`\n[seo-audit] ${errors.length} error(s) — failing.`);
  process.exit(1);
}
