// Run with: deno run --allow-net --allow-read --allow-write golden25.ts
// Or with Node 18+: node golden25.ts

type Case = { domain: string; expect: string[]; deny?: string[]; kind?: 'html'|'pdf'|'html|pdf' };
type Result = {
  domain: string;
  ok: boolean;
  time_ms: number;
  url?: string;
  policy_type?: 'html'|'pdf';
  confidence?: 'high'|'medium'|'low';
  score?: number;
  reasons?: string[];
  error?: string;
};

// Node.js compatibility wrapper for file operations
const readText = async (p: string): Promise<string> => {
  try {
    // Try Node.js first
    const fs = await import('node:fs/promises');
    return await fs.readFile(p, 'utf8');
  } catch {
    // Fallback to Deno
    return await (globalThis as any).Deno.readTextFile(p);
  }
};

const writeText = async (p: string, content: string): Promise<void> => {
  try {
    // Try Node.js first
    const fs = await import('node:fs/promises');
    await fs.writeFile(p, content, 'utf8');
  } catch {
    // Fallback to Deno
    await (globalThis as any).Deno.writeTextFile(p, content);
  }
};

const cfg = JSON.parse(await readText('./golden25.config.json')) as {
  functionUrl: string; timeoutMs: number; domains: Case[];
};

const sanitize = (u: string) => {
  try { const x = new URL(u); x.hash=''; x.search=''; return x.toString(); } catch { return u; }
};
const containsAny = (txt: string, parts: string[]) => parts.some(p => txt.includes(p.toLowerCase()));

async function runCase(test: Case): Promise<Result> {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), cfg.timeoutMs);
    const res = await fetch(cfg.functionUrl, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ service_domain: test.domain }),
      signal: ctrl.signal
    }).finally(() => clearTimeout(to));

    const time_ms = Date.now() - start;
    if (!res.ok) return { domain: test.domain, ok: false, time_ms, error: `HTTP ${res.status}` };

    const data = await res.json();
    const url = sanitize(data.url ?? '');
    const policy_type = (data.policy_type || (url.endsWith('.pdf') ? 'pdf' : 'html')) as 'html'|'pdf';
    const urlLower = url.toLowerCase();

    const expectOk = test.expect ? containsAny(urlLower, test.expect.map(s=>s.toLowerCase())) : true;
    const denyOk   = test.deny   ? !containsAny(urlLower, test.deny.map(s=>s.toLowerCase())) : true;
    const kindOk   = test.kind ? (test.kind === 'html|pdf' || policy_type === test.kind) : true;

    return {
      domain: test.domain,
      ok: Boolean(url) && expectOk && denyOk && kindOk,
      time_ms,
      url,
      policy_type,
      confidence: data.confidence,
      score: data.score,
      reasons: data.reasons
    };
  } catch (e:any) {
    return { domain: test.domain, ok: false, time_ms: Date.now()-start, error: e?.message || 'error' };
  }
}

const results = await Promise.all(cfg.domains.map(runCase));

// Report
const okCount = results.filter(r => r.ok).length;
const median = (arr:number[]) => {
  const s = arr.slice().sort((a,b)=>a-b); const m = Math.floor(s.length/2);
  return s.length%2 ? s[m] : Math.round((s[m-1]+s[m])/2);
};
const times = results.map(r=>r.time_ms);

console.log('\nGOLDEN-25 REPORT');
console.log('================');
for (const r of results) {
  const status = r.ok ? '✅' : '❌';
  const url = r.url ? r.url : (r.error || '');
  console.log(`${status} ${r.domain.padEnd(18)}  ${String(r.time_ms).padStart(5)} ms  ${url}`);
}
console.log('----------------');
console.log(`Pass: ${okCount}/25`);
console.log(`Median time: ${median(times)} ms`);

const summary = {
  pass: okCount,
  total: results.length,
  median_ms: median(times),
  results
};

await writeText('./golden25.summary.json', JSON.stringify(summary, null, 2));

console.log('\nSaved: golden25.summary.json');
