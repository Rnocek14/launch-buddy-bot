// Unit tests for the five audit fixes (phantom brokers, deletion cap, contact
// authz, honest copy, env int parsing).
//
// Runs under `bun test`. Deno.env is shimmed so the real edge-function modules
// load outside the Deno runtime. Where a whole edge function cannot be imported
// (remote https:// imports, a top-level Deno.serve), the fixed logic is pulled
// OUT OF THE SHIPPED SOURCE and executed — never re-typed here. A copy-pasted
// replica would keep passing after the shipped code regressed, which is worse
// than having no test at all.
//
// Every extraction happens lazily inside a test, so a construct that has gone
// missing fails that one test with a readable message instead of aborting the
// file and hiding the other results.
import { test, expect, describe } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FN = (p: string) => join(ROOT, "supabase/functions", p);
const SRC = (p: string) => join(ROOT, "src", p);
const MIGRATIONS = join(ROOT, "supabase/migrations");
const read = (p: string) => readFileSync(p, "utf8");
const migration = (f: string) => read(join(MIGRATIONS, f));

// --- Deno.env shim -----------------------------------------------------------
// Blank / whitespace-only / absent values, set BEFORE probes.ts is imported
// below: that module computes its clamped budgets at import time, so the shim
// has to be in place first and the import has to be top-level (a beforeAll
// would run after every test file had already been evaluated, and a sibling
// file replacing globalThis.Deno in the meantime would silently defuse it).
const denoEnv: Record<string, string | undefined> = {
  PROBE_TIMEOUT_MS: "", // set-but-empty
  SITEMAP_MAX_LOCS: "   ", // whitespace-only
  // SITEMAP_MAX_BYTES deliberately absent
};
const priorDeno = (globalThis as any).Deno;
(globalThis as any).Deno = {
  ...(priorDeno ?? {}),
  // Delegate unknown keys so this shim composes with the one in
  // revenue-fixes.test.ts whichever file the runner loads first.
  env: { get: (k: string) => (k in denoEnv ? denoEnv[k] : priorDeno?.env?.get?.(k)) },
};

const probes = await import(FN("_shared/probes.ts"));

// --- Source-extraction helpers ----------------------------------------------
const transpiler = new Bun.Transpiler({ loader: "ts" });

/** Compile a TypeScript snippet lifted from source and evaluate `returnExpr`. */
function evalSnippet<T>(snippet: string, returnExpr: string, scope: Record<string, unknown> = {}): T {
  const js = transpiler.transformSync(snippet);
  const names = Object.keys(scope);
  return new Function(...names, `${js}\nreturn (${returnExpr});`)(...names.map((n) => scope[n])) as T;
}

/** Text inside the balanced (...) group beginning at the first '(' at/after `from`. */
function balancedParens(src: string, from: number): string {
  const open = src.indexOf("(", from);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "(") depth++;
    else if (src[i] === ")" && --depth === 0) return src.slice(open + 1, i);
  }
  throw new Error(`unbalanced parens from index ${from}`);
}

function must(m: RegExpMatchArray | null, what: string): RegExpMatchArray {
  if (!m) throw new Error(`could not locate ${what} in the shipped source — it is missing or has been rewritten`);
  return m;
}

