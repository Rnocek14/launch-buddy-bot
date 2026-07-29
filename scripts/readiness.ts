/**
 * Production readiness scan.  Run:  npm run readiness
 *
 * GO-LIVE.md is a manual checklist, which means it tells you what to check but
 * never what is actually true right now. This probes the running system and
 * reports the difference.
 *
 * The probes are chosen so they are safe to run against production repeatedly:
 * nothing is written, no real address is used, and the one probe that touches
 * the lead-capture path deliberately sends `consented: false` so the function's
 * own consent guard rejects it — which doubles as a test that the guard works.
 *
 * Exit code is non-zero if any RED item fails, so it can gate a deploy.
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import { resolve } from "path";

type Status = "pass" | "fail" | "warn" | "unknown";

interface Check {
  area: string;
  name: string;
  status: Status;
  detail: string;
  /** Exact remediation. Shown only when not passing. */
  fix?: string;
  /** RED items block revenue or the core product; they set the exit code. */
  critical?: boolean;
}

const checks: Check[] = [];
const add = (c: Check) => checks.push(c);

const ROOT = resolve(".");
const read = (p: string) => readFileSync(resolve(ROOT, p), "utf8");

// ---------------------------------------------------------------------------
// A. Offline config hygiene
// ---------------------------------------------------------------------------

function checkEnvFile() {
  if (!existsSync(resolve(ROOT, ".env"))) {
    add({
      area: "Config",
      name: ".env present",
      status: "warn",
      detail: "No .env file found",
      fix: "Create .env with VITE_SUPABASE_URL, VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_PUBLISHABLE_KEY.",
    });
    return null;
  }

  const env = Object.fromEntries(
    read(".env")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        // Values may be quote-wrapped; Vite strips these, so we must too or
        // every URL built from them is malformed.
        const v = l.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
        return [l.slice(0, i).trim(), v];
      }),
  ) as Record<string, string>;

  // .env is committed in this repo. That is only safe while it holds nothing
  // but publishable values, so verify that rather than assuming it.
  const SECRET_HINTS = [
    "SERVICE_ROLE",
    "STRIPE_SECRET",
    "STRIPE_WEBHOOK",
    "RESEND_API",
    "HIBP_API",
    "SERP_API",
    "OPENAI_API",
    "BROWSERLESS",
    "CLIENT_SECRET",
    "ENCRYPTION_KEY",
    "EMAIL_SECRET",
  ];
  const leaked = Object.keys(env).filter((k) =>
    SECRET_HINTS.some((h) => k.toUpperCase().includes(h)),
  );

  add({
    area: "Config",
    name: "No server secrets in committed .env",
    status: leaked.length ? "fail" : "pass",
    critical: true,
    detail: leaked.length
      ? `Secret-looking keys in a committed file: ${leaked.join(", ")}`
      : "Only publishable VITE_* values present",
    fix: "Move these to Supabase Edge Function secrets (`supabase secrets set NAME=value`), rotate the exposed values, and keep local overrides in .env.local (already gitignored via *.local).",
  });

  // A service_role JWT in a VITE_ variable would be shipped to every browser.
  const pub = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (pub.split(".").length === 3) {
    try {
      const payload = JSON.parse(
        Buffer.from(pub.split(".")[1], "base64").toString("utf8"),
      );
      const role = payload.role;
      add({
        area: "Config",
        name: "Client key is anon, not service_role",
        status: role === "anon" ? "pass" : "fail",
        critical: true,
        detail: `role claim = ${role}`,
        fix: "A service_role key in a VITE_ variable is bundled into the browser and grants full database access. Replace with the anon/publishable key and rotate the exposed one immediately.",
      });
    } catch {
      add({
        area: "Config",
        name: "Client key is anon, not service_role",
        status: "unknown",
        detail: "Could not decode the publishable key",
      });
    }
  }

  return env;
}

