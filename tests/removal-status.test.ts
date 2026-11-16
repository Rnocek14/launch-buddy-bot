import { describe, it, expect } from "vitest";
import { summarizeRemovals } from "../src/lib/removalStatus";
describe("removal summary", () => {
  it("counts only confirmed removals as removed", () => {
    expect(summarizeRemovals([{ status: "removed" }, { status: "request_sent" }, { status: "failed" }]).removed).toBe(1);
  });
  it("counts broker confirmations as needing the customer", () => {
    expect(summarizeRemovals([{ status: "needs_customer" }]).needsYou).toBe(1);
  });
});
