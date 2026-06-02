// Browserless static prerender — runs as a `postbuild` step.
//
// Reads the built dist/index.html (preserving Vite's hashed asset tags),
// then for every PUBLIC SEO route injects route-specific <title>, meta
// description, canonical, Open Graph tags, JSON-LD, and the FULL article/
// broker/comparison body HTML into <div id="root">.
//
// Googlebot's first response now contains real, route-specific content
// BEFORE any JavaScript runs. On the client, React's createRoot mounts
// into #root and takes over — the live SPA behaves exactly as before.
//
// No headless browser. No React SSR. Pure data -> HTML, same runtime
// (bun) used by scripts/generate-sitemap.ts.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { GUIDES, type Guide, type GuideCategory } from "../src/data/guides";
import { BLOG_POSTS } from "../src/data/blogPosts";
import { DELETE_GUIDES } from "../src/data/deleteGuides";
import { COMPETITORS } from "../src/data/competitors";

const BASE_URL = "https://footprintfinder.co";
const DIST = resolve("dist");
const SUPABASE_URL = "https://gqxkeezkajkiyjpnjgkx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxeGtlZXprYWpraXlqcG5qZ2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNjM4NDYsImV4cCI6MjA3NzkzOTg0Nn0.64_sr6feszswWrxHBogLYLPZvlnibTY_7ZOFd1l1Vfw";
const YEAR = new Date().getFullYear();

type JsonLd = Record<string, unknown>;
interface Route {
  path: string; // e.g. "/guides/foo" ("/" for home)
  title: string;
  description: string;
  ogType?: "website" | "article";
  jsonLd?: JsonLd[];
  body: string; // inner HTML for #root
}

// ---------- escaping helpers ----------
const escHtml = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const escAttr = (s: string) =>
  escHtml(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const p = (text: string) => `<p>${escHtml(text)}</p>`;
const ul = (items: string[]) =>
  items.length
    ? `<ul>${items.map((i) => `<li>${escHtml(i)}</li>`).join("")}</ul>`
    : "";
const linkList = (links: { href: string; label: string }[]) =>
  `<ul>${links
    .map((l) => `<li><a href="${escAttr(l.href)}">${escHtml(l.label)}</a></li>`)
    .join("")}</ul>`;

// ---------- schema builders ----------
const articleSchema = (headline: string, description: string, url: string): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline,
  description,
  mainEntityOfPage: url,
  author: { "@type": "Organization", name: "Footprint Finder" },
  publisher: { "@type": "Organization", name: "Footprint Finder" },
});
const faqSchema = (faqs: { question: string; answer: string }[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
});

// ---------- route builders ----------
function guideRoute(g: Guide): Route {
  const url = `${BASE_URL}/guides/${g.slug}`;
  const sections = g.sections
    .map(
      (s) =>
        `<section><h2>${escHtml(s.heading)}</h2>${p(s.body)}${
          s.bullets ? ul(s.bullets) : ""
        }</section>`,
    )
    .join("");
  const faqHtml = `<section><h2>Frequently asked questions</h2>${g.faqs
    .map((f) => `<h3>${escHtml(f.question)}</h3>${p(f.answer)}`)
    .join("")}</section>`;
  return {
    path: `/guides/${g.slug}`,
    title: g.title,
    description: g.description,
    ogType: "article",
    jsonLd: [articleSchema(g.h1, g.description, url), faqSchema(g.faqs)],
    body: `<article><h1>${escHtml(g.h1)}</h1>${p(g.intro)}${sections}${faqHtml}</article>`,
  };
}

function guideIndexRoute(): Route {
  const cats: { key: GuideCategory; label: string }[] = [
    { key: "Discovery", label: "Start here: who has your information" },
    { key: "Education", label: "Understand the threat" },
    { key: "Google Removal", label: "Remove yourself from Google" },
    { key: "Removal", label: "Remove yourself everywhere" },
  ];
  const groups = cats
    .map((c) => {
      const items = GUIDES.filter((g) => g.category === c.key);
      if (!items.length) return "";
      return `<section><h2>${escHtml(c.label)}</h2>${linkList(
        items.map((g) => ({ href: `/guides/${g.slug}`, label: g.h1 })),
      )}</section>`;
    })
    .join("");
  return {
    path: "/guides",
    title:
      "Privacy Guides — Remove Your Information From the Internet | Footprint Finder",
    description:
      "Free, step-by-step guides to removing your personal information from the internet, Google and data brokers. Plus a 60-second scan to find where you're exposed.",
    ogType: "website",
    body: `<main><h1>Privacy &amp; data removal guides</h1>${p(
      "Free, no-fluff guides to removing your personal information from the internet.",
    )}${groups}</main>`,
  };
}

