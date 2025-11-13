#!/usr/bin/env -S npx tsx

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, QUARANTINE_MAX_AGE_DAYS } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('[Quarantine] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const maxAgeDays = Number.isFinite(Number(QUARANTINE_MAX_AGE_DAYS))
  ? Number(QUARANTINE_MAX_AGE_DAYS)
  : 7;

async function main() {
  console.log(`[Quarantine] Cleanup starting (max_age_days=${maxAgeDays})`);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/discovery_quarantine_cleanup`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ max_age_days: maxAgeDays }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[Quarantine] Cleanup failed:', res.status, body);
    process.exit(1);
  }

  const [row] = (await res.json()) as { deleted_count: number; remaining_active: number }[];
  console.log(
    `[Quarantine] Cleanup complete — deleted=${row.deleted_count}, remaining_active=${row.remaining_active}`
  );
}

main().catch((e) => {
  console.error('[Quarantine] Fatal error:', e);
  process.exit(1);
});