function checkStripePrices() {
  const src = read("src/config/pricing.ts");
  // price_1<accountpart>… — Stripe encodes the account in the ID, so prices
  // from two accounts cannot both work with one secret key.
  const entries = Array.from(
    src.matchAll(/(\w+):\s*\{\s*\n\s*id:\s*"(price_1[A-Za-z0-9]+)"/g),
  ).map((m) => ({ key: m[1], id: m[2] }));

  if (!entries.length) {
    add({
      area: "Stripe",
      name: "Price IDs parse",
      status: "unknown",
      detail: "Could not find price IDs in src/config/pricing.ts",
    });
    return;
  }

  const live = entries.filter((e) => !e.key.startsWith("LEGACY_"));
  // Stripe IDs look like price_1 + 5 chars + a 10-char account segment + rest.
  // That layout is not documented, so a mismatch is a prompt to go and look
  // rather than a hard verdict — hence warn, not fail.
  const acct = (id: string) => id.slice(12, 22);
  const accounts = new Set(live.map((e) => acct(e.id)));

  add({
    area: "Stripe",
    name: "Sellable prices share one Stripe account",
    status: accounts.size === 1 ? "pass" : "warn",
    detail:
      accounts.size === 1
        ? `${live.length} sellable prices, one account segment (${[...accounts][0]})`
        : `Prices span ${accounts.size} account segments: ${[...accounts].join(", ")}`,
    fix: "Every price you sell must live in the same Stripe account as STRIPE_SECRET_KEY, or checkout fails with 'No such price'. This check reads an undocumented part of the ID, so confirm in the Stripe dashboard before acting on it.",
  });

  const legacy = entries.filter((e) => e.key.startsWith("LEGACY_"));
  if (legacy.length) {
    const legacyAccounts = new Set(legacy.map((e) => acct(e.id)));
    const mixed = [...legacyAccounts].some((a) => !accounts.has(a));
    add({
      area: "Stripe",
      name: "Legacy prices are lookup-only",
      status: mixed ? "warn" : "pass",
      detail: mixed
        ? `${legacy.length} legacy price(s) from a different account — fine while they are only used for tier lookup, never for checkout`
        : `${legacy.length} legacy price(s), same account`,
      fix: "Confirm legacy IDs are only read from PRICE_ID_TO_TIER and never passed to Stripe checkout. If a grandfathered user ever hits checkout with one, it will fail.",
    });
  }
}

function checkMigrations() {
  const dir = resolve(ROOT, "supabase/migrations");
  if (!existsSync(dir)) {
    add({ area: "Database", name: "Migrations directory", status: "fail", critical: true, detail: "supabase/migrations not found" });
    return;
  }
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql"));
  add({
    area: "Database",
    name: "Migrations present",
    status: files.length ? "pass" : "fail",
    detail: `${files.length} migration files`,
    fix: "Apply with `supabase db push` — an unapplied migration means the table simply is not there in production.",
  });
}

function checkEdgeFunctionSecretsReferenced() {
  // Which secrets the deployed code will actually ask for. Useful as the
  // authoritative list to set, rather than trusting a hand-written doc.
  const dir = resolve(ROOT, "supabase/functions");
  if (!existsSync(dir)) return;
  const names = new Set<string>();
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const full = resolve(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith(".ts")) {
        for (const m of readFileSync(full, "utf8").matchAll(
          /Deno\.env\.get\(['"]([A-Z0-9_]+)['"]\)/g,
        )) {
          names.add(m[1]);
        }
      }
    }
  };
  walk(dir);
  // Supabase injects these automatically; they are not things you set.
  for (const auto of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"]) {
    names.delete(auto);
  }
  add({
    area: "Config",
    name: "Secrets referenced by edge functions",
    status: "pass",
    detail: `${names.size} distinct: ${[...names].sort().join(", ")}`,
  });
}

// ---------------------------------------------------------------------------
// B. Live probes
// ---------------------------------------------------------------------------

const PROBE_EMAIL = "readiness-probe@footprintfinder.co";

async function probeFunction(
  base: string,
  anon: string,
  name: string,
  body: unknown,
): Promise<{ status: number; text: string } | { error: string }> {
  try {
    const res = await fetch(`${base}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anon}`,
        apikey: anon,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const text = (await res.text()).slice(0, 400);
    // Supabase functions always answer with JSON. A non-JSON body means the
    // response came from something in between — a proxy, a captive portal, an
    // egress policy — and reporting it as a function failure would send the
    // reader off fixing something that is not broken.
    try {
      JSON.parse(text);
    } catch {
      return { error: `Intercepted before reaching Supabase (HTTP ${res.status}: ${text.slice(0, 120)})` };
    }
    return { status: res.status, text };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

async function checkLive(env: Record<string, string> | null) {
  const base = env?.VITE_SUPABASE_URL;
  const anon = env?.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !anon) {
    add({ area: "Live", name: "Supabase reachable", status: "unknown", detail: "No VITE_SUPABASE_URL / key in .env" });
    return;
  }

  // --- The free scan's breach half. Hard-fails 503 without HIBP_API_KEY,
  //     which is exactly the "the free scan returns nothing" symptom.
  const breach = await probeFunction(base, anon, "free-breach-check", { email: PROBE_EMAIL });
  if ("error" in breach) {
    add({ area: "Live", name: "free-breach-check reachable", status: "unknown", detail: breach.error, fix: "Run this from a network that can reach your Supabase project." });
  } else if (breach.status === 404) {
    add({ area: "Free scan", name: "free-breach-check deployed", status: "fail", critical: true, detail: "404 — function not deployed", fix: "supabase functions deploy free-breach-check" });
  } else if (breach.status === 503 || breach.text.includes("Breach check service unavailable")) {
    add({
      area: "Free scan",
      name: "HIBP_API_KEY configured",
      status: "fail",
      critical: true,
      detail: "Function returns 503 — the key is not set, so every scan shows no breaches",
      fix: "HaveIBeenPwned's API v3 is a paid subscription. Buy a key at haveibeenpwned.com/API/Key, then `supabase secrets set HIBP_API_KEY=...` and redeploy free-breach-check.",
    });
  } else if (breach.status === 200) {
    let parsed: any = {};
    try { parsed = JSON.parse(breach.text); } catch { /* non-JSON body */ }
    add({
      area: "Free scan",
      name: "HIBP_API_KEY configured",
      status: parsed.error ? "warn" : "pass",
      detail: parsed.error ? `Returned soft error: ${parsed.error}` : "Breach lookup returned a live result",
    });
  } else {
    add({ area: "Free scan", name: "free-breach-check healthy", status: "warn", detail: `HTTP ${breach.status}: ${breach.text}` });
  }

  // --- The free scan's broker half. Degrades honestly rather than failing.
  const broker = await probeFunction(base, anon, "free-broker-check", {
    firstName: "Readiness", lastName: "Probe",
  });
  if ("error" in broker) {
    add({ area: "Live", name: "free-broker-check reachable", status: "unknown", detail: broker.error });
  } else if (broker.status === 404) {
    add({ area: "Free scan", name: "free-broker-check deployed", status: "fail", critical: true, detail: "404 — function not deployed", fix: "supabase functions deploy free-broker-check" });
  } else {
    let parsed: any = {};
    try { parsed = JSON.parse(broker.text); } catch { /* non-JSON body */ }
    const degraded = parsed?.degraded === true;
    add({
      area: "Free scan",
      name: "SERP_API_KEY configured",
      status: degraded ? "fail" : broker.status === 200 ? "pass" : "warn",
      critical: true,
      detail: degraded
        ? "Broker check reports degraded — no live listings are being found"
        : `HTTP ${broker.status}`,
      fix: "SerpApi is a paid service. Get a key at serpapi.com, then `supabase secrets set SERP_API_KEY=...` and redeploy free-broker-check. Without it the scan can never show a real broker listing, which is the single most convincing thing in the whole funnel.",
    });
  }

  // --- Lead capture. Deliberately sends consented:false: a healthy function
  //     rejects it with 400, which proves both deployment and that the consent
  //     guard works, while storing nothing.
  const capture = await probeFunction(base, anon, "capture-scan-lead", {
    email: PROBE_EMAIL, consented: false, source: "readiness",
  });
  if ("error" in capture) {
    add({ area: "Live", name: "capture-scan-lead reachable", status: "unknown", detail: capture.error });
  } else if (capture.status === 404) {
    add({
      area: "Leads",
      name: "capture-scan-lead deployed",
      status: "fail",
      critical: true,
      detail: "404 — not deployed, so no lead is ever stored",
      fix: "supabase functions deploy capture-scan-lead — and apply the scan_leads migration first, or every capture will error.",
    });
  } else if (capture.status === 400 && capture.text.includes("Consent")) {
    add({ area: "Leads", name: "capture-scan-lead + consent guard", status: "pass", detail: "Deployed, and correctly refuses to store without consent" });
  } else if (capture.status === 200) {
    add({
      area: "Leads",
      name: "capture-scan-lead consent guard",
      status: "fail",
      critical: true,
      detail: "Function accepted a request with consented:false",
      fix: "The deployed copy is out of date — it must reject unconsented writes. Redeploy capture-scan-lead.",
    });
  } else {
    add({ area: "Leads", name: "capture-scan-lead healthy", status: "warn", detail: `HTTP ${capture.status}: ${capture.text}` });
  }

  // --- Analytics, which is how you will know any of the above is working.
  const analytics = await probeFunction(base, anon, "log-analytics-event", {
    event: "readiness_probe", properties: { source: "readiness-script" },
  });
  if ("error" in analytics) {
    add({ area: "Live", name: "log-analytics-event reachable", status: "unknown", detail: analytics.error });
  } else {
    add({
      area: "Analytics",
      name: "log-analytics-event deployed",
      status: analytics.status === 200 ? "pass" : "warn",
      detail: `HTTP ${analytics.status}`,
      fix: "supabase functions deploy log-analytics-event — without it you are flying blind on whether any funnel change worked.",
    });
  }
}

/**
 * A corporate proxy, a sandbox egress policy or an offline laptop all produce
 * responses that look exactly like a broken deployment. Reporting "your site
 * is down" because the machine running this script cannot reach the internet
 * would be worse than reporting nothing, so anything that does not look like
 * our own HTML is treated as not-checked rather than failed.
 */
function looksLikeOurApp(html: string) {
  return html.includes('id="root"') || html.toLowerCase().includes("footprint finder");
}

async function checkSite(siteUrl: string) {
  try {
    const res = await fetch(siteUrl, { signal: AbortSignal.timeout(20000) });
    const html = await res.text();
    if (!looksLikeOurApp(html)) {
      add({
        area: "Site",
        name: "Homepage reachable",
        status: "unknown",
        detail: `HTTP ${res.status}, and the body is not our HTML — almost certainly a proxy or egress block on this machine, not a site outage`,
        fix: "Re-run from a network that can reach the public site.",
      });
      return;
    }
    const root = html.indexOf('<div id="root">');
    const body = root >= 0 ? html.slice(root, html.indexOf("</body>")) : "";
    const words = body.replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
    add({
      area: "Site",
      name: "Homepage serves prerendered HTML",
      status: words > 100 ? "pass" : "fail",
      critical: true,
      detail: `${words} words inside #root before JavaScript runs`,
      fix: "If this is near zero the prerender step is not reaching production. Confirm `postbuild` runs on your host and that dist/ is what gets deployed.",
    });
  } catch (e) {
    add({ area: "Site", name: "Homepage reachable", status: "unknown", detail: e instanceof Error ? e.message : String(e) });
  }

  for (const path of ["/robots.txt", "/sitemap.xml"]) {
    try {
      const res = await fetch(siteUrl + path, { signal: AbortSignal.timeout(15000) });
      const body = (await res.text()).slice(0, 2000);
      // Same reasoning as looksLikeOurApp: a proxy 403 is not a site failure.
      const proxyBlocked =
        !res.ok && !/user-agent|sitemap|<urlset|<\?xml/i.test(body);
      add({
        area: "Site",
        name: `${path} served`,
        status: res.ok ? "pass" : proxyBlocked ? "unknown" : "fail",
        detail: proxyBlocked
          ? `HTTP ${res.status} with a non-site body — proxy or egress block on this machine`
          : `HTTP ${res.status}`,
        fix: `${path} must return 200 — search engines cannot discover the site without it.`,
      });
    } catch (e) {
      add({ area: "Site", name: `${path} served`, status: "unknown", detail: e instanceof Error ? e.message : String(e) });
    }
  }
}

// ---------------------------------------------------------------------------

const ICON: Record<Status, string> = { pass: "PASS", fail: "FAIL", warn: "WARN", unknown: " ?  " };

async function main() {
  const env = checkEnvFile();
  checkStripePrices();
  checkMigrations();
  checkEdgeFunctionSecretsReferenced();

  const offline = process.argv.includes("--offline");
  if (!offline) {
    await checkLive(env);
    await checkSite(process.env.SITE_URL ?? "https://footprintfinder.co");
  }

  const areas = [...new Set(checks.map((c) => c.area))];
  console.log("\n=== Production readiness ===\n");
  for (const area of areas) {
    console.log(area);
    for (const c of checks.filter((x) => x.area === area)) {
      const flag = c.critical && c.status === "fail" ? " [BLOCKS REVENUE]" : "";
      console.log(`  ${ICON[c.status]}  ${c.name}${flag}`);
      console.log(`        ${c.detail}`);
      if (c.status !== "pass" && c.fix) console.log(`        FIX: ${c.fix}`);
    }
    console.log("");
  }

  const failed = checks.filter((c) => c.status === "fail");
  const blocking = failed.filter((c) => c.critical);
  const unknown = checks.filter((c) => c.status === "unknown");

  console.log(
    `${checks.filter((c) => c.status === "pass").length} passed · ${failed.length} failed · ` +
      `${checks.filter((c) => c.status === "warn").length} warnings · ${unknown.length} not checked`,
  );
  if (unknown.length) {
    console.log("\nItems marked ? could not be reached from here — re-run from a network with access.");
  }
  if (blocking.length) {
    console.log(`\n${blocking.length} blocking issue(s):`);
    for (const b of blocking) console.log(`  - ${b.area}: ${b.name}`);
    process.exit(1);
  }
}

void main();
