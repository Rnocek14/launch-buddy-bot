// Shared helper to normalize broker scan result status across dashboard + detail pages.
// Single source of truth for UI state derivation.

export type BrokerResultState = "found" | "possible" | "clear" | "opted_out" | "error";

export function getBrokerResultState(result: {
  status: string;
  status_v2?: string | null;
  opted_out_at?: string | null;
}): BrokerResultState {
  if (result.opted_out_at) return "opted_out";
  if (result.status_v2 === "found" || (!result.status_v2 && result.status === "found")) return "found";
  if (result.status_v2 === "possible_match") return "possible";
  if (result.status_v2 === "not_found" || result.status === "clean") return "clear";
  return "error";
}

/** Priority for sorting: found first, then possible, then error, then clear, then opted_out */
export function brokerResultPriority(state: BrokerResultState): number {
  switch (state) {
    case "found": return 0;
    case "possible": return 1;
    case "error": return 2;
    case "clear": return 3;
    case "opted_out": return 4;
  }
}
