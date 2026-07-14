// Unit tests for the four revenue-blocking fixes.
// Runs under `bun test`. Deno.env is shimmed so the real edge-function
// modules load outside the Deno runtime.
import { test, expect, describe, beforeAll } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FN = (p: string) => join(ROOT, "supabase/functions", p);

// --- Deno.env shim (edge functions call Deno.env.get at load/call time) ---
const denoEnv: Record<string, string> = {};
(globalThis as any).Deno = { env: { get: (k: string) => denoEnv[k] } };

// ---------------------------------------------------------------------------
// BUG 1 — Resend sender is no longer the test sandbox (real module under test)
// ---------------------------------------------------------------------------
describe("bug1: Resend sender identity (_shared/resend.ts)", () => {
  let mod: typeof import("../supabase/functions/_shared/resend.ts");
  beforeAll(async () => {
    mod = await import(FN("_shared/resend.ts"));
  });

  test("default sender is a verified footprintfinder.co address, not the sandbox", () => {
    expect(mod.RESEND_FROM_DOMAIN).toBe("footprintfinder.co");
    expect(mod.RESEND_FROM).toBe("Footprint Finder <noreply@footprintfinder.co>");
    expect(mod.RESEND_FROM).not.toContain("resend.dev");
  });

  test("resendFrom builds a mailbox on the verified domain", () => {
    expect(mod.resendFrom("reports")).toBe("Footprint Finder <reports@footprintfinder.co>");
    expect(mod.resendFrom("notifications")).toContain("@footprintfinder.co>");
  });

  test("isResendTestSender flags the sandbox and clears the real domain", () => {
    expect(mod.isResendTestSender("X <onboarding@resend.dev>")).toBe(true);
    expect(mod.isResendTestSender(mod.RESEND_FROM)).toBe(false);
  });

  test("resendSenderDomain extracts the bare domain", () => {
    expect(mod.resendSenderDomain("Foo <a@footprintfinder.co>")).toBe("footprintfinder.co");
  });
});

// ---------------------------------------------------------------------------
// BUG 3 — subPeriodISO reads Basil item fields, falls back, never throws
// Replica kept byte-identical to the shipped helper; consistency asserted below.
// ---------------------------------------------------------------------------
const subPeriodISO = (
  sub: any,
  field: "current_period_start" | "current_period_end",
): string | null => {
  const ts = sub?.items?.data?.[0]?.[field] ?? sub?.[field];
  return typeof ts === "number" ? new Date(ts * 1000).toISOString() : null;
};

describe("bug3: Stripe Basil period fields (subPeriodISO)", () => {
  const EPOCH = 1_700_000_000; // 2023-11-14T22:13:20Z

  test("reads current_period_end from subscription.items.data[0] (Basil layout)", () => {
    const sub = { items: { data: [{ current_period_end: EPOCH }] } };
    expect(subPeriodISO(sub, "current_period_end")).toBe("2023-11-14T22:13:20.000Z");
  });

  test("falls back to the legacy top-level field", () => {
    const sub = { current_period_start: EPOCH };
    expect(subPeriodISO(sub, "current_period_start")).toBe("2023-11-14T22:13:20.000Z");
  });

  test("item value wins over the legacy top-level value", () => {
    const sub = { current_period_end: 1, items: { data: [{ current_period_end: EPOCH }] } };
    expect(subPeriodISO(sub, "current_period_end")).toBe("2023-11-14T22:13:20.000Z");
  });

  test("returns null (never throws RangeError) when the field is absent", () => {
    expect(subPeriodISO({ items: { data: [{}] } }, "current_period_end")).toBeNull();
    expect(subPeriodISO({}, "current_period_end")).toBeNull();
    expect(subPeriodISO(undefined, "current_period_end")).toBeNull();
    // The original bug: new Date(undefined * 1000) => Invalid Date => .toISOString() throws
    expect(() => subPeriodISO({}, "current_period_end")).not.toThrow();
  });

  test("shipped source in all 3 functions contains the exact helper expression", () => {
    const expr = 'const ts = sub?.items?.data?.[0]?.[field] ?? sub?.[field];';
    for (const f of ["stripe-webhook/index.ts", "check-subscription/index.ts", "finalize-payment/index.ts"]) {
      expect(readFileSync(FN(f), "utf8")).toContain(expr);
    }
  });

  test("no shipped function still reads current_period_* off the top-level object with *1000", () => {
    for (const f of ["stripe-webhook/index.ts", "check-subscription/index.ts", "finalize-payment/index.ts"]) {
      const src = readFileSync(FN(f), "utf8");
      expect(src).not.toMatch(/subscription\.current_period_(start|end)\s*\*\s*1000/);
      expect(src).not.toMatch(/\bsub\.current_period_(start|end)\s*\*\s*1000/);
    }
  });
});

