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
import {
  DELETE_GUIDES,
  deleteGuideFaqs,
  deleteGuideAftermath,
} from "../src/data/deleteGuides";
import {
  COMPETITORS,
  FEATURE_ROWS,
  RELATED_BROKERS,
  FOOTPRINT_FINDER_FEATURES,
  FOOTPRINT_FINDER_BROKER_COVERAGE,
  FOOTPRINT_FINDER_PRICING,
  COMPETITOR_PRICING_VERIFIED_ON,
} from "../src/data/competitors";
import {
  COMPETITOR_ARTICLES,
  CATEGORY_CONTEXT,
  RANKING_CRITERIA,
} from "../src/data/competitorArticles";
import { HEAD_TO_HEADS, headToHeadsFor } from "../src/data/headToHead";
import {
  BEST_SERVICES_DESCRIPTION,
  BEST_SERVICES_INTRO,
  BEST_SERVICES_RANKING,
  BEST_SERVICES_HOW_TO_CHOOSE,
  BEST_SERVICES_FAQS,
} from "../src/data/bestServices";

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
const articleSchema = (
  headline: string,
  description: string,
  url: string,
  datePublished?: string,
  dateModified?: string,
): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline,
  description,
  mainEntityOfPage: url,
  image: `${BASE_URL}/og-image.png`,
  ...(datePublished ? { datePublished } : {}),
  ...(dateModified ? { dateModified } : {}),
  author: { "@type": "Organization", name: "Footprint Finder", url: BASE_URL },
  publisher: {
    "@type": "Organization",
    name: "Footprint Finder",
    url: BASE_URL,
    logo: { "@type": "ImageObject", url: `${BASE_URL}/og-image.png` },
  },
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
/** BreadcrumbList matching the visible breadcrumb trail on the page. */
const breadcrumbSchema = (trail: { name: string; path: string }[]): JsonLd => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: trail.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.name,
    item: `${BASE_URL}${t.path}`,
  })),
});

/** Renders the FAQ block as visible copy, matching the FAQPage schema. */
const faqBlock = (faqs: { question: string; answer: string }[]) =>
  `<section><h2>Frequently asked questions</h2>${faqs
    .map((f) => `<h3>${escHtml(f.question)}</h3>${p(f.answer)}`)
    .join("")}</section>`;

/** Visible breadcrumb trail; the last item is plain text, not a link. */
const breadcrumbNav = (trail: { name: string; path: string }[]) =>
  `<nav aria-label="Breadcrumb">${trail
    .map((t, i) =>
      i === trail.length - 1
        ? `<span>${escHtml(t.name)}</span>`
        : `<a href="${escAttr(t.path)}">${escHtml(t.name)}</a> / `,
    )
    .join("")}</nav>`;

/**
 * Cross-cluster links appended to every article-type page.
 *
 * Without this, a prerendered comparison or blog page is a dead end in the
 * raw HTML: React adds the nav and footer on hydration, but the first crawl
 * response has no outbound links at all, so no authority flows through the
 * page and related URLs are only discoverable via sitemap.xml.
 */
const relatedLinksBlock = (
  heading: string,
  links: { href: string; label: string }[],
) => `<section><h2>${escHtml(heading)}</h2>${linkList(links)}</section>`;

const siteLinksBlock = () =>
  relatedLinksBlock("Explore Footprint Finder", [
    { href: "/free-scan", label: "Run a free exposure scan" },
    { href: "/best-data-removal-services", label: "Best data removal services compared" },
    { href: "/vs", label: "Compare privacy and data-removal services" },
    { href: "/remove-from", label: "Free data-broker opt-out guides" },
    { href: "/guides", label: "Privacy and data removal guides" },
    { href: "/delete", label: "How to delete online accounts" },
    { href: "/pricing", label: "Pricing" },
  ]);

/**
 * Bridge from an informational page into the commercial comparison cluster.
 * Mirrors src/components/ServiceComparisonLinks.tsx so the prerendered HTML
 * carries the same links a crawler would find after hydration.
 */
