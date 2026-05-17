/**
 * One-shot script to check Resend domain DNS verification status.
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx bun scripts/check-resend-dns.ts
 *
 * Prints which DNS records (SPF, DKIM, DMARC) are verified for
 * footprintfinder.co. If any are pending, transactional email
 * (deletion requests, welcome emails) will likely land in spam.
 */

const DOMAIN = "footprintfinder.co";
const API_KEY = process.env.RESEND_API_KEY;

if (!API_KEY) {
  console.error("RESEND_API_KEY env var is required");
  process.exit(1);
}

async function main() {
  const res = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) {
    console.error(`Resend API error: ${res.status} ${await res.text()}`);
    process.exit(1);
  }
  const { data } = await res.json();
  const domain = (data ?? []).find((d: any) => d.name === DOMAIN);
  if (!domain) {
    console.error(
      `Domain "${DOMAIN}" not found in Resend. Add it at https://resend.com/domains`
    );
    process.exit(1);
  }

  console.log(`\nDomain: ${domain.name}`);
  console.log(`Region: ${domain.region}`);
  console.log(`Status: ${domain.status}`);
  console.log(`\nDNS records:`);

  const detail = await fetch(`https://api.resend.com/domains/${domain.id}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  const { records = [] } = await detail.json();

  for (const r of records) {
    const ok = r.status === "verified";
    const mark = ok ? "✅" : "❌";
    console.log(`  ${mark} ${r.record} (${r.name})  ->  ${r.status}`);
  }

  const allOk = records.every((r: any) => r.status === "verified");
  console.log(
    `\n${allOk ? "✅ All DNS records verified — transactional email should deliver cleanly." : "⚠️  One or more records are pending. Add them at your DNS provider and re-run."}\n`
  );
  if (!allOk) process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