function brokerRoute(b: BrokerRecord): Route {
  const url = `${BASE_URL}/remove-from/${b.slug}`;
  const time = b.opt_out_time_estimate ?? "a few minutes";
  const title = `How to Delete Your Info from ${b.name} & Opt Out (${YEAR} Guide)`;
  const description = `How to delete your personal information from ${b.name} and opt out for free. Step-by-step removal guide — takes ${time}. Or let Footprint Finder remove you from 45+ brokers automatically.`;
  const steps = (b.instructions ?? "")
    .split(/\\n|\n/)
    .map((s) => s.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);
  const stepsHtml = steps.length
    ? `<section><h2>How to opt out of ${escHtml(b.name)}</h2><ol>${steps
        .map((s) => `<li>${escHtml(s)}</li>`)
        .join("")}</ol></section>`
    : "";
  const faqs = [
    {
      question: `How do I delete my information from ${b.name}?`,
      answer: `To delete your information from ${b.name}, open its opt-out page, search for your listing, and submit a removal request. The process takes ${time}. Footprint Finder can also do this for you automatically across 45+ brokers.`,
    },
    {
      question: `Is it free to remove yourself from ${b.name}?`,
      answer: `Yes — ${b.name} is legally required to honor opt-out requests at no cost. The manual process takes ${time}.`,
    },
    {
      question: `How long until ${b.name} removes my information?`,
      answer: `${b.name} typically removes listings within 7–30 days of a verified opt-out request. Most brokers re-list users after 30–90 days, which is why ongoing monitoring is recommended.`,
    },
  ];
  const faqHtml = `<section><h2>Frequently asked questions</h2>${faqs
    .map((f) => `<h3>${escHtml(f.question)}</h3>${p(f.answer)}`)
    .join("")}</section>`;
  const meta: string[] = [];
  if (b.opt_out_difficulty) meta.push(`Difficulty: ${b.opt_out_difficulty}`);
  if (b.opt_out_time_estimate) meta.push(`Time: ${b.opt_out_time_estimate}`);
  return {
    path: `/remove-from/${b.slug}`,
    title,
    description,
    ogType: "article",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `Remove your information from ${b.name}`,
        description: `Opt-out instructions for ${b.name} data broker.`,
        totalTime: b.opt_out_time_estimate ?? "PT10M",
        step: steps.map((text, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: `Step ${i + 1}`,
          text,
        })),
      },
      faqSchema(faqs),
    ],
    body: `<article><h1>How to Delete Your Info from ${escHtml(
      b.name,
    )} &amp; Opt Out</h1>${p(
      `${b.name} is a data broker that publishes your personal information online. This free guide shows you exactly how to remove yourself.`,
    )}${meta.length ? ul(meta) : ""}${
      b.opt_out_url
        ? `<p><a href="${escAttr(b.opt_out_url)}">${escHtml(
            b.name,
          )} opt-out page</a></p>`
        : ""
    }${stepsHtml}${faqHtml}</article>`,
  };
}

function brokerIndexRoute(brokers: BrokerRecord[]): Route {
  return {
    path: "/remove-from",
    title: "Remove Yourself from Data Brokers — Free Opt-Out Guides",
    description:
      "Free, step-by-step opt-out guides for 70+ data brokers and people-search sites. Find out who's exposing your info and remove yourself for free.",
    ogType: "website",
    body: `<main><h1>Remove yourself from data brokers</h1>${p(
      "Free, step-by-step opt-out guides for the data brokers and people-search sites most likely to be exposing your name, address and phone number.",
    )}${linkList(
      brokers.map((b) => ({
        href: `/remove-from/${b.slug}`,
        label: `Remove from ${b.name}`,
      })),
    )}</main>`,
  };
}

