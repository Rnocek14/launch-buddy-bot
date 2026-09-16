/**
 * Unified checkout entry point.
 *
 * - Logged-in users -> `create-checkout-session` (existing authed flow).
 * - Guests with an email -> `instant-checkout` (account auto-created post-payment).
 * - Guests without an email -> caller should open <QuickCheckoutEmailDialog/>.
 *
 * Same-tab redirect avoids popup blockers (esp. mobile Safari).
 */

import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

export type CheckoutSource =
  | "pricing_page"
  | "upgrade_modal"
  | "tier_upgrade_prompt"
  | "free_scan_upgrade_cta"
  | "iceberg_panel"
  | "subscribe_page"
  | "dashboard_empty_state"
  | "broker_exposure"
  | "subscription_status_card"
  | "parents_landing"
  | "navbar"
  | "other";

export interface StartCheckoutOptions {
  priceId: string;
  /** Guest email (required when user is not logged in). */
  email?: string;
  source: CheckoutSource;
  /** Optional analytics tier label (e.g. "pro" | "complete" | "family"). */
  tier?: string;
}

export type StartCheckoutResult =
  | { status: "redirecting" }
  | { status: "needs_email" }
  | { status: "error"; message: string };

const PERSISTED_EMAIL_KEY = "ff_guest_email";

export function getPersistedGuestEmail(): string {
  try {
    return localStorage.getItem(PERSISTED_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function persistGuestEmail(email: string) {
  try {
    if (email && email.includes("@")) {
      localStorage.setItem(PERSISTED_EMAIL_KEY, email.trim());
    }
  } catch {
    // ignore quota / privacy mode
  }
}

/**
 * The free broker check collects exactly the three fields the paid scan needs
 * (LiveBrokerCheck), and until now all three were dropped at the checkout
 * boundary: startCheckout forwards only priceId/email/source/affiliateCode, and
 * scan-brokers then reads profiles.full_name/city/state, finds them empty, and
 * falls back to the email local-part as a first name with a blank surname. A
 * customer who saw "we found you on 4 sites" and paid ninety seconds later got a
 * 20-site scan run for a person named after their email prefix.
 *
 * Stored in the same place and the same way as the guest email, so it survives
 * the Stripe redirect round-trip (same browser, same origin).
 */
export interface ScanIdentity {
  fullName: string;
  city: string;
  state: string;
}

const PERSISTED_IDENTITY_KEY = "ff_scan_identity";

export function getPersistedScanIdentity(): ScanIdentity | null {
  try {
    const raw = localStorage.getItem(PERSISTED_IDENTITY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ScanIdentity>;
    if (!parsed?.fullName?.trim()) return null;
    return {
      fullName: parsed.fullName.trim(),
      city: (parsed.city ?? "").trim(),
      state: (parsed.state ?? "").trim(),
    };
  } catch {
    return null;
  }
}

export function persistScanIdentity(identity: ScanIdentity) {
  try {
    if (!identity.fullName?.trim()) return;
    localStorage.setItem(PERSISTED_IDENTITY_KEY, JSON.stringify(identity));
  } catch {
    // ignore quota / privacy mode
  }
}

export async function startCheckout(
  opts: StartCheckoutOptions
): Promise<StartCheckoutResult> {
  const { priceId, source, tier } = opts;
  const explicitEmail = opts.email?.trim();

  trackEvent("checkout_initiated", {
    source,
    tier,
    priceId,
    hasEmail: !!explicitEmail,
  });

  const { getStoredAffiliateRef } = await import("@/lib/affiliateTracking");
  const ref = getStoredAffiliateRef();

  const { data: { session } } = await supabase.auth.getSession();

  try {
    if (session?.user) {
      // Logged-in path
      const { data, error } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            priceId,
            ...(ref?.code ? { affiliateCode: ref.code } : {}),
          },
        }
      );
      if (error || !data?.url) {
        throw new Error(data?.error || error?.message || "Checkout failed");
      }
      window.location.href = data.url;
      return { status: "redirecting" };
    }

    // Guest path
    const email = explicitEmail || getPersistedGuestEmail();
    if (!email || !email.includes("@")) {
      return { status: "needs_email" };
    }
    persistGuestEmail(email);

    const { data, error } = await supabase.functions.invoke("instant-checkout", {
      body: {
        email,
        priceId,
        source,
        ...(ref?.code ? { affiliateCode: ref.code } : {}),
      },
    });
    if (error || !data?.url) {
      throw new Error(data?.error || error?.message || "Checkout failed");
    }
    window.location.href = data.url;
    return { status: "redirecting" };
  } catch (err: any) {
    console.error("[startCheckout] error:", err);
    return {
      status: "error",
      message: err?.message || "Checkout failed. Please try again.",
    };
  }
}
