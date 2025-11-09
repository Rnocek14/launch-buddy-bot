// tools/alerts-24h.js
// Usage: node tools/alerts-24h.js "Golden-10 sustained breach"
// Requires: SUPABASE_URL, SUPABASE_ANON_KEY (or service role read-only), SLACK_WEBHOOK_URL

const https = require('https');

const [,, title = 'Golden-10 sustained breach'] = process.argv;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const SLACK = process.env.SLACK_WEBHOOK_URL;

if (!SUPABASE_URL || !SUPABASE_KEY || !SLACK) {
  console.error('Missing SUPABASE_URL / SUPABASE_*_KEY / SLACK_WEBHOOK_URL');
  process.exit(2);
}

(async () => {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/discovery_alerts_24h?select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!r.ok) { console.error('Supabase error', r.status); process.exit(2); }
  const [row] = await r.json();
  const pass = Number(row?.pass_rate_24h ?? 0);
  const p95  = Number(row?.p95_ms_24h ?? 0);
  const errs = row?.top_errors_24h || [];

  // Deadband thresholds (sustained breach)
  const passBreached = pass < 0.80;
  const p95Breached  = p95 > 5000;

  if (!passBreached && !p95Breached) {
    console.log('No sustained breach in last 24h; noop.');
    process.exit(0);
  }

  // Build Slack message
  const lines = [];
  lines.push(`*${title}*`);
  lines.push(`• Pass (24h): *${(pass*100).toFixed(1)}%* ${passBreached ? '❌' : '✅'}`);
  lines.push(`• p95 (24h): *${p95}ms* ${p95Breached ? '❌' : '✅'}`);
  if (errs?.length) {
    lines.push(`• Top errors:`);
    for (const e of errs) lines.push(`  – \`${e.ec}\``);
  }
  // GH context (optional)
  const sha = process.env.GITHUB_SHA;
  const runUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
  if (sha) {
    const shortSha = sha.substring(0,7);
    lines.push(`• Build: \`${shortSha}\`${runUrl ? ` (<${runUrl}|workflow>)` : ''}`);
  }

  const payload = JSON.stringify({ text: lines.join('\n') });
  const req = https.request(SLACK, { method: 'POST', headers: { 'Content-Type': 'application/json' } }, res => {
    if (res.statusCode >= 200 && res.statusCode < 300) process.exit(0);
    console.error('Slack error', res.statusCode); process.exit(2);
  });
  req.on('error', e => { console.error('Slack request error', e); process.exit(2); });
  req.write(payload); req.end();
})().catch(e => { console.error(e); process.exit(2); });
