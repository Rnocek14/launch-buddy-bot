// Phase 1.3: Sitemap probe cache (24h TTL)

export async function getSitemapCache(supabase: any, domain: string, ttlMs = 24 * 60 * 60 * 1000) {
  const { data } = await supabase
    .from('probe_cache_sitemap')
    .select('*')
    .eq('domain', domain)
    .maybeSingle();
  
  if (!data) return { urls: null, cacheHit: false };
  
  const age = Date.now() - new Date(data.fetched_at).getTime();
  if (age > ttlMs) return { urls: null, cacheHit: false };
  
  return { urls: data.urls as string[], cacheHit: true };
}

export async function setSitemapCache(supabase: any, domain: string, urls: string[]) {
  await supabase
    .from('probe_cache_sitemap')
    .upsert(
      { domain, urls, fetched_at: new Date().toISOString() },
      { onConflict: 'domain' }
    );
}