const comparisonBridgeBlock = (brokerName?: string) =>
  `<section><h2>Rather not do this manually?</h2>${p(
    brokerName
      ? `The ${brokerName} opt-out above is free and takes a few minutes — but you will need to repeat it across dozens of brokers, and again every few months when they re-list you. These services handle the repetition for you:`
      : "Every opt-out on this site is free to do yourself. The catch is that brokers re-list you within months, so it is a recurring job rather than a one-off. These services handle the repetition for you:",
  )}${linkList([
    { href: "/best-data-removal-services", label: "Best data removal services compared" },
    ...HEAD_TO_HEADS.slice(0, 3).map((h) => ({
      href: `/vs/${h.slug}`,
      label: `${COMPETITORS[h.a]?.name} vs ${COMPETITORS[h.b]?.name}`,
    })),
    { href: "/vs", label: "All service comparisons" },
  ])}</section>`;

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
    body: `<article><h1>${escHtml(g.h1)}</h1>${p(g.intro)}${sections}${faqHtml}${comparisonBridgeBlock()}${siteLinksBlock()}</article>`,
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
    title: "Privacy Guides — Remove Your Info From the Internet",
    description:
      "Free, step-by-step guides to removing your personal information from the internet, Google and data brokers. Plus a 60-second scan to find where you're exposed.",
    ogType: "website",
    body: `<main><h1>Privacy &amp; data removal guides</h1>${p(
      "Free, no-fluff guides to removing your personal information from the internet.",
    )}${groups}${siteLinksBlock()}</main>`,
  };
}

