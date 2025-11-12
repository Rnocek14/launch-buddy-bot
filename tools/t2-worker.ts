/**
 * Phase 1.4: Tier-2 Headless Retry Worker
 * 
 * Processes queued T2 retries using Playwright to handle bot protection,
 * CAPTCHAs, and heavy SPAs that fail in T1 (simple fetch).
 * 
 * Environment:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY
 * - T2_BATCH (default: 5)
 * - T2_MAX_ATTEMPTS (default: 3)
 * - T2_BACKOFF_MS (default: 15000)
 * - T2_TIMEOUT_MS (default: 60000)
 */

import { chromium } from 'playwright';

// Env
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const T2_BATCH = Number(process.env.T2_BATCH || 5);
const T2_MAX_ATTEMPTS = Number(process.env.T2_MAX_ATTEMPTS || 3);
const T2_BACKOFF_MS = Number(process.env.T2_BACKOFF_MS || 15_000);
const T2_TIMEOUT_MS = Number(process.env.T2_TIMEOUT_MS || 60_000);
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (Tier2-Headless; +footprintfinder.com)';

async function sb(path: string, init: any = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const headers = {
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    Prefer: 'return=representation',
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };
  const r = await fetch(url, { ...init, headers });
  if (!r.ok) throw new Error(`Supabase ${r.status} ${await r.text()}`);
  return r.json();
}

async function leaseJobs() {
  // Take oldest queued jobs whose next_run_at <= now()
  const now = new Date().toISOString();
  return sb(
    `t2_retries?select=*&status=eq.queued&next_run_at=lte.${encodeURIComponent(now)}&order=next_run_at.asc&limit=${T2_BATCH}`,
    { method: 'GET' }
  );
}

async function markRunning(id: number) {
  await sb(`t2_retries?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'running', updated_at: new Date().toISOString() })
  });
}

async function reschedule(job: any, error: string) {
  const attempts = (job.attempts || 0) + 1;
  const next = new Date(Date.now() + T2_BACKOFF_MS * Math.min(4, attempts));
  const status = attempts >= T2_MAX_ATTEMPTS ? 'failed' : 'queued';
  console.log(`[T2] Rescheduling ${job.domain} (attempt ${attempts}/${T2_MAX_ATTEMPTS}): ${error}`);
  await sb(`t2_retries?id=eq.${job.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      attempts,
      last_error: error.substring(0, 500),
      next_run_at: next.toISOString(),
      updated_at: new Date().toISOString()
    })
  });
}

async function complete(job: any, result: { url?: string; policy_type?: 'html' | 'pdf'; vendor?: string; t2_time_ms: number }) {
  console.log(`[T2] Completed ${job.domain}: ${result.url || 'no policy found'} (${result.t2_time_ms}ms)`);
  await sb(`t2_retries?id=eq.${job.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'done',
      result_url: result.url,
      policy_type: result.policy_type,
      vendor: result.vendor,
      t2_time_ms: result.t2_time_ms,
      updated_at: new Date().toISOString()
    })
  });
  // Write metrics row (t2_success)
  await sb('discovery_metrics', {
    method: 'POST',
    body: JSON.stringify({
      domain: job.domain,
      success: Boolean(result.url),
      method_used: 't2',
      time_ms: result.t2_time_ms,
      t2_used: true,
      t2_success: Boolean(result.url),
      t2_time_ms: result.t2_time_ms,
      urls_considered: 1,
      policy_type: result.policy_type,
      vendor: result.vendor
    })
  });
}

async function runJob(job: any) {
  const t0 = Date.now();
  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      userAgent: USER_AGENT,
      javaScriptEnabled: true,
      viewport: { width: 1366, height: 900 },
      locale: 'en-US'
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(T2_TIMEOUT_MS);

    const url = job.seed_url || `https://${job.domain}`;
    console.log(`[T2] Processing ${job.domain} → ${url}`);
    
    // Bounded retries on initial page load
    let loaded = false;
    let lastError: any;
    for (let attempt = 0; attempt < 2 && !loaded; attempt++) {
      try {
        const waitStrategy = attempt === 0 ? 'domcontentloaded' : 'load';
        const timeout = attempt === 0 ? T2_TIMEOUT_MS : Math.min(T2_TIMEOUT_MS, 30_000);
        await page.goto(url, { waitUntil: waitStrategy, timeout });
        loaded = true;
      } catch (e) {
        lastError = e;
        console.warn(`[T2] Navigation attempt ${attempt + 1} failed:`, e.message);
      }
    }
    
    if (!loaded) {
      throw new Error(`Navigation failed after 2 attempts: ${lastError?.message || 'unknown'}`);
    }

    // Wait for JS to settle
    await page.waitForTimeout(2000);

    // Heuristics: look for vendor scripts, privacy links, or obvious policy anchors
    const html = await page.content();
    const lower = html.toLowerCase();

    // Persist vendor only if detected
    let vendor: string | undefined;
    if (/onetrust|otprivacy|optanon/.test(lower)) vendor = 'onetrust';
    else if (/securiti\.(ai|app)|privacy-central/.test(lower)) vendor = 'securiti';
    else if (/trustarc/.test(lower)) vendor = 'trustarc';
    else if (/transcend\./.test(lower)) vendor = 'transcend';
    else if (/cookiebot/.test(lower)) vendor = 'cookiebot';
    else if (/osano/.test(lower)) vendor = 'osano';

    // Check common anchors (skip data URLs)
    const hrefs = await page.$$eval('a[href]', (as: any) => 
      as.slice(0, 400)
        .map((a: any) => a.href)
        .filter((h: string) => h && !h.startsWith('data:') && !h.startsWith('javascript:'))
    );
    
    const privacyPatterns = [
      /privacy.*policy/i,
      /data.*protection/i,
      /gdpr/i,
      /ccpa/i,
      /your.*rights/i,
      /privacy.*center/i,
      /data.*request/i
    ];
    
    let finalUrl = hrefs.find((h: string) => 
      privacyPatterns.some(p => p.test(h))
    );

    // If none, try site search (fallback)
    if (!finalUrl) {
      const guesses = [
        `https://${job.domain}/privacy`,
        `https://${job.domain}/privacy-policy`,
        `https://${job.domain}/legal/privacy`,
        `https://${job.domain}/privacy-center`
      ];
      for (const g of guesses) {
        try {
          await page.goto(g, { waitUntil: 'domcontentloaded', timeout: 15_000 });
          const status = page.url();
          if (status && !status.includes('404') && !status.includes('error')) {
            finalUrl = g;
            break;
          }
        } catch {}
      }
    }

    const t2_time_ms = Date.now() - t0;
    await complete(job, {
      url: finalUrl,
      policy_type: finalUrl?.endsWith('.pdf') ? 'pdf' : 'html',
      vendor,
      t2_time_ms
    });
  } catch (e: any) {
    await reschedule(job, String(e?.message || e));
  } finally {
    await browser.close();
  }
}

(async () => {
  console.log(`[T2] Starting worker (batch=${T2_BATCH}, timeout=${T2_TIMEOUT_MS}ms)`);
  try {
    const jobs = await leaseJobs();
    console.log(`[T2] Leased ${jobs.length} jobs`);
    
    for (const j of jobs) {
      try {
        await markRunning(j.id);
        await runJob(j);
      } catch (e) {
        console.error(`[T2] Job ${j.id} failed:`, e);
        await reschedule(j, String(e));
      }
    }
    
    console.log('[T2] Worker completed');
  } catch (e) {
    console.error('[T2] Worker error:', e);
    process.exit(1);
  }
})();
