// Runs before Vite dev/build; writes public/sitemap.xml from routes + dynamic SEO data.

import { writeFileSync, readFileSync } from "fs";
import { execFileSync } from "child_process";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://footprintfinder.co";

/**
 * Fallback only. Real <lastmod> values come from git — see gitLastModified().
 * A sitemap that stamps every URL with the same frozen date teaches Google to
 * ignore our lastmod entirely, which is worse than omitting it.
 */
const BUILD_DATE = new Date().toISOString().slice(0, 10);

/**
 * Date of the last commit that touched `file`, as YYYY-MM-DD.
 * Returns undefined on shallow clones or when git is unavailable, in which
 * case we omit <lastmod> rather than invent one.
 */
const gitDateCache = new Map<string, string | undefined>();
function gitLastModified(file: string): string | undefined {
  if (gitDateCache.has(file)) return gitDateCache.get(file);
  let date: string | undefined;
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cs", "--", file], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    date = /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : undefined;
  } catch {
    date = undefined;
  }
  gitDateCache.set(file, date);
  return date;
}
const SUPABASE_URL = "https://gqxkeezkajkiyjpnjgkx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeGtlZXprYWpraXlqcG5qZ2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjM4NDYsImV4cCI6MjA3NzkzOTg0Nn0.64_sr6feszswWrxHBogLYLPZvlnibTY_7ZOFd1l1Vfw";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const routeDefaults: Record<string, Omit<SitemapEntry, "path">> = {
  "/": { changefreq: "weekly", priority: "1.0" },
  "/free-scan": { changefreq: "weekly", priority: "0.95" },
  "/parents": { changefreq: "weekly", priority: "0.9" },
  "/remove-from": { changefreq: "weekly", priority: "0.9" },
  "/pricing": { changefreq: "weekly", priority: "0.85" },
  "/vs": { changefreq: "monthly", priority: "0.85" },
  "/enterprise": { changefreq: "monthly", priority: "0.8" },
  "/blog": { changefreq: "weekly", priority: "0.7" },
  "/guides": { changefreq: "weekly", priority: "0.85" },
  "/delete": { changefreq: "weekly", priority: "0.8" },
  "/breach": { changefreq: "weekly", priority: "0.8" },
  "/who-has-my-data": { changefreq: "monthly", priority: "0.7" },
  "/affiliates": { changefreq: "monthly", priority: "0.5" },
  "/extension": { changefreq: "monthly", priority: "0.7" },
  "/demo": { changefreq: "monthly", priority: "0.6" },
  "/help": { changefreq: "monthly", priority: "0.6" },
  "/status": { changefreq: "yearly", priority: "0.5" },
  "/privacy": { changefreq: "yearly", priority: "0.4" },
  "/terms": { changefreq: "yearly", priority: "0.4" },
};

/**
 * Routes that must NEVER appear in the sitemap.
 *
 * A sitemap is a list of pages we want indexed. Listing a URL here that
 * robots.txt disallows is a direct contradiction — Google Search Console
 * reports it as an error and it dilutes the crawl signal for the ~150 pages
 * we actually want ranked.
 *
 * Three groups:
 *  1. Everything Disallow'd in public/robots.txt (keep the two in sync).
 *  2. Authenticated app surfaces that render nothing useful to a logged-out
 *     crawler.
 *  3. Redirect-only routes (<Navigate/>), which have no content of their own.
 */
const excludedRoutes = new Set([
  // 1. Mirrors public/robots.txt Disallow list.
  "/auth",
  "/dashboard",
  "/admin",
  "/admin/analytics",
  "/unmatched-domains",
  "/settings",
  "/billing",
  "/preferences",
  "/cleanup",
  "/deletion-requests",
  "/email-subscriptions",
  "/reset-password",
  "/payment-success",
  // 2. Authenticated / internal surfaces.
  "/alpha",
  "/authorize",
  "/broker-scan",
  "/debug/discovery",
  "/offboarding",
  "/organization",
  "/subscribe",
  "/unsubscribe",
  "/affiliates/dashboard",
  // 3. Redirect-only routes.
  "/exposure-scan",
  "/scan",
]);

const fallbackBrokerSlugs = ["411", "acxiom", "addresses", "advancedbackgroundchecks", "apollo", "beenverified", "checkpeople", "clustrmaps", "cocofinder", "cyberbackgroundchecks", "epsilon", "familytreenow", "fastpeoplesearch", "idtrue", "infotracer", "instantcheckmate", "intelius", "lead411", "lexisnexis", "mylife", "nuwber", "peekyou", "peoplebyname", "peoplefinders", "peoplelooker", "peoplesearchnow", "persopo", "publicrecords360", "publicrecordsnow", "radaris", "rocketreach", "searchpeoplefree", "smartbackgroundchecks", "spokeo", "thatsthem", "truepeoplesearch", "truthfinder", "usa-people-search", "usphonebook", "voterrecords", "whitepages", "xlek", "yellowpages", "zabasearch", "zoominfo"];
const compareSlugs = ["deleteme", "incogni", "onerep", "privacybee", "easyoptouts", "aura", "optery", "kanary", "mine"];
const deleteGuideSlugs = ["facebook", "instagram", "amazon", "linkedin", "spotify", "twitter", "tiktok", "snapchat", "reddit", "pinterest"];

function getStaticRoutesFromApp() {
  const app = readFileSync(resolve("src/App.tsx"), "utf8");
  return Array.from(app.matchAll(/<Route\s+path="([^"]+)"/g))
    .map((match) => match[1])
    .filter((path) => path !== "*" && !path.includes(":"));
}

