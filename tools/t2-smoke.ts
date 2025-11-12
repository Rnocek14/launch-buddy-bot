// T2 smoke test: validate enqueue → lease → run → metrics write
// Usage:
//   export SUPABASE_URL=https://...
//   export SUPABASE_SERVICE_KEY=...
//   npx tsx tools/t2-smoke.ts
//   npx tsx tools/t2-worker.ts  # run worker after seeding

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function main() {
  const domains = ['example-spa.com', 'airbnb.com', 'booking.com'].map(d => d.toLowerCase());

  console.log('[T2 Smoke] Seeding queue with test domains...');

  // 1) Seed queue
  for (const d of domains) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/t2_retries`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          domain: d,
          seed_url: `https://${d}`,
          reason: 'bot_protection',
          status: 'queued',
          next_run_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error(`[seed] failed for ${d}:`, error);
      } else {
        console.log(`[seed] ✓ queued ${d}`);
      }
    } catch (e) {
      console.error(`[seed] error for ${d}:`, e);
    }
  }

  console.log('\n[T2 Smoke] Seeding complete. Now run: npx tsx tools/t2-worker.ts\n');

  // 2) Read current queue state
  console.log('[T2 Smoke] Current queue state:');
  const r1 = await fetch(
    `${SUPABASE_URL}/rest/v1/t2_retries?select=domain,status,attempts,result_url,t2_time_ms,last_error&order=updated_at.desc&limit=10`,
    { headers }
  );
  const queue = await r1.json();
  console.table(queue);

  // 3) Read recent metrics
  console.log('\n[T2 Smoke] Recent metrics (T2 runs):');
  const r2 = await fetch(
    `${SUPABASE_URL}/rest/v1/discovery_metrics?select=domain,t2_used,t2_success,t2_time_ms,method_used,success&t2_used=eq.true&order=created_at.desc&limit=10`,
    { headers }
  );
  const metrics = await r2.json();
  console.table(metrics);

  // 4) Summary stats
  console.log('\n[T2 Smoke] Queue summary:');
  const r3 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/t2_queue_summary`, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  });

  if (r3.ok) {
    const summary = await r3.json();
    console.table(summary);
  } else {
    // Fallback: manual count by status
    const statuses = ['queued', 'running', 'done', 'failed'];
    console.log('Status breakdown:');
    for (const status of statuses) {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/t2_retries?select=count&status=eq.${status}`,
        { headers: { ...headers, Prefer: 'count=exact' } }
      );
      const data = await r.json();
      console.log(`  ${status}: ${r.headers.get('content-range')?.split('/')[1] || 0}`);
    }
  }
}

main().catch(e => {
  console.error('[T2 Smoke] Fatal error:', e);
  process.exit(1);
});
