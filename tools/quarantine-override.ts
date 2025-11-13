#!/usr/bin/env -S npx tsx

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, ACTOR } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const [, , domain, ...reasonParts] = process.argv;
if (!domain) {
  console.error('Usage: quarantine-override <domain> [reason]');
  process.exit(1);
}

const reason = reasonParts.join(' ') || 'manual override';
const actor = ACTOR || 'ops/manual';

async function main() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/discovery_quarantine_override`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_domain: domain,
      p_reason: reason,
      p_actor: actor,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Override failed:', res.status, body);
    process.exit(1);
  }

  const [row] = (await res.json()) as { domain: string; removed: boolean }[];
  console.log(
    `[Quarantine Override] domain=${row.domain}, removed=${row.removed ? 'yes' : 'no'}`
  );
}

main().catch((e) => {
  console.error('[Quarantine Override] Fatal error:', e);
  process.exit(1);
});
