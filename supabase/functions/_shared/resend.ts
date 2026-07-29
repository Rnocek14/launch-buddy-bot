// Central sender identity for all outbound Resend email.
//
// ONE-TIME NON-CODE SETUP: verify the sending domain in Resend
// (https://resend.com/domains) and set the Supabase edge-function secret
// RESEND_FROM_DOMAIN=footprintfinder.co (the default below). Until the domain
// is verified, Resend delivers only to the account owner's own address and
// drops mail to third parties. Optionally set RESEND_FROM to override the whole
// default no-reply sender.
export const RESEND_FROM_DOMAIN =
  Deno.env.get("RESEND_FROM_DOMAIN") ?? "footprintfinder.co";

/** Build a verified sender: resendFrom("reports") -> "Footprint Finder <reports@footprintfinder.co>". */
export function resendFrom(mailbox = "noreply", displayName = "Footprint Finder"): string {
  return `${displayName} <${mailbox}@${RESEND_FROM_DOMAIN}>`;
}

/** Default no-reply sender. RESEND_FROM overrides it wholesale. */
export const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? resendFrom();

/** Bare domain of a sender string, e.g. "footprintfinder.co". */
export function resendSenderDomain(from = RESEND_FROM): string {
  return (from.match(/@([^>\s]+)/)?.[1] ?? "").toLowerCase();
}

/** Resend's shared sandbox domain only delivers to the account owner — never third parties. */
export function isResendTestSender(from = RESEND_FROM): boolean {
  return resendSenderDomain(from) === "resend.dev";
}
