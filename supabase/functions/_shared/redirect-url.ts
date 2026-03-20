/**
 * Returns the base URL for post-OAuth redirects.
 * Uses the SITE_URL secret if set, otherwise falls back to the published app URL.
 * Never relies on the `referer` header (which is null during OAuth redirects).
 */
export function getRedirectBaseUrl(): string {
  return Deno.env.get('SITE_URL') || 'https://launch-buddy-bot.lovable.app';
}