/** Slug list out of a `name TEXT[] := ARRAY[ 'a', 'b' ];` plpgsql declaration. */
function sqlSlugArray(sql: string, varName: string): string[] {
  const m = must(sql.match(new RegExp(`${varName}\\s+TEXT\\[\\]\\s*:=\\s*ARRAY\\[([\\s\\S]*?)\\];`)), varName);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

// ---------------------------------------------------------------------------
// FIX 5 — int(): a set-but-empty env var must fall back to its default
// ---------------------------------------------------------------------------

// Matches either shape of the helper — the old one-line expression body or the
// fixed block body — so a regression fails on the ASSERTIONS below (with the
// real values printed) rather than on a missing-source error.
const INT_RE = /const int = \(v\?: string, d = 0\) =>\s*(?:\{[\s\S]*?\n\};|[^\n]*;)/;

function shippedInt(path: string): (v?: string, d?: number) => number {
  const snippet = must(read(path).match(INT_RE), `int() in ${path}`)[0];
  return evalSnippet(snippet, "int");
}

describe("env-int: blank env vars fall back to the default, not to 0", () => {
  // The implementation this replaces. Kept only to prove the new tests are not
  // vacuous: Number('') === 0 and Number('   ') === 0 are both finite, so the
  // old one-liner answered 0 and the caller's Math.max() clamp turned that into
  // the floor.
  const legacyInt = (v?: string, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

  test("the old implementation really did collapse a blank value to 0", () => {
    expect(legacyInt("", 25000)).toBe(0);
    expect(legacyInt("   ", 25000)).toBe(0);
  });

  test("probes.ts (real module) resolves blank/whitespace/absent env to its defaults", () => {
    // PROBE_TIMEOUT_MS='' — old: Math.max(1500, 0) === 1500
    expect(probes.PROBE_TIMEOUT_MS).toBe(4000);
    // SITEMAP_MAX_LOCS='   ' — old: Math.max(25, 0) === 25
    expect(probes.SITEMAP_MAX_LOCS).toBe(200);
    // absent — unchanged by the fix, asserted so a regression here is visible too
    expect(probes.SITEMAP_MAX_BYTES).toBe(5_000_000);
  });

  // Both shipped copies of int() are lifted out of their source file and run.
  const copies: Array<[string, string]> = [
    ["_shared/probes.ts", FN("_shared/probes.ts")],
    ["discover-privacy-contacts/index.ts", FN("discover-privacy-contacts/index.ts")],
  ];

  for (const [label, path] of copies) {
    describe(label, () => {
      test("blank and whitespace-only are treated as unset", () => {
        const int = shippedInt(path);
        expect(int("", 7)).toBe(7);
        expect(int("   ", 7)).toBe(7);
        expect(int("\t\n ", 7)).toBe(7);
        expect(int(undefined, 7)).toBe(7);
      });

      test("an explicit '0' still parses as 0 (the guard is blankness, not falsiness)", () => {
        const int = shippedInt(path);
        expect(int("0", 7)).toBe(0);
        expect(int("-5", 7)).toBe(-5);
      });

      test("real numbers and junk behave exactly as before", () => {
        const int = shippedInt(path);
        expect(int("42", 7)).toBe(42);
        expect(int(" 25000 ", 7)).toBe(25000);
        expect(int("abc", 7)).toBe(7);
        expect(int("NaN", 7)).toBe(7);
        expect(int("Infinity", 7)).toBe(7);
        expect(int("-Infinity", 7)).toBe(7);
      });
    });
  }

  test("DISCOVERY_DOMAIN_BUDGET_MS='' is 25000ms again, not the 3000ms floor", () => {
    const path = FN("discover-privacy-contacts/index.ts");
    const src = read(path);
    const snippet = must(src.match(INT_RE), "int()")[0];
    // The real clamp expression, lifted from the DOMAIN_BUDGET_MS line.
    const clampExpr = must(src.match(/const DOMAIN_BUDGET_MS = (Math\.min\(.*\));/), "DOMAIN_BUDGET_MS clamp")[1]
      .replace(/Deno\.env\.get\('DISCOVERY_DOMAIN_BUDGET_MS'\)/, "v");
    const budget = evalSnippet<(v?: string) => number>(snippet, `(v) => ${clampExpr}`);

    expect(budget("")).toBe(25000); // the reported 8x cut: was 3000
    expect(budget("   ")).toBe(25000);
    expect(budget(undefined)).toBe(25000);
    expect(budget("45000")).toBe(45000); // still honours a real value
    expect(budget("1000")).toBe(3000); // still clamps a real value to the floor
  });

  test("the mirrored helper in tests/env-parse.test.ts is kept in sync", () => {
    const src = read(join(ROOT, "tests/env-parse.test.ts"));
    expect(src).toContain("v.trim() === ''");
    expect(src).toContain("expect(clampBudget('   ')).toBe(25000)");
  });
});

// ---------------------------------------------------------------------------
// FIX 1 — scan-brokers never reports an unchecked broker as clean
// ---------------------------------------------------------------------------
const scanSrc = () => read(FN("scan-brokers/index.ts"));

/** The engine's real pattern map, read off the shipped source. */
function scannerSlugs(): Set<string> {
  const src = scanSrc();
  const start = src.indexOf("const brokerPatterns: Record<string, {");
  if (start < 0) throw new Error("brokerPatterns map not found in scan-brokers/index.ts");
  // The map ends at the first top-level `};` after it.
  const end = start + must(src.slice(start).match(/\n\};\n/), "end of brokerPatterns")!.index!;
  const slugs = [...src.slice(start, end).matchAll(/^ {2}'([a-z0-9_-]+)': \{$/gm)].map((m) => m[1]);
  return new Set(slugs);
}

/** The persisted `status` expression from the broker_scan_results upsert. */
function persistStatus(): (r: { status_v2: string }) => string {
  const expr = must(
    scanSrc().match(/from\('broker_scan_results'\)\s*\.upsert\(\{[\s\S]*?\n\s*status:\s*(.+?),\n/),
    "broker_scan_results upsert status mapping",
  )[1];
  return new Function("result", `return (${expr});`) as (r: { status_v2: string }) => string;
}

describe("scan-brokers: a broker with no detection pattern can never persist as 'clean'", () => {
  test("the pattern map is non-trivial and the scannable set is derived from it", () => {
    const slugs = scannerSlugs();
    expect(slugs.size).toBeGreaterThan(0);
    expect(slugs.has("beenverified")).toBe(true);
    // Derived, not hand-copied — a hardcoded list can drift from the real patterns.
    expect(scanSrc()).toContain("const SCANNABLE_BROKER_SLUGS = new Set(Object.keys(brokerPatterns));");
  });

  test("the persist mapping still round-trips the statuses it is supposed to", () => {
    // Guards against a mapping that says 'error' for everything, which would make
    // the assertion below pass without meaning anything.
    const persist = persistStatus();
    expect(persist({ status_v2: "not_found" })).toBe("clean");
    expect(persist({ status_v2: "found" })).toBe("found");
    expect(persist({ status_v2: "possible_match" })).toBe("found");
    expect(persist({ status_v2: "timeout" })).toBe("error");
  });

  test("scanBrokerV2's no-pattern branch returns 'unknown', which persists as 'error'", () => {
    const src = scanSrc();
    const branchAt = src.indexOf("if (!pattern) {");
    expect(branchAt).toBeGreaterThan(-1);
    const branch = src.slice(branchAt, src.indexOf("\n  }", branchAt));
    const statusV2 = must(branch.match(/status_v2:\s*'([a-z_]+)'/), "no-pattern status_v2")[1];
    const persist = persistStatus();

    // The original bug: this said 'not_found', which the upsert maps to 'clean'.
    expect(statusV2).not.toBe("not_found");
    expect(statusV2).toBe("unknown");
    expect(persist({ status_v2: statusV2 })).not.toBe("clean");
    expect(persist({ status_v2: statusV2 })).toBe("error");

    // 'error' is in the broker_scan_results status CHECK constraint; 'unknown' is a
    // legal status_v2. No ErrorCode means "never attempted", hence null.
    expect(branch).toMatch(/error_code:\s*null/);
  });

  test("the real partition helper routes pattern-less brokers to 'skipped', never to the scan list", () => {
    const snippet = must(
      scanSrc().match(/const partitionByPatternSupport = \(candidates[\s\S]*?\n {6}\}\);/),
      "partitionByPatternSupport",
    )[0];
    const slugs = scannerSlugs();
    const partition = evalSnippet<(c: { id: string; slug: string }[]) => { scannable: any[]; skipped: any[] }>(
      snippet,
      "partitionByPatternSupport",
      { hasDetectionPattern: (s: string) => slugs.has(s) },
    );

    const { scannable, skipped } = partition([
      { id: "1", slug: "beenverified" }, // has a pattern
      { id: "2", slug: "pipl" }, // listed, no pattern
      { id: "3", slug: "mugshots" }, // listed, no pattern
    ]);
    expect(scannable.map((b) => b.slug)).toEqual(["beenverified"]);
    expect(skipped.map((b) => b.slug)).toEqual(["pipl", "mugshots"]);
  });

  test("both broker-selection branches scan only the partitioned 'scannable' half", () => {
    const src = scanSrc();
    expect(src).toContain("brokers = split.scannable;");
    expect(src).toContain("brokers = retrySplit.scannable;");
    // total_brokers is the real coverage number, not the size of the directory.
    expect(src).toContain("brokerCount = brokers.length;");
    expect(src).not.toContain("count: 'exact'");
  });

  test("coverage numbers are reported to the client on POST and GET", () => {
    const src = scanSrc();
    expect(src).toContain("skipped_broker_slugs");
    expect(src).toContain("listed_brokers: listedCount");
  });
});

describe("scan-brokers migration: clears the phantom clean rows and nothing else", () => {
  const FILE = "20260916120200_clear_phantom_clean_broker_results.sql";

  test("its scannable list is exactly the engine's pattern map", () => {
    expect(new Set(sqlSlugArray(migration(FILE), "v_scannable_slugs"))).toEqual(scannerSlugs());
  });

  test("the two lists are disjoint, so a typo cannot delete a real scan result", () => {
    const sql = migration(FILE);
    const slugs = scannerSlugs();
    const unscannable = sqlSlugArray(sql, "v_unscannable_slugs");
    expect(unscannable.filter((s) => slugs.has(s))).toEqual([]);
    expect(unscannable.length).toBeGreaterThan(0);
    expect(sql).toContain("db.slug <> ALL (v_scannable_slugs)");
  });

  test("only false 'not listed' claims are deleted — user actions survive", () => {
    const sql = migration(FILE);
    const del = sql.slice(sql.indexOf("DELETE FROM public.broker_scan_results"));
    const where = del.slice(0, del.indexOf(";"));
    expect(where).toContain("bsr.status = 'clean'");
    expect(where).toContain("bsr.status_v2 = 'not_found'");
    expect(where).toContain("bsr.opted_out_at IS NULL");
    expect(where).toContain("bsr.opt_out_started_at IS NULL");
    // 'found' / 'opted_out' rows record something real and must not be swept up.
    expect(where).not.toContain("'opted_out'");
  });
});

// ---------------------------------------------------------------------------
// FIX 1b — Family tier may run broker scans
// ---------------------------------------------------------------------------
describe("scan-brokers: the subscription gate accepts Complete AND Family", () => {
  /** The `if (...)` guarding the broker-scan 403, whichever shape it has. */
  function shippedGate(): (subscription: { tier: string } | null) => boolean {
    const src = scanSrc();
    const errAt = src.search(/subscription required for broker scanning/);
    if (errAt < 0) throw new Error("broker-scan subscription 403 not found");
    const ifAt = src.lastIndexOf("if (", errAt);
    const cond = balancedParens(src, ifAt);
    // BROKER_SCAN_TIERS is supplied when the shipped gate references it; the old
    // gate compared tier to a single literal and simply ignores the extra arg.
    const tiersSnippet = src.match(/const BROKER_SCAN_TIERS = new Set\(\[[^\]]*\]\);/);
    const tiers = tiersSnippet ? evalSnippet<Set<string>>(tiersSnippet[0], "BROKER_SCAN_TIERS") : new Set<string>();
    const fn = new Function("subscription", "BROKER_SCAN_TIERS", `return (${cond});`);
    return (subscription) => Boolean(fn(subscription, tiers));
  }

  test("the tier set holds both paid scanning tiers and neither free nor pro", () => {
    const snippet = must(scanSrc().match(/const BROKER_SCAN_TIERS = new Set\(\[[^\]]*\]\);/), "BROKER_SCAN_TIERS")[0];
    const tiers = evalSnippet<Set<string>>(snippet, "BROKER_SCAN_TIERS");
    expect(tiers.has("complete")).toBe(true);
    expect(tiers.has("family")).toBe(true);
    expect(tiers.has("pro")).toBe(false);
    expect(tiers.has("free")).toBe(false);
  });

  test("the shipped 403 condition (lifted from source) lets Family through", () => {
    const denied = shippedGate();
    expect(denied({ tier: "family" })).toBe(false); // the bug: was true
    expect(denied({ tier: "complete" })).toBe(false);
    expect(denied({ tier: "pro" })).toBe(true);
    expect(denied({ tier: "free" })).toBe(true);
    expect(denied(null)).toBe(true); // no active subscription
  });

  test("the gate mirrors TIER_LIMITS.brokerScanning in src/config/pricing.ts", async () => {
    const { TIER_LIMITS } = await import("../src/config/pricing");
    const denied = shippedGate();
    for (const [tier, limits] of Object.entries(TIER_LIMITS)) {
      const mayScan = (limits as { brokerScanning: boolean }).brokerScanning;
      expect({ tier, denied: denied({ tier }) }).toEqual({ tier, denied: !mayScan });
    }
  });

  test("the 403 copy names Family so the message is not itself misleading", () => {
    expect(scanSrc()).toMatch(/Complete or Family subscription required for broker scanning/);
  });
});

// ---------------------------------------------------------------------------
// FIX 2 — unlimited deletions for every paid tier
// ---------------------------------------------------------------------------
describe("deletion cap: get_remaining_deletions returns unlimited for all paid tiers", () => {
  const FILE = "20260916120000_fix_deletion_limits_for_paid_tiers.sql";
  const fnBody = () => {
    const sql = migration(FILE);
    return sql.slice(sql.indexOf("CREATE OR REPLACE FUNCTION public.get_remaining_deletions"));
  };

  /** Tiers the shipped SQL short-circuits to NULL (= unlimited). */
  function unlimitedTiers(): Set<string> {
    const body = fnBody();
    const gate = must(body.match(/IF v_tier (?:IN \(([^)]*)\)|= ('[a-z]+')) THEN\s*\n\s*RETURN NULL/), "unlimited tier gate");
    return new Set([...(gate[1] ?? gate[2]).matchAll(/'([a-z]+)'/g)].map((m) => m[1]));
  }

  test("the unlimited gate covers pro, complete and family", () => {
    expect(unlimitedTiers()).toEqual(new Set(["pro", "complete", "family"]));
  });

  test("this migration is the last word on the function", () => {
    const definers = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql") && /FUNCTION public\.get_remaining_deletions/.test(read(join(MIGRATIONS, f))))
      .sort();
    expect(definers.length).toBeGreaterThan(1); // there IS an earlier, broken definition
    expect(definers[definers.length - 1]).toBe(FILE);
  });

  test("subscriptions.tier can physically hold 'family'", () => {
    // Without this the family branch above is unreachable: check-subscription
    // swallows the constraint violation and the row stays on its old tier.
    const check = must(
      migration(FILE).match(/ADD CONSTRAINT subscriptions_tier_check CHECK \(([\s\S]*?)\);/),
      "tier CHECK constraint",
    )[1];
    for (const tier of ["free", "pro", "complete", "family"]) expect(check).toContain(`'${tier}'`);
  });

  test("free-tier behaviour and the SECURITY DEFINER context are preserved", () => {
    const body = fnBody();
    expect(body).toContain("RETURN GREATEST(0, v_max_free_deletions - COALESCE(v_deletion_count, 0));");
    expect(body).toContain("v_max_free_deletions INTEGER := 3;");
    expect(body).toContain("SECURITY DEFINER");
    expect(body).toContain("SET search_path = public");
    expect(body).toContain("ON CONFLICT (user_id) DO NOTHING");
  });

  test("the send-deletion-request guard no longer blocks Complete or Family", () => {
    const fnSrc = read(FN("send-deletion-request/index.ts"));
    // The real guard, unchanged by this fix — the migration is what moves.
    expect(fnSrc).toContain("remainingDeletions !== null && remainingDeletions <= 0");

    const unlimited = unlimitedTiers();
    const remaining = (tier: string, used: number) => (unlimited.has(tier) ? null : Math.max(0, 3 - used));
    const blocked = (tier: string, used: number) => {
      const r = remaining(tier, used);
      return r !== null && r <= 0;
    };
    expect(blocked("complete", 3)).toBe(false); // the customer-facing bug
    expect(blocked("family", 99)).toBe(false);
    expect(blocked("pro", 3)).toBe(false);
    expect(blocked("free", 3)).toBe(true); // free cap still enforced
    expect(blocked("free", 1)).toBe(false);
  });

  test("the SQL gate matches TIER_LIMITS.deletionsPerMonth in src/config/pricing.ts", async () => {
    const { TIER_LIMITS } = await import("../src/config/pricing");
    const configUnlimited = new Set(
      Object.entries(TIER_LIMITS)
        .filter(([, l]) => (l as { deletionsPerMonth: number | null }).deletionsPerMonth === null)
        .map(([tier]) => tier),
    );
    expect(configUnlimited).toEqual(unlimitedTiers());
  });

  test("increment_deletion_count is deliberately untouched", () => {
    // It gates on `v_tier = 'free'`, so it never had the paid-tier problem.
    expect(migration(FILE)).not.toMatch(/CREATE OR REPLACE FUNCTION public\.increment_deletion_count/);
  });
});