function deleteRoute(g: (typeof DELETE_GUIDES)[number]): Route {
  const stepsHtml = `<section><h2>Steps to delete your ${escHtml(
    g.service,
  )} account</h2><ol>${g.steps
    .map((s) => `<li><strong>${escHtml(s.title)}.</strong> ${escHtml(s.body)}</li>`)
    .join("")}</ol></section>`;
  return {
    path: `/delete/${g.slug}`,
    title: `How to Delete Your ${g.service} Account (${YEAR}) — Step-by-Step`,
    description: `Permanently delete your ${g.service} account in ${g.timeEstimate}. Step-by-step instructions, what data they keep, and common gotchas.`,
    ogType: "article",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `How to delete your ${g.service} account`,
        description: g.intro,
        totalTime: g.timeEstimate,
        step: g.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.title,
          text: s.body,
        })),
      },
    ],
    body: `<article><h1>How to Delete Your ${escHtml(
      g.service,
    )} Account</h1>${p(g.intro)}<h2>What ${escHtml(
      g.service,
    )} keeps after deletion</h2>${ul(g.whatTheyKeep)}${stepsHtml}<h2>Gotchas to watch for</h2>${ul(
      g.gotchas,
    )}</article>`,
  };
}

function deleteIndexRoute(): Route {
  return {
    path: "/delete",
    title: "How to Delete Online Accounts — Step-by-Step Guides | Footprint Finder",
    description:
      "Free, step-by-step guides to permanently delete your accounts on Facebook, Instagram, Amazon, LinkedIn, Spotify and more — including what data they keep.",
    ogType: "website",
    body: `<main><h1>How to delete online accounts</h1>${p(
      "Step-by-step guides to permanently delete the accounts you no longer use.",
    )}${linkList(
      DELETE_GUIDES.map((g) => ({
        href: `/delete/${g.slug}`,
        label: `Delete your ${g.service} account`,
      })),
    )}</main>`,
  };
}

function blogRoute(post: (typeof BLOG_POSTS)[number]): Route {
  const url = `${BASE_URL}/blog/${post.slug}`;
  const sections = post.sections
    .map(
      (s) =>
        `<section><h2>${escHtml(s.heading)}</h2>${s.body
          .map((b) => p(b))
          .join("")}</section>`,
    )
    .join("");
  const table = `<table><thead><tr><th>Feature</th><th>Footprint Finder</th><th>${escHtml(
    post.competitor,
  )}</th></tr></thead><tbody>${post.comparisonTable
    .map(
      (r) =>
        `<tr><td>${escHtml(r.feature)}</td><td>${escHtml(r.us)}</td><td>${escHtml(
          r.them,
        )}</td></tr>`,
    )
    .join("")}</tbody></table>`;
  return {
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.description,
    ogType: "article",
    jsonLd: [articleSchema(post.title, post.description, url)],
    body: `<article><h1>${escHtml(post.title)}</h1>${p(post.tldr)}${sections}<h2>Feature comparison</h2>${table}<h2>Verdict</h2>${p(
      post.verdict,
    )}</article>`,
  };
}

function blogIndexRoute(): Route {
  return {
    path: "/blog",
    title: "Privacy Tool Comparisons & Guides | Footprint Finder Blog",
    description:
      "Honest comparisons of Footprint Finder vs Incogni, DeleteMe, Optery and other privacy services — plus guides to cleaning up your digital footprint.",
    ogType: "website",
    body: `<main><h1>Footprint Finder blog</h1>${p(
      "Honest comparisons and guides for cleaning up your digital footprint.",
    )}${linkList(
      BLOG_POSTS.map((b) => ({ href: `/blog/${b.slug}`, label: b.title })),
    )}</main>`,
  };
}

