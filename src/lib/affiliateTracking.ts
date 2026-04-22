/**
 * Affiliate referral tracking
 * Captures ?ref= param from URL, stores in localStorage (90 day attribution),
 * and logs the click to the database.
 */
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "ff_affiliate_ref";
const ATTRIBUTION_DAYS = 90;

interface StoredRef {
  code: string;
  affiliateId: string;
  capturedAt: string;
}

export async function captureAffiliateRef(): Promise<void> {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const code = params.get("ref");
  if (!code) return;

  const normalized = code.toUpperCase().trim();
  if (!/^[A-Z0-9]{4,16}$/.test(normalized)) return;

  try {
    // Lookup affiliate
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id, code, status")
      .eq("code", normalized)
      .eq("status", "approved")
      .maybeSingle();

    if (!affiliate) return;

    // Store attribution
    const stored: StoredRef = {
      code: affiliate.code,
      affiliateId: affiliate.id,
      capturedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    // Log click (fire-and-forget)
    supabase.from("affiliate_clicks").insert({
      affiliate_id: affiliate.id,
      affiliate_code: affiliate.code,
      source_url: document.referrer || null,
      landing_path: window.location.pathname,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    }).then(({ error }) => {
      if (error) console.warn("[AFFILIATE] click log failed:", error.message);
    });
  } catch (err) {
    console.warn("[AFFILIATE] capture failed:", err);
  }
}

export function getStoredAffiliateRef(): StoredRef | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredRef = JSON.parse(raw);
    const ageDays = (Date.now() - new Date(parsed.capturedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > ATTRIBUTION_DAYS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAffiliateRef(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
