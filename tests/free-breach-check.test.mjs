/**
 * Contract tests for the real free-breach-check Edge Function.
 * The Deno std server import is replaced with a captured callback, and the
 * TypeScript source is transpiled by the same TS compiler used in CI.
 * No external APIs, personal emails, or actual account lookups are used.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script, createContext } from "node:vm";
import ts from "typescript";

const edgePath = "supabase/functions/free-breach-check/index.ts";
const source = readFileSync(edgePath, "utf8");
const sourceWithoutDenoImport = source.replace(
  /^import\s+\{\s*serve\s*\}\s+from\s+["']https:\/\/deno\.land\/[^"']+["'];?\s*/m,
  ""
);
assert.notEqual(sourceWithoutDenoImport, source, "Expected Deno std serve import");
const js = ts.transpileModule(sourceWithoutDenoImport, {
  compilerOptions: {
    module: ts.ModuleKind.None,
    target: ts.ScriptTarget.ES2022,
  },
  fileName: edgePath,
}).outputText;

const TEST_EMAIL = "scan-fixture@example.com";

function harness({ key = "fake-test-api-key", fetchResponse, fetchError } = {}) {
  let handler;
  const calls = [];
  const errors = [];
  const mockFetch = async (url, options) => {
    calls.push({ url, options });
    if (fetchError) throw fetchError;
    if (fetchResponse) return fetchResponse;
    return new Response(null, { status: 404 });
  };
  const globals = {
    serve: (callback) => { handler = callback; },
    Deno: { env: { get: (name) => name === "HIBP_API_KEY" ? key : undefined } },
    fetch: mockFetch,
    Request,
    Response,
    Headers,
    AbortSignal,
    URL,
    Map,
    Date,
    console: { log() {}, warn() {}, error(...args) { errors.push(args.map(String).join(" ")); } },
    JSON,
    encodeURIComponent,
  };
  const context = createContext(globals);
  new Script(js, { filename: edgePath }).runInContext(context);
  assert.equal(typeof handler, "function", "Deno serve handler should register");

  async function request(email = TEST_EMAIL, method = "POST") {
    const options = method === "POST"
      ? { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }
      : { method };
    const response = await handler(new Request("https://example.test/free-breach-check", options));
    return { status: response.status, body: await response.json().catch(() => null), response, errors };
  }

  return { request, calls, errors };
}