function getBlogSlugs() {
  const posts = readFileSync(resolve("src/data/blogPosts.ts"), "utf8");
  return Array.from(posts.matchAll(/slug:\s*"([^"]+)"/g)).map((match) => match[1]);
}

function getGuideSlugs() {
  const guides = readFileSync(resolve("src/data/guides.ts"), "utf8");
  return Array.from(guides.matchAll(/slug:\s*"([^"]+)"/g)).map((match) => match[1]);
}

function getBreachSlugs() {
  const breaches = readFileSync(resolve("src/data/breachEvents.ts"), "utf8");
  return Array.from(breaches.matchAll(/slug:\s*"([^"]+)"/g)).map((match) => match[1]);
}

async function getBrokerSlugs() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("data_brokers")
      .select("slug")
      .eq("is_active", true)
      .order("slug", { ascending: true });

    if (error) throw error;
    const slugs = (data ?? []).map((row) => row.slug).filter(Boolean);
    return slugs.length ? slugs : fallbackBrokerSlugs;
  } catch (error) {
    console.warn("Using fallback broker slugs for sitemap:", error instanceof Error ? error.message : error);
    return fallbackBrokerSlugs;
  }
}

async function getPublicResultEntries() {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.rpc("get_public_result_sitemap_entries");

    if (error) throw error;
    return (data ?? []) as Array<{ share_id: string; created_at: string | null }>;
  } catch (error) {
    console.warn("Skipping public result sitemap entries:", error instanceof Error ? error.message : error);
    return [];
  }
}

function addEntry(entries: Map<string, SitemapEntry>, entry: SitemapEntry) {
  if (excludedRoutes.has(entry.path)) return;
  entries.set(entry.path, {
    changefreq: "yearly",
    priority: "0.1",
    ...entry,
  });
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((entry) => [
    "  <url>",
    `    <loc>${BASE_URL}${escapeXml(entry.path)}</loc>`,
    entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
    entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : null,
    entry.priority ? `    <priority>${entry.priority}</priority>` : null,
    "  </url>",
  ].filter(Boolean).join("\n"));

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    "",
  ].join("\n");
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function main() {
  const entries = new Map<string, SitemapEntry>();

  // Each cluster's <lastmod> tracks the file that actually produces its
  // content, so a data-only edit correctly re-dates just those URLs.
  const appLastmod = gitLastModified("src/App.tsx") ?? BUILD_DATE;
  const blogLastmod = gitLastModified("src/data/blogPosts.ts");
  const guidesLastmod = gitLastModified("src/data/guides.ts");
  const breachLastmod = gitLastModified("src/data/breachEvents.ts");
  const compareLastmod = gitLastModified("src/data/competitors.ts");
  const deleteLastmod = gitLastModified("src/data/deleteGuides.ts");
  // Broker pages are rendered from the Supabase table by scripts/prerender.ts;
  // the page template is what we can date, so use it.
  const brokerLastmod = gitLastModified("scripts/prerender.ts");

  for (const path of getStaticRoutesFromApp()) {
    addEntry(entries, {
      path,
      lastmod: appLastmod,
      ...(routeDefaults[path] ?? { changefreq: "monthly", priority: "0.6" }),
    });
  }

  // Hub pages list their cluster's items, so they re-date with the cluster
  // data rather than with App.tsx.
  for (const [path, lastmod] of Object.entries({
    "/blog": blogLastmod,
    "/guides": guidesLastmod,
    "/vs": compareLastmod,
    "/delete": deleteLastmod,
    "/breach": breachLastmod,
    "/remove-from": brokerLastmod,
  })) {
    const existing = entries.get(path);
    if (existing && lastmod) entries.set(path, { ...existing, lastmod });
  }

  for (const slug of getBlogSlugs()) {
    addEntry(entries, { path: `/blog/${slug}`, lastmod: blogLastmod, changefreq: "monthly", priority: "0.75" });
  }

  for (const slug of getGuideSlugs()) {
    addEntry(entries, { path: `/guides/${slug}`, lastmod: guidesLastmod, changefreq: "monthly", priority: "0.8" });
  }

  for (const slug of getBreachSlugs()) {
    addEntry(entries, { path: `/breach/${slug}`, lastmod: breachLastmod, changefreq: "weekly", priority: "0.8" });
  }

  for (const slug of compareSlugs) {
    addEntry(entries, { path: `/vs/${slug}`, lastmod: compareLastmod, changefreq: "monthly", priority: slug === "deleteme" || slug === "incogni" ? "0.9" : "0.85" });
  }

  for (const slug of deleteGuideSlugs) {
    addEntry(entries, { path: `/delete/${slug}`, lastmod: deleteLastmod, changefreq: "monthly", priority: "0.75" });
  }

  for (const slug of await getBrokerSlugs()) {
    addEntry(entries, { path: `/remove-from/${slug}`, lastmod: brokerLastmod, changefreq: "monthly", priority: "0.75" });
  }

  for (const result of await getPublicResultEntries()) {
    addEntry(entries, {
      path: `/results/${result.share_id}`,
      lastmod: result.created_at?.slice(0, 10),
      changefreq: "monthly",
      priority: "0.4",
    });
  }

  const ordered = Array.from(entries.values()).sort((a, b) => {
    const priorityDiff = Number(b.priority ?? 0) - Number(a.priority ?? 0);
    return priorityDiff || a.path.localeCompare(b.path);
  });

  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(ordered));
  console.log(`sitemap.xml written (${ordered.length} entries)`);
}

void main();
