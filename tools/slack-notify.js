// tools/slack-notify.js
// Usage: node tools/slack-notify.js golden10.summary.json "Golden-10 nightly"

const fs = require('fs');
const https = require('https');

const [,, summaryPath, title = 'Golden-10'] = process.argv;
if (!summaryPath) { console.error('Missing summary path'); process.exit(1); }

const webhook = process.env.SLACK_WEBHOOK_URL; // set in repo secrets
if (!webhook) { console.error('Missing SLACK_WEBHOOK_URL'); process.exit(1); }

const s = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const ok = s.results.filter(r => r.ok);
const bad = s.results.filter(r => !r.ok);

// Build a compact message with context
const lines = [];
lines.push(`*${title}*`);
lines.push(`• Pass: *${s.pass}/${s.total}*  • Median: *${s.median_ms}ms*`);

// Add build context if available
const sha = process.env.GITHUB_SHA;
const runUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : null;

if (sha) {
  const shortSha = sha.substring(0, 7);
  lines.push(`• Build: \`${shortSha}\`${runUrl ? ` (<${runUrl}|workflow>)` : ''}`);
}

if (bad.length) {
  lines.push(`• Failures (${bad.length}):`);
  for (const r of bad.slice(0, 5)) {
    lines.push(`  – ${r.domain} (${r.time_ms}ms): ${r.error || r.url}`);
  }
  if (bad.length > 5) lines.push(`  … +${bad.length - 5} more`);
}

const payload = JSON.stringify({ text: lines.join('\n') });

const req = https.request(webhook, { method: 'POST', headers: {'Content-Type':'application/json'} }, res => {
  if (res.statusCode >= 200 && res.statusCode < 300) process.exit(0);
  console.error('Slack error', res.statusCode); process.exit(2);
});
req.on('error', e => { console.error('Slack request error', e); process.exit(2); });
req.write(payload);
req.end();
