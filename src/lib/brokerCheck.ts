import { supabase } from "@/integrations/supabase/client";

export type BrokerStatus = "found" | "possible_match" | "not_found" | "unknown";
export interface BrokerResult {
  slug: string;
  name: string;
  domain: string;
  status: BrokerStatus;
  confidence: number | null;
  profileUrl: string | null;
  exposed?: string[];
}

export function isIncomplete(results: Pick<BrokerResult, "status">[], degraded = false): boolean {
  return degraded || results.length === 0 || results.some(r => r.status === "unknown");
}

export async function checkPublicBrokers(fullName: string, city: string, state: string) {
  const parts = fullName.trim().split(/\s+/);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);
  try {
    const { data, error } = await supabase.functions.invoke("free-broker-check", {
      body: { firstName: parts[0], lastName: parts.slice(1).join(" "), city: city.trim(), state },
      signal: controller.signal,
    });
    if (error || !Array.isArray(data?.results)) throw new Error("Broker check unavailable");
    const results = data.results as BrokerResult[];
    return { results, incomplete: isIncomplete(results, Boolean(data.degraded)) };
  } finally {
    clearTimeout(timer);
  }
}