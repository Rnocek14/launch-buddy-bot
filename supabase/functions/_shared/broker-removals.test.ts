import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { chooseMethod, isEligible, nextAction, statusAfterRescan } from "./broker-removals.ts";

const verified = { privacy_email: "privacy@b.com", removal_method: "email", form_automation_enabled: false, contact_verified_at: "2026-11-01" };
const sent = { status: "request_sent" as const, method: "email" as const, sent_at: "2026-11-01T00:00:00Z", follow_up_at: "2026-12-01T00:00:00Z", attempts: 1 };

Deno.test("requires signed permission form", () => assertEquals(isEligible("complete", false), false));
Deno.test("requires Complete plan", () => assertEquals(isEligible("pro", true), false));
Deno.test("Complete + permission is eligible", () => assertEquals(isEligible("complete", true), true));
Deno.test("unverified broker email falls back to queue", () =>
  assertEquals(chooseMethod({ ...verified, contact_verified_at: null }, false), "form"));
Deno.test("automation off without tested adapter", () =>
  assertEquals(chooseMethod({ ...verified, privacy_email: null, form_automation_enabled: true }, false), "form"));
Deno.test("one request per broker: no resend before follow-up date", () =>
  assertEquals(nextAction("email", sent, new Date("2026-11-15")), "skip"));
Deno.test("follow-up after 30 days", () => assertEquals(nextAction("email", sent, new Date("2026-12-02")), "follow_up"));
Deno.test("stops after 3 attempts", () => assertEquals(nextAction("email", { ...sent, attempts: 3 }, new Date("2027-01-01")), "skip"));
Deno.test("failed scan never marks removed", () =>
  assertEquals(statusAfterRescan(sent, { status_v2: "error", scanned_at: "2026-11-20T00:00:00Z" }), "waiting"));
Deno.test("possible match never marks removed", () =>
  assertEquals(statusAfterRescan(sent, { status_v2: "possible_match", scanned_at: "2026-11-20T00:00:00Z" }), "waiting"));
Deno.test("scan before request never marks removed", () =>
  assertEquals(statusAfterRescan(sent, { status_v2: "not_found", scanned_at: "2026-10-20T00:00:00Z" }), "request_sent"));
Deno.test("clear scan after request marks removed", () =>
  assertEquals(statusAfterRescan(sent, { status_v2: "not_found", scanned_at: "2026-11-20T00:00:00Z" }), "removed"));
