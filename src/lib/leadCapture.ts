import { supabase } from "@/integrations/supabase/client";

/**
 * Consent-gated email capture for the free scan and breach pages.
 *
 * The site's SEO clusters all funnel into a scan form that, until now, took
 * an email and discarded it. This is the capture — but it only ever fires
 * when someone has ticked an unticked-by-default box.
 *
 * The consent copy lives here rather than inline in each page for two
 * reasons: the exact wording is stored alongside the address as the audit
 * trail, so it has to be the same string that was rendered; and a single
 * definition means the promise cannot drift between surfaces.
 */
export const LEAD_CONSENT_COPY =
  "Email me my results and alert me if new exposure shows up. No spam, unsubscribe any time.";

/**
 * Shown wherever the box is not ticked. Must stay true — the previous copy
 * said "We don't store or share your email address" unconditionally, which
 * would have become a false statement the moment capture existed.
 */
export const LEAD_NO_CAPTURE_COPY =
  "We only store your email if you tick the box above. Either way we never sell or share it.";

export interface CaptureLeadInput {
  email: string;
  /** Must be an explicit, affirmative tick. Never default this to true. */
  consented: boolean;
  /** Surface that captured it: "free_scan", "breach", "plan". */
  source: string;
  /** The ?src= campaign parameter, when present. */
  sourceDetail?: string | null;
}

/**
 * Fire-and-forget. A capture failure must never block someone from seeing
 * their scan results — they came for the scan, not to join a list.
 */
export async function captureLead({
  email,
  consented,
  source,
  sourceDetail,
}: CaptureLeadInput): Promise<void> {
  if (!consented) return;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;

  try {
    await supabase.functions.invoke("capture-scan-lead", {
      body: {
        email: trimmed,
        consented: true,
        source,
        sourceDetail: sourceDetail ?? null,
        sourcePath:
          typeof window !== "undefined" ? window.location.pathname : null,
        consentCopy: LEAD_CONSENT_COPY,
      },
    });
  } catch (err) {
    console.warn("[leadCapture] failed to store lead:", err);
  }
}
