// 24h auto-mute for domains with repeated issues

export async function isQuarantined(supabase: any, domain: string): Promise<boolean> {
  const { data } = await supabase
    .from('discovery_quarantine')
    .select('until_at')
    .eq('domain', domain.toLowerCase())
    .maybeSingle();
  
  if (!data) return false;
  return new Date(data.until_at) > new Date();
}

export async function addToQuarantine(
  supabase: any, 
  domain: string, 
  reason: string, 
  ttlMs: number = 24 * 60 * 60 * 1000,
  lastError?: string
) {
  const untilAt = new Date(Date.now() + ttlMs).toISOString();
  
  // Upsert: increment attempts if exists
  const { data: existing } = await supabase
    .from('discovery_quarantine')
    .select('attempts')
    .eq('domain', domain.toLowerCase())
    .maybeSingle();
  
  await supabase.from('discovery_quarantine').upsert({
    domain: domain.toLowerCase(),
    reason,
    until_at: untilAt,
    attempts: (existing?.attempts ?? 0) + 1,
    last_error: lastError,
    updated_at: new Date().toISOString()
  }, { onConflict: 'domain' });
  
  console.log(`[Quarantine] ${domain} → ${reason} until ${untilAt}`);
}

export async function removeFromQuarantine(supabase: any, domain: string) {
  await supabase.from('discovery_quarantine').delete().eq('domain', domain.toLowerCase());
  console.log(`[Quarantine] ${domain} removed`);
}