// ---------------------------------------------------------------------------
// FIX 3 — validate-email-contact actually USES its admin check
// ---------------------------------------------------------------------------
describe("validate-email-contact: the admin check guards the writes", () => {
  const contactSrc = () => read(FN("validate-email-contact/index.ts"));
  const rpcIndex = (src: string) => {
    const i = src.indexOf('supabase.rpc("has_role"');
    if (i < 0) throw new Error("has_role check is missing from validate-email-contact");
    return i;
  };

  test("the has_role result is bound AND consumed (the original bug discarded it)", () => {
    const src = contactSrc();
    const rpcAt = rpcIndex(src);
    const decl = must(
      src.slice(0, rpcAt).match(/const \{ data: (\w+)(?:, error: (\w+))? \} = await $/),
      "has_role destructuring",
    );
    const [, adminVar, errVar] = decl;
    expect(errVar).toBeTruthy(); // the RPC error is captured, not ignored
    // Before the fix `isAdmin` appeared exactly once: assigned, then never read.
    const uses = src.split(new RegExp(`\\b${adminVar}\\b`)).length - 1;
    expect(uses).toBeGreaterThan(1);
    expect(src.slice(rpcAt)).toMatch(new RegExp(`if \\([\\s\\S]{0,120}\\b${adminVar}\\b`));
  });

  test("the shipped denial condition (lifted from source) fails closed", () => {
    const src = contactSrc();
    const rpcAt = rpcIndex(src);
    const cond = balancedParens(src, src.indexOf("if (", rpcAt));
    const fn = new Function("roleError", "isAdmin", `return (${cond});`);
    // The shipped condition is `roleError || isAdmin !== true`, so it yields the
    // error object rather than a boolean; the `if` reads it for truthiness.
    const deny = (e: unknown, a: unknown) => Boolean(fn(e, a));

    expect(deny(null, true)).toBe(false); // admin -> allowed
    expect(deny(null, false)).toBe(true); // non-admin -> denied
    expect(deny(null, null)).toBe(true); // RPC returned nothing -> denied
    expect(deny(null, undefined)).toBe(true);
    expect(deny({ message: "rpc down" }, true)).toBe(true); // error -> denied anyway
  });

  test("the denial is a 403 response, not a silent no-op", () => {
    const src = contactSrc();
    const rpcAt = rpcIndex(src);
    const gate = src.slice(rpcAt, src.indexOf("const validationResult", rpcAt));
    expect(gate).toContain("status: 403");
    expect(gate).toMatch(/admin role required/i);
    expect(gate).toMatch(/console\.error\(/); // denials are logged
  });

  test("the gate runs before the DNS lookup and before either write", () => {
    const src = contactSrc();
    const rpcAt = rpcIndex(src);
    const mxAt = src.indexOf("await validateEmailMX(email)");
    const writeAt = src.indexOf("if (updateDatabase && validationResult.isValid)");
    const contactWrite = src.indexOf('.from("privacy_contacts")');
    const catalogWrite = src.indexOf('.from("service_catalog")');
    for (const idx of [mxAt, writeAt, contactWrite, catalogWrite]) expect(idx).toBeGreaterThan(-1);
    expect(rpcAt).toBeLessThan(mxAt); // a denied request does no outbound work
    expect(rpcAt).toBeLessThan(writeAt);
    expect(rpcAt).toBeLessThan(contactWrite);
    expect(rpcAt).toBeLessThan(catalogWrite);
  });

  test("the gate only applies to writes — a read-only MX check stays open", () => {
    const src = contactSrc();
    expect(src.slice(0, rpcIndex(src))).toMatch(/if \(updateDatabase\) \{\s*$/m);
  });

  test("privacy_contacts is covered by the same gate as service_catalog", () => {
    // privacy_contacts has no user_id column and admin-only RLS, and
    // send-deletion-request prefers it over service_catalog.privacy_email.
    const src = contactSrc();
    expect(read(FN("send-deletion-request/index.ts"))).toContain("privacy_contacts");
    const gated = src.slice(src.indexOf("if (updateDatabase && validationResult.isValid)"));
    expect(gated).toContain('.from("privacy_contacts")');
    expect(gated).toContain('.from("service_catalog")');
  });
});

describe("validate-email-contact migration: unverifies implausible contacts", () => {
  const FILE = "20260916120100_reset_unverified_privacy_contacts.sql";

  test("flags rather than deletes, so an admin can still re-review", () => {
    const sql = migration(FILE);
    expect(sql).toContain("contact_verified = false");
    expect(sql).toContain("verified = false");
    expect(sql).not.toMatch(/DELETE FROM public\.(privacy_contacts|service_catalog)/);
    expect(sql).not.toMatch(/SET privacy_email = NULL/);
  });

  test("plausibility is checked against service_catalog.domain, with no service hardcoded", () => {
    // Comments cite the real production case (GitHub -> privacy@dropbox.com); the
    // executable SQL must be set-based and name no service at all.
    const executable = migration(FILE).replace(/--[^\n]*/g, "");
    expect(executable).toContain("s.domain");
    expect(executable).toContain("public.service_catalog");
    expect(executable).not.toMatch(/dropbox|github|google|bbc/i);
  });

  test("its helper is dropped again, so no permanent API surface is added", () => {
    const sql = migration(FILE);
    expect(sql).toMatch(/CREATE (OR REPLACE )?FUNCTION public\.__reset_contacts_domain_is_plausible/);
    expect(sql).toMatch(/DROP FUNCTION[\s\S]*__reset_contacts_domain_is_plausible/);
  });
});

// ---------------------------------------------------------------------------
// FIX 4 — marketing copy claims only what the product does
// ---------------------------------------------------------------------------
describe("honest copy: no 'removes', and every broker count traces to the config", () => {
  const COPY_FILES = ["config/brokers.ts", "config/pricing.ts", "pages/Index.tsx", "components/Hero.tsx"];

  test("none of the changed files claim the product removes anything", () => {
    for (const f of COPY_FILES) {
      const src = read(SRC(f));
      // "removal guide" / "opt-out" are fine; "removes" asserts we do it for you.
      expect(src).not.toMatch(/\bremoves\b/i);
      expect(src).not.toMatch(/\bwe remove\b/i);
      expect(src).not.toMatch(/\bautomatically remov/i);
    }
    expect(read(SRC("pages/Index.tsx"))).not.toContain("finds and removes");
  });

  test("no inflated or '+'-suffixed broker claim survives in the changed files", () => {
    for (const f of COPY_FILES) {
      const src = read(SRC(f));
      expect(src).not.toMatch(/\b\d+\+\s*(data broker|broker|people-search|sites)/i);
      // counts must be interpolated from the constants, never typed as a literal
      expect(src).not.toMatch(/\b\d+\s+people-search sites/);
    }
  });

  test("AUTO_SCAN_BROKER_COUNT equals the engine's real pattern count", async () => {
    const brokers = await import("../src/config/brokers");
    expect(brokers.AUTO_SCAN_BROKER_COUNT).toBe(scannerSlugs().size);
    expect(brokers.BROKER_COUNT).toBe(brokers.AUTO_SCAN_BROKER_COUNT);
    expect(brokers.BROKER_COUNT_LABEL).toBe(String(brokers.AUTO_SCAN_BROKER_COUNT));
    // the old label over-claimed
    expect(brokers.BROKER_COUNT_LABEL).not.toContain("+");
    // and it is not derived from the client-side list, which has drifted from the engine
    expect(read(SRC("config/brokers.ts"))).not.toMatch(/AUTO_SCAN_BROKER_COUNT\s*=\s*brokerPatterns\.length/);
    expect(read(SRC("config/brokers.ts"))).not.toMatch(/BROKER_COUNT\s*=\s*brokerPatterns\.length/);
  });

  test("GUIDED_OPTOUT_BROKER_COUNT equals the seeded data_brokers rows", async () => {
    const brokers = await import("../src/config/brokers");
    expect(brokers.GUIDED_OPTOUT_BROKER_COUNT).toBe(seededBrokerSlugs().size);
    // the two claims are different promises and must not collapse into one
    expect(brokers.GUIDED_OPTOUT_BROKER_COUNT).toBeGreaterThan(brokers.AUTO_SCAN_BROKER_COUNT);
  });

  test("Complete no longer advertises a broker rescan job that does not exist", async () => {
    const { COMPLETE_FEATURES, PARENT_SCAN_FEATURES } = await import("../src/config/pricing");
    const features = [...COMPLETE_FEATURES, ...PARENT_SCAN_FEATURES];
    for (const line of features) expect(line).not.toMatch(/\bremoves\b/i);

    // The only pg_cron jobs are monthly-pro-rescan (inbox) and monthly-discovery-report;
    // nothing rescans brokers. Phrased as an implication so that actually shipping such a
    // job later re-permits the claim instead of failing this test for the wrong reason.
    const allSql = readdirSync(MIGRATIONS)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => read(join(MIGRATIONS, f)))
      .join("\n");
    const hasBrokerRescanCron = /cron\.schedule\(\s*'[^']*broker[^']*'/i.test(allSql);
    const rescanClaims = features.filter((l) => /monthly.*broker|broker.*rescan/i.test(l));
    expect({ rescanClaims, hasBrokerRescanCron }).toEqual({
      rescanClaims: hasBrokerRescanCron ? rescanClaims : [],
      hasBrokerRescanCron,
    });
  });

  test("the feature lists quote the config constants, not literals", async () => {
    const { COMPLETE_FEATURES, PARENT_SCAN_FEATURES } = await import("../src/config/pricing");
    const brokers = await import("../src/config/brokers");
    const joined = [...COMPLETE_FEATURES, ...PARENT_SCAN_FEATURES].join(" | ");
    expect(joined).toContain(String(brokers.AUTO_SCAN_BROKER_COUNT));
    expect(joined).toContain(String(brokers.GUIDED_OPTOUT_BROKER_COUNT));
    expect(read(SRC("config/pricing.ts"))).toContain("${AUTO_SCAN_BROKER_COUNT}");
  });
});

/** Every slug seeded into public.data_brokers, across all seed migrations. */
function seededBrokerSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql"))) {
    const sql = read(join(MIGRATIONS, file));
    const header = sql.match(/INSERT INTO public\.data_brokers \(([^)]*)\)/);
    if (!header) continue;
    const slugIdx = header[1].split(",").map((c) => c.trim()).indexOf("slug");
    if (slugIdx < 0) continue;
    for (const line of sql.split("\n")) {
      const t = line.trim();
      if (!t.startsWith("('")) continue;
      const lits = leadingSqlLiterals(t, slugIdx + 1);
      if (lits.length > slugIdx) slugs.add(lits[slugIdx]);
    }
  }
  return slugs;
}

/** First `n` single-quoted literals of a VALUES tuple, honouring '' escapes. */
function leadingSqlLiterals(tuple: string, n: number): string[] {
  const out: string[] = [];
  let i = tuple.indexOf("(") + 1;
  while (i < tuple.length && out.length < n) {
    if (tuple[i] !== "'") {
      i++;
      continue;
    }
    let lit = "";
    i++;
    while (i < tuple.length) {
      if (tuple[i] === "'" && tuple[i + 1] === "'") {
        lit += "'";
        i += 2;
      } else if (tuple[i] === "'") {
        i++;
        break;
      } else {
        lit += tuple[i++];
      }
    }
    out.push(lit);
  }
  return out;
}