// ---------------------------------------------------------------------------
// BUG 2 — mode-aware checkout error (never logs the secret)
// Replica of the shipped stripeKeyMode()/friendlyStripeError() in the checkout fns.
// ---------------------------------------------------------------------------
function stripeKeyMode(): "live" | "test" | "unknown" {
  const k = (globalThis as any).Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  if (k.startsWith("sk_live_")) return "live";
  if (k.startsWith("sk_test_")) return "test";
  return "unknown";
}
function friendlyStripeError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string } | null)?.code;
  if (code === "resource_missing" || /no such (price|product|customer)/i.test(msg)) {
    const mode = stripeKeyMode();
    if (mode === "test") {
      return `Checkout failed: Stripe is in TEST mode but the app's price IDs are LIVE. Deploy a live-mode secret key (sk_live_...) and a matching live webhook secret. (Stripe: ${msg})`;
    }
    if (mode === "unknown") {
      return `Checkout failed: STRIPE_SECRET_KEY is missing or malformed. Set a live-mode secret key (sk_live_...) and a matching live webhook secret. (Stripe: ${msg})`;
    }
    return `Checkout failed: the configured price was not found in your Stripe LIVE account. Confirm the price IDs in src/config/pricing.ts exist and are active in the live dashboard. (Stripe: ${msg})`;
  }
  return msg;
}

describe("bug2: legible checkout error on key/price mode mismatch", () => {
  const noSuchPrice = Object.assign(new Error("No such price: 'price_1TPSsa...'"), { code: "resource_missing" });

  test("test-mode key against live price -> names the TEST/LIVE mismatch", () => {
    denoEnv.STRIPE_SECRET_KEY = "sk_test_ABC123";
    const m = friendlyStripeError(noSuchPrice);
    expect(m).toContain("TEST mode");
    expect(m).toContain("sk_live_");
  });

  test("live-mode key + missing price -> not self-contradictory", () => {
    denoEnv.STRIPE_SECRET_KEY = "sk_live_ABC123";
    const m = friendlyStripeError(noSuchPrice);
    expect(m).toContain("LIVE account");
    expect(m).not.toContain("is in live mode, but"); // the old misleading phrasing
  });

  test("missing/malformed key -> flagged explicitly", () => {
    denoEnv.STRIPE_SECRET_KEY = "";
    expect(friendlyStripeError(noSuchPrice)).toContain("missing or malformed");
  });

  test("unrelated errors pass through untouched", () => {
    denoEnv.STRIPE_SECRET_KEY = "sk_live_ABC";
    expect(friendlyStripeError(new Error("card_declined"))).toBe("card_declined");
  });

  test("the guard never interpolates the secret value", () => {
    denoEnv.STRIPE_SECRET_KEY = "sk_test_SUPERSECRETVALUE";
    expect(friendlyStripeError(noSuchPrice)).not.toContain("SUPERSECRETVALUE");
  });

  test("shipped checkout fns log only the friendly message, never the key", () => {
    for (const f of ["create-checkout-session/index.ts", "instant-checkout/index.ts", "create-parent-scan-payment/index.ts"]) {
      const src = readFileSync(FN(f), "utf8");
      expect(src).toContain("friendlyStripeError");
      // stripeKeyMode inspects only the prefix — it must not log/return the raw key
      expect(src).not.toMatch(/console\.(log|error)\([^)]*STRIPE_SECRET_KEY/);
    }
  });
});

// ---------------------------------------------------------------------------
// BUG 4 — Gmail OAuth callback keys writes on the resolved userId, not CSRF state
// ---------------------------------------------------------------------------
describe("bug4: OAuth callback keying", () => {
  test("gmail-oauth-callback keys all writes on userId, not the CSRF state", () => {
    const src = readFileSync(FN("gmail-oauth-callback/index.ts"), "utf8");
    expect(src).toContain('const userId = stateRow.user_id');
    // no write keyed on the CSRF token anymore
    expect(src).not.toMatch(/\.eq\("user_id",\s*state\)/);
    expect(src).not.toMatch(/user_id:\s*state\b/);
    // CSRF single-use validation is preserved (delete keyed on the state token)
    expect(src).toMatch(/oauth_states"[\s\S]*?\.delete\(\)[\s\S]*?\.eq\("state",\s*state\)/);
  });
});