function brokerRoute(b: BrokerRecord): Route {
  const url = `${BASE_URL}/remove-from/${b.slug}`;
  const time = b.opt_out_time_estimate ?? "a few minutes";
  const title = `How to Delete Your Info from ${b.name} & Opt Out (${YEAR} Guide)`;
  const description = `How to delete your personal information from ${b.name} and opt out for free. Step-by-step removal guide — takes ${time}. Or let Footprint Finder remove you from 25+ brokers automatically.`;
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
      answer: `To delete your information from ${b.name}, open its opt-out page, search for your listing, and submit a removal request. The process takes ${time}. Footprint Finder can also do this for you automatically across 25+ brokers.`,
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
    }${stepsHtml}${faqHtml}${comparisonBridgeBlock(b.name)}${siteLinksBlock()}</article>`,
  };
}

function brokerIndexRoute(brokers: BrokerRecord[]): Route {
  return {
    path: "/remove-from",
    title: "Remove Yourself from Data Brokers — Free Opt-Out Guides",
    description:
      "Free, step-by-step opt-out guides for 45+ data brokers and people-search sites. Find out who's exposing your info and remove yourself for free.",
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
  const faqs = deleteGuideFaqs(g);
  const aftermath = deleteGuideAftermath(g);
  const trail = [
    { name: "Home", path: "/" },
    { name: "Delete accounts", path: "/delete" },
    { name: `Delete your ${g.service} account`, path: `/delete/${g.slug}` },
  ];
  return {
    path: `/delete/${g.slug}`,
    title: `How to Delete Your ${g.service} Account (${YEAR})`,
    description: `Delete your ${g.service} account in ${g.timeEstimate}. Step-by-step instructions, what data ${g.service} keeps, and the gotchas to avoid.`,
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
      faqSchema(faqs),
      breadcrumbSchema(trail),
    ],
    body: `<article>${breadcrumbNav(trail)}<h1>How to Delete Your ${escHtml(
      g.service,
    )} Account</h1>${p(g.intro)}<h2>What ${escHtml(
      g.service,
    )} keeps after deletion</h2>${ul(g.whatTheyKeep)}${stepsHtml}<h2>Gotchas to watch for</h2>${ul(
      g.gotchas,
    )}<h2>${escHtml(aftermath.heading)}</h2>${aftermath.body
      .map((b) => p(b))
      .join("")}${faqBlock(faqs)}${comparisonBridgeBlock()}${siteLinksBlock()}</article>`,
  };
}

function deleteIndexRoute(): Route {
  return {
    path: "/delete",
    title: "How to Delete Online Accounts — Step-by-Step Guides",
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

function compareRoute(c: (typeof COMPETITORS)[string]): Route {
  const article = COMPETITOR_ARTICLES[c.slug];
  const alternatives = Object.values(COMPETITORS).filter((o) => o.slug !== c.slug);
  const optionCount = alternatives.length + 1;
  const url = `${BASE_URL}/vs/${c.slug}`;
  const title = `${c.name} Alternatives: ${optionCount} Options Compared (${YEAR})`;
  const description = `${c.name} alternatives compared: ${optionCount} data removal services on price, broker coverage and what each one can actually see.`;
  const trail = [
    { name: "Home", path: "/" },
    { name: "Compare", path: "/vs" },
    { name: `${c.name} alternatives`, path: `/vs/${c.slug}` },
  ];

  // Summary table — the answer a skimmer needs before scrolling.
  const summaryTable = `<table><thead><tr><th>Service</th><th>Best for</th><th>Price</th></tr></thead><tbody>${alternatives
    .map(
      (alt) =>
        `<tr><td><a href="/vs/${escAttr(alt.slug)}">${escHtml(alt.name)}</a></td><td>${escHtml(
          COMPETITOR_ARTICLES[alt.slug]?.bestForShort ?? alt.tagline,
        )}</td><td>${escHtml(alt.annualPrice)}</td></tr>`,
    )
    .join(
      "",
    )}<tr><td>Footprint Finder (ours)</td><td>Finding forgotten accounts in your inbox</td><td>${escHtml(
    FOOTPRINT_FINDER_PRICING.pro,
  )}+</td></tr></tbody></table>`;

  const matrix = `<table><thead><tr><th>Capability</th><th>Footprint Finder</th><th>${escHtml(
    c.name,
  )}</th></tr></thead><tbody>${FEATURE_ROWS.map(
    (row) =>
      `<tr><td>${escHtml(row.label)}</td><td>${
        FOOTPRINT_FINDER_FEATURES[row.key] ? "Yes" : "No"
      }</td><td>${c.features[row.key] ? "Yes" : "No"}</td></tr>`,
  ).join("")}</tbody></table>`;

  const articleSections = (article?.sections ?? [])
    .map(
      (s) =>
        `<section><h2>${escHtml(s.heading)}</h2>${s.body.map((b) => p(b)).join("")}</section>`,
    )
    .join("");

  const alternativesList = alternatives
    .map(
      (alt) =>
        `<section><h3><a href="/vs/${escAttr(alt.slug)}">${escHtml(alt.name)}</a></h3>${p(
          `${alt.annualPrice} · ${alt.brokerCoverage}. ${
            COMPETITOR_ARTICLES[alt.slug]?.shortTake ?? alt.tagline
          }`,
        )}</section>`,
    )
    .join("");

  const pairs = headToHeadsFor(c.slug).map((h) => ({
    href: `/vs/${h.slug}`,
    label: `${COMPETITORS[h.a]?.name} vs ${COMPETITORS[h.b]?.name}`,
  }));

  return {
    path: `/vs/${c.slug}`,
    title,
    description,
    ogType: "article",
    jsonLd: [
      articleSchema(title, description, url, undefined, COMPETITOR_PRICING_VERIFIED_ON),
      ...(article ? [faqSchema(article.faqs)] : []),
      breadcrumbSchema(trail),
    ],
    body: `<article>${breadcrumbNav(trail)}<h1>${escHtml(c.name)} alternatives: ${optionCount} options compared</h1>${p(
      `${c.tagline}. Here's how it stacks up against every major alternative on price, broker coverage and what each one can actually see — including the cases where ${c.name} is still the right buy.`,
    )}${p(
      `Disclosure: Footprint Finder is our own product and appears in this comparison. The capability table is generated from one shared data file, so we are scored on the same criteria as everyone else. Pricing last verified ${COMPETITOR_PRICING_VERIFIED_ON}.`,
    )}<h2>The short answer</h2>${summaryTable}<h2>Why people look for ${escHtml(
      c.name,
    )} alternatives</h2>${ul(article?.whySeekAlternatives ?? c.cons)}${articleSections}<h2>Footprint Finder vs ${escHtml(
      c.name,
    )}</h2>${p(
      `Footprint Finder removes you from ${FOOTPRINT_FINDER_BROKER_COVERAGE} on the ${FOOTPRINT_FINDER_PRICING.brokerTier} plan; ${c.name} covers ${c.brokerCoverage}.`,
    )}${matrix}${ul(c.whyFf)}<h2>The best ${escHtml(
      c.name,
    )} alternatives</h2>${alternativesList}<h2>${escHtml(
      RANKING_CRITERIA.heading,
    )}</h2>${RANKING_CRITERIA.body.map((b) => p(b)).join("")}<h2>${escHtml(
      CATEGORY_CONTEXT.heading,
    )}</h2>${CATEGORY_CONTEXT.body
      .slice(0, 2)
      .map((b) => p(b))
      .join("")}<h2>What to check before you switch from ${escHtml(
      c.name,
    )}</h2>${ul(article?.switchNotes ?? [])}${faqBlock(
      article?.faqs ?? [],
    )}<h2>The verdict</h2>${p(article?.verdict ?? c.bestFor)}${
      pairs.length
        ? relatedLinksBlock(`Head-to-head comparisons involving ${c.name}`, pairs)
        : ""
    }${relatedLinksBlock(
      "Free data-broker removal guides",
      RELATED_BROKERS.map((b) => ({
        href: `/remove-from/${b.slug}`,
        label: `How to opt out of ${b.name}`,
      })),
    )}${relatedLinksBlock("Compare other privacy tools", [
      ...alternatives.map((o) => ({
        href: `/vs/${o.slug}`,
        label: `${o.name} alternatives`,
      })),
      { href: "/best-data-removal-services", label: "Best data removal services" },
    ])}${siteLinksBlock()}</article>`,
  };
}

function headToHeadRoute(h: (typeof HEAD_TO_HEADS)[number]): Route {
  const a = COMPETITORS[h.a];
  const b = COMPETITORS[h.b];
  const url = `${BASE_URL}/vs/${h.slug}`;
  const title = `${a.name} vs ${b.name} (${YEAR}): Which Should You Use?`;
  const description = h.metaDescription;
  const trail = [
    { name: "Home", path: "/" },
    { name: "Compare", path: "/vs" },
    { name: `${a.name} vs ${b.name}`, path: `/vs/${h.slug}` },
  ];

  const glance = `<table><thead><tr><th></th><th>${escHtml(a.name)}</th><th>${escHtml(
    b.name,
  )}</th></tr></thead><tbody><tr><td>Annual price</td><td>${escHtml(
    a.annualPrice,
  )}</td><td>${escHtml(b.annualPrice)}</td></tr><tr><td>Monthly price</td><td>${escHtml(
    a.monthlyPrice,
  )}</td><td>${escHtml(b.monthlyPrice)}</td></tr><tr><td>Broker coverage</td><td>${escHtml(
    a.brokerCoverage,
  )}</td><td>${escHtml(b.brokerCoverage)}</td></tr>${FEATURE_ROWS.map(
    (row) =>
      `<tr><td>${escHtml(row.label)}</td><td>${a.features[row.key] ? "Yes" : "No"}</td><td>${
        b.features[row.key] ? "Yes" : "No"
      }</td></tr>`,
  ).join("")}</tbody></table>`;

  const sections = h.sections
    .map(
      (s) =>
        `<section><h2>${escHtml(s.heading)}</h2>${s.body.map((x) => p(x)).join("")}</section>`,
    )
    .join("");

  const otherPairs = HEAD_TO_HEADS.filter((o) => o.slug !== h.slug).map((o) => ({
    href: `/vs/${o.slug}`,
    label: `${COMPETITORS[o.a]?.name} vs ${COMPETITORS[o.b]?.name}`,
  }));

  return {
    path: `/vs/${h.slug}`,
    title,
    description,
    ogType: "article",
    jsonLd: [
      articleSchema(title, description, url, undefined, COMPETITOR_PRICING_VERIFIED_ON),
      faqSchema(h.faqs),
      breadcrumbSchema(trail),
    ],
    body: `<article>${breadcrumbNav(trail)}<h1>${escHtml(a.name)} vs ${escHtml(
      b.name,
    )}: which should you use?</h1>${p(h.angle)}<h2>${escHtml(a.name)} vs ${escHtml(
      b.name,
    )} at a glance</h2>${p(
      `Pricing last verified ${COMPETITOR_PRICING_VERIFIED_ON}.`,
    )}${glance}${sections}<h2>${escHtml(a.name)} pros</h2>${ul(
      a.pros,
    )}<h2>${escHtml(a.name)} cons</h2>${ul(a.cons)}<h2>${escHtml(
      b.name,
    )} pros</h2>${ul(b.pros)}<h2>${escHtml(b.name)} cons</h2>${ul(
      b.cons,
    )}<h2>Which should you pick?</h2>${p(`Pick ${a.name} if: ${h.pickA}`)}${p(
      `Pick ${b.name} if: ${h.pickB}`,
    )}<h2>A third option worth knowing about</h2>${p(
      `Disclosure: Footprint Finder is our product. Both ${a.name} and ${b.name} work outward from your name into public databases; Footprint Finder also reads your inbox metadata to find the accounts you have actually created. ${FOOTPRINT_FINDER_PRICING.pro} for inbox discovery and breach monitoring, ${FOOTPRINT_FINDER_PRICING.complete} adds broker removal across ${FOOTPRINT_FINDER_BROKER_COVERAGE}. Broker coverage is smaller than both services here — if people-search listings are your only concern, one of them covers more sites.`,
    )}${faqBlock(h.faqs)}${relatedLinksBlock(
      "Other head-to-head comparisons",
      otherPairs,
    )}${relatedLinksBlock("Keep researching", [
      { href: "/best-data-removal-services", label: "Best data removal services" },
      { href: `/vs/${a.slug}`, label: `${a.name} alternatives` },
      { href: `/vs/${b.slug}`, label: `${b.name} alternatives` },
    ])}${siteLinksBlock()}</article>`,
  };
}

function bestServicesRoute(): Route {
  const url = `${BASE_URL}/best-data-removal-services`;
  const title = `Best Data Removal Services in ${YEAR}: ${BEST_SERVICES_RANKING.length} Compared & Ranked`;
  const trail = [
    { name: "Home", path: "/" },
    { name: "Compare", path: "/vs" },
    { name: "Best data removal services", path: "/best-data-removal-services" },
  ];

  const rows = BEST_SERVICES_RANKING.map((entry) => {
    const isOurs = entry.slug === "footprintfinder";
    const c = isOurs ? undefined : COMPETITORS[entry.slug];
    return {
      name: isOurs ? "Footprint Finder (ours)" : c!.name,
      slug: isOurs ? null : c!.slug,
      price: isOurs
        ? `${FOOTPRINT_FINDER_PRICING.pro} / ${FOOTPRINT_FINDER_PRICING.complete}`
        : c!.annualPrice,
      coverage: isOurs ? FOOTPRINT_FINDER_BROKER_COVERAGE : c!.brokerCoverage,
      features: isOurs ? FOOTPRINT_FINDER_FEATURES : c!.features,
      award: entry.award,
      why: entry.why,
      caveat: entry.caveat,
    };
  });

  const masterTable = `<table><thead><tr><th>Service</th><th>Price</th><th>Brokers</th>${FEATURE_ROWS.map(
    (r) => `<th>${escHtml(r.label)}</th>`,
  ).join("")}</tr></thead><tbody>${rows
    .map(
      (r) =>
        `<tr><td>${
          r.slug ? `<a href="/vs/${escAttr(r.slug)}">${escHtml(r.name)}</a>` : escHtml(r.name)
        }</td><td>${escHtml(r.price)}</td><td>${escHtml(r.coverage)}</td>${FEATURE_ROWS.map(
          (f) => `<td>${r.features[f.key] ? "Yes" : "No"}</td>`,
        ).join("")}</tr>`,
    )
    .join("")}</tbody></table>`;

  const entries = rows
    .map(
      (r, i) =>
        `<section><h3>${i + 1}. ${
          r.slug ? `<a href="/vs/${escAttr(r.slug)}">${escHtml(r.name)}</a>` : escHtml(r.name)
        } — ${escHtml(r.award)}</h3>${p(`${r.price} · ${r.coverage}`)}${p(r.why)}${p(
          `The catch: ${r.caveat}`,
        )}</section>`,
    )
    .join("");

  return {
    path: "/best-data-removal-services",
    title,
    description: BEST_SERVICES_DESCRIPTION,
    ogType: "article",
    jsonLd: [
      articleSchema(title, BEST_SERVICES_DESCRIPTION, url, undefined, COMPETITOR_PRICING_VERIFIED_ON),
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: title,
        itemListElement: BEST_SERVICES_RANKING.map((entry, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name:
            entry.slug === "footprintfinder"
              ? "Footprint Finder"
              : COMPETITORS[entry.slug]?.name,
          ...(entry.slug === "footprintfinder"
            ? {}
            : { url: `${BASE_URL}/vs/${entry.slug}` }),
        })),
      },
      faqSchema(BEST_SERVICES_FAQS),
      breadcrumbSchema(trail),
    ],
    body: `<article>${breadcrumbNav(trail)}<h1>Best data removal services in ${YEAR}</h1>${BEST_SERVICES_INTRO.map(
      (b) => p(b),
    ).join("")}<h2>Every service compared</h2>${masterTable}<h2>The picks, by category</h2>${entries}<h2>${escHtml(
      BEST_SERVICES_HOW_TO_CHOOSE.heading,
    )}</h2>${ul(
      BEST_SERVICES_HOW_TO_CHOOSE.body.map((b) => b.split("**").join("")),
    )}<h2>${escHtml(CATEGORY_CONTEXT.heading)}</h2>${CATEGORY_CONTEXT.body
      .map((b) => p(b))
      .join("")}<h2>${escHtml(RANKING_CRITERIA.heading)}</h2>${RANKING_CRITERIA.body
      .map((b) => p(b))
      .join("")}${faqBlock(BEST_SERVICES_FAQS)}${relatedLinksBlock(
      "Head-to-head comparisons",
      HEAD_TO_HEADS.map((h) => ({
        href: `/vs/${h.slug}`,
        label: `${COMPETITORS[h.a]?.name} vs ${COMPETITORS[h.b]?.name}`,
      })),
    )}${siteLinksBlock()}</article>`,
  };
}

function compareIndexRoute(): Route {
  const trail = [
    { name: "Home", path: "/" },
    { name: "Compare", path: "/vs" },
  ];
  return {
    path: "/vs",
    title: `Data Removal Service Comparisons (${YEAR}) — Footprint Finder`,
    description:
      "Side-by-side comparisons of DeleteMe, Incogni, OneRep, Optery, Privacy Bee, Kanary, Aura and Mine — pricing, coverage and honest alternatives.",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Data removal service comparisons",
        itemListElement: Object.values(COMPETITORS).map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: `${c.name} alternatives`,
          url: `${BASE_URL}/vs/${c.slug}`,
        })),
      },
      breadcrumbSchema(trail),
    ],
    body: `<main>${breadcrumbNav(trail)}<h1>Compare data removal services</h1>${p(
      "Honest, side-by-side comparisons of the major privacy and data-removal services — what each covers, what it costs, and which alternative fits your situation.",
    )}${linkList([
      {
        href: "/best-data-removal-services",
        label: `Best data removal services in ${YEAR} — all ${BEST_SERVICES_RANKING.length} ranked`,
      },
    ])}<h2>Alternatives by service</h2>${linkList(
      Object.values(COMPETITORS).map((c) => ({
        href: `/vs/${c.slug}`,
        label: `${c.name} alternatives — ${c.annualPrice}, ${c.brokerCoverage}`,
      })),
    )}<h2>Head-to-head comparisons</h2>${linkList(
      HEAD_TO_HEADS.map((h) => ({
        href: `/vs/${h.slug}`,
        label: `${COMPETITORS[h.a]?.name} vs ${COMPETITORS[h.b]?.name}`,
      })),
    )}${siteLinksBlock()}</main>`,
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
        "Footprint Finder scans your inbox to find every account, data-broker listing and breach tied to your email, then helps you remove it. Run a free scan in 60 seconds — no credit card, no password.",
      )}${p(
        "The scan reads email metadata only: sender, subject and date. We never read, store or index message bodies. That metadata is enough to reconstruct the list of services holding your data, which is something no public-records search can do.",
      )}<h2>What the scan finds</h2>${ul([
        "Forgotten accounts — every service that has emailed you, including ones you signed up for years ago and never closed",
        "Breach exposure — whether your address appears in known data breaches",
        "Data-broker listings — where your name, address and phone are published across 25+ US people-search sites (Complete plan)",
        "Mailing lists you can unsubscribe from in one click",
      ])}<h2>Why removal is ongoing, not a one-off</h2>${p(
        "Data brokers rebuild their databases from public records, marketing data and each other, so a listing you removed reappears within months. Forgotten accounts feed the same loop: one gets breached, your details circulate, and the brokers ingest them again. Monthly rescans and alerts exist because this is maintenance, not a fix.",
      )}<h2>Pricing</h2>${p(
        `Free to scan and see your exposure. Pro is ${FOOTPRINT_FINDER_PRICING.pro} for unlimited deletion requests, deep inbox scanning and monthly rescans. Complete is ${FOOTPRINT_FINDER_PRICING.complete} and adds data-broker removal. Family covers up to five people at ${FOOTPRINT_FINDER_PRICING.family}.`,
      )}<h2>Start here</h2>${linkList([
        { href: "/free-scan", label: "Run your free exposure scan" },
        { href: "/best-data-removal-services", label: `Best data removal services in ${YEAR} — all ${BEST_SERVICES_RANKING.length} compared` },
        { href: "/vs", label: "Compare Footprint Finder against DeleteMe, Incogni and others" },
        { href: "/remove-from", label: "Free data-broker opt-out guides" },
        { href: "/guides", label: "Privacy and data removal guides" },
        { href: "/delete", label: "How to delete your online accounts" },
        { href: "/breach", label: "Recent data breaches and what to do" },
        { href: "/parents", label: "Protect a parent from scam calls" },
        { href: "/enterprise", label: "Shadow IT audits for businesses" },
        { href: "/pricing", label: "Pricing" },
      ])}</main>`,
    },
    {
      path: "/free-scan",
      title: "Free Digital Exposure Scan — See Where You're Exposed",
      description:
        "Run a free 60-second scan to find data-broker listings, breaches and forgotten accounts tied to your email. No credit card, no password required.",
      ogType: "website",
      body: `<main><h1>Free digital exposure scan</h1>${p(
        "Enter your email and we'll show you where your personal information is exposed — across data brokers, known breaches and the accounts you've forgotten about. It takes about 60 seconds and costs nothing.",
      )}${p(
        "There's no credit card and no password involved. Connecting an inbox is optional and uses read-only OAuth for metadata only — sender, subject and date, never message content. You can revoke access from your Google or Microsoft account settings at any time.",
      )}<h2>What you'll see</h2>${ul([
        "Which known breaches include your email address",
        "Which people-search sites publish your name, address and phone",
        "Which services still hold an account tied to your email",
        "A risk score, and the specific steps to bring it down",
      ])}${comparisonBridgeBlock()}${siteLinksBlock()}</main>`,
    },
    {
      path: "/pricing",
      title: "Pricing — Free Scan, Pro & Complete Plans | Footprint Finder",
      description:
        "Start free. Pro is $79/year, Complete is $129/year with data-broker removal, and Family covers five people at $179/year. No hidden tiers.",
      ogType: "website",
      body: `<main><h1>Simple, transparent pricing</h1>${p(
        "Try the entire product free before you pay anything. The free tier scans one email account and includes three deletion requests a month, so you can see your actual exposure before deciding whether a paid plan is worth it.",
      )}<h2>Plans</h2>${ul([
        "Free — one email account, three deletion requests a month, breach check. No data-broker scanning.",
        `Pro, ${FOOTPRINT_FINDER_PRICING.pro} — up to three email accounts, unlimited deletion requests, deep inbox scan, monthly rescans. No data-broker scanning.`,
        `Complete, ${FOOTPRINT_FINDER_PRICING.complete} — everything in Pro, plus data-broker scanning and removal across ${FOOTPRINT_FINDER_BROKER_COVERAGE}, and up to five email accounts.`,
        `Family, ${FOOTPRINT_FINDER_PRICING.family} — everything in Complete, for up to five people.`,
        "Parent Protection Scan, $39 one-time — a single deep scan of a parent's email, scam-focused, no subscription.",
      ])}${p(
        "Data-broker removal is a Complete-tier feature. If broker listings are the only thing you care about, compare Complete against the dedicated removal services rather than our entry plan — and note that every broker opt-out is free to do yourself.",
      )}${comparisonBridgeBlock()}${siteLinksBlock()}</main>`,
    },
    {
      path: "/parents",
      title: "Protect Your Parents From Scams & Identity Theft",
      description:
        "Your parents' phone numbers and addresses are published on data-broker sites, fueling scam calls. Find their exposure and remove it in minutes.",
      ogType: "website",
      body: `<main><h1>Protect your parents from scams and identity theft</h1>${p(
        "Data brokers publish your parents' home address, phone number and the names of their relatives online — which is exactly the information a scam caller uses to sound credible. Someone who knows a target's street, their daughter's name and their approximate age is far harder to hang up on.",
      )}${p(
        "Footprint Finder finds those listings and walks you through removing them. The Parent Protection Scan is a one-time $39 deep scan of a parent's email with a printable action plan, written to be readable by someone who didn't grow up with this — no subscription required.",
      )}<h2>What it covers</h2>${ul([
        "Data-broker listings publishing their address, phone and relatives",
        "Breach exposure for their email address",
        "Accounts and subscriptions tied to their inbox",
        "A printable, plain-English action plan you can work through together",
      ])}${siteLinksBlock()}</main>`,
    },
    {
      path: "/enterprise",
      title: "Enterprise Privacy & Shadow IT Audits | Footprint Finder",
      description:
        "Discover the forgotten SaaS accounts and exposed employee data across your organization. Footprint Finder runs privacy audits at scale.",
      ogType: "website",
      body: `<main><h1>Enterprise privacy &amp; shadow IT audits</h1>${p(
        "Employees sign up for tools faster than IT can track them. By the time someone leaves, their work email is attached to dozens of services nobody inventoried — each holding company data, each an account that outlives the offboarding checklist.",
      )}${p(
        "Footprint Finder discovers those accounts by scanning employee inbox metadata with consent, aggregates the findings at the organisation level, and produces an offboarding audit report your IT and HR teams can act on.",
      )}<h2>What you get</h2>${ul([
        "Bulk scanning across employee inboxes, with per-employee consent",
        "Organisation-level view of every SaaS account discovered",
        "Offboarding audit reports exportable as PDF or CSV",
        "Risk ranking so remediation starts with the accounts that matter",
      ])}${siteLinksBlock()}</main>`,
    },
    {
      path: "/help",
      title: "Help & FAQ — How Footprint Finder Works",
      description:
        "Learn how Footprint Finder's server-side email metadata scanning works, what data we read (and never read), and how to remove your information.",
      ogType: "website",
      body: `<main><h1>Help &amp; frequently asked questions</h1>${p(
        "Footprint Finder uses server-side email metadata extraction to find the services tied to your inbox. We read sender, subject and date only. We never read, store or index the body content of your emails, and we never sell your data.",
      )}${faqBlock([
        {
          question: "What does Footprint Finder actually read from my inbox?",
          answer:
            "Sender, subject line and date — the message headers. Never the body. That metadata is enough to identify which companies have emailed you, which is what reveals where you hold accounts.",
        },
        {
          question: "Do I have to connect my email?",
          answer:
            "No. You can run a free breach and data-broker check with just an email address. Connecting an inbox is what unlocks account discovery, and it uses read-only OAuth you can revoke from your Google or Microsoft account settings at any time.",
        },
        {
          question: "Which plan includes data-broker removal?",
          answer: `Complete, at ${FOOTPRINT_FINDER_PRICING.complete}. The free and Pro tiers cover inbox account discovery and breach monitoring but do not include broker scanning.`,
        },
        {
          question: "Can I do this myself instead of paying?",
          answer:
            "Yes, and we publish the instructions. Every data-broker opt-out is free by law; expect around ten minutes per site and a repeat pass every few months as brokers re-list you. Paying a service buys the repetition, not access.",
        },
      ])}${siteLinksBlock()}</main>`,
    },
    {
      path: "/privacy",
      title: "Privacy Policy | Footprint Finder",
      description:
        "How Footprint Finder collects, uses and protects your data. We scan email metadata only — never message body content — and never sell your data.",
      ogType: "website",
      body: `<main><h1>Privacy Policy</h1>${p(
        "This policy explains how Footprint Finder collects, uses and protects your data. We scan email metadata only — sender, subject and date — never message body content, and we never sell your data.",
      )}${p(
        "OAuth tokens are stored server-side and never exposed to the browser. All data is encrypted in transit and at rest, with row-level security on every database table. Our use of Google user data complies with the Google API Services User Data Policy, including the Limited Use requirements.",
      )}${siteLinksBlock()}</main>`,
    },
    {
      path: "/terms",
      title: "Terms of Service | Footprint Finder",
      description:
        "The terms and conditions governing your use of Footprint Finder's privacy monitoring and data-removal services.",
      ogType: "website",
      body: `<main><h1>Terms of Service</h1>${p(
        "These terms govern your use of Footprint Finder's privacy monitoring and data-removal services, including the scope of what we scan, subscription and billing terms, and the limits of what any removal service can guarantee.",
      )}${p(
        "In particular: no data-removal service can guarantee removal from every broker. Some ignore requests, some re-list from fresh public records, and some fall outside the reach of the laws a request cites. We describe what we attempt and report what actually happened.",
      )}${siteLinksBlock()}</main>`,
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
    `<meta property="og:image" content="${BASE_URL}/og-image.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escAttr(route.title)}" />`,
    `<meta name="twitter:image" content="${BASE_URL}/og-image.png" />`,
    ...(route.jsonLd ?? []).map(
      (b) =>
        `<script type="application/ld+json" data-dynamic-seo="1">${JSON.stringify(b)}</script>`,
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
    compareIndexRoute(),
    ...Object.values(COMPETITORS).map(compareRoute),
    ...HEAD_TO_HEADS.map(headToHeadRoute),
    bestServicesRoute(),
  ];

  for (const route of routes) writeRoute(template, route);

  console.log(
    `[prerender] wrote ${routes.length} static HTML pages (${brokers.length} brokers).`,
  );
}

void main();
