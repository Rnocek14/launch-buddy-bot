export function isBrokerDomain(url: string, domain: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return parsed.protocol === 'https:' && (host === domain || host.endsWith(`.${domain}`));
  } catch { return false; }
}

export function noMatchStatus(successfulQueries: number, requiredQueries: number): 'not_found' | 'unknown' {
  return successfulQueries === requiredQueries ? 'not_found' : 'unknown';
}

export function parseSearchResponse(json: Record<string, unknown>) {
  // SerpApi reports a completed zero-result Google query in its error field.
  // Recognize only this exact outcome, not auth, billing, or transport errors.
  if (json.error === "Google hasn't returned any results for this query.") return [];
  if (json.error) throw new Error(`Search provider error: ${String(json.error)}`);
  if (!Array.isArray(json.organic_results) && !(json.search_information as { organic_results_state?: string } | undefined)?.organic_results_state?.includes('Empty')) {
    throw new Error('Search provider returned no completed search');
  }
  return Array.isArray(json.organic_results) ? json.organic_results : [];
}