function compareRoute(c: (typeof COMPETITORS)[string]): Route {
  const faqs = [
    {
      question: `Is Footprint Finder cheaper than ${c.name}?`,
      answer: `Footprint Finder costs $79/year. ${c.name} costs ${c.annualPrice}. Footprint Finder also includes inbox account discovery and breach monitoring, which ${c.name} does not.`,
    },
    {
      question: `What does Footprint Finder do that ${c.name} doesn't?`,
      answer: `Footprint Finder scans your Gmail or Outlook inbox to discover every account tied to your email — including forgotten subscriptions, old services, and shadow accounts. ${c.name} only removes you from data broker sites and cannot see your inbox-based footprint.`,
    },
    {
      question: `Should I use ${c.name} or Footprint Finder?`,
      answer: c.bestFor,
    },
  ];
  return {
    path: `/vs/${c.slug}`,
    title: `Footprint Finder vs ${c.name} — Honest Comparison`,
    description: `Compare Footprint Finder and ${c.name} side-by-side. Pricing, features, broker coverage, breach monitoring. Which privacy service is right for you?`,
    ogType: "article",
    jsonLd: [faqSchema(faqs)],
    body: `<article><h1>Footprint Finder vs ${escHtml(c.name)}</h1>${p(
      `${c.tagline}. Here's how it stacks up against Footprint Finder on price, coverage, and features.`,
    )}<h2>Quick verdict</h2>${p(c.bestFor)}<h2>${escHtml(
      c.name,
    )} pricing</h2>${p(
      `${c.monthlyPrice} · ${c.annualPrice}. Footprint Finder is $79/year, all-in-one.`,
    )}<h2>${escHtml(c.name)} pros</h2>${ul(c.pros)}<h2>${escHtml(
      c.name,
    )} cons</h2>${ul(c.cons)}<h2>Why people choose Footprint Finder</h2>${ul(
      c.whyFf,
    )}</article>`,
  };
}

function compareIndexRoute(): Route {
  return {
    path: "/vs",
    title: "Footprint Finder vs Other Privacy Tools — Comparisons",
    description:
      "Compare Footprint Finder against DeleteMe, Incogni, Optery, Kanary and Mine on price, data broker coverage, inbox scanning and breach monitoring.",
    ogType: "website",
    body: `<main><h1>Compare Footprint Finder vs other privacy tools</h1>${p(
      "Honest, side-by-side comparisons against the most popular privacy and data-removal services.",
    )}${linkList(
      Object.values(COMPETITORS).map((c) => ({
        href: `/vs/${c.slug}`,
        label: `Footprint Finder vs ${c.name}`,
      })),
    )}</main>`,
  };
}

// Authored static marketing pages (body extracted by hand; head accurate).
function staticRoutes(): Route[] {
  return [
    {
      path: "/",
      title: "Footprint Finder — Monitor Your Digital Exposure",
      description:
        "Monthly scans for new breaches, broker listings, and forgotten accounts tied to your email — alerts you before damage is done.",
      ogType: "website",
      body: `<main><h1>Find out who has your personal information — and remove it</h1>${p(
        "Footprint Finder scans your inbox to find every account, data-broker listing and breach tied to your email, then helps you remove it. Run a free scan in 60 seconds.",
      )}${p(
        "Continuous monitoring alerts you when new breaches, broker listings or accounts appear, so you can clean them up before they become a problem.",
      )}${linkList([
        { href: "/free-scan", label: "Run your free exposure scan" },
        { href: "/remove-from", label: "Data broker removal guides" },
        { href: "/guides", label: "Privacy & data removal guides" },
        { href: "/pricing", label: "Pricing" },
      ])}</main>`,
    },
    {
      path: "/free-scan",
      title: "Free Digital Exposure Scan — Find Where You're Exposed | Footprint Finder",
      description:
        "Run a free 60-second scan to find data-broker listings, breaches and forgotten accounts tied to your email. No credit card, no password required.",
      ogType: "website",
      body: `<main><h1>Free digital exposure scan</h1>${p(
        "Enter your email and we'll show you where your personal information is exposed across data brokers, breaches and forgotten accounts — free, in about 60 seconds.",
      )}</main>`,
    },
    {
      path: "/pricing",
      title: "Pricing — Free Scan, Pro & Complete Plans | Footprint Finder",
      description:
        "Start free. Footprint Finder Pro is $79/year and Complete is $129/year — covering data broker removal, inbox account discovery and breach monitoring.",
      ogType: "website",
      body: `<main><h1>Simple, transparent pricing</h1>${p(
        "Try the entire product free before you pay. Pro is $79/year and Complete is $129/year, covering data broker removal, inbox account discovery and breach monitoring.",
      )}</main>`,
    },
    {
      path: "/parents",
      title: "Protect Your Parents From Scams & Identity Theft | Footprint Finder",
      description:
        "Your parents' phone numbers and addresses are published on data-broker sites, fueling scam calls. Find their exposure and remove it in minutes.",
      ogType: "website",
      body: `<main><h1>Protect your parents from scams and identity theft</h1>${p(
        "Data brokers publish your parents' home address, phone number and relatives online — exactly what scammers use to target them. Footprint Finder finds those listings and helps you remove them.",
      )}</main>`,
    },
    {
      path: "/enterprise",
      title: "Enterprise Privacy & Shadow IT Audits | Footprint Finder",
      description:
        "Discover the forgotten SaaS accounts and exposed employee data across your organization. Footprint Finder runs privacy audits at scale.",
      ogType: "website",
      body: `<main><h1>Enterprise privacy &amp; shadow IT audits</h1>${p(
        "Footprint Finder helps organizations discover forgotten SaaS accounts and exposed employee data, then drive remediation at scale.",
      )}</main>`,
    },
    {
      path: "/help",
      title: "Help & FAQ — How Footprint Finder Works",
      description:
        "Learn how Footprint Finder's server-side email metadata scanning works, what data we read (and never read), and how to remove your information.",
      ogType: "website",
      body: `<main><h1>Help &amp; frequently asked questions</h1>${p(
        "Footprint Finder uses server-side email metadata extraction to find the services tied to your inbox. We never read or store the body content of your emails.",
      )}</main>`,
    },
    {
      path: "/privacy",
      title: "Privacy Policy | Footprint Finder",
      description:
        "How Footprint Finder collects, uses and protects your data. We scan email metadata only — never message body content — and never sell your data.",
      ogType: "website",
      body: `<main><h1>Privacy Policy</h1>${p(
        "This policy explains how Footprint Finder collects, uses and protects your data. We scan email metadata only — never message body content — and never sell your data.",
      )}</main>`,
    },
    {
      path: "/terms",
      title: "Terms of Service | Footprint Finder",
      description:
        "The terms and conditions governing your use of Footprint Finder's privacy monitoring and data-removal services.",
      ogType: "website",
      body: `<main><h1>Terms of Service</h1>${p(
        "These terms govern your use of Footprint Finder's privacy monitoring and data-removal services.",
      )}</main>`,
    },
  ];
}

// ---------- broker fetch ----------
interface BrokerRecord {
  slug: string;
  name: string;
  website: string | null;
  opt_out_url: string | null;
  opt_out_difficulty: string | null;
  opt_out_time_estimate: string | null;
  instructions: string | null;
  priority: string | null;
}
async function fetchBrokers(): Promise<BrokerRecord[]> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("data_brokers")
      .select(
        "slug,name,website,opt_out_url,opt_out_difficulty,opt_out_time_estimate,instructions,priority",
      )
      .eq("is_active", true)
      .order("slug", { ascending: true });
    if (error) throw error;
    return (data ?? []) as BrokerRecord[];
  } catch (err) {
    console.warn(
      "[prerender] Could not fetch brokers, skipping broker pages:",
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}

// ---------- head + body injection ----------
function buildHtml(template: string, route: Route): string {
  const canonical = `${BASE_URL}${route.path === "/" ? "/" : route.path}`;
  let html = template;

  // title
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escHtml(route.title)}</title>`,
  );
  // description
  html = html.replace(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${escAttr(route.description)}" />`,
  );
  // twitter title/description -> route-specific
  html = html.replace(
    /<meta\s+name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${escAttr(route.title)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${escAttr(route.description)}" />`,
  );

  const headTags = [
    `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:title" content="${escAttr(route.title)}" />`,
    `<meta property="og:description" content="${escAttr(route.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:type" content="${route.ogType ?? "article"}" />`,
    ...(route.jsonLd ?? []).map(
      (b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`,
    ),
  ].join("\n    ");
  html = html.replace("</head>", `    ${headTags}\n  </head>`);

  // body — inject prerendered content into the (empty) root div.
  // React's createRoot replaces this on hydration; crawlers read it first.
  const injected = html.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root"><div data-prerendered="true">${route.body}</div></div>`,
  );
  if (injected === html) {
    throw new Error(
      `[prerender] Could not find <div id="root"></div> in template for ${route.path}`,
    );
  }
  return injected;
}

function writeRoute(template: string, route: Route) {
  const html = buildHtml(template, route);
  const outPath =
    route.path === "/"
      ? resolve(DIST, "index.html")
      : resolve(DIST, `.${route.path}`, "index.html");
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
}

async function main() {
  const templatePath = resolve(DIST, "index.html");
  if (!existsSync(templatePath)) {
    console.error(
      "[prerender] dist/index.html not found — did `vite build` run first?",
    );
    process.exit(1);
  }
  const template = readFileSync(templatePath, "utf8");

  const brokers = await fetchBrokers();

  const routes: Route[] = [
    ...staticRoutes(),
    guideIndexRoute(),
    ...GUIDES.map(guideRoute),
    brokerIndexRoute(brokers),
    ...brokers.map(brokerRoute),
    deleteIndexRoute(),
    ...DELETE_GUIDES.map(deleteRoute),
    blogIndexRoute(),
    ...BLOG_POSTS.map(blogRoute),
    compareIndexRoute(),
    ...Object.values(COMPETITORS).map(compareRoute),
  ];

  for (const route of routes) writeRoute(template, route);

  console.log(
    `[prerender] wrote ${routes.length} static HTML pages (${brokers.length} brokers).`,
  );
}

void main();
