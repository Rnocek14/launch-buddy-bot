// Runs before Vite dev/build; writes public/sitemap.xml from routes + dynamic SEO data.

import { writeFileSync, readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://footprintfinder.co";
const LASTMOD = "2026-05-17";
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
  "/extension": { changefreq: "monthly", priority: "0.7" },
  "/demo": { changefreq: "monthly", priority: "0.6" },
  "/help": { changefreq: "monthly", priority: "0.6" },
  "/status": { changefreq: "yearly", priority: "0.5" },
  "/privacy": { changefreq: "yearly", priority: "0.4" },
  "/terms": { changefreq: "yearly", priority: "0.4" },
};

const lowPriorityRoutes = new Set([
  "/auth",
  "/admin",
  "/admin/analytics",
  "/dashboard",
  "/unmatched-domains",
  "/deletion-requests",
  "/cleanup",
  "/alpha",
  "/unsubscribe",
  "/preferences",
  "/settings",
  "/debug/discovery",
  "/subscribe",
  "/billing",
  "/authorize",
  "/broker-scan",
  "/organization",
  "/offboarding",
  "/exposure-scan",
  "/reset-password",
  "/email-subscriptions",
  "/scan",
  "/affiliates",
  "/affiliates/dashboard",
  "/payment-success",
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
  entries.set(entry.path, {
    lastmod: LASTMOD,
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

  for (const path of getStaticRoutesFromApp()) {
    addEntry(entries, {
      path,
      ...(routeDefaults[path] ?? (lowPriorityRoutes.has(path)
        ? { changefreq: "yearly", priority: "0.1" }
        : { changefreq: "monthly", priority: "0.6" })),
    });
  }

  for (const slug of getBlogSlugs()) {
    addEntry(entries, { path: `/blog/${slug}`, changefreq: "monthly", priority: "0.75" });
  }

  for (const slug of getGuideSlugs()) {
    addEntry(entries, { path: `/guides/${slug}`, changefreq: "monthly", priority: "0.8" });
  }

  for (const slug of compareSlugs) {
    addEntry(entries, { path: `/vs/${slug}`, changefreq: "monthly", priority: slug === "deleteme" || slug === "incogni" ? "0.9" : "0.85" });
  }

  for (const slug of deleteGuideSlugs) {
    addEntry(entries, { path: `/delete/${slug}`, changefreq: "monthly", priority: "0.75" });
  }

  for (const slug of await getBrokerSlugs()) {
    addEntry(entries, { path: `/remove-from/${slug}`, changefreq: "monthly", priority: "0.75" });
  }

  for (const result of await getPublicResultEntries()) {
    addEntry(entries, {
      path: `/results/${result.share_id}`,
      lastmod: result.created_at?.slice(0, 10) ?? LASTMOD,
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