test("200 with a real-looking provider finding returns only the finding and correct severity", async () => {
  const providerPayload = [{
    Name: "FixtureBreach",
    Title: "Fixture Breach",
    Domain: "example.org",
    BreachDate: "2020-01-02",
    Description: "A fictional unit-test record",
    DataClasses: ["Email addresses", "Passwords"],
    IsVerified: true,
    IsSensitive: false,
    LogoPath: "",
  }];
  const h = harness({ fetchResponse: new Response(JSON.stringify(providerPayload), { status: 200 }) });
  const result = await h.request();
  assert.equal(result.status, 200, JSON.stringify(result.errors));
  assert.equal(result.body.checked, true);
  assert.equal(result.body.breachCount, 1);
  assert.equal(result.body.criticalCount, 1);
  assert.equal(result.body.breaches[0].name, "FixtureBreach");
  assert.equal(result.body.breaches[0].severity, "critical");
  assert.equal(h.calls.length, 1);
  assert.match(h.calls[0].url, /haveibeenpwned\.com\/api\/v3\/breachedaccount\//);
  assert.equal(h.calls[0].options.headers["hibp-api-key"], "fake-test-api-key");
});

test("successful empty HIBP array means zero known matches", async () => {
  const h = harness({ fetchResponse: new Response("[]", { status: 200 }) });
  const result = await h.request();
  assert.equal(result.status, 200);
  assert.equal(result.body.checked, true);
  assert.equal(result.body.breachCount, 0);
  assert.deepEqual(Array.from(result.body.breaches), []);
});

test("HIBP HTTP 404 means zero known matches, NOT an error", async () => {
  const result = await harness().request();
  assert.equal(result.status, 200);
  assert.equal(result.body.checked, true);
  assert.equal(result.body.breachCount, 0);
});

test("HIBP rate limiting must not turn into a zero-breach report", async () => {
  const result = await harness({
    fetchResponse: new Response("Rate limited", { status: 429, headers: { "retry-after": "2" } }),
  }).request();
  assert.equal(result.status, 503);
  assert.equal(result.body.checked, false);
  assert.match(result.body.error, /rate limit/i);
  assert.equal(result.body.breachCount, undefined);
});

test("HIBP authentication/configuration failures remain unavailable", async () => {
  const result = await harness({ fetchResponse: new Response("Unauthorized", { status: 401 }) }).request();
  assert.equal(result.status, 503);
  assert.equal(result.body.checked, false);
  assert.match(result.body.error, /configuration/i);
  assert.equal(result.body.breachCount, undefined);
});

test("HIBP server errors remain unavailable", async () => {
  const result = await harness({ fetchResponse: new Response("Provider error", { status: 500 }) }).request();
  assert.equal(result.status, 503);
  assert.equal(result.body.checked, false);
  assert.equal(result.body.breachCount, undefined);
});

test("missing API key returns unavailable without calling provider", async () => {
  const h = harness({ key: "" });
  const result = await h.request();
  assert.equal(result.status, 503);
  assert.match(result.body.error, /unavailable/i);
  assert.equal(h.calls.length, 0);
});

test("invalid email is rejected before HIBP lookup", async () => {
  const h = harness();
  const result = await h.request("not-an-email");
  assert.equal(result.status, 400);
  assert.equal(h.calls.length, 0);
});

test("malformed HIBP success payload does not become a clean result", async () => {
  const result = await harness({
    fetchResponse: new Response(JSON.stringify({ unrelated: true }), { status: 200 }),
  }).request();
  assert.equal(result.status, 503);
  assert.equal(result.body.checked, false);
  assert.equal(result.body.breachCount, undefined);
});

test("network failure does not fabricate breach counts", async () => {
  const result = await harness({ fetchError: new Error("network offline") }).request();
  assert.equal(result.status, 503);
  assert.equal(result.body.checked, false);
  assert.equal(result.body.breachCount, undefined);
});

test("per-isolate rate limiter rejects the sixth request per email", async () => {
  const h = harness();
  for (let i = 0; i < 5; i++) {
    const result = await h.request(TEST_EMAIL);
    assert.equal(result.status, 200);
  }
  const sixth = await h.request(TEST_EMAIL);
  assert.equal(sixth.status, 429);
  assert.equal(h.calls.length, 5);
});

test("the free-scan interface does not convert guesses into findings or demand instant payment", () => {
  const summary = readFileSync("src/components/free-scan/ExposureSummary.tsx", "utf8");
  const page = readFileSync("src/pages/FreeScan.tsx", "utf8");
  const evidence = readFileSync("src/components/free-scan/WhatWeChecked.tsx", "utf8");
  const broker = readFileSync("src/components/free-scan/LiveBrokerCheck.tsx", "utf8");
  assert.doesNotMatch(summary, /estimateIceberg|CompleteCheckoutButton|hiddenAccounts|brokerSites/);
  assert.doesNotMatch(page, /estimateIceberg|CompleteCheckoutButton|IcebergPanel/);
  assert.match(page, /Retry breach check/);
  assert.match(page, /Create a free account/);
  assert.match(page, /scan_failed/);
  assert.doesNotMatch(evidence, /Public mention scanning/);
  assert.doesNotMatch(broker, /removes you automatically|we remove you from all of them/i);
});

test("the homepage passes email without exposing it in a URL query parameter", () => {
  const hero = readFileSync("src/components/Hero.tsx", "utf8");
  assert.match(hero, /state:\s*\{\s*scanEmail:\s*candidate\s*\}/);
  assert.doesNotMatch(hero, /\/free-scan\?email=/);
});